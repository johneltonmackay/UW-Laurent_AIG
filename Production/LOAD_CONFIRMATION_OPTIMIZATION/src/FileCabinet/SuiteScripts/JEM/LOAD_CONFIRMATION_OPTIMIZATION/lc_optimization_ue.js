/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/file', 'N/render', 'N/ui/serverWidget'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search, runtime, file, render, serverWidget) => {
        const TERMS_NET_30 = 2
        const LO_STATUS_COVERED = 3
        const LO_STATUS_NEEDS_CARRIER = 2
        const LO_STATUS_READY_FOR_INVOICE = 4

        const LO_ORDER_STATUS_FIELD = 'custbody10'
        const LC_ORDER_STATUS_FIELD = 'custbody4'
        const LC_ORDER_BOL_DOCUMENT_FIELD = 'custbody_boldocument'
        const LC_ORDER_TENDER_ATTACHMENT_FIELD = 'custbody_tenderattachment'
        const LC_CREATEDFROM_FIELD = 'createdfrom'
        const LC_COMMISSION_AUTH_ID_FIELD = 'custbody_commission_auth_id'
        

        const LC_STATUS_CANCELED = 17
        const LC_STATUS_WATCHED = 15
        const LC_STATUS_COMPLETED = 6

        const LC_TERMS_FIELD = 'terms'
        const PROD_FOLDER_BOL_CREATED_BY_SCRIPT = 172798
        const SB1_FOLDER_BOL_CREATED_BY_SCRIPT = 123166

        const beforeLoad = (scriptContext) => {
            let objForm = scriptContext.form;

            if (scriptContext.type == 'copy' || scriptContext.type == 'create'){
                let objRecord = scriptContext.newRecord
                setRateToNull(objRecord)
            }

            if (scriptContext.type == 'copy' || scriptContext.type == 'create' || scriptContext.type == 'create'){
                addSavedDriverField(objForm)
            }
        }

        const beforeSubmit = (scriptContext) => {
            if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT) {
                let objRecord = scriptContext.newRecord
            	setNet30(objRecord)
            	setCommissionAuthId(objRecord)
            } 
        }

        const afterSubmit = (scriptContext) => {
            log.debug('afterSubmit scriptContext.type', scriptContext.type)
            let objRecord = scriptContext.newRecord
            let intRecId = objRecord.id
            let strRecType = objRecord.type

            let intBOL = null
            let intSOId = null
            let strLCOrderStatus = null
            let strLONewOrderStatus = null
            let arrValidatedSaved = []
            let objValidatedSaved = {}
            let arrRecordSubmitLogs = []
            let objRecordSubmitLogs = {}

            if (intRecId){
                let objCurrRecord = record.load({
                    type: strRecType,
                    id: intRecId,
                    isDynamic: true
                })
                log.debug('afterSubmit objCurrRecord', objCurrRecord)
                if (objCurrRecord){
                    intBOL = addBOLFile(objCurrRecord)
                    if (intBOL){
                        objValidatedSaved.intBOL = intBOL
                        arrValidatedSaved.push(objValidatedSaved)
                    }

                    let strBOLDocument = objCurrRecord.getValue({ fieldId: LC_ORDER_BOL_DOCUMENT_FIELD });
                    let strTenderAttachment = objCurrRecord.getValue({ fieldId: LC_ORDER_TENDER_ATTACHMENT_FIELD });

                    if (scriptContext.type === scriptContext.UserEventType.CREATE ||
                        scriptContext.type === scriptContext.UserEventType.EDIT ||
                        scriptContext.type === scriptContext.UserEventType.XEDIT ||
                        scriptContext.type === scriptContext.UserEventType.COPY)
                    {

                        let objParam = {
                            record: objCurrRecord,
                            BOLDocument: strBOLDocument ? strBOLDocument : null,
                            tenderAttachment: strTenderAttachment ? strTenderAttachment : null
                        }

                        strLCOrderStatus = objCurrRecord.getValue({ fieldId: LC_ORDER_STATUS_FIELD });

                        if (strLCOrderStatus){
                            if (strLCOrderStatus == LC_STATUS_CANCELED || strLCOrderStatus == LC_STATUS_WATCHED){
                                objParam.status = LO_STATUS_NEEDS_CARRIER
                                intSOId = updateLOStatusDocuments(objParam)
                            } else if (strLCOrderStatus == LC_STATUS_COMPLETED){
                                objParam.status = LO_STATUS_READY_FOR_INVOICE
                                intSOId = updateLOStatusDocuments(objParam)
                            }
                        } else {
                            objParam.status = LO_STATUS_COVERED
                            intSOId = updateLOStatusDocuments(objParam)
                        } 

                        strLONewOrderStatus = objParam.status
                    }

                    if (intSOId){
                        objRecordSubmitLogs.intSOId = intSOId
                        objRecordSubmitLogs.intSOId_Context = scriptContext.type
                        objRecordSubmitLogs.intLCId_Status = strLCOrderStatus ? strLCOrderStatus : null
                        objRecordSubmitLogs.intSOId_Status = strLONewOrderStatus ? strLONewOrderStatus : null
                        arrRecordSubmitLogs.push(objRecordSubmitLogs)
                        log.debug('afterSubmit: arrRecordSubmitLogs', arrRecordSubmitLogs);
                    }
                }

                if (arrValidatedSaved.length > 0){
                    let recId = objCurrRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    })
                    objValidatedSaved.recId = recId
                    log.debug('afterSubmit: arrValidatedSaved', arrValidatedSaved);
                }
            }
        }

        // Private Function

        const setRateToNull = (objRecord) => {
            try {
                let fieldsToUpdate = ['rate', 'amount']
                let lineCount = objRecord.getLineCount ({
                    sublistId: 'item'
                })
                if (lineCount > 0) {
                    for (let index = 0; index < lineCount; index++) {
                        fieldsToUpdate.forEach(fieldId => {
                            objRecord.setSublistValue({
                                sublistId: 'item',
                                fieldId: fieldId,
                                value: 0,
                                line: index
                            })
                        });
                        let LineNum = 1 + index
                        log.debug('setRateToNull: Rate Set to Null', 'on Line ' + LineNum)
                    }

                }
            } catch (error) {
                log.error('setRateToNull Error', error.message)
            }
        }

        const addBOLFile = (objCurrRecord) => {
            let intBOL = null
            try {
                if (objCurrRecord){
                    let strDocuNum = objCurrRecord.getValue({
                        fieldId: 'tranid'
                    })
                    let pdfRenderer = render.create();
                    pdfRenderer.setTemplateByScriptId('CUSTTMPL_BILL_OF_LADING_PDF'); 
                    pdfRenderer.addRecord({
                        templateName: 'record',
                        record: objCurrRecord
                    });
                    let pdfFile = pdfRenderer.renderAsPdf();
                    
                    pdfFile.folder = PROD_FOLDER_BOL_CREATED_BY_SCRIPT;
                    pdfFile.name = 'BOL_' + strDocuNum + '.pdf';

                    let fileId = pdfFile.save();

                    objCurrRecord.setValue({
                        fieldId: 'custbody_bill_of_lading_pdf',
                        value: fileId
                    })

                    intBOL = objCurrRecord.getValue({
                        fieldId: 'custbody_bill_of_lading_pdf',
                    })
                }                
            } catch (error) {
                log.error('addBOLFile Error', error.message)
            }

            log.debug('addBOLFile intBOL', intBOL)
            return intBOL 
        }

        const updateLOStatusDocuments = (objParam) => {
            let objCurrRecord = objParam.record
            let NewStatus = objParam.status
            let intSOId = null
            try {
                let intCreatedFromId = objCurrRecord.getValue({
                    fieldId: 'createdfrom'
                });
                if (intCreatedFromId){
                    intSOId = record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: intCreatedFromId,
                        values: {
                            [LO_ORDER_STATUS_FIELD]: NewStatus,
                            [LC_ORDER_BOL_DOCUMENT_FIELD]: objParam.BOLDocument ? objParam.BOLDocument : null,
                            [LC_ORDER_TENDER_ATTACHMENT_FIELD]: objParam.tenderAttachment ? objParam.tenderAttachment : null
                        },
                        options: {
                            enableSourcing: true,
                            ignoreMandatoryFields : true
                        }
                    });
                }
            } catch (error) {
                log.error('updateLOStatusDocuments Error', error.message)
            }
            return intSOId
        }

        const setNet30 = (objRecord) => {
            try {
                objRecord.setValue({
                    fieldId: LC_TERMS_FIELD,
                    value: TERMS_NET_30
                });
                log.debug('setNet30: Terms Set to ', TERMS_NET_30)
            } catch (error) {
                log.error('setNet30 Error', error.message)
            }

        }

        const setCommissionAuthId = (objRecord) => {
            try {
                let intCommAuthId = null
                let intCreatedFrom = objRecord.getValue({
                    fieldId: LC_CREATEDFROM_FIELD,
                });
                if (intCreatedFrom){
                    let fieldLookUp = search.lookupFields({
                        type: 'salesorder',
                        id: intCreatedFrom,
                        columns: 'custbody_commission_auth_id'
                    });
                    log.debug("fieldLookUp", fieldLookUp)
                    if (fieldLookUp){
                        intCommAuthId = fieldLookUp.custbody_commission_auth_id[0].value;
                        log.debug("intCommAuthId", intCommAuthId)
                        if (intCommAuthId){
                            objRecord.setValue({
                                fieldId: LC_COMMISSION_AUTH_ID_FIELD,
                                value: intCommAuthId
                            })
                            log.debug('setCommissionAuthId: Commission Authorization ID Set to ', intCommAuthId)
                        }
                    }
                }
            } catch (error) {
                log.error('setCommissionAuthId Error', error.message)
            }

        }

        const addSavedDriverField = (objForm) => {
            const customField = objForm.addField({
                id: 'custpage_driver_instructions',
                type: serverWidget.FieldType.SELECT,
                label: 'List of Driver Instructions',
            });

            objForm.insertField({
                field : customField,
                nextfield : 'custbody_driver_instructions'
            });
        
            customField.addSelectOption({
                value: '',
                text: 'Select Instruction'
            });
        
            try {
                const instructionSearch = search.load({
                    id: 'customsearch_list_of_driver_instructions' 
                });
        
                const searchResult = instructionSearch.run().getRange({
                    start: 0,
                    end: 1000 
                });
        
                searchResult.forEach((result) => {
                    const instructionGroup = result.getValue({
                        name: 'custbody_driver_instructions',
                        summary: search.Summary.GROUP
                    });
    
                    customField.addSelectOption({
                        value: instructionGroup,
                        text: instructionGroup
                    });
                });
            } catch (error) {
                log.error('Error Loading Instructions', error);
            }
        };
        
        

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
