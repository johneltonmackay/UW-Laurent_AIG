/**
 * @NAPIVersion 2.1
 */
define(["N/ui/serverWidget", "N/search", "N/task", "N/file", "N/record", "../Library/add_sub_item_sl_mapping.js", 'N/runtime', 'N/url', 'N/ui/message', 'N/format', 'N/currentRecord', 'N/redirect'],

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
                    param: options.contextParam
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

                
        const addTabs = (options) => {
            try {

                options.form.addTab({
                    id : 'custpage_tab_commodity',
                    label : 'Commodity'
                });
                options.form.addSubtab({
                    id : 'custpage_subtab_commodity',
                    label : 'Commodity Details',
                    tab: 'custpage_tab_commodity'
                });

                options.form.addTab({
                    id : 'custpage_tab_location',
                    label : 'Location'
                });
                options.form.addSubtab({
                    id : 'custpage_subtab_location',
                    label : 'Location Details',
                    tab: 'custpage_tab_location'
                });

                options.form.addTab({
                    id : 'custpage_tab_load_order',
                    label : 'Load Order'
                });
                options.form.addSubtab({
                    id : 'custpage_subtab_load_order',
                    label : 'Load Order Details',
                    tab: 'custpage_tab_load_order'
                });

            } catch (error) {
                log.error('addTabs Error', error.message)
            }
            
        }

        ACTIONS.createSubItem = (options) => {
            try {
                let arrCusRecData = []
                let objData = {}
                log.debug('createSubItem options', options.postParam[1])
                let objParamDataCusRecId = options.postParam[0]
                let arrParamDataSublist = JSON.parse(options.postParam[1].custpage_sub_item_data)

                arrParamDataSublist.forEach(data => {
                    const objData = { ...data }; // Create a new object and copy properties from data
                    objData.custpage_monday_parent_id = objParamDataCusRecId.custpage_monday_parent_id;
                    arrCusRecData.push(objData);
                });

                log.debug('createSubItem arrCusRecData', arrCusRecData)

                let arrCustomRecId = createCustomRecord(arrCusRecData)

                return arrCustomRecId;
            } catch (error) {
                log.error('createSubItem Error', error.message)
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

        ACTIONS.viewResults = (options) => {
            try {
                var objForm = serverWidget.createForm({
                    title: options.title,
                    hideNavBar: false
                });
                log.debug('viewResults buildForm options', options)

                objForm.clientScriptModulePath = slMapping.SUITELET.form.CS_PATH;

                addTabs({
                    form: objForm,
                });

                objForm.addButton({
                    id: 'custpage_goback_btn',
                    label : 'Main Page',
                    functionName: 'refreshPage'
                }); 

                addNewFields({
                    form: objForm,
                    param: JSON.parse(options.transkey)
                });
 
                viewSublistFields({
                    form: objForm,  
                    parameters: JSON.parse(options.transkey)
                });

                return objForm;
            } catch (err) {
                log.error('ERROR_VIEW_RESULTS:', err.message)
            }
        }

        const addNewFields = (options) => {
            try {
                let objParam = options.param
                log.debug('addNewFields objParam', objParam)
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

                    if (slMapping.SUITELET.form.fields[strKey].ishidden) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }

                    if (slMapping.SUITELET.form.fields[strKey].hasDefault) {
                        let compareKey = slMapping.SUITELET.form.fields[strKey].id
                        for (const key in objParam) {
                            if (key == compareKey) {
                                const element = objParam[key];
                                if (key == 'custpage_tender_files'){
                                    let strTenderFileURL = objParam['custpage_tender_files_url']
                                    let recLink = `<a href='${strTenderFileURL}' target="_blank" rel="noopener noreferrer">${element}</a>`
                                    objField.updateDisplayType({
                                        displayType: serverWidget.FieldDisplayType.INLINE
                                    });
                                    objField.defaultValue = recLink;
                                } else if (key == 'custpage_other_files'){
                                    let strOtherFileURL = objParam['custpage_other_files_url']
                                    let recLink = `<a href='${strOtherFileURL}' target="_blank" rel="noopener noreferrer">${element}</a>`
                                    objField.updateDisplayType({
                                        displayType: serverWidget.FieldDisplayType.INLINE
                                    });
                                    objField.defaultValue = recLink;
                                } else {
                                    objField.updateDisplayType({
                                        displayType: serverWidget.FieldDisplayType.INLINE
                                    });
                                    objField.defaultValue = element;
                                }

                            }
                        }
                    }
                    
                }
            } catch (err) {
                log.error("addNewFields Error", err.message);
            }
        }
        
        const addFields = (options) => {
            log.debug('addFields options', options)
            let paramSubItems = JSON.parse(options.param.paramSubItems)
            let strCusRecId = paramSubItems.customRecID
            log.debug('addFields strCusRecId', strCusRecId)

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

                    if (slMapping.SUITELET.form.fields[strKey].ishidden) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }

                    if (slMapping.SUITELET.form.fields[strKey].hasDefault) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        }).defaultValue = strCusRecId
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
            let arrCustomRecId = []
            try {
                let arrParamData = options
                if (arrParamData.length > 0){
                    arrParamData.forEach(data => {
                        let objRecData = record.create({
                            type: 'customrecord_monday_sales_sub_itm',
                            isDynamic: true
                        })
                        if (objRecData){
                            for (const key in data) {
                                let fieldIds = key.replace('custpage', 'custrecord')
                                let fieldValue = data[key]
                                objRecData.setValue({
                                    fieldId: fieldIds,
                                    value: fieldValue
                                }) 
                            }
                            let recId = objRecData.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            })
                            log.debug('createCustomRecord recId', recId) 
                            arrCustomRecId.push(recId)
                        }
                    });
                }
            } catch (error) {
                log.error('createCustomRecord error', error.message)
            }
            return arrCustomRecId
        }

        const viewSublistFields = (options) => {
            try {
                let sublist = options.form.addSublist({
                    id : 'custpage_sublist4',
					type : serverWidget.SublistType.INLINEEDITOR,
					label : 'COMMODITY DETAILS',
					tab: 'custpage_tab_commodity'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfields) {
                    sublist.addField(slMapping.SUITELET.form.sublistfields[strKey]);
                }

                let paramTransKey = options.parameters.custpage_monday_parent_id
                log.debug('viewSublistFields paramTransKey', paramTransKey);
                if (paramTransKey){
                    let arrSearchResults = runViewSearch(paramTransKey)
                    arrSearchResults.forEach((data, index) => {
                        log.debug('viewSublistFields data', data);
                        for (const key in data) {
                            let value = data[key];
                            if (value && value !== '' && value !== undefined && value !== null){
                                sublist.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: value,
                                });
                            }
 
                        }
                    });
                }


                let sublist2nd = options.form.addSublist({
                    id : 'custpage_sublist2nd',
					type : serverWidget.SublistType.LIST,
					label : 'LOCATION DETAILS',
					tab: 'custpage_tab_location'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfields2nd) {
                    sublist2nd.addField(slMapping.SUITELET.form.sublistfields2nd[strKey]);
                }

                let sublist3rd = options.form.addSublist({
                    id : 'custpage_sublist3rd',
					type : serverWidget.SublistType.LIST,
					label : 'LOAD ORDER DETAILS',
					tab: 'custpage_tab_load_order'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfields3rd) {
                    sublist3rd.addField(slMapping.SUITELET.form.sublistfields3rd[strKey]);
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
                    type: 'customrecord_monday_sales_sub_itm',
                    filters: [
                        ['custrecord_monday_parent_id', 'is', strTransKey],
                    ],
                    columns: [
                        search.createColumn({ name: 'custrecord_item', label: 'custpage_item'}),
                        search.createColumn({ name: 'custrecord_dimension', label: 'custpage_dimension'}),
                        search.createColumn({ name: 'custrecord_weight', label: 'custpage_weight'}),
                        search.createColumn({ name: 'custrecord_special_reqs', label: 'custpage_special_reqs'}),                      
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

        return { FORM, ACTIONS }
    });
