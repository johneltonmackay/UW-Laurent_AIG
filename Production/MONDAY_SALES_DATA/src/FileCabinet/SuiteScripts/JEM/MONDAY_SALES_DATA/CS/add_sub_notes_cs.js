/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', 'N/runtime', '../Library/add_sub_notes_sl_mapping.js', 'N/record'], (currentRecord, url, runtime, slMapping, record) => {

    // Function to initialize the page
    const pageInit = (scriptContext) => {
        try {
            console.log('MSD New Sub Notes Page Fully Loaded!');

            let objCurrentRecord = scriptContext.currentRecord;
            let objForm = objCurrentRecord.form
            let urlParams = new URLSearchParams(window.location.search);
            let dataParam = urlParams.get('transkey');
            let isSaved = urlParams.get('isSaved');

            if (dataParam){
                objCurrentRecord.setValue({
                    fieldId: 'custpage_monday_parent_id',
                    value: dataParam,
                    ignoreFieldChange: true,
                    fireSlavingSync: true
                });
            }

            if (isSaved){
                let myMsg = message.create({
                    title: `Saved Complete`,
                    message: `Page is Updated.`,
                    type: message.Type.INFORMATION
                });
                
                myMsg.show({
                    duration: 2500
                });
            }
        } catch (error) {
            console.log('Error in pageInit:', error.message);
        }
    };

    
    const fieldChanged = (scriptContext) => {
        var currentRecord = scriptContext.currentRecord;
        var currIndex = scriptContext.line

        if (scriptContext.fieldId == 'custpage_note_notes') {
            console.log('fieldChanged currIndex', currIndex)
            let notesId = currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_sublist_notes',
                fieldId: 'custpage_sub_rec_id',
            });
            console.log('notesId', notesId)
            if (notesId){
                currentRecord.setCurrentSublistValue({
                    sublistId: 'custpage_sublist_notes',
                    fieldId: 'custpage_is_updated',
                    value: true
                });
                console.log('fieldChanged notesId', notesId)
            }
        }
    };
    

    const sublistChanged = (scriptContext) => {
        var currentRecord = scriptContext.currentRecord;
        var sublistName = scriptContext.sublistId;
        var op = scriptContext.operation;
        if (sublistName === 'custpage_sublist_notes') {
            let arrNotesData = getSublistData(sublistName)
            if (arrNotesData.length > 0){
                currentRecord.setValue({
                    fieldId: 'custpage_sub_notes_data',
                    value: JSON.stringify(arrNotesData)
                });
            }
        }
    }

    const saveRecord = (scriptContext) => {
        let arrNotesData = [];
        let currRec = currentRecord.get()
        let lineCount = currRec.getLineCount({ sublistId: 'custpage_sublist_notes' });
        if (lineCount > 0){
            for (let i = 0; i < lineCount; i++) {
                let isUpdated = currRec.getSublistValue({
                    sublistId: 'custpage_sublist_notes',
                    fieldId: 'custpage_is_updated',
                    line: i
                });
                console.log('isUpdated', isUpdated)
                if (isUpdated){
                    let notesId = currRec.getSublistValue({
                        sublistId: 'custpage_sublist_notes',
                        fieldId: 'custpage_sub_rec_id',
                        line: i
                    });
                    console.log('notesId', notesId)
                    if (notesId){
                        let strNotes = currRec.getSublistValue({
                            sublistId: 'custpage_sublist_notes',
                            fieldId: 'custpage_note_notes',
                            line: i
                        });
                        console.log('strNotes', strNotes)
                        arrNotesData.push({
                            type: 'note',
                            id: notesId,
                            values: {
                                'note': strNotes
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields : true
                            }
                        })
                    }
                }
            }

            arrNotesData.forEach(data => {
                let recordId = record.submitFields.promise(data)
                console.log('Updated recordId', recordId)
            });
        }
        return true
    }

    const getSublistData = (sublistName) => {
        let arrNotesData = [];
        try {         
            let currRec = currentRecord.get()
            let lineCount = currRec.getLineCount({ sublistId: sublistName });
            if (lineCount > 0){
                for (let i = 0; i < lineCount; i++) {
                    let objData = {}
                    for (var strKey in slMapping.SUITELET.form.sublistfieldsNotes) {
                        let fieldInfo = slMapping.SUITELET.form.sublistfieldsNotes[strKey];
                        if (fieldInfo.id == 'custpage_author_notes'){
                            let userObj = runtime.getCurrentUser()
                            objData[fieldInfo.id] = userObj.id
                        } else if (fieldInfo.id == 'custpage_title_notes') {
                            let msdId = currRec.getValue({
                                fieldId: 'custpage_monday_parent_id',
                            })
                            objData[fieldInfo.id] = msdId
                        } else if (fieldInfo.id == 'custpage_sub_rec_id' || fieldInfo.id == 'custpage_note_notes') {
                            let fieldValue = currRec.getSublistValue({
                                sublistId: sublistName,
                                fieldId: fieldInfo.id,
                                line: i
                            });
                            objData[fieldInfo.id] = fieldValue
                        }
                    }
                    if (!objData.custpage_sub_rec_id){
                        arrNotesData.push(objData);
                    }
                }
                console.log('getSublistData arrNotesData', arrNotesData)
            }
        } catch (error) {
            console.log('Error: getSublistData', error.message)
        }
        return arrNotesData
    }

    const closeWindow = () => {
        if (window.opener) {
            window.opener.location.reload();
        }
        window.close();
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        sublistChanged: sublistChanged,
        saveRecord: saveRecord,
        closeWindow: closeWindow
    };

});



