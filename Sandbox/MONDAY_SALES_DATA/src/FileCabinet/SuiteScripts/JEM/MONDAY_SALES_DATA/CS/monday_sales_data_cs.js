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
            // **Ensure NetSuite has rendered dropdowns before running the function**
            setTimeout(applyRowColor, 200);

            let objCurrentRecord = scriptContext.currentRecord;
            let objForm = objCurrentRecord.form
            let urlParams = new URLSearchParams(window.location.search);
            let dataParam = urlParams.get('filterParam');
            let isCloseWindow = urlParams.get('closeWindow');
            let isUpdates = urlParams.get('updates');
            console.log('isUpdates', isUpdates);
            
            let arrjsonData = JSON.parse(dataParam);
            if (isCloseWindow) {
                if (window.opener) {
                    window.opener.location.reload();
                }
                window.close();
            } else {
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
                if (currIndex >= 0){
                    let customRecordId = objCurrRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custpage_name',
                        line: currIndex
                    });
                    console.log('fieldChanged customRecordId', customRecordId)
                    let loadOrderId = objCurrRecord.getSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custpage_load_order_id',
                        line: currIndex
                    });
                    console.log('fieldChanged loadOrderId', loadOrderId)

                    if (customRecordId && loadOrderId){

                        let objField = objCurrRecord.getSublistField({
                            sublistId: 'custpage_sublist',
                            fieldId: scriptContext.fieldId,
                            line: currIndex
                        });

                        let fieldLabel = objField ? objField.label : null;
                        
                        let cusRecFieldId = scriptContext.fieldId.replace('custpage', 'custrecord')

                        sublistValue = objCurrRecord.getCurrentSublistValue({
                            sublistId: 'custpage_sublist',
                            fieldId: scriptContext.fieldId
                        }); 
                        
                        let sublistText = ""

                        if (scriptContext.fieldId == 'custpage_status' ){
                            sublistText = objCurrRecord.getCurrentSublistText({
                                sublistId: 'custpage_sublist',
                                fieldId: scriptContext.fieldId
                            });
                        } else {
                            sublistText = objCurrRecord.getCurrentSublistValue({
                                sublistId: 'custpage_sublist',
                                fieldId: scriptContext.fieldId
                            });
                        }

                        

                        console.log('fieldChanged cusRecFieldId', cusRecFieldId)
                        console.log('fieldChanged sublistValue', sublistValue)

                        var strTranId = objCurrRecord.getCurrentSublistValue({
                            sublistId: 'custpage_sublist',
                            fieldId: 'custpage_tran_id'
                        });

                        let myMsg = message.create({
                            title: `Field Updated: ${fieldLabel} to ${sublistText} `,
                            message: `The record ${strTranId} has been updated. Please wait while the page refreshes.`,
                            type: message.Type.INFORMATION
                        });
                        
                        myMsg.show({
                            duration: 2500
                        });


                        record.submitFields.promise({
                            type: 'customrecord_my_sales_data',
                            id: customRecordId,
                            values: {
                                [cusRecFieldId]: sublistValue
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }
                        }).then(() => {

                            let loadOrderFieldId = scriptContext.fieldId.startsWith('custpage_status')
                            ? scriptContext.fieldId.replace('custpage_status', 'custbody10')
                            : scriptContext.fieldId.replace('custpage', 'custbody');

                            return record.submitFields.promise({
                                type: 'salesorder',
                                id: loadOrderId,
                                values: {
                                    [loadOrderFieldId]: sublistValue
                                },
                                options: {
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }).then(() => {
                            console.log('Both records updated successfully');
                            window.onbeforeunload = null;
                            searchItems()
                        }).catch((error) => {
                            console.error('Error updating records:', error);
                        });

                        console.log('fieldChanged recId', cusRecFieldId)
                    }
                }
            }

            if (arrBodyFieldChanging.includes(scriptContext.fieldId)) {
                getCurrentActiveTab(objCurrRecord);
                searchItems()
            }

            if (scriptContext.fieldId == 'custpage_order_status'){
                getCurrentActiveTab(objCurrRecord);
                var currIndex = scriptContext.line
                console.log('fieldChanged currIndex', currIndex)
                if (currIndex >= 0){
                    let poRecordId = objCurrRecord.getSublistValue({
                        sublistId: 'custpage_sublist2',
                        fieldId: 'custpage_rec_id',
                        line: currIndex
                    });
                    console.log('fieldChanged poRecordId', poRecordId)
                    
                    if (poRecordId){

                        let objField = objCurrRecord.getSublistField({
                            sublistId: 'custpage_sublist2',
                            fieldId: scriptContext.fieldId,
                            line: currIndex
                        });

                        let fieldLabel = objField ? objField.label : null;
                        
                        let poFieldId = scriptContext.fieldId.replace('custpage_order_status', 'custbody4')

                        
                        var sublistValue = objCurrRecord.getSublistValue({
                            sublistId: 'custpage_sublist2',
                            fieldId: scriptContext.fieldId,
                            line: currIndex

                        });

                        var sublistText = objCurrRecord.getSublistText({
                            sublistId: 'custpage_sublist2',
                            fieldId: scriptContext.fieldId,
                            line: currIndex

                        });
                        console.log('fieldChanged poFieldId', poFieldId)
                        console.log('fieldChanged sublistValue', sublistValue)

                        let strTranId = objCurrRecord.getSublistValue({
                            sublistId: 'custpage_sublist2',
                            fieldId: 'custpage_po_tran_id',
                            line: currIndex
                        });

                        console.log('fieldChanged strTranId', strTranId)


                        let myMsg = message.create({
                            title: `Field Updated: ${fieldLabel} to ${sublistText} `,
                            message: `The record ${strTranId} has been updated. Please wait while the page refreshes.`,
                            type: message.Type.INFORMATION
                        });

                        myMsg.show({
                            duration: 2500
                        });

                        record.submitFields.promise({
                            type: 'purchaseorder',
                            id: poRecordId,
                            values: {
                                [poFieldId]: sublistValue
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }
                        }).then(() => {
                            console.log('Records updated successfully');
                            window.onbeforeunload = null;
                            searchItems()
                        }).catch((error) => {
                            console.error('Error updating records:', error);
                        });

                        console.log('fieldChanged poFieldId', poFieldId)
                    }
                }
            }

        } catch (error) {
            console.log('Error in fieldChanged:', error.message);
        }

    }

    const addNewSalesData = () => {
        try {
            let sURL = `/app/accounting/transactions/salesord.nl`;
            window.onbeforeunload = null;
            window.open(sURL, '_blank'); // Opens in a new tab
        } catch (error) {
            console.log('Error: addNewSalesData', error.message);
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
                arrParameter[0].custpage_department_head || 
                arrParameter[0].custpage_drop_location_head || 
                arrParameter[0].custpage_pu_location_head || 
                arrParameter[0].custpage_customer_po || 
                arrParameter[0].custpage_customer_id ||
                arrParameter[0].custpage_sortby ||
                (arrParameter[0].custpage_load_order_head !== "" ||
                arrParameter[0].custpage_status_head !== "" 
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
            applyRowColor()
            setTimeout(() => {
                tabElement.click();
            }, 200); // Adjust delay as needed
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
    
    function applyRowColor() {
        jQuery('#custpage_sublist_splits tbody tr').each(function () {
            var cell = jQuery(this).find('td:eq(17)'); // Status field column
            var statusInput = cell.find('input.dropdownInput'); // Find NetSuite dropdown field
            var statusText = "";
    
            if (statusInput.length > 0) {
                statusText = statusInput.val().trim(); // Get the selected value
            } else {
                statusText = cell.text().trim(); // If no input field, get text
            }
    
            console.log("Final Row Status:", statusText); // Debugging
    
            // Determine row color based on status
            let color = ""; // Default (no color)
            if (statusText == 'HOTTT!!!') {
                color = '#FF69B4'; // Hot Pink
            } else if (statusText == 'Needs Carrier') {
                color = '#F4A460'; // Sandy Brown
            } else if (statusText == 'Covered') {
                color = '#4682B4'; // Steel Blue
            } else if (statusText == 'In Transit') {
                color = '#DC143C'; // Crimson
            } else if (statusText == 'Waiting For Customer') {
                color = '#1E90FF'; // Dodger Blue
            }
    
            if (color !== "") {
                // Apply background color ONLY to `<td>` cells that are NOT hidden
                jQuery(this).find('td').each(function () {
                    if (!jQuery(this).is(':hidden')) {
                        jQuery(this).attr('style', `background-color: ${color} !important; color: white;`);
                    }
                });
            }
        });
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        addNewSalesData,
        refreshPage,
        searchItems,
        addSubItems,
    };

});



