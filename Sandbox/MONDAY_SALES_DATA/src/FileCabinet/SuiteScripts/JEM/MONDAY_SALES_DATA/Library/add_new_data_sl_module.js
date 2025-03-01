/**
 * @NAPIVersion 2.1
 */
define(["N/ui/serverWidget", "N/search", "N/task", "N/file", "N/record", "../Library/add_new_data_sl_mapping.js", 'N/runtime', 'N/url', 'N/ui/message', 'N/format', 'N/currentRecord', 'N/redirect'],

    (serverWidget, search, task, file, record, slMapping, runtime, url, message, format, currentRecord, redirect) => {

        //#constants
        const FORM = {};
        const ACTIONS = {};

        //#global functions
        FORM.buildForm = (options) => {
            try {
                log.debug('buildForm options', options)

                var objForm = serverWidget.createForm({
                    title: options.title,
                    hideNavBar: false
                });
                
                addButtons({
                    form: objForm,
                });

                addFields({
                    form: objForm,
                });

                addSublistFields({
                    form: objForm,  
                });

                objForm.clientScriptModulePath = slMapping.SUITELET.form.CS_PATH;

                return objForm;
            } catch (err) {
                log.error('ERROR_BUILD_FORM:', err.message)
            }
        }

        ACTIONS.createSalesOrder = (options) => {
            try {
                let arrPdfId = []
                log.debug('createSalesOrder options', options)
                let customRecId = createCustomRecord(options)
                if (customRecId){
                    let SORecId = createSO(options, customRecId)
                    if (SORecId){
                        let arrParamData = options.postParam
                        if (arrParamData.length > 0){
                            arrParamData.forEach(data => {
                                for (const key in data) {
                                    if (key == 'custpage_tender_files' || key == 'custpage_other_files'){
                                        let pdfId = data[key]
                                        arrPdfId.push(pdfId)
                                    }
                                }
                            });
                        }
                        let customRec = record.submitFields({
                            type: 'customrecord_my_sales_data',
                            id: customRecId,
                            values: {
                                 'custrecord_load_order': SORecId
                            },
                            options: { enableSourcing: true, ignoreMandatoryFields: true }
                        });
                        log.debug('createSalesOrder updated customRec', customRec)
                        log.debug('createSalesOrder arrPdfId', arrPdfId)

                        arrPdfId.forEach(element => {
                            record.attach({
                                record: {
                                    type: 'file',
                                    id: element
                                },
                                to: {
                                    type: 'salesorder',
                                    id: SORecId
                                }
                            });
                        });

                        redirect.toSuitelet({
                            scriptId: 'customscript_monday_sales_data_main_sl',
                            deploymentId: 'customdeploy_monday_sales_data_main_sl',
                            parameters: {
                                postData: null
                            }
                        });
                    }
                }
            } catch (error) {
                log.error('createSalesOrder Error', error.message)
            }
        }

        const addButtons = (options) => {
            try {
                options.form.addSubmitButton({
                    label: slMapping.SUITELET.form.buttons.SUBMIT.label,
                });
            } catch (err) {
                log.error("BUILD_FORM_ADD_BUTTONS_ERROR", err.message);
            }
        };
        
        const addFields = (options) => {
            try {
                for (var strKey in slMapping.SUITELET.form.fields) {
                    options.form.addField(slMapping.SUITELET.form.fields[strKey]);
                    var objField = options.form.getField({
                        id: slMapping.SUITELET.form.fields[strKey].id,
                        container: 'custpage_fieldgroup'
                    });

                    if (slMapping.SUITELET.form.fields[strKey].isInLine) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });
                    }

                    if (slMapping.SUITELET.form.fields[strKey].isHidden) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }
                }
            } catch (err) {
                log.error("BUILD_FORM_ADD_BODY_FILTERS_ERROR", err.message);
            }
        };

        const addSublistFields = (options) => {
            try {

                let sublist = options.form.addSublist({
                    id: 'custpage_sublist',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Sales Order Item',
                    tab: 'custpage_tabid'
                });
        
                for (var strKey in slMapping.SUITELET.form.sublistfields) {
                    sublist.addField(slMapping.SUITELET.form.sublistfields[strKey]);
                }

            } catch (err) {
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR", err.message);
            }
        };
        
        const createCustomRecord = (options) => {
            let customRecId = null
            let arrSOLineData = []
            try {
                let arrParamData = options.postParam
                if (arrParamData.length > 0){
                    let objRecData = record.create({
                        type: 'customrecord_my_sales_data',
                        isDynamic: true
                    })
                    if (objRecData){
                        arrParamData.forEach(data => {
                            let intTotalAmount = 0
                            for (const key in data) {
                                let fieldIds = key.replace('custpage', 'custrecord')
                                let fieldValue = data[key]
                                if (key == 'custpage_so_data'){
                                    arrSOLineData = JSON.parse(data[key])
                                    arrSOLineData.forEach(data => {
                                        intTotalAmount += parseInt(data.custpage_amount)
                                    });
                                    objRecData.setValue({
                                        fieldId: 'custrecord_amount',
                                        value: intTotalAmount
                                    }) 
                                } else {
                                    objRecData.setValue({
                                        fieldId: fieldIds,
                                        value: fieldValue
                                    }) 
                                }
                            }
                        });
                        customRecId = objRecData.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })
                        log.debug('createCustomRecord recordId', customRecId) 
                    }
                }
            } catch (error) {
                log.error('createCustomRecord error', error.message)
            }
            return customRecId
        }

        const createSO = (options, customRecId) => {
            log.debug('createSO options', options)
            let salesOrderId = null
            try {
                let arrParamData = options.postParam
                let strCustomer = null
                let strPONum = null
                let strStatus = null
                let strLoadDetails = null
                let arrSOLineData = []
                if (arrParamData.length > 0){
                    arrParamData.forEach(data => {
                        for (const key in data) {
                            if (key == 'custpage_customer'){
                                strCustomer = data[key]
                            } else if (key == 'custpage_po_number'){
                                strPONum = data[key]
                            } else if (key == 'custpage_status'){
                                strStatus = data[key]
                            } else if (key == 'custpage_so_data'){
                                arrSOLineData = JSON.parse(data[key])
                                log.debug('createSO arrSOLineData', arrSOLineData)
                            } else if (key == 'custpage_load_detailsgeorge'){
                                strLoadDetails = data[key]
                            } 
                        }
                    });

                    let objRecData = record.create({
                        type: 'salesorder',
                        isDynamic: true
                    })
                    if (objRecData){
                        let arrEmpDepartment = getUserDepartment()
                        let objSalesParam = {
                            entity: strCustomer ? strCustomer : null,
                            otherrefnum: strPONum ? strPONum :null,
                            custbody10: strStatus ? strStatus : null,
                            department: arrEmpDepartment[0] ? arrEmpDepartment[0] : null,
                            custbody_monday_sales_data_id: customRecId ? customRecId : null,
                            custbody_load_detailsgeorge: strLoadDetails ? strLoadDetails : null
                        }
                        for (let key in objSalesParam) {
                            if (objSalesParam.hasOwnProperty(key)) {
                                let fieldToSet = objSalesParam[key] ? objSalesParam[key] : null
                                if (fieldToSet != null){
                                    objRecData.setValue({
                                        fieldId: key,
                                        value: fieldToSet
                                    });
                                }
                            }
                        }

                        arrSOLineData.forEach(data => {
                            data.quantity = 1
                            objRecData.selectNewLine('item');
                            for (const key in data) {
                                let fieldToSet = null
                                let fieldIds = key.replace('custpage_', '')
                                let fieldValue = data[key]
                                if (fieldIds == 'amount'){
                                    fieldToSet = 'rate'
                                } else if (fieldIds == 'commodity'){
                                    fieldToSet = 'custcol_commodity'
                                } else {
                                    fieldToSet = fieldIds
                                }
                                objRecData.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: fieldToSet,
                                    value: fieldValue
                                }) 
                            }
                            objRecData.commitLine('item');
                        });

                        salesOrderId = objRecData.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })
                        log.debug('createSalesOrder salesOrderId', salesOrderId) 
                    }
                }
            } catch (error) {
                log.error('createSO error', error.message)
            }
            return salesOrderId
        }

        const getUserDepartment = () => {
            let arrEmpDepartment = null
            try {
                let intEmpId = runtime.getCurrentUser().id;
                if (intEmpId){
                    let fieldLookUp = search.lookupFields({
                        type: 'employee',
                        id: intEmpId,
                        columns: 'department'
                    });
                    log.debug("fieldLookUp", fieldLookUp)
                    if (fieldLookUp){
                        arrEmpDepartment = fieldLookUp.department;
                        log.debug("arrEmpDepartment", arrEmpDepartment)
                    }
                }
            } catch (error) {
                log.error('getUserDepartment Error', error.message)
            }

            return arrEmpDepartment
        }

        return { FORM, ACTIONS }
    });
