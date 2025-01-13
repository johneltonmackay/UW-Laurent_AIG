/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url', '../Library/add_new_data_sl_mapping.js', '../Library/monday_sales_data_sl_mapping.js', 'N/search', 'N/ui/message', 'N/record'],
    
    (currentRecord, url, slMapping, mondayMapping, search, message, record) => {

    // Function to initialize the page
    const pageInit = (scriptContext) => {
        try {
            console.log('Test Page Fully Loaded!', scriptContext);

            let objCurrentRecord = scriptContext.currentRecord;
            let urlParams = new URLSearchParams(window.location.search);
            let dataParam = urlParams.get('filterParam');
            let arrjsonData = JSON.parse(dataParam);
            console.log('arrjsonData', arrjsonData);
            if (arrjsonData) {
                arrjsonData.forEach(data => {
                    for (let key in data) {
                        if(key == 'custpage_active_tab'){
                            let value = data[key];
                            activateTab(value)
                        }

                        let value = data[key];
                        console.log('key:', key, 'value:', value);
                        objCurrentRecord.setValue({
                            fieldId: key,
                            value: value,
                            ignoreFieldChange: true,
                            fireSlavingSync: true
                        });
                    }
                })
            }
        } catch (error) {
            console.log('Error in pageInit:', error.message);
        }
    };

    const fieldChanged = (scriptContext) => {
        try {
            let arrSubListFieldChanging = []
            let arrBodyFieldChanging = []
            for (var strKey in mondayMapping.SUITELET.form.sublistfields) {
                let subfieldId = mondayMapping.SUITELET.form.sublistfields[strKey].id;
                arrSubListFieldChanging.push(subfieldId)
            }

            for (var strKey in mondayMapping.SUITELET.form.fields) {
                let bodyfieldId = mondayMapping.SUITELET.form.fields[strKey].id;
                arrBodyFieldChanging.push(bodyfieldId)
            }
    
            var objCurrRecord = scriptContext.currentRecord;

            console.log('scriptContext.fieldId', scriptContext.fieldId)
    
            if (arrSubListFieldChanging.includes(scriptContext.fieldId)) {
                getCurrentActiveTab(objCurrRecord);
                var currIndex = scriptContext.line
                console.log('fieldChanged currIndex', currIndex)
                if (currIndex){
                    let customRecordId = objCurrRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custpage_name',
                        line: currIndex
                    });
                    console.log('fieldChanged customRecordId', customRecordId)
                    if (customRecordId){
                        let cusRecFieldId = scriptContext.fieldId.replace('custpage', 'custrecord')
                        var sublistValue = objCurrRecord.getCurrentSublistValue({
                            sublistId: 'custpage_sublist',
                            fieldId: scriptContext.fieldId
                        });
                        let recId = record.submitFields.promise({
                            type: 'customrecord_my_sales_data',
                            id: customRecordId,
                            values: {
                                [cusRecFieldId]: sublistValue
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields : true
                            }
                        })
                        console.log('fieldChanged recId', cusRecFieldId + ' ' + recId)
                    }
                }
            }

            if (arrBodyFieldChanging.includes(scriptContext.fieldId)) {
                getCurrentActiveTab(objCurrRecord);
                searchItems()
            }



        } catch (error) {
            console.log('Error in fieldChanged:', error.message);
        }

    }

    const addNewSalesData = (scriptContext) => {
        let currRec = currentRecord.get()
        console.log('addNewSalesData currRec', currRec)
        try {
            var sURL = url.resolveScript({
                scriptId : slMapping.SUITELET.scriptid,
                deploymentId : slMapping.SUITELET.deploymentid,
                returnExternalUrl : false,
            });
        
            window.onbeforeunload = null;
            window.location = sURL;
        } catch (error) {
            console.log('Error: addNewSalesData', error.message)
        }
    }

    const refreshPage = (scriptContext) => {
        try {          
            var sURL = url.resolveScript({
                scriptId : mondayMapping.SUITELET.scriptid,
                deploymentId : mondayMapping.SUITELET.deploymentid,
                returnExternalUrl : false,
            });
        
            window.onbeforeunload = null;
            window.location = sURL;
        } catch (error) {
            console.log('Error: refreshPage', error.message)
        }
    }

    const searchItems = (scriptContext) => {
        let arrParameter = []
        let currRec = currentRecord.get()
        console.log('searchItems currRec', currRec)
        try {
            const fieldValues = {}
            for (let strKey in mondayMapping.SUITELET.form.fields) {
                let fieldId = mondayMapping.SUITELET.form.fields[strKey].id
                let value = currRec.getValue({
                    fieldId: fieldId
                });
                if (value){
                    fieldValues[fieldId] = value; // Dynamically setting fieldId
                    if (!arrParameter.includes(fieldValues)){
                        arrParameter.push(fieldValues);
                    }
                }
            }
            console.log('searchItems arrParameter', JSON.stringify(arrParameter))

            let blnisValid = false

            if (
                arrParameter[0].custpage_drop_location || 
                arrParameter[0].custpage_pu_location || 
                arrParameter[0].custpage_customer_po || 
                arrParameter[0].custpage_customer_id ||
                arrParameter[0].custpage_sortby ||
                (arrParameter[0].custpage_load_order[0] !== "" ||
                arrParameter[0].custpage_status[0] !== "" 
                )
            ) {
                blnisValid = true;
            }
            console.log('searchItems blnisValid', blnisValid)

            if (blnisValid){
                var sURL = url.resolveScript({
                    scriptId : mondayMapping.SUITELET.scriptid,
                    deploymentId : mondayMapping.SUITELET.deploymentid,
                    returnExternalUrl : false,
                    params : {
                        filterParam: JSON.stringify(arrParameter)
                    }
                });
            
                window.onbeforeunload = null;
                window.location = sURL;
            } else {
                let objMessage = message.create({
                    type: message.Type.WARNING,
                    ...mondayMapping.NOTIFICATION.REQUIRED
                });
                objMessage.show({
                    duration: 5000 // will disappear after 5s
                });
            }
        } catch (error) {
            console.log('Error: searchItems', error.message)
        }
    }

    const addSubItems = (options) => {
        let currRec = currentRecord.get()
        console.log('addSubItems currRec', currRec)
        try {
            let objResults = getSelected()
            if (objResults.isValid){
                var sURL = url.resolveScript({
                    scriptId : 'customscript_add_sub_item_main_page_sl',
                    deploymentId : 'customdeploy_add_sub_item_main_page_sl',
                    params: {
                        paramSubItems: JSON.stringify(objResults),
                    },
                    returnExternalUrl : false,
                });
            
                window.onbeforeunload = null;
                window.location = sURL;
            } else {
                alert("You can only add 1 sub item at a time")
            }
        } catch (error) {
            console.log('Error: addSubItems', error.message)
        }
    };

    const getSelected = () => {
        let objResults = {}
        let customRecID = null
        var rec = currentRecord.get();
        var lineCount = rec.getLineCount({ sublistId: 'custpage_sublist' });

        const fields = [
            { id: 'custpage_name', key: 'msd_id' },
            
        ];
        let counter = 0
        for (let i = 0; i < lineCount; i++) {
            const isSelected = rec.getSublistValue({
                sublistId: 'custpage_sublist',
                fieldId: 'custpage_chk_add_sub_rec',
                line: i
            });
            if (isSelected) {
                customRecID = rec.getSublistValue({
                    sublistId: 'custpage_sublist',
                    fieldId: 'custpage_name',
                    line: i
                });
                counter++
            }
        }

        if (counter > 1){
            objResults = {
                isValid: false,
                customRecID: null
            }
        } else if (counter == 0){
            objResults = {
                isValid: false,
                customRecID: null
            }
        } else {
            objResults = {
                isValid: true,
                customRecID: customRecID
            }
        }
        log.debug('getSelected objResults', objResults)
        return objResults
    }

    const activateTab = (tabId) => {
        // Try selecting a link inside the tab or the tab element itself.
        // Often, tabs might look like: <li id="myTabId" class="..."><a href="#">Tab Name</a></li>
        const tabElement = document.querySelector(`#${tabId} a`) || document.getElementById(tabId);
        if (tabElement) {
            // If the tab can be activated by clicking on it:
            tabElement.click();
        } else {
            console.log(`Unable to find tab with ID: ${tabId}`);
        }
    };

    const getCurrentActiveTab = (objCurrRecord) => {
        // Select the active tab element by its class
        let tabName = null
        const currentActiveTab = document.querySelector('td.formtabon');
    
        if (currentActiveTab) {
            // The tab name might be inside an <a> with class "formtabtexton"
            const link = currentActiveTab.querySelector('a.formtabtexton');
            tabName = link ? link.textContent.trim() : currentActiveTab.textContent.trim();
            objCurrRecord.setValue({
                fieldId: 'custpage_active_tab', 
                value: currentActiveTab.id,
                ignoreFieldChange: true,
                fireSlavingSync: true
            })
        } else {
            console.log('No active tab found. Check if the class or structure has changed.');
        }
    };
    
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        addNewSalesData,
        refreshPage,
        searchItems,
        addSubItems,
    };

});



