/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/search', 'N/ui/serverWidget', 'N/url'],
    /**
 * @param{record} record
 * @param{redirect} redirect
 * @param{search} search
 */
    (record, redirect, search, serverWidget, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const CONTEXT_METHOD = {
            GET: "GET",
            POST: "POST"
        };

        const onRequest = (scriptContext) => {
            if (scriptContext.request.method == CONTEXT_METHOD.GET) {
                let scriptObj = scriptContext.request.parameters;
                let objParam = JSON.parse(scriptObj.paramDataGet)
                let strTransKey = objParam.transkey
                let arrParam = objParam.data
                log.debug('GET onRequest objParam', objParam);
                log.debug('GET onRequest strTransKey', strTransKey);
                if (strTransKey){
                    if (arrParam.length > 1){
                        let arrVBIds = createVendorBill(arrParam, strTransKey)
                        if (arrVBIds.length > 1){
                            let options = {
                                scriptContext: scriptContext,
                                transkey: strTransKey
                            }
                            viewResults(options)
                        }
                    } else {
                        scriptContext.response.write({
                            output: JSON.stringify({
                                success: false,
                                message: 'Error creating record: ' + e.message
                            })
                        });
                    }
                }
            }
        }

        // Private Function

        const createVendorBill = (arrParam, strTransKey) => {
            let arrForUpdate = []
            let arrVBIds = []
            let intTotalCommissionAmount = 0
            try {
                arrParam.forEach(data => {
                    intTotalCommissionAmount += data.commissionAmount ? data.commissionAmount : 0;
                });

                let objVendorBill = record.create({
                    type: record.Type.VENDOR_BILL,
                    isDynamic: true,
                    defaultValues: {
                        customform: 257 
                    }
                });
                if (objVendorBill){
                    objVendorBill.setValue('entity', data.vendorId);
                    objVendorBill.setValue('custbody_sl_transaction_key', strTransKey);
                    objVendorBill.setValue('approvalstatus', 1); // Pending Approval
                    objVendorBill.setValue('custbody_commission_auth_id', data.commissionId);
                    objVendorBill.selectNewLine('item');
                    objVendorBill.setCurrentSublistValue('item', 'item', 48); // Commission; 
                    objVendorBill.setCurrentSublistValue('item', 'quantity', 1);
                    objVendorBill.setCurrentSublistValue('item', 'rate', data.commissionAmount ? data.commissionAmount : null);
                    objVendorBill.setCurrentSublistValue('item', 'description', 'Commission for Sales Order ' + data.soId);
                    objVendorBill.setCurrentSublistValue('item', 'custcol_comm_auth_id', data.commissionId);
                    objVendorBill.commitLine('item');
                }

                let vendorBillId = objVendorBill.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                if (vendorBillId){
                    arrForUpdate.push({
                        vbId: vendorBillId,
                        caId: data.commissionId
                    })
                    arrVBIds.push(vendorBillId);
                }
            } catch (error) {
                log.error('ERROR_RECORD_CREATION:', error.message)
            }
            log.debug('createVendorBill arrVBIds', arrVBIds)

            arrForUpdate.forEach(data => {
                updateCommissionAuthorization(data)
            });

            return arrVBIds
        }

        const updateCommissionAuthorization = (data) => {
            try {
                var id = record.submitFields({
                    type: 'customrecord_commission_authorization',
                    id: data.caId,
                    values: {
                        custrecord_vendor_bill_id: data.vbId
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                });
                log.debug('updateCommissionAuthorization record id', id)
            } catch (error) {
                log.error('ERROR_UPDATE_COMMISSION_AUTHORIZATION:', error.message)
            }
        }

        const viewResults = (options) => {
            try {
                var objForm = serverWidget.createForm({
                    title: 'Commission Authorization: BILL CREATED',
                });
                log.debug('buildForm options', options)

                objForm.clientScriptFileId = 104747;

                objForm.addButton({
                    id: 'custpage_goback_btn',
                    label : 'Main Page',
                    functionName: 'refreshPage'
                }); 

                objForm.addField({
                    id: 'custpage_transkey',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Transaction Key'
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                }).defaultValue = options.transkey;
 
                viewSublistFields({
                    form: objForm,  
                    parameters: options.transkey
                });

                options.scriptContext.response.writePage(objForm);

            } catch (err) {
                log.error('ERROR_VIEW_RESULTS:', err.message)
            }
        }

        const viewSublistFields = (options) => {
            try {
                let sublistfields = {
                    VIEW: {
                        id: "custpage_view",
                        label: "VENDOR BILL ID",
                        type : serverWidget.FieldType.TEXT,
                    },
                    VENDOR_ID: {
                        id: "custpage_vendorid",
                        label: "VENDOR ID",
                        type : serverWidget.FieldType.TEXT,
                    },
                    BILL_TOTAL: {
                        id: "custpage_total",
                        label: "BILL TOTAL",
                        type : serverWidget.FieldType.TEXT,
                    },
                    COMM_AUTH_ID: {
                        id: "custpage_comm_auth_id",
                        label: "COMMISSION AUTHORIZATION ID",
                        type : serverWidget.FieldType.TEXT,
                    },
                }
                
                let sublist = options.form.addSublist({
                    id : 'custpage_sublist',
                    type : serverWidget.SublistType.LIST,
                    label : 'List of Vendor Bill',
                    tab: 'custpage_tabid'
                });
                
                for (let strKey in sublistfields) {
                    sublist.addField(sublistfields[strKey]);
                }
                

                let paramTransKey = options.parameters
                log.debug('viewSublistFields paramTransKey', paramTransKey);
                if (paramTransKey){
                    let arrSearchResults = runViewSearch(paramTransKey)
                    arrSearchResults.forEach((data, index) => {
                        for (const key in data) {
                            let value = data[key];
                            if (value){
                                if (key == 'custpage_view'){
                                    var strRecUrl = url.resolveRecord({
                                        recordType: 'vendorbill',
                                        recordId: value
                                    });
                                    let recLink = `<a href='${strRecUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink,
                                    });
                                } else if (key == 'custpage_comm_auth_id'){
                                    var strRecUrl = url.resolveRecord({
                                        recordType: 'customrecord_commission_authorization',
                                        recordId: value
                                    });
                                    let recLink = `<a href='${strRecUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink,
                                    });
                                } else {
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: value,
                                    });
                                }
                                
                            }
 
                        }
                    });
                }
            } catch (err) {
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR", err.message);
            }
        }

        const runViewSearch = (paramTransKey) => {
            log.debug('runViewSearch started');
            try {
                let strTransKey = paramTransKey
                log.debug('runViewSearch strTransKey', strTransKey);

                let arrSearchResults = []

                let objSavedSearch = search.create({
                    type: 'vendorbill',
                    filters: [
                        ['type', 'anyof', 'VendBill'],
                        'AND',
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['custbody_sl_transaction_key', 'is', strTransKey],
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid', label: 'custpage_view'}),
                        search.createColumn({ name: 'entityid', join: 'vendor', label: 'custpage_vendorid' }),
                        search.createColumn({ name: 'total', label: 'custpage_total'}),
                        search.createColumn({ name: 'custbody_commission_auth_id', label: 'custpage_comm_auth_id' })
                    ],

                });

                let searchResultCount = objSavedSearch.runPaged().count;
            
                if (searchResultCount !== 0) {
                    let pagedData = objSavedSearch.runPaged({ pageSize: 1000 });
            
                    for (let i = 0; i < pagedData.pageRanges.length; i++) {
                        let currentPage = pagedData.fetch(i);
                        let pageData = currentPage.data;
                        var pageColumns = currentPage.data[0].columns;
                        if (pageData.length > 0) {
                            for (let pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                let objData = {};
                                pageColumns.forEach(function (result) {
                                    let resultLabel = result.label;
                                    objData[resultLabel] = pageData[pageResultIndex].getValue(result)
                                })
                                arrSearchResults.push(objData);
                            }
                        }   
                    }
                }
            log.debug(`runSearch runViewSearch ${Object.keys(arrSearchResults).length}`, arrSearchResults);
            return arrSearchResults;

            } catch (err) {
                log.error('Error: runViewSearch', err.message);
            }
        }

        return {onRequest}

    });
