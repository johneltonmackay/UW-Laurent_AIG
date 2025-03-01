/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', '../Library/add_new_data_sl_mapping.js'], (currentRecord, url, slMapping) => {

    // Function to initialize the page
    const pageInit = (scriptContext) => {
        try {
            console.log('MSD New Data Page Fully Loaded!');
        } catch (error) {
            console.log('Error in pageInit:', error.message);
        }
    };

    const sublistChanged = (scriptContext) => {
        var currentRecord = scriptContext.currentRecord;
        var sublistName = scriptContext.sublistId;
        var op = scriptContext.operation;
        if (sublistName === 'custpage_sublist') {
            let arrSOData = getSublistData(sublistName)
            if (arrSOData.length > 0){
                currentRecord.setValue({
                    fieldId: 'custpage_so_data',
                    value: JSON.stringify(arrSOData)
                });
            }
        }
    }

    const getSublistData = (sublistName) => {
        let arrSOData = [];
        try {         
            let currRec = currentRecord.get()
            let lineCount = currRec.getLineCount({ sublistId: sublistName });
            if(lineCount > 0){
                for (let i = 0; i < lineCount; i++) {
                    let objData = {}
                    for (var strKey in slMapping.SUITELET.form.sublistfields) {
                        let fieldInfo = slMapping.SUITELET.form.sublistfields[strKey];
                        let fieldValue = currRec.getSublistValue({
                            sublistId: sublistName,
                            fieldId: fieldInfo.id,
                            line: i
                        });
                        objData[fieldInfo.id] = fieldValue
                    }
                    arrSOData.push(objData);
                }
                console.log('getSublistData arrSOData', arrSOData)
            }
        } catch (error) {
            console.log('Error: getSublistData', error.message)
        }
        return arrSOData
    }

    return {
        pageInit: pageInit,
        sublistChanged: sublistChanged
    };

});



