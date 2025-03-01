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
                let arrNotes = [];
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
                    
                    if (fieldConfig.isInLine) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });
                    }
                }
                
                arrNotes = searchNotes()
                
                arrSublistDataParam.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        if (value !== undefined && value !== null && value !== "") {
                            try {
                                if (key == 'custpage_load_order'){
                                    let SalesId = data['custpage_load_order_id']
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
                                    let soId = data['custpage_load_order_id'];
                                    let customerId = data['custpage_customer'];
                                    let strFrom = data['custpage_pu_location'];
                                    let strTo = data['custpage_drop_location'];
                                    let strAmount = data['custpage_amount'];
                                    let strRate = data['custpage_target_rate'];
                                    let strTender = data['custpage_tender_files'];
                                    let strOtherFile = data['custpage_other_files']; 
                                    let strTenderURL = data['custpage_tender_files_url'];
                                    let strOtherFileURL = data['custpage_other_files_url']; 
                                    let strLength = data['custpage_lenght_feet']; 
                                    let strWidth = data['custpage_width_feet']; 
                                    let strHeight= data['custpage_height_feet']; 
                                    let strWeight = data['custpage_load_weight']; 
                                    let strFileCabinetId = data['custpage_file_cabinet_id']; 
                                    let strTranId = data['custpage_tran_id']; 


                                    
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
                                        custpage_other_files_url: strOtherFileURL,
                                        custpage_lenght_feet: strLength,
                                        custpage_width_feet: strWidth,
                                        custpage_height_feet: strHeight,
                                        custpage_load_weight: strWeight,
                                        custpage_so_files: strFileCabinetId,
                                        custpage_so_tranid: strTranId,

                                    };
                                    var sURL = url.resolveScript({
                                        scriptId : 'customscript_add_sub_item_main_page_sl',
                                        deploymentId : 'customdeploy_add_sub_item_main_page_sl',
                                        returnExternalUrl : false,
                                        
                                        params : {
                                            transkey: JSON.stringify(objParamView)
                                        }
                                    });
                                    let recLink = `<a href='#' onclick="window.open('${sURL}', 'popupView', 'width=1000,height=800,scrollbars=yes,resizable=yes');">VIEW</a>`;
                                    // let recLink = `<a href='${sURL}' target="_blank" rel="noopener noreferrer">VIEW</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink ? recLink : null
                                    });
                                } else if (key == 'custpage_view_notes_rec'){
                                    let msdId = data['custpage_name'];

                                    const arrFilteredByMSDId = arrNotes.filter(item =>
                                        item.title == msdId 
                                    );
                                    // log.debug('arrFilteredByMSDId', arrFilteredByMSDId);

                                    var sURL = url.resolveScript({
                                        scriptId : 'customscript_add_sub_notes_main_page_sl',
                                        deploymentId : 'customdeploy_add_sub_notes_main_page_sl',
                                        returnExternalUrl : false,
                                        
                                        params : {
                                            transkey: msdId
                                        }
                                    });
                                    let recLink = `<a href='#' onclick="window.open('${sURL}', 'popupView', 'width=1000,height=800,scrollbars=yes,resizable=yes');">${arrFilteredByMSDId.length}</a>`;
                                    // let recLink = `<a href='${sURL}' target="_blank" rel="noopener noreferrer">VIEW</a>`
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink ? recLink : null
                                    });
                                } else if (key == 'custpage_need_call'){
                                    let blnCall = data[key];
                                    let strCall = 'F'
                                    if (blnCall){
                                        strCall = 'T'
                                    }
                                    sublist.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: strCall
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
        
        const runSearch = (options) => {
            try {
                log.debug('runSearch options', options)
                let arrSearchParam = options.contextParam.filterParam ? JSON.parse(options.contextParam.filterParam) : [] 
                let puLocation = null
                let dropLocation = null
                let customerPO = null
                let strLoadOrder = null
                let intDepartment = null
                let arrOrderStatus = null
                let strCustmerId = null
                let customFilters = [];
                let arrAddFlds = ['custrecord_status', 'custrecord_customer', 'custrecord_need_call'];
                let strSortBy = null;
                let stdColumns = [

                    search.createColumn({ name: 'custrecord_miles', label: 'custpage_miles' }),
                    // search.createColumn({ name: 'custrecord_amount', label: 'custpage_amount' }),
                    search.createColumn({ name: 'custrecord_target_rate', label: 'custpage_target_rate' }),
                    // search.createColumn({ name: 'custrecord_commodity', label: 'custpage_commodity' }),
                    // search.createColumn({ name: 'custrecord_pu_timeline', label: 'custpage_pu_timeline' }),
                    // search.createColumn({ name: 'custrecord_drop_timeline', label: 'custpage_drop_timeline' }),
                    search.createColumn({ name: 'custrecord_load_order', label: 'custpage_load_order' }),
                    search.createColumn({ name: 'custrecord_load_order', label: 'custpage_load_order_id' }),
                    // search.createColumn({ name: 'custrecord_tender_files', label: 'custpage_tender_files' }),
                    // search.createColumn({ name: 'custrecord_tender_files_url', label: 'custpage_tender_files_url' }),
                    // search.createColumn({ name: 'custrecord_other_files', label: 'custpage_other_files' }),
                    // search.createColumn({ name: 'custrecord_other_files_url', label: 'custpage_other_files_url' }),
                    search.createColumn({ name: 'custrecord_notes', label: 'custpage_notes' }),
                    search.createColumn({ name: 'internalid', label: 'custpage_view_sub_rec' }),

                    search.createColumn({ name: 'custbody_lenght_feet',  join: 'custrecord_load_order', label: 'custpage_lenght_feet' }),
                    search.createColumn({ name: 'custbody_width_feet', join: 'custrecord_load_order', label: 'custpage_width_feet' }),
                    search.createColumn({ name: 'custbody_height_feet', join: 'custrecord_load_order', label: 'custpage_height_feet' }),
                    search.createColumn({ name: 'custbody_load_weight', join: 'custrecord_load_order', label: 'custpage_load_weight' }),

                    search.createColumn({ name: 'internalid', label: 'custpage_view_notes_rec' }),
                    search.createColumn({ name: 'custbody_file_cabinet_id', join: 'custrecord_load_order', label: 'custpage_file_cabinet_id' }),
                    search.createColumn({ name: 'tranid', join: 'custrecord_load_order', label: 'custpage_tran_id' }),   
                    search.createColumn({ name: 'department', join: 'custrecord_load_order', label: 'custpage_department' }),   
                    search.createColumn({ name: 'fxamount', join: 'custrecord_load_order', label: 'custpage_amount' }),   
                    search.createColumn({ name: 'custbody_pu_location', join: 'custrecord_load_order', label: 'custpage_pu_location' }),
                    search.createColumn({ name: 'custbody_drop_location', join: 'custrecord_load_order', label: 'custpage_drop_location' }),
                    search.createColumn({ name: 'custbody_load_detailsgeorge', join: 'custrecord_load_order', label: 'custpage_load_detailsgeorge' }),
                    search.createColumn({ name: 'custbody_customer_po_numbers', join: 'custrecord_load_order', label: 'custpage_customer_po_numbers' }),
                    search.createColumn({ name: 'custbody_need_call', join: 'custrecord_load_order', label: 'custpage_need_call' }),

                ];

                if (arrSearchParam && arrSearchParam.length > 0){
                    arrSearchParam.forEach((data) => {
                        log.debug('runSearch arrSearchParam data', data)
                        puLocation = data.custpage_pu_location_head ? data.custpage_pu_location_head : null;
                        dropLocation = data.custpage_drop_location_head ? data.custpage_drop_location_head : null;
                        customerPO = data.custpage_customer_po ? data.custpage_customer_po : null;
                        strSortBy = data.custpage_sortby ? data.custpage_sortby : null;
                        strLoadOrder = data.custpage_load_order_head ? data.custpage_load_order_head : null 
                        arrOrderStatus = data.custpage_status_head ? data.custpage_status_head : null;
                        strCustmerId = data.custpage_customer_id ? data.custpage_customer_id : null;
                        intDepartment = data.custpage_department_head ? data.custpage_department_head : null;
                    });
                } 

                customFilters.push(['custrecord_load_order.mainline', 'is', 'T']);

                if (puLocation) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.custbody_pu_location', 'contains', puLocation]);
                }

                if (dropLocation) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.custbody_drop_location', 'contains', dropLocation]);
                }

                if (customerPO) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.custbody_customer_po_numbers', 'contains', customerPO]);
                }

                
                if (intDepartment) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.department', 'anyof', intDepartment],);
                }

                if (strLoadOrder) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.numbertext', 'contains', strLoadOrder]);
                } else {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order', 'noneof', '@NONE@']);
                }

                if (arrOrderStatus) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.custbody10', 'anyof', arrOrderStatus]);
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.custbody10', 'noneof', '4']); // Ready for Invoice
                } else {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_load_order.custbody10', 'noneof', '4']); // Ready for Invoice
                }

                if (strCustmerId) {
                    if (customFilters.length > 0) customFilters.push('AND');
                    customFilters.push(['custrecord_customer.entityid', 'contains', strCustmerId]);
                }
                log.debug('runSearch strSortBy', strSortBy)

                if (strSortBy && arrAddFlds.includes(strSortBy)) {
                    stdColumns.push(search.createColumn({
                        name: 'internalid',
                        label: 'custpage_name',
                    }));
                    arrAddFlds.forEach(fldId => {
                        let newFldId = null
                        
                        if (fldId == 'custrecord_status'){
                            newFldId = fldId.replace('custrecord_status', 'custbody10')
                        } else if (fldId == 'custrecord_customer'){
                            newFldId = fldId.replace('custrecord_customer', 'entity')
                        } else {
                            newFldId = fldId.replace('custrecord', 'custbody')
                        }

                        let objNewColumn = search.createColumn({
                            name: newFldId,
                            join: 'custrecord_load_order',
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
                        let newFldId = null
                        
                        if (fldId == 'custrecord_status'){
                            newFldId = fldId.replace('custrecord_status', 'custbody10')
                        } else if (fldId == 'custrecord_customer'){
                            newFldId = fldId.replace('custrecord_customer', 'entity')
                        } else {
                            newFldId = fldId.replace('custrecord', 'custbody')
                        }

                        let objNewColumn = search.createColumn({
                            name: newFldId,
                            join: 'custrecord_load_order',
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
                    
                    if (fieldConfig.isInLine) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.INLINE
                        });
                    }
                }
                
                
                arrSublistDataParam.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        if (value !== undefined && value !== null && value !== "") {
                            try {
                                if (key == 'custpage_doc_num'){
                                    let purchaseId = data['custpage_rec_id']
                                    var strRecUrl = url.resolveRecord({
                                        recordType: 'purchaseorder',
                                        recordId: purchaseId
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
                log.error("BUILD_FORM_ADD_SUBLIST_ERROR 2", err.message);
            }
        };

        const runSearch2nd = (options) => {
            try {
                let strSortBy = null
                log.debug('runSearch2nd options', options)
                let arrSearchParam = options.contextParam.filterParam ? JSON.parse(options.contextParam.filterParam) : [] 
                log.debug('runSearch2nd arrSearchParam', arrSearchParam)

                let customFilters = [
                    ['type', 'anyof', 'PurchOrd'],
                    'AND',
                    ['status', 'noneof', 'PurchOrd:G', 'PurchOrd:H', 'PurchOrd:C', 'PurchOrd:A'],
                    'AND',
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['custbody4', 'noneof', '@NONE@'],
                ];

                let stdColumns = [
                    search.createColumn({ name: 'tranid', label: 'custpage_doc_num' }),
                    search.createColumn({ name: 'tranid', label: 'custpage_po_tran_id' }),
                    search.createColumn({ name: 'trandate', label: 'custpage_trans_date' }),
                    search.createColumn({ name: 'custbody19', label: 'custpage_pu_date' }),
                    search.createColumn({ name: 'custbody20', label: 'custpage_drop_date' }),
                    search.createColumn({ name: 'memo', label: 'custpage_memo' }),
                    search.createColumn({ name: 'amount', label: 'custpage_amount' }),
                    search.createColumn({ name: 'custbody_pu_location', label: 'custpage_pu_location' }),
                ]

                if (arrSearchParam.length > 0){
                    strSortBy = arrSearchParam[0].custpage_sortby ? arrSearchParam[0].custpage_sortby : null

                    if (arrSearchParam[0].custpage_load_confirmation){
                        customFilters.push('AND'),
                        customFilters.push(['numbertext', 'contains', arrSearchParam[0].custpage_load_confirmation])
                    }
                    if (arrSearchParam[0].custpage_vendor_id){
                        customFilters.push('AND'),
                        customFilters.push(['vendor.entityid', 'contains', arrSearchParam[0].custpage_vendor_id])
                    }
                    if (arrSearchParam[0].custpage_status_lc){
                        customFilters.push('AND'),
                        customFilters.push(['custbody4', 'anyof', arrSearchParam[0].custpage_status_lc])
                    }
                    if (arrSearchParam[0].custpage_department_head){
                        customFilters.push('AND'),
                        customFilters.push(['department', 'anyof', arrSearchParam[0].custpage_department_head])
                    }
                    if (arrSearchParam[0].custpage_drop_location_head){
                        customFilters.push('AND'),
                        customFilters.push(['custbody_drop_location', 'contains', arrSearchParam[0].custpage_drop_location_head])
                    }
                    if (arrSearchParam[0].custpage_pu_location_head){
                        customFilters.push('AND'),
                        customFilters.push(['custbody_pu_location', 'contains', arrSearchParam[0].custpage_pu_location_head])
                    }
                }

                let arrAddFlds = ['custrecord_status', 'custrecord_customer'];
                log.debug('runSearch2nd strSortBy', strSortBy)

                if (arrAddFlds.includes(strSortBy)){
                    stdColumns.push(search.createColumn({
                        name: 'internalid',
                        label: 'custpage_rec_id',
                    }));
                    arrAddFlds.forEach(fldId => {
                        let newFldId = fldId.startsWith('custrecord_status')
                        ? fldId.replace('custrecord_status', 'custbody4')
                        : fldId.replace('custrecord_customer', 'entity');

                        let newLabelId = fldId.startsWith('custrecord_status')
                        ? fldId.replace('custrecord_status', 'custpage_order_status')
                        : fldId.replace('custrecord_customer', 'custpage_company_name');

                        if (fldId == 'custrecord_customer'){
                            let objNewColumn = search.createColumn({
                                name: 'companyname',
                                join: 'vendor',
                                label: 'custpage_company_name',
                            });
                            if (strSortBy == fldId){
                                objNewColumn.sort = search.Sort.ASC
                            }
                            stdColumns.push(objNewColumn)
                        } else {
                            let objNewColumn = search.createColumn({
                                name: newFldId,
                                label: newLabelId,
                            });
                            if (strSortBy == fldId){
                                objNewColumn.sort = search.Sort.ASC
                            }
                            stdColumns.push(objNewColumn)
                        }
                    });
                } else {
                    stdColumns.push(search.createColumn({
                        name: 'internalid',
                        label: 'custpage_rec_id',
                        sort: search.Sort.DESC
                    }));
                    arrAddFlds.forEach(fldId => {
                        let newFldId = fldId.startsWith('custrecord_status')
                        ? fldId.replace('custrecord_status', 'custbody4')
                        : fldId.replace('custrecord_customer', 'entity');

                        let newLabelId = fldId.startsWith('custrecord_status')
                        ? fldId.replace('custrecord_status', 'custpage_order_status')
                        : fldId.replace('custrecord_customer', 'custpage_company_name');


                        if (fldId == 'custrecord_customer'){
                            let objNewColumn = search.createColumn({
                                name: 'companyname',
                                join: 'vendor',
                                label: 'custpage_company_name',
                            });
                            stdColumns.push(objNewColumn)
                        } else {
                            let objNewColumn = search.createColumn({
                                name: newFldId,
                                label: newLabelId,
                            });
                            stdColumns.push(objNewColumn)
                        }
                    });
                }

                log.debug('runSearch2nd customFilters', customFilters)
                log.debug('runSearch2nd stdColumns', stdColumns)


                let arrFieldsText = ['']
                let arrSearchResults = []
                let objSavedSearch = search.create({

                    type: 'purchaseorder',
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
            log.debug(`runSearch runSearch2nd ${Object.keys(arrSearchResults).length}`, arrSearchResults);

            return arrSearchResults;

            } catch (err) {
                log.error('Error: runSearch2nd', err.message);
            }
        }

        const searchNotes = (msdId) => {
            let arrNotes = [];
              try {
                  let objSearch = search.create({
                      type: 'note',
                      filters:  [
                        ['notetype', 'anyof', '7'],
                    ],
                      columns: [
                          search.createColumn({ name: 'internalid' }),
                          search.createColumn({ name: 'author' }),
                          search.createColumn({ name: 'title' }),
                          search.createColumn({ name: 'note' }),
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
                                arrNotes.push({
                                      internalId: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                      author: pageData[pageResultIndex].getValue({name: 'author'}),
                                      title: pageData[pageResultIndex].getValue({name: 'title'}),
                                      note: pageData[pageResultIndex].getValue({name: 'note'}),

                                  });
                              }
                          }
                      }
                  }
              } catch (err) {
                  log.error('searchNotes', err.message);
              }
              log.debug("searchNotes arrNotes", arrNotes)
              return arrNotes;
        }

        const populateDropdownOptions = (field, source) => {
            if (source == 'customlist787' || source == 'customlist786') {
                const customListSearch = search.create({
                    type: source,
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

        return { FORM, ACTIONS }
    });
