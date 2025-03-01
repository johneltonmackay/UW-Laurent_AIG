/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/file', 'N/render'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search, runtime, file, render) => {
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
        const LC_NS_STATUS_FIELD = 'status'

        const LC_STATUS_CANCELED = 17
        const LC_STATUS_WATCHED = 15
        const LC_STATUS_COMPLETED = 6

        const LC_TERMS_FIELD = 'terms'
        const PROD_FOLDER_BOL_CREATED_BY_SCRIPT = 172798
        const SB1_FOLDER_BOL_CREATED_BY_SCRIPT = 123166

        const beforeLoad = (scriptContext) => {
            if (scriptContext.type == 'copy' || scriptContext.type == 'create'){
                log.debug('beforeLoad executionContext', runtime.executionContext)
                let objRecord = scriptContext.newRecord
                // setRateToNull(objRecord)
            }
        }

        const beforeSubmit = (scriptContext) => {
            if (scriptContext.type == scriptContext.UserEventType.CREATE || scriptContext.type == scriptContext.UserEventType.EDIT) {
                log.debug('beforeSubmit executionContext', runtime.executionContext)
                let objRecord = scriptContext.newRecord
            	setNet30(objRecord)
            	setCommissionAuthId(objRecord)
            } 
        }

        const afterSubmit = (scriptContext) => {
            log.debug('afterSubmit scriptContext.type', scriptContext.type)
            log.debug('afterSubmit executionContext', runtime.executionContext)
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

            let blnValue = false

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
                    let strLoadConStatus = objCurrRecord.getValue({ fieldId: LC_NS_STATUS_FIELD });
                    log.debug('afterSubmit strLoadConStatus', strLoadConStatus)

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

                        // Auto Close Load Order
                        
                        if (strLoadConStatus == 'Closed'){
                            blnValue = true
                        } else {
                            blnValue = false
                        }

                        let objLineToClose = autoCloseLO(objCurrRecord)

                        if (objLineToClose){
                            processLineToClose(objLineToClose, blnValue)
                        }
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
                    
                    pdfFile.folder = SB1_FOLDER_BOL_CREATED_BY_SCRIPT;
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

        const autoCloseLO = (objRecord) => {
            let objLOToProcess = {}
            let intLOId = objRecord.getValue({
                fieldId: 'createdfrom'
            })
            
            if (intLOId){
                objLOToProcess.LCId = objRecord.id
                objLOToProcess.LOId = intLOId
                log.debug('autoCloseLO objLOToProcess', objLOToProcess)
            }
            
            return objLOToProcess
        }

        const processLineToClose = (objLineToClose, blnValue) => {
            let intLCId = objLineToClose.LCId
            const objRecord = record.load({
                type: 'salesorder',
                id: objLineToClose.LOId,
                isDynamic: true
            }) 
            if (objRecord){
                let arrLOLineData = searchLineUniqueKeys(intLCId)
                arrLOLineData.forEach((item, x) => {
                    let intLineRec = objRecord.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        value: item.lineuniquekey
                    })
                    log.debug('reduce: intLineRec', intLineRec)
                    if(intLineRec != -1){
                        objRecord.selectLine({
                            sublistId:'item',
                            line:intLineRec
                        });
                        objRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'isclosed',
                            value: blnValue
                        });
                        objRecord.commitLine({sublistId:'item'})
                    }
                })
                let recordId = objRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
                log.debug('processLineToClose recordId Updated', recordId)
            }
        }

        const searchLineUniqueKeys = (LCId) => {
            let arrLOLineData = [];
            try {
                let objSearch = search.create({
                    type: 'salesorder',
                    filters:  [
                        ['type', 'anyof', 'SalesOrd'],
                        'AND',
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['cogs', 'is', 'F'],
                        'AND',
                        ['taxline', 'is', 'F'],
                        'AND',
                        ['shipping', 'is', 'F'],
                        'AND',
                        ['applyinglinktype', 'anyof', 'DropShip'],
                        'AND',
                        ['applyingtransaction.internalid', 'anyof', LCId],
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'tranid' }),
                        search.createColumn({ name: 'custcol_customer_po_num_linelevel' }),
                        search.createColumn({ name: 'line' }),
                        search.createColumn({ name: 'lineuniquekey' }),
                        search.createColumn({ name: 'line', join: 'applyingtransaction' }),
                        search.createColumn({ name: 'linesequencenumber', join: 'applyingtransaction' }),
                        search.createColumn({ name: 'lineuniquekey', join: 'applyingtransaction' }),
                        search.createColumn({ name: 'internalid', join: 'applyingtransaction' }),
                    ]
                });
                
                var searchResultCount = objSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                arrLOLineData.push({
                                    internalid: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                    tranid: pageData[pageResultIndex].getValue({name: 'tranid'}),
                                    customer_po: pageData[pageResultIndex].getValue({name: 'custcol_customer_po_num_linelevel'}),
                                    linesequencenumber: pageData[pageResultIndex].getValue({ name: 'linesequencenumber', join: 'applyingtransaction' }),
                                    lineuniquekey: pageData[pageResultIndex].getValue({ name: 'lineuniquekey' }),
                                    lc_internalid: pageData[pageResultIndex].getValue({ name: 'internalid', join: 'applyingtransaction' }),
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                log.error('searchLineUniqueKeys', err.message);
            }
            log.debug("searchLineUniqueKeys arrLOLineData", arrLOLineData)
            return arrLOLineData;
        }


        return {beforeLoad, beforeSubmit, afterSubmit}

    });
