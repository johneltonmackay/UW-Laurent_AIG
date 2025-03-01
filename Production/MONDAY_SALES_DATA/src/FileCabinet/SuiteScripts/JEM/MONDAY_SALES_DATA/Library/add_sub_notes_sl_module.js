/**
 * @NAPIVersion 2.1
 */
define(["N/ui/serverWidget", "N/search", "N/task", "N/file", "N/record", "../Library/add_sub_notes_sl_mapping.js", 'N/runtime', 'N/url', 'N/ui/message', 'N/format', 'N/currentRecord', 'N/redirect'],

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
            try {
                let arrCusRecData = []
                let objData = {}
                log.debug('createSubItem options', options.postParam)
                let objParamDataCusRecId = options.postParam[0]
                const subItemDataObj = options.postParam.find(item => item.custpage_sub_notes_data);
                const arrParamDataSublist = JSON.parse(subItemDataObj.custpage_sub_notes_data);

                arrParamDataSublist.forEach(data => {
                    const objData = { ...data }; // Create a new object and copy properties from data
                    objData.custpage_monday_parent_id = objParamDataCusRecId.custpage_monday_parent_id;
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

                addFields({
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
                    id : 'custpage_tab_notes',
                    label : 'Notes'
                });
                options.form.addSubtab({
                    id : 'custpage_subtab_notes',
                    label : 'Notes Details',
                    tab: 'custpage_tab_notes'
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
            let strMSDRecId = JSON.parse(options.param)
            log.debug('addFields strMSDRecId', strMSDRecId)

            try {
                for (var strKey in slMapping.SUITELET.form.fields) {
                    options.form.addField(slMapping.SUITELET.form.fields[strKey]);
                    var objField = options.form.getField({
                        id: slMapping.SUITELET.form.fields[strKey].id,
                        container: 'custpage_tab_notes'
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
                        }).defaultValue = strMSDRecId
                    }
                }
            } catch (err) {
                log.error("BUILD_FORM_ADD_BODY_FILTERS_ERROR", err.message);
            }
        };
        
        
        const viewSublistFields = (options) => {
            try {
                buildNotesTable(options)
            } catch (err) {
                log.error("viewSublistFields_ERROR", err.message);
            }
        }

        const buildNotesTable = (options) => {
            try {

                let sublistNotes = options.form.addSublist({
                    id : 'custpage_sublist_notes',
					type : serverWidget.SublistType.INLINEEDITOR,
					label : 'NOTES DETAILS',
					tab: 'custpage_tab_notes'
                });
                for (var strKey in slMapping.SUITELET.form.sublistfieldsNotes) {

                    let fieldConfig = slMapping.SUITELET.form.sublistfieldsNotes[strKey];
                
                    let objField = sublistNotes.addField({
                        id: fieldConfig.id,
                        type: serverWidget.FieldType[fieldConfig.type.toUpperCase()],
                        label: fieldConfig.label,
                    });

                    configureFields(fieldConfig, objField)

                }

                let paramTransKey = options.parameters
                log.debug('buildNotesTable paramTransKey', paramTransKey);
                if (paramTransKey){
                    let arrSearchResults = runViewSearch(paramTransKey)

                    arrSearchResults.forEach((data, index) => {
                        // log.debug('buildNotesTable data', data);
                        for (const key in data) {
                            let value = data[key];
                            if (value && value !== '' && value !== undefined && value !== null){
                                sublistNotes.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: value,
                                });
                            }
                        }
                    });
                }
            } catch (error) {
                log.error("buildNotesTable Error", error.message);
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
        }

        const runViewSearch = (paramTransKey) => {
            log.debug('runViewSearch started');
            try {
                let strTransKey = paramTransKey
                log.debug('runViewSearch strTransKey', strTransKey);

                let arrSearchResults = []

                let objSavedSearch = search.create({
                    type: 'note',
                    filters: [
                        ['title', 'is', strTransKey],
                    ],
                    columns: [
                        search.createColumn({ name: 'entityid', join: 'author', label: 'custpage_author_notes'}),
                        search.createColumn({ name: 'note', label: 'custpage_note_notes'}),
                        search.createColumn({ name: 'internalid', label: 'custpage_sub_rec_id'}),
                        search.createColumn({ name: 'title', label: 'custpage_title_notes'}),   
                        search.createColumn({ name: 'notedate', label: 'custpage_notedate_notes'}),   
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
                                    let arrFldId = ['custpage_subsidary_notes', 'custpage_department_notes']
                                    let resultLabel = result.label;
                                    if (arrFldId.includes(resultLabel)){
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
            log.debug(`runSearch runViewSearch ${Object.keys(arrSearchResults).length}`, arrSearchResults);
            return arrSearchResults;

            } catch (err) {
                log.error('Error: runViewSearch', err.message);
            }
        }

        const createCustomRecord = (options) => {
            let arrCustomRecId = []
            try {
                let arrParamData = options
                if (arrParamData.length > 0){
                    arrParamData.forEach(data => {
                        let objRecData = record.create({
                            type: 'note',
                            isDynamic: true
                        })
                        if (objRecData){
                            for (const key in data) {
                                let fieldIds = null
                                let fieldValue = data[key]
                                if (key == 'custpage_title_notes'){
                                    fieldIds = 'title'
                                    objRecData.setValue({
                                        fieldId: fieldIds,
                                        value: fieldValue
                                    }) 
                                    objRecData.setValue({
                                        fieldId: 'record',
                                        value: fieldValue
                                    }) 
                                } else if (key == 'custpage_note_notes'){
                                    fieldIds = 'note'
                                    objRecData.setValue({
                                        fieldId: fieldIds,
                                        value: fieldValue
                                    }) 
                                }
                            }
                            objRecData.setValue({
                                fieldId: 'notetype',
                                value: 7 // Note
                            }) 

                            objRecData.setValue({
                                fieldId: 'recordtype',
                                value: 859 // MSD
                            }) 

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
