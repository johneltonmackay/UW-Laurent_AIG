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
                    hideNavBar: true
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

        ACTIONS.createSubItem = (options) => {
            let arrCustomRecId = []
            try {
                let arrCusRecData = []
                let objData = {}
                log.debug('createSubItem options', options.postParam)
                let objParamDataCusRecId = options.postParam[0]
                const subItemDataObj = options.postParam.find(item => item.custpage_create_sub_item_data);
                log.debug('createSubItem subItemDataObj', subItemDataObj)

                if (subItemDataObj){
                    const arrParamDataSublist = subItemDataObj.custpage_create_sub_item_data 
                    ? JSON.parse(subItemDataObj.custpage_create_sub_item_data) 
                    : [];
    
                    arrParamDataSublist.forEach(data => {
                        const objData = { ...data }; // Create a new object and copy properties from data
                        objData.custpage_monday_parent_id = objParamDataCusRecId.custpage_monday_parent_id;
                        arrCusRecData.push(objData);
                    });
    
                    log.debug('createSubItem arrCusRecData', arrCusRecData)
    
                    if (arrCusRecData.length > 0){
                        arrCustomRecId = createCustomRecord(arrCusRecData)
                    }
                }
            } catch (error) {
                log.error('createSubItem Error', error.message)
            }
            return arrCustomRecId;
        }

        ACTIONS.viewResults = (options) => {
            try {
                var objForm = serverWidget.createForm({
                    title: options.title,
                    hideNavBar: true
                });
                log.debug('viewResults buildForm options', options)

                objForm.clientScriptModulePath = slMapping.SUITELET.form.CS_PATH;

                addButtons({
                    form: objForm,
                });

                addTabs({
                    form: objForm,
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

                options.form.addTab({
                    id : 'custpage_tab_load_order_line',
                    label : 'Load Order Line Item'
                });
                options.form.addSubtab({
                    id : 'custpage_subtab_load_order_line',
                    label : 'Load Order Line Item Details',
                    tab: 'custpage_tab_load_order_line'
                });

            } catch (error) {
                log.error('addTabs Error', error.message)
            }
            
        }

        const addButtons = (options) => {
            try {
                const submitButton = options.form.addSubmitButton({
                    label: slMapping.SUITELET.form.buttons.SUBMIT.label,
                });
                // submitButton.isHidden = true;

                const buttons = slMapping.SUITELET.form.buttons;
                for (const strKey in buttons) {
                    if (Object.prototype.hasOwnProperty.call(buttons, strKey)) {
                        const button = buttons[strKey];
                        if (button.isCustom) { 
                            options.form.addButton({
                                id: button.id, 
                                label: button.label,
                                functionName: button.functionName || null
                            });
                        }
                    }
                }
            } catch (err) {
                log.error("BUILD_FORM_ADD_BUTTONS_ERROR", err.message);
            }
        };

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

                    if (slMapping.SUITELET.form.fields[strKey].isHidden) {
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

        const addNewFields = (options) => {
            try {
                let objParam = options.param
                log.debug('addNewFields objParam', objParam)
                
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

                    if (slMapping.SUITELET.form.fields[strKey].isHidden) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }

                    if (slMapping.SUITELET.form.fields[strKey].hasDefault) {
                        let compareKey = slMapping.SUITELET.form.fields[strKey].id
                        for (const key in objParam) {
                            if (key == compareKey) {
                                const element = objParam[key];
                                if (key == 'custpage_so_files'){
                                    let strSOName = objParam['custpage_so_tranid']
                                    let fileCabinetId = element;
                                    let strFileCabinetURL = `/app/common/media/mediaitemfolders.nl?folder=${fileCabinetId}`
                                    let recLink = `<a href='${strFileCabinetURL}' target="_blank" rel="noopener noreferrer">${strSOName}</a>`
                                    objField.updateDisplayType({
                                        displayType: serverWidget.FieldDisplayType.INLINE
                                    });
                                    objField.defaultValue = fileCabinetId ? recLink : null;
                                } else {
                                    let arrFieldEntry = ['custpage_lenght_feet', 'custpage_width_feet', 'custpage_height_feet', 'custpage_load_weight']
                                    if (arrFieldEntry.includes(key)){
                                        objField.updateDisplayType({
                                            displayType: serverWidget.FieldDisplayType.ENTRY
                                        });
                                    } else {
                                        objField.updateDisplayType({
                                            displayType: serverWidget.FieldDisplayType.INLINE
                                        });
                                    }

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
        
        const viewSublistFields = (options) => {
            try {
                buildCommodityTable(options)
                buildLocationTable(options)
                buildLoadOrderTable(options)
                buildLoadOrderLineItemsTable(options)
            } catch (err) {
                log.error("viewSublistFields_ERROR", err.message);
            }
        }

        const buildCommodityTable = (options) => {
            try {

                let sublistCommodity = options.form.addSublist({
                    id : 'custpage_sublist_commodity',
					type : serverWidget.SublistType.INLINEEDITOR,
					label : 'COMMODITY DETAILS',
					tab: 'custpage_tab_commodity'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfieldsCommodity) {

                    let fieldConfig = slMapping.SUITELET.form.sublistfieldsCommodity[strKey];
                
                    let objField = sublistCommodity.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label,
                    });

                    if (fieldConfig.isDisabled) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.DISABLED
                        });
                    }

                    if (fieldConfig.isHidden) {
                        objField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    }
                }

                let paramTransKey = options.parameters.custpage_monday_parent_id
                log.debug('buildCommodityTable paramTransKey', paramTransKey);
                if (paramTransKey){
                    let arrSearchResults = runViewSearch(paramTransKey)

                    arrSearchResults.forEach((data, index) => {
                        log.debug('buildCommodityTable data', data);
                        for (const key in data) {
                            let value = data[key];
                            if (value && value !== '' && value !== undefined && value !== null){
                                sublistCommodity.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: value,
                                });
                            }
                        }
                    });
                }
            } catch (error) {
                log.error("buildCommodityTable Error", error.message);
            }
        }

        const buildLocationTable = (options) => {
            try {
                let sublistLocation = options.form.addSublist({
                    id : 'custpage_sublist_location',
                    type : serverWidget.SublistType.LIST,
                    label : 'LOCATION DETAILS',
                    tab: 'custpage_tab_location'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfieldsLocation) {
    
                    let fieldConfig = slMapping.SUITELET.form.sublistfieldsLocation[strKey];
    
                    let objField = sublistLocation.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label,
                    });
                
                    configureFields(fieldConfig, objField)

                    let paramTransKey = options.parameters.custpage_so_number
                    log.debug('buildLocationTable paramTransKey', paramTransKey);
                    if (paramTransKey){
                        let arrSearchResults = runViewSearchLocation(paramTransKey)

                        arrSearchResults.forEach((data, index) => {
                            log.debug('buildLocationTable data', data);
                            for (const key in data) {
                                let value = data[key];
                                if (value && value !== '' && value !== undefined && value !== null){
                                    sublistLocation.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: value,
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (error) {
                log.error("buildLocationTable Error", error.message);
            }
        }

        const buildLoadOrderTable = (options) => {
            try {
                let sublistLoadOrder = options.form.addSublist({
                    id : 'custpage_sublist_load_order',
                    type : serverWidget.SublistType.LIST,
                    label : 'LOAD ORDER DETAILS',
                    tab: 'custpage_tab_load_order'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfieldsLoadOrder) {
                    let fieldConfig = slMapping.SUITELET.form.sublistfieldsLoadOrder[strKey];
    
                    let objField = sublistLoadOrder.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label,
                    });

                    configureFields(fieldConfig, objField)
                
                }

                let paramTransKey = options.parameters.custpage_so_number
                log.debug('buildLoadOrderTable paramTransKey', paramTransKey);
                if (paramTransKey){
                    let arrSearchResults = runViewSearchLoadWithConfirmation(paramTransKey)

                    arrSearchResults.forEach((data, index) => {
                        log.debug('buildLoadOrderTable data', data);
                        for (const key in data) {
                            let value = data[key];
                            if (value && value !== '' && value !== undefined && value !== null){
                                if (key == 'custpage_linked_po'){
                                    let PurchaseOrderId = data['custpage_internalid']
                                    var strRecUrl = url.resolveRecord({
                                        recordType: 'purchaseorder',
                                        recordId: PurchaseOrderId
                                    });
                                    let recLink = `<a href='${strRecUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublistLoadOrder.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink,
                                    });
                                } else {
                                    sublistLoadOrder.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: value,
                                    });
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                log.error("buildLoadOrderTable Error", error.message);
            }
        }

        const buildLoadOrderLineItemsTable = (options) => {
            try {
                let sublistLoadOrderLine = options.form.addSublist({
                    id : 'custpage_sublist_load_order_line',
                    type : serverWidget.SublistType.LIST,
                    label : 'LOAD ORDER LINE ITEM DETAILS',
                    tab: 'custpage_tab_load_order_line'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfieldsLoadOrderLine) {
                    let fieldConfig = slMapping.SUITELET.form.sublistfieldsLoadOrderLine[strKey];
    
                    let objField = sublistLoadOrderLine.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label,
                    });

                    configureFields(fieldConfig, objField)
                
                }

                let paramTransKey = options.parameters.custpage_so_number
                log.debug('buildLoadOrderLineItemsTable paramTransKey', paramTransKey);
                if (paramTransKey){
                    let arrSearchResults = runViewSearchLineItems(paramTransKey)

                    arrSearchResults.forEach((data, index) => {
                        log.debug('buildLoadOrderLineItemsTable data', data);
                        for (const key in data) {
                            let value = data[key];
                            if (value && value !== '' && value !== undefined && value !== null){
                                if (key == 'custpage_createpo'){
                                    let PurchaseOrderId = data['custpage_internalid']
                                    var strRecUrl = url.resolveRecord({
                                        recordType: 'purchaseorder',
                                        recordId: PurchaseOrderId
                                    });
                                    let recLink = `<a href='${strRecUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                    sublistLoadOrderLine.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink,
                                    });
                                } else {
                                    sublistLoadOrderLine.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: value,
                                    });
                                }
                            } else {
                                if (key == 'custpage_createpo'){
                                    let strForm = 78
                                    let entityId = data['custpage_entity']
                                    var sURL = `/app/accounting/transactions/purchord.nl?soid=${paramTransKey}&shipgroup=&dropship=T&custid=${entityId}&cf=${strForm}&nexus=1`
                                    log.debug('sURL', sURL)
                                    let recLink = `<a href='${sURL}' target="_blank" rel="noopener noreferrer">Drop Ship</a>`
                                    sublistLoadOrderLine.setSublistValue({
                                        id: key,
                                        line: index,
                                        value: recLink,
                                    });
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                log.error("buildLoadOrderLineItemsTable Error", error.message);
            }
        }

        const configureFields = (fieldConfig, objField) => {
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

        const populateDropdownOptions = (field, source) => {
            if (source == 'item') {
                const customListSearch = search.create({
                    type: 'item',
                    columns: ['internalid', 'itemid']
                });
        
                const results = customListSearch.run().getRange({ start: 0, end: 1000 });
                results.forEach(result => {
                    field.addSelectOption({
                        value: result.getValue({ name: 'internalid' }),
                        text: result.getValue({ name: 'itemid' })
                    });
                });
            } 

            if (source == 'customlist843') {
                const customListSearch = search.create({
                    type: 'customlist843',
                    columns: ['internalid', 'name']
                });
        
                const results = customListSearch.run().getRange({ start: 0, end: 1000 });
                results.forEach(result => {
                    field.addSelectOption({
                        value: result.getValue({ name: 'internalid' }),
                        text: result.getValue({ name: 'name' })
                    });
                });
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
                        // search.createColumn({ name: 'custrecord_lenght_feet', label: 'custpage_lenght_feet'}),
                        // search.createColumn({ name: 'custrecord_width_feet', label: 'custpage_width_feet'}),
                        // search.createColumn({ name: 'custrecord_height_feet', label: 'custpage_height_feet'}),
                        search.createColumn({ name: 'custrecord_commodity_sub', label: 'custpage_commodity_sub'}),
                        search.createColumn({ name: 'internalid', label: 'custpage_sub_rec_id'}),
                        // search.createColumn({ name: 'custrecord_load_weight', label: 'custpage_load_weight'}),
                        search.createColumn({ name: 'custrecord_requirements', label: 'custpage_requirements'}),        
                        search.createColumn({ name: 'custrecord_addtional_details', label: 'custpage_addtional_details'}),       
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

        const runViewSearchLocation = (paramTransKey) => {
            log.debug('runViewSearchLocation started');
            try {
                let strTransKey = paramTransKey
                log.debug('runViewSearchLocation strTransKey', strTransKey);

                let arrSearchResults = []

                let objSavedSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ['internalid', 'is', strTransKey],
                        'AND',
                        ['mainline', 'is', 'T'],
                    ],
                    columns: [
                        search.createColumn({ name: 'custbody_pu_location', label: 'custpage_pu_location'}),
                        search.createColumn({ name: 'custbody_drop_location', label: 'custpage_drop_location'}),
                        search.createColumn({ name: 'custbody19', label: 'custpage_pick_up_date'}),
                        search.createColumn({ name: 'custbody23', label: 'custpage_pick_up_hours'}),
                        search.createColumn({ name: 'custbody20', label: 'custpage_drop_date'}),     
                        search.createColumn({ name: 'custbody24', label: 'custpage_drop_hours'}),     
                        search.createColumn({ name: 'custbody22', label: 'custpage_pu_appointment'}),       
                        search.createColumn({ name: 'custbody21', label: 'custpage_drop_appointment'}),       
                        search.createColumn({ name: 'custbody_appointment_information', label: 'custpage_appointment_information'}),       
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
            log.debug(`runSearch runViewSearchLocation ${Object.keys(arrSearchResults).length}`, arrSearchResults);
            return arrSearchResults;

            } catch (err) {
                log.error('Error: runViewSearchLocation', err.message);
            }
        }

        const runViewSearchLoadWithConfirmation = (paramTransKey) => {
            log.debug('runViewSearchLoadWithConfirmation started');
            try {
                let strTransKey = paramTransKey
                log.debug('runViewSearchLoadWithConfirmation strTransKey', strTransKey);

                let arrSearchResults = []

                let objSavedSearch = search.create({
                    type: 'purchaseorder',
                    filters: [
                        ['createdfrom', 'is', strTransKey],
                        'AND',
                        ['mainline', 'is', 'T'],
                    ],
                    columns: [
                        search.createColumn({ name: 'custbody_truck_trailer_', label: 'custpage_book_carrier'}),
                        search.createColumn({ name: 'custbody_driver_name', label: 'custpage_driver_name'}),
                        search.createColumn({ name: 'custbody_driver_phone', label: 'custpage_driver_number'}),
                        search.createColumn({ name: 'custbody_dispatcher_name', label: 'custpage_dispatch_name'}),
                        search.createColumn({ name: 'custbody_dispatcher_phone', label: 'custpage_dispatch_number'}),        
                        search.createColumn({ name: 'tranid', label: 'custpage_linked_po'}),       
                        search.createColumn({ name: 'internalid', label: 'custpage_internalid'}),       

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
            log.debug(`runSearch runViewSearchLocation ${Object.keys(arrSearchResults).length}`, arrSearchResults);
            return arrSearchResults;

            } catch (err) {
                log.error('Error: runViewSearchLocation', err.message);
            }
        }

        const runViewSearchLineItems = (paramTransKey) => {
            log.debug('runViewSearchLineItems started');
            try {
                let strTransKey = paramTransKey
                log.debug('runViewSearchLineItems strTransKey', strTransKey);

                let arrSearchResults = []

                let objSavedSearch = search.create({
                    type: 'salesorder',
                    filters: [
                        ['internalid', 'is', strTransKey],
                        'AND',
                        ['mainline', 'is', 'F'],
                        'AND',
                        ['cogs', 'is', 'F'],
                        'AND',
                        ['taxline', 'is', 'F'],
                        'AND',
                        ['shipping', 'is', 'F'],
                        'AND',
                        ['status', 'anyof', 'SalesOrd:F'],
                    ],
                    columns: [
                        search.createColumn({ name: 'item', label: 'custpage_item'}),
                        search.createColumn({ name: 'item', label: 'custpage_item_id'}),
                        search.createColumn({ name: 'lineuniquekey', label: 'custpage_lineuniquekey'}),
                        search.createColumn({ name: 'custcol_commodity', label: 'custpage_commodity'}),
                        search.createColumn({ name: 'amount', label: 'custpage_line_amount'}),
                        search.createColumn({ name: 'tranid', join: 'applyingtransaction', label: 'custpage_createpo' }),
                        search.createColumn({ name: 'mainname', join: 'applyingtransaction', label: 'custpage_povendor'}),
                        search.createColumn({ name: 'currency', join: 'applyingtransaction', label: 'custpage_pocurrency' }),
                        search.createColumn({ name: 'porate', label: 'custpage_porate'}),    
                        search.createColumn({ name: 'internalid', join: 'applyingtransaction', label: 'custpage_internalid'}),
                        search.createColumn({ name: 'entity', label: 'custpage_entity'}),    
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
                                    if (resultLabel == 'custpage_pocurrency' || resultLabel == 'custpage_povendor') {
                                        objData[resultLabel] = pageData[pageResultIndex].getText(result)
                                    } else {
                                        objData[resultLabel] = pageData[pageResultIndex].getValue(result)    
                                    }
                                })
                                arrSearchResults.push(objData);
                            }
                        }   
                    }
                }
            log.debug(`runSearch runViewSearchLineItems ${Object.keys(arrSearchResults).length}`, arrSearchResults);
            return arrSearchResults;

            } catch (err) {
                log.error('Error: runViewSearchLineItems', err.message);
            }
        }

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

        return { FORM, ACTIONS }
    });
