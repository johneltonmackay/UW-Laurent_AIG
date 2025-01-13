/**
 * @NAPIVersion 2.1
 */
define(["N/ui/serverWidget", "N/search", "N/task", "N/file", "N/record", "../Library/monday_sales_data_sl_mapping.js", 'N/runtime', 'N/url', 'N/ui/message', 'N/format', 'N/currentRecord', 'N/redirect'],

    (serverWidget, search, task, file, record, slMapping, runtime, url, message, format, currentRecord, redirect) => {

        //#constants
        const FORM = {};
        const ACTIONS = {};

        //#global functions
        FORM.buildForm = (options) => {
            try {
                log.debug('buildForm options', options)

                let arrSearchResults = runSearch(options)
                let arrSearchResults2nd = runSearch2nd(options)
                // let arrSearchResults3rd = runSearch3rd(options)
                // let arrSearchResults4th = runSearch4th(options)

                var objForm = serverWidget.createForm({
                    id: 'custpage_form_id',
                    title: options.title,
                    hideNavBar: false
                });
                                
                addTabs({
                    form: objForm,
                });

                addButtons({
                    form: objForm,
                });

                addFields({
                    form: objForm,
                });

                addSublistFields({
                    form: objForm,  
                    data: arrSearchResults
                });

                addSublistFields2nd({
                    form: objForm,  
                    data: arrSearchResults2nd
                });

                // addSublistFields3rd({
                //     form: objForm,  
                //     data: arrSearchResults3rd
                // });

                // addSublistFields4th({
                //     form: objForm,  
                //     data: arrSearchResults4th
                // });


                objForm.clientScriptModulePath = slMapping.SUITELET.form.CS_PATH;

                return objForm;
            } catch (err) {
                log.error('ERROR_BUILD_FORM:', err.message)
            }
        }

        const addButtons = (options) => {
            try {
                const buttons = slMapping.SUITELET.form.buttons;
                for (const strKey in buttons) {
                    if (Object.prototype.hasOwnProperty.call(buttons, strKey)) {
                        const button = buttons[strKey];
                        options.form.addButton({
                            id: button.id,
                            label: button.label,
                            functionName: button.functionName || null
                        });
                    }
                }
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

                    if (slMapping.SUITELET.form.fields[strKey].isDisabled) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                    }

                    if (slMapping.SUITELET.form.fields[strKey].hasOptions) {
                        let arrOptions = slMapping.SUITELET.form.fields[strKey].arrOptions
                        log.debug('arrOptions', arrOptions)
                        arrOptions.forEach(data => {
                            objField.addSelectOption(data);
                        });
                    }
                }
            } catch (err) {
                log.error("BUILD_FORM_ADD_BODY_FILTERS_ERROR", err.message);
            }
        };

        const addTabs = (options) => {
            try {
                options.form.addFieldGroup({
                    id : 'custpage_field_group_filter',
                    label : 'Main Filter'
                });

                options.form.addTab({
                    id : 'custpage_tab_load_order',
                    label : 'Load Order'
                });

                options.form.addFieldGroup({
                    id : 'custpage_field_group_filter_order',
                    label : 'Refine Filter',
                    tab: 'custpage_tab_load_order'
                });

                options.form.addSubtab({
                    id : 'custpage_subtab_load_order',
                    label : 'Load Order Details',
                    tab: 'custpage_tab_load_order'
                });

                options.form.addTab({
                    id : 'custpage_tab_load_confirmation',
                    label : 'Load Confirmation'
                });

                options.form.addFieldGroup({
                    id : 'custpage_field_group_filter_confirmation',
                    label : 'Refine Filter',
                    tab: 'custpage_tab_load_confirmation'
                });
    
                options.form.addSubtab({
                    id : 'custpage_subtab_load_confirmation',
                    label : 'Load Confirmation Details',
                    tab: 'custpage_tab_load_confirmation'
                });
            } catch (error) {
                log.error('addTabs Error', error.message)
            }
            
        }

        const addSublistFields = (options) => {
            try {
                let arrSublistDataParam = options.data;
                log.debug('addSublistFields arrSublistDataParam', arrSublistDataParam)
                let sublist = options.form.addSublist({
                    id: 'custpage_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'List of Load Orders and Status',
                    tab: 'custpage_tab_load_order'
                });

                for (let key in slMapping.SUITELET.form.sublistfields) {
                    let fieldConfig = slMapping.SUITELET.form.sublistfields[key];
                
                    let objField = sublist.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label,
                    });
                
                    if (fieldConfig.type.toLowerCase() === 'select' && fieldConfig.source) {
                        populateDropdownOptions(objField, fieldConfig.source);
                    }
                
                    if (fieldConfig.isEdit) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.ENTRY
                        });
                    }

                    if (fieldConfig.isHidden) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }
                }
                
                
                arrSublistDataParam.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        if (value !== undefined && value !== null && value !== "") {
                            try {
                                if (key == 'custpage_load_order'){
                                    let SalesId = data['custpage_id_load_order']
                                    var strRecUrl = url.resolveRecord({
                                        recordType: 'salesorder',
                                        recordId: SalesId
                                    });
                                    let recLink = `<a href='${strRecUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink,
                                    });
                                } else if (key == 'custpage_view_sub_rec'){
                                    let msdId = data['custpage_name'];
                                    let soId = data['custpage_id_load_order'];
                                    let customerId = data['custpage_customer'];
                                    let strFrom = data['custpage_pu_location'];
                                    let strTo = data['custpage_drop_location'];
                                    let strAmount = data['custpage_amount'];
                                    let strRate = data['custpage_target_rate'];
                                    let strTender = data['custpage_tender_files'];
                                    let strOtherFile = data['custpage_other_files']; 
                                    let strTenderURL = data['custpage_tender_files_url'];
                                    let strOtherFileURL = data['custpage_other_files_url']; 
                                    
                                    let objParamView = {
                                        custpage_monday_parent_id: msdId, 
                                        custpage_so_number: soId,
                                        custpage_customer_name: customerId,
                                        custpage_from: strFrom, 
                                        custpage_to: strTo,
                                        custpage_amount: strAmount,
                                        custpage_target_rate: strRate,
                                        custpage_tender_files: strTender,
                                        custpage_other_files: strOtherFile,
                                        custpage_tender_files_url: strTenderURL,
                                        custpage_other_files_url: strOtherFileURL
                                    };
                                    var sURL = url.resolveScript({
                                        scriptId : 'customscript_add_sub_item_main_page_sl',
                                        deploymentId : 'customdeploy_add_sub_item_main_page_sl',
                                        returnExternalUrl : false,
                                        
                                        params : {
                                            transkey: JSON.stringify(objParamView)
                                        }
                                    });
                                    let recLink = `<a href='${sURL}' target="_blank" rel="noopener noreferrer">VIEW</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink ? recLink : null
                                    });
                                } else if (key == 'custpage_tender_files'){
                                    let strTenderFileURL = data['custpage_tender_files_url']
                                    let recLink = `<a href='${strTenderFileURL}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink ? recLink : null,
                                    });
                                } else if (key == 'custpage_other_files'){
                                    let strOtherFileURL = data['custpage_other_files_url']
                                    let recLink = `<a href='${strOtherFileURL}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink ? recLink : null,
                                    });
                                } else {
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: value
                                    });
                                }

                            } catch (error) {
                                log.error("setSublistValue error", error.message);
                            }
                        }
                    }
                });

        
            } catch (err) {
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR 1", err.message);
            }
        };

        const addSublistFields2nd = (options) => {
            try {
                let arrSublistDataParam = options.data;

                let sublist = options.form.addSublist({
                    id: 'custpage_sublist2',
                    type: serverWidget.SublistType.LIST,
                    label: 'List of Load Confirmations and Status',
                    tab: 'custpage_tab_load_confirmation'
                });
                
                for (let key in slMapping.SUITELET.form.sublistfields2nd) {
                    let fieldConfig = slMapping.SUITELET.form.sublistfields2nd[key];
                
                    let objField = sublist.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label
                    });
                                
                    if (fieldConfig.isEdit) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.ENTRY
                        });
                    }
                }
                
                
                arrSublistDataParam.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        try {
                            sublist.setSublistValue({
                                id: key,
                                line: index,
                                value: value ? value : null
                            });
                        } catch (error) {
                            log.error("setSublistValue error", error.message);
                        }
                    }
                });

        
            } catch (err) {
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR 2", err.message);
            }
        };

        const addSublistFields3rd = (options) => {
            try {
                let arrSublistDataParam = options.data;

                let sublist = options.form.addSublist({
                    id: 'custpage_sublist3',
                    type: serverWidget.SublistType.LIST,
                    label: 'AIG - List of Load Confirmations and Status - In Transit',
                    tab: 'custpage_tabid'
                });
                
                for (let key in slMapping.SUITELET.form.sublistfields3rd) {
                    let fieldConfig = slMapping.SUITELET.form.sublistfields3rd[key];
                
                    let objField = sublist.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label
                    });
                                
                    if (fieldConfig.isEdit) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.ENTRY
                        });
                    }
                }
                
                
                arrSublistDataParam.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        if (value !== undefined && value !== null && value !== "") {
                            try {
                                sublist.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: value
                                });
                            } catch (error) {
                                log.error("setSublistValue error", error.message);
                            }
                        }
                    }
                });

        
            } catch (err) {
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR 3", err.message);
            }
        };

        const addSublistFields4th = (options) => {
            try {
                let arrSublistDataParam = options.data;

                let sublist = options.form.addSublist({
                    id: 'custpage_sublist4',
                    type: serverWidget.SublistType.LIST,
                    label: 'AIG - List of Loads Booked',
                    tab: 'custpage_tabid'
                });
                
                for (let key in slMapping.SUITELET.form.sublistfields4th) {
                    let fieldConfig = slMapping.SUITELET.form.sublistfields4th[key];
                
                    let objField = sublist.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label
                    });
                                
                    if (fieldConfig.isEdit) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.ENTRY
                        });
                    }
                }
                
                
                arrSublistDataParam.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        if (value !== undefined && value !== null && value !== "") {
                            try {
                                sublist.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: value
                                });
                            } catch (error) {
                                log.error("setSublistValue error", error.message);
                            }
                        }
                    }
                });

        
            } catch (err) {
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR 4", err.message);
            }
        };
        
        const runSearch = (options) => {
            try {
                log.debug('runSearch options', options)
                let arrSearchParam = options.contextParam.filterParam ? JSON.parse(options.contextParam.filterParam) : [] 
                let puLocation = null
                let dropLocation = null
                let customerPO = null
                let arrLoadOrder = []
                let arrOrderStatus = []
                let arrCustmerId = []
                let customFilters = [];
                let arrAddFlds = ['custrecord_status', 'custrecord_customer'];
                let strSortBy = null;
                let stdColumns = [
                    search.createColumn({ name: 'custrecord_pu_location', label: 'custpage_pu_location' }),
                    search.createColumn({ name: 'custrecord_drop_location', label: 'custpage_drop_location' }),
                    search.createColumn({ name: 'custrecord_miles', label: 'custpage_miles' }),
                    search.createColumn({ name: 'custrecord_amount', label: 'custpage_amount' }),
                    search.createColumn({ name: 'custrecord_target_rate', label: 'custpage_target_rate' }),
                    search.createColumn({ name: 'custrecord_commodity', label: 'custpage_commodity' }),
                    search.createColumn({ name: 'custrecord_pu_timeline', label: 'custpage_pu_timeline' }),
                    search.createColumn({ name: 'custrecord_drop_timeline', label: 'custpage_drop_timeline' }),
                    search.createColumn({ name: 'custrecord_po_number', label: 'custpage_po_number' }),
                    search.createColumn({ name: 'custrecord_load_order', label: 'custpage_load_order' }),
                    search.createColumn({ name: 'custrecord_load_order', label: 'custpage_id_load_order' }),
                    search.createColumn({ name: 'custrecord_tender_files', label: 'custpage_tender_files' }),
                    search.createColumn({ name: 'custrecord_tender_files_url', label: 'custpage_tender_files_url' }),
                    search.createColumn({ name: 'custrecord_other_files', label: 'custpage_other_files' }),
                    search.createColumn({ name: 'custrecord_other_files_url', label: 'custpage_other_files_url' }),
                    search.createColumn({ name: 'custrecord_notes', label: 'custpage_notes' }),
                    search.createColumn({ name: 'internalid', label: 'custpage_view_sub_rec' }),
                ];

                if (arrSearchParam && arrSearchParam.length > 0){
                    arrSearchParam.forEach((data) => {
                        log.debug('runSearch arrSearchParam data', data)
                        puLocation = data.custpage_pu_location ? data.custpage_pu_location : null;
                        dropLocation = data.custpage_drop_location ? data.custpage_drop_location : null;
                        customerPO = data.custpage_customer_po ? data.custpage_customer_po : null;
                        strSortBy = data.custpage_sortby ? data.custpage_sortby : null;
                        arrLoadOrder = data.custpage_load_order ? data.custpage_load_order : null 
                        arrOrderStatus = data.custpage_status ? data.custpage_status : null;
                        arrCustmerId = data.custpage_customer_id ? data.custpage_customer_id : null;
                    });
                } 

                if (puLocation) {
                    customFilters.push(['custrecord_pu_location', 'contains', puLocation]);
                }

                if (dropLocation) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_drop_location', 'contains', dropLocation]);
                }

                if (customerPO) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_po_number', 'contains', customerPO]);
                }

                if (arrLoadOrder && arrLoadOrder.length > 0 && arrLoadOrder[0] !== "") {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.internalid', 'anyof', arrLoadOrder]);
                }

                if (arrOrderStatus && arrOrderStatus.length > 0 && arrOrderStatus[0] !== "") {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_status', 'anyof', arrOrderStatus]);
                }

                if (arrCustmerId && arrCustmerId.length > 0 && arrCustmerId[0] !== "") {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_customer', 'anyof', arrCustmerId]);
                }
                log.debug('runSearch strSortBy', strSortBy)

                if (strSortBy && arrAddFlds.includes(strSortBy)) {
                    stdColumns.push(search.createColumn({
                        name: 'internalid',
                        label: 'custpage_name',
                    }));
                    arrAddFlds.forEach(fldId => {
                        let objNewColumn = search.createColumn({
                            name: fldId,
                            label: fldId.replace('custrecord', 'custpage'),
                        });
                        if (strSortBy == fldId){
                            objNewColumn.sort = search.Sort.ASC
                        }
                        stdColumns.push(objNewColumn)
                    });
                } else {
                    stdColumns.push(search.createColumn({
                        name: 'internalid',
                        label: 'custpage_name',
                        sort: search.Sort.DESC
                    }));
                    arrAddFlds.forEach(fldId => {
                        let objNewColumn = search.createColumn({
                            name: fldId,
                            label: fldId.replace('custrecord', 'custpage'),
                        });
                        stdColumns.push(objNewColumn)
                    });
                }
                

                log.debug('runSearch customFilters', customFilters)
                log.debug('runSearch stdColumns', stdColumns)
                let arrFieldsText = ['custpage_load_order', 'custpage_tender_files', 'custpage_other_files']
                let arrSearchResults = []
                let objSavedSearch = search.create({
                    type: 'customrecord_my_sales_data',
                    filters: customFilters,
                    columns: stdColumns,
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
                                    if (arrFieldsText.includes(resultLabel)){
                                        objData[resultLabel] = pageData[pageResultIndex].getText(result);
                                    } else {
                                        objData[resultLabel] = pageData[pageResultIndex].getValue(result);
                                    }
                                })
                                arrSearchResults.push(objData);
                            }
                        }   
                    }
                }
            log.debug(`runSearch arrSearchResults ${Object.keys(arrSearchResults).length}`, arrSearchResults);

            return arrSearchResults;

            } catch (err) {
                log.error('Error: runSearch', err.message);
            }
        }

        const runSearch2nd = (options) => {
            try {
                log.debug('runSearch2nd options', options)
                let arrSearchParam = options.contextParam.filterParam ? JSON.parse(options.contextParam.filterParam) : [] 
                
                let customFilters = [
                    ['type', 'anyof', 'PurchOrd'],
                    'AND',
                    ['status', 'anyof', 'PurchOrd:E', 'PurchOrd:F'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['custbody4', 'anyof', '2', '6'],
                ];

                let arrFieldsText = ['custpage_order_status', 'custpage_name']
                let arrSearchResults = []
                let objSavedSearch = search.create({
                    type: 'purchaseorder',
                    filters: customFilters,
                    columns: [
                        search.createColumn({ name: 'internalid', label: 'custpage_rec_id', sort: search.Sort.DESC }),
                        search.createColumn({ name: 'tranid', label: 'custpage_doc_num' }),
                        search.createColumn({ name: 'trandate', label: 'custpage_date' }),
                        search.createColumn({ name: 'entity', label: 'custpage_name' }),
                        search.createColumn({ name: 'memo', label: 'custpage_memo' }),
                        search.createColumn({ name: 'amount', label: 'custpage_amount' }),
                        search.createColumn({ name: 'custbody4', label: 'custpage_order_status' }),
                        search.createColumn({ name: 'custbody_pu_location', label: 'custpage_pu_location' }),
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
                                    if (arrFieldsText.includes(resultLabel)){
                                        objData[resultLabel] = pageData[pageResultIndex].getText(result);
                                    } else {
                                        objData[resultLabel] = pageData[pageResultIndex].getValue(result);
                                    }
                                })
                                arrSearchResults.push(objData);
                            }
                        }   
                    }
                }
            log.debug(`runSearch runSearch2nd ${Object.keys(arrSearchResults).length}`, arrSearchResults);

            return arrSearchResults;

            } catch (err) {
                log.error('Error: runSearch2nd', err.message);
            }
        }

        const runSearch3rd = (options) => {
            try {
                log.debug('runSearch3rd options', options)
                let arrSearchParam = options.contextParam.filterParam ? JSON.parse(options.contextParam.filterParam) : [] 
                
                let customFilters = [
                    ['type', 'anyof', 'PurchOrd'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['custbody4', 'anyof', '4', '8', '7'],
                ];

                let arrFieldsText = ['custpage_order_status', 'custpage_name']
                let arrSearchResults = []
                let objSavedSearch = search.create({
                    type: 'purchaseorder',
                    filters: customFilters,
                    columns: [
                        search.createColumn({ name: 'internalid', label: 'custpage_rec_id', sort: search.Sort.DESC }),
                        search.createColumn({ name: 'tranid', label: 'custpage_doc_num' }),
                        search.createColumn({ name: 'custbody_entity_company_name', label: 'custpage_vendor' }),
                        search.createColumn({ name: 'custbody4', label: 'custpage_status' }),
                        search.createColumn({ name: 'custbody30', label: 'custpage_eta' }),
                        search.createColumn({ name: 'custbody20', label: 'custpage_del_date' }),
                        search.createColumn({ name: 'custbody_pu_location', label: 'custpage_pu_city' }),
                        search.createColumn({ name: 'custbody_drop_location', label: 'custpage_drop_location' }),
                        search.createColumn({ name: 'createdfrom', label: 'custpage_created_from' }),
                        search.createColumn({ name: 'formulatext', formula: '{createdfrom.entity}', label: 'custpage_customer' }),
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
                                    if (arrFieldsText.includes(resultLabel)){
                                        objData[resultLabel] = pageData[pageResultIndex].getText(result);
                                    } else {
                                        objData[resultLabel] = pageData[pageResultIndex].getValue(result);
                                    }
                                })
                                arrSearchResults.push(objData);
                            }
                        }   
                    }
                }
            log.debug(`runSearch runSearch3rd ${Object.keys(arrSearchResults).length}`, arrSearchResults);

            return arrSearchResults;

            } catch (err) {
                log.error('Error: runSearch3rd', err.message);
            }
        }

        const runSearch4th = (options) => {
            try {
                log.debug('runSearch4th options', options)
                let arrSearchParam = options.contextParam.filterParam ? JSON.parse(options.contextParam.filterParam) : [] 
                
                let customFilters = [
                    ['type', 'anyof', 'PurchOrd'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['custbody4', 'anyof', '5', '1'],
                ];

                let arrFieldsText = ['custpage_order_status', 'custpage_vendor']
                let arrSearchResults = []
                let objSavedSearch = search.create({
                    type: 'purchaseorder',
                    filters: customFilters,
                    columns: [
                        search.createColumn({ name: 'internalid', label: 'custpage_rec_id', sort: search.Sort.DESC }),
                        search.createColumn({ name: 'tranid', label: 'custpage_doc_num' }),
                        search.createColumn({ name: 'custbody_entity_company_name', label: 'custpage_vendor' }),
                        search.createColumn({ name: 'custbody4', label: 'custpage_order_status' }),
                        search.createColumn({ name: 'custbody30', label: 'custpage_eta' }),
                        search.createColumn({ name: 'custbody19', label: 'custpage_pu_date' }),
                        search.createColumn({ name: 'custbody_pu_location', label: 'custpage_pu_city' }),
                        search.createColumn({ name: 'custbody_drop_location', label: 'custpage_drop_location' }),
                        
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
                                    if (arrFieldsText.includes(resultLabel)){
                                        objData[resultLabel] = pageData[pageResultIndex].getText(result);
                                    } else {
                                        objData[resultLabel] = pageData[pageResultIndex].getValue(result);
                                    }
                                })
                                arrSearchResults.push(objData);
                            }
                        }   
                    }
                }
            log.debug(`runSearch runSearch3rd ${Object.keys(arrSearchResults).length}`, arrSearchResults);

            return arrSearchResults;

            } catch (err) {
                log.error('Error: runSearch3rd', err.message);
            }
        }

        const populateDropdownOptions = (field, source) => {
            if (source == 'customlist787') {
                const customListSearch = search.create({
                    type: 'customlist787',
                    columns: ['internalid', 'name']
                });
        
                const results = customListSearch.run().getRange({ start: 0, end: 1000 });
                results.forEach(result => {
                    field.addSelectOption({
                        value: result.getValue({ name: 'internalid' }),
                        text: result.getValue({ name: 'name' })
                    });
                });
            } else {
                const recordSearch = search.create({
                    type: source,
                    columns: ['internalid', 'entityid']
                });
                const results = recordSearch.run().getRange({ start: 0, end: 1000 });
                results.forEach(result => {
                    field.addSelectOption({
                        value: result.getValue({ name: 'internalid' }),
                        text: result.getValue({ name: 'entityid' })
                    });
                });
            }
        }

        const viewResults = () => {
            try {
                var sURL = url.resolveScript({
                    scriptId : 'customscript_add_sub_item_main_page_sl',
                    deploymentId : 'customdeploy_add_sub_item_main_page_sl',
                    returnExternalUrl : false,
                    params : {
                        transkey: strTransKey
                    }
                });
                window.onbeforeunload = null;
                window.location = sURL;
            } catch (error) {
                console.log('Error: viewResults', error.message)
            }
        }

        return { FORM, ACTIONS }
    });
