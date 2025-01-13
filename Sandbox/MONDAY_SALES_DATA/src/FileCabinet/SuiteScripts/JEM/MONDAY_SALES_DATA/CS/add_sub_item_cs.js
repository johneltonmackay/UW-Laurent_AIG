/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', '../Library/add_sub_item_sl_mapping.js'], (currentRecord, url, slMapping) => {

    // Function to initialize the page
    const pageInit = (scriptContext) => {
        try {
            console.log('MSD New Sub Item Page Fully Loaded!');
        } catch (error) {
            console.log('Error in pageInit:', error.message);
        }
    };

    const sublistChanged = (scriptContext) => {
        var currentRecord = scriptContext.currentRecord;
        var sublistName = scriptContext.sublistId;
        var op = scriptContext.operation;
        if (sublistName === 'custpage_sublist') {
            let arrSOData = getSublistData()
            if (arrSOData.length > 0){
                currentRecord.setValue({
                    fieldId: 'custpage_sub_item_data',
                    value: JSON.stringify(arrSOData)
                });
            }
        }
    }

    const getSublistData = (scriptContext) => {
        let arrSOData = [];
        try {         
            let currRec = currentRecord.get()
            let lineCount = currRec.getLineCount({ sublistId: 'custpage_sublist' });
            if(lineCount > 0){
                for (let i = 0; i < lineCount; i++) {
                    let objData = {}
                    for (var strKey in slMapping.SUITELET.form.sublistfields) {
                        let fieldInfo = slMapping.SUITELET.form.sublistfields[strKey];
                        let fieldValue = currRec.getSublistValue({
                            sublistId: 'custpage_sublist',
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

    const refreshPage = (scriptContext) => {
        try {          
            var sURL = url.resolveScript({
                scriptId : 'customscript_monday_sales_data_main_sl',
                deploymentId : 'customdeploy_monday_sales_data_main_sl',
                returnExternalUrl : false,
            });
        
            window.onbeforeunload = null;
            window.location = sURL;
        } catch (error) {
            console.log('Error: refreshPage', error.message)
        }
    }

    return {
        pageInit: pageInit,
        sublistChanged: sublistChanged,
        refreshPage: refreshPage
    };

});



