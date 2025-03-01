/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/message', 'N/format', 'N/record', 'N/currentRecord', 'N/url', '../Library/add_sub_item_sl_mapping.js'], (message, format, record, currentRecord, url, slMapping) => {

    const pageInit = (scriptContext) => {
        try {
            console.log('MSD New Sub Item Page Fully Loaded!');

            let objCurrentRecord = scriptContext.currentRecord;
            let objForm = objCurrentRecord.form
            let urlParams = new URLSearchParams(window.location.search);
            let dataParam = urlParams.get('transkey');
            let isSaved = urlParams.get('isSaved');

            if (dataParam){
                objCurrentRecord.setValue({
                    fieldId: 'custpage_page_transkey',
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

        let objFldMapping = fldMapping()
        console.log('objFldMapping', objFldMapping)
        let arrBodyField = objFldMapping.arrBodyField
        let arrCommodityFld = objFldMapping.arrCommodityFld
        let arrLocationField = objFldMapping.arrLocationField
        let arrLoadOrderLineField = objFldMapping.arrLoadOrderLineField

        console.log('arrLocationField', arrLocationField)

        let objData = {}; 

        if (arrBodyField.includes(scriptContext.fieldId)) {
            console.log('fieldChanged scriptContext.fieldId', scriptContext.fieldId);

            let fldValue = currentRecord.getValue({
                fieldId: scriptContext.fieldId,
            });
            console.log('fldValue', fldValue);

            if (fldValue) {
                // Retrieve the current MSD data and parse it
                let fldId = scriptContext.fieldId

                let newFldId = fldId.replace('custpage', 'custrecord')

                let currentMSDData = currentRecord.getValue({
                    fieldId: 'custpage_update_msd_data',
                });
                console.log('currentMSDData', currentMSDData);

                let arrMSDData = currentMSDData ? JSON.parse(currentMSDData) : [];
        
                let existingIndex = arrMSDData.findIndex(
                    (item) => Object.keys(item)[0] === newFldId
                );
        
                if (existingIndex !== -1) {
                    arrMSDData[existingIndex][newFldId] = fldValue;
                } else {
                    objData[newFldId] = fldValue;
                    arrMSDData.push({ ...objData });
                }
        
                currentRecord.setValue({
                    fieldId: 'custpage_update_msd_data',
                    value: JSON.stringify(arrMSDData),
                });

                if (arrBodyField.includes(fldId)){

                    let currentLoadData = currentRecord.getValue({
                        fieldId: 'custpage_update_load_order_data',
                    });
                    console.log('currentLoadOrderData', currentLoadData);

                    let arrLoadData = currentLoadData ? JSON.parse(currentLoadData) : [];

                    // Combine both arrays and keep unique keys with latest values
                    let mergedData = [...arrLoadData, ...arrMSDData].reduce((acc, obj) => {
                        let key = Object.keys(obj)[0]; // Get the first key of the object
                        let modifiedKey = key.replace('custrecord', 'custbody'); // Assign modified key
                        acc[modifiedKey] = obj[key]; // Update the value with the latest one
                        return acc;
                    }, {});


                    // Convert the object back to an array format
                    let uniqueArr = Object.keys(mergedData).map(key => ({ [key]: mergedData[key] }));

                    currentRecord.setValue({
                        fieldId: 'custpage_update_load_order_data',
                        value: JSON.stringify(uniqueArr),
                    });
                }
            }
        }

        if (arrCommodityFld.includes(scriptContext.fieldId)) {
            let subRecId = currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_sublist_commodity',
                fieldId: 'custpage_sub_rec_id',
            });
            console.log('subRecId', subRecId)
            if (subRecId){
                currentRecord.setCurrentSublistValue({
                    sublistId: 'custpage_sublist_commodity',
                    fieldId: 'custpage_is_updated',
                    value: true
                });
                console.log('fieldChanged subRecId', subRecId)
            }
        }

        if (arrLocationField.includes(scriptContext.fieldId)) {
            console.log('fieldChanged scriptContext.fieldId', scriptContext.fieldId);

            let arrLocationFields = ['custpage_pu_city_state', 'custpage_drop_location']
            let arrDateFields = ['custbody19', 'custbody20']
            let arrTimeFields = ['custbody23', 'custbody24']


            let fldValue = currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_sublist_location',
                fieldId: scriptContext.fieldId,
            });
            console.log('fldValue', fldValue);

            if (fldValue) {
                // Retrieve the current MSD data and parse it
                let fldId = scriptContext.fieldId
                let newFldId = fldSwitch(fldId)

                if (arrDateFields.includes(newFldId)) {
                    fldValue = stringToDate(fldValue)
                    console.log('arrDateFields fldValue', fldValue)
                }

                if (arrTimeFields.includes(newFldId)) {
                    fldValue = stringToTime(fldValue)
                    console.log('arrTimeFields fldValue', fldValue)
                }

                
                let currentLoadOrderData = currentRecord.getValue({
                    fieldId: 'custpage_update_load_order_data',
                });
                console.log('currentLoadOrderData', currentLoadOrderData);
        
                let arrLoadOrderData = currentLoadOrderData ? JSON.parse(currentLoadOrderData) : [];

                let existingIndex = arrLoadOrderData.findIndex(
                    (item) => Object.keys(item)[0] === newFldId
                );
        
                if (existingIndex !== -1) {
                    arrLoadOrderData[existingIndex][newFldId] = fldValue;
                } else {
                    objData[newFldId] = fldValue;
                    arrLoadOrderData.push({ ...objData });
                }
        
                currentRecord.setValue({
                    fieldId: 'custpage_update_load_order_data',
                    value: JSON.stringify(arrLoadOrderData),
                });

                if (arrLocationFields.includes(fldId)){

                    let currentMondayData = currentRecord.getValue({
                        fieldId: 'custpage_update_msd_data',
                    });
                    console.log('currentMondayData', currentMondayData);

                    let arrMondayData = currentMondayData ? JSON.parse(currentMondayData) : [];

                    // Combine both arrays and keep unique keys with latest values
                    let mergedData = [...arrLoadOrderData, ...arrMondayData].reduce((acc, obj) => {
                        let key = Object.keys(obj)[0]; // Get the first key of the object
                        let modifiedKey = key.replace('custbody', 'custrecord'); // Assign modified key
                        acc[modifiedKey] = obj[key]; // Update the value with the latest one
                        return acc;
                    }, {});


                    // Convert the object back to an array format
                    let uniqueArr = Object.keys(mergedData).map(key => ({ [key]: mergedData[key] }));

                    currentRecord.setValue({
                        fieldId: 'custpage_update_msd_data',
                        value: JSON.stringify(uniqueArr),
                    });
                }
            }
        }

        if (arrLoadOrderLineField.includes(scriptContext.fieldId)) {
            console.log('fieldChanged scriptContext.fieldId', scriptContext.fieldId);
        
            let fldValue = currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_sublist_load_order_line',
                fieldId: scriptContext.fieldId,
            });
        
            let strLineKeyValue = currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_sublist_load_order_line',
                fieldId: 'custpage_lineuniquekey',
            });
        
            console.log('strLineKeyValue', strLineKeyValue);
        
            if (strLineKeyValue) {
                let newFldId = scriptContext.fieldId.startsWith('custpage_line_amount')
                    ? scriptContext.fieldId.replace('custpage_line_', '')
                    : scriptContext.fieldId.replace('custpage', 'custcol');
        
                let currentOrderLineData = currentRecord.getValue({
                    fieldId: 'custpage_update_load_order_line',
                });
        
                console.log('currentOrderLineData', currentOrderLineData);
        
                let arrOrderLineData = currentOrderLineData ? JSON.parse(currentOrderLineData) : [];
        
                // Find existing object with the same custpage_lineuniquekey
                let existingIndex = arrOrderLineData.findIndex(
                    (item) => item.custpage_lineuniquekey === strLineKeyValue
                );
        
                if (existingIndex !== -1) {
                    // Update existing object
                    arrOrderLineData[existingIndex][newFldId] = fldValue;
                } else {
                    // Create a new object and push it
                    let objData = {
                        custpage_lineuniquekey: strLineKeyValue,
                        [newFldId]: fldValue,
                    };
                    arrOrderLineData.push(objData);
                }
        
                // Save the updated array back to the field
                currentRecord.setValue({
                    fieldId: 'custpage_update_load_order_line',
                    value: JSON.stringify(arrOrderLineData),
                });
            }
        }
        
    };
    

    const sublistChanged = (scriptContext) => {
        var currentRecord = scriptContext.currentRecord;
        var sublistName = scriptContext.sublistId;
        var op = scriptContext.operation;
        if (sublistName === 'custpage_sublist_commodity') {
            let arrSOData = getSublistData(sublistName)
            if (arrSOData.length > 0){
                currentRecord.setValue({
                    fieldId: 'custpage_create_sub_item_data',
                    value: JSON.stringify(arrSOData)
                });
            }
        }
    }

    const saveRecord = (scriptContext) => {
        let strSublistName = 'custpage_sublist_commodity'
        let arrSubItemData = [];
        let objData = {}; 

        let objFldMapping = fldMapping()
        console.log('objFldMapping', objFldMapping)
        let arrBodyField = objFldMapping.arrBodyField
        let arrCommodityFld = objFldMapping.arrCommodityFld

        let currRec = currentRecord.get()
        let lineCount = currRec.getLineCount({ sublistId: strSublistName });
        if (lineCount > 0){
            for (let i = 0; i < lineCount; i++) {
                let isUpdated = currRec.getSublistValue({
                    sublistId: strSublistName,
                    fieldId: 'custpage_is_updated',
                    line: i
                });
                console.log('isUpdated', isUpdated)
                if (isUpdated){
                    let subRecId = currRec.getSublistValue({
                        sublistId: strSublistName,
                        fieldId: 'custpage_sub_rec_id',
                        line: i
                    });
                    console.log('subRecId', subRecId)
                    if (subRecId){
                        let objData = {}
                        arrCommodityFld.forEach(fldId => {
                            let newFldId = fldId.replace('custpage', 'custrecord')
                            let fldValue = currRec.getSublistValue({
                                sublistId: strSublistName,
                                fieldId: fldId,
                                line: i
                            });
                            objData[newFldId] = fldValue
                            console.log('fldValue', fldValue)
                        });
                        
                        arrSubItemData.push({
                            type: 'customrecord_monday_sales_sub_itm',
                            id: subRecId,
                            values: objData,
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields : true
                            }
                        })
                    }
                }
            }
            console.log('arrSubItemData', arrSubItemData)

            for (const data of arrSubItemData) {
                try {
                    console.log('data', data)
                    let recordId = record.submitFields.promise(data); 
                    console.log('Updated Sub Item Record ID:', recordId);
                } catch (error) {
                    console.error('Error Sub Item updating record:', error);
                }
            }
          
        }

        let currentMSDData = currRec.getValue({
            fieldId: 'custpage_update_msd_data',
        })

        let arrMSDData = currentMSDData ? JSON.parse(currentMSDData) : [];

        let intMDSId = currRec.getValue({
            fieldId: 'custpage_monday_parent_id',
        })
        
        if (arrMSDData.length > 0 && intMDSId){
            try {
                const singleObject = arrMSDData.reduce((acc, obj) => {
                    return { ...acc, ...obj };
                  }, {});
                console.log('singleObject', singleObject)
                let recordId = record.submitFields.promise({
                    type: 'customrecord_my_sales_data',
                    id: intMDSId,
                    values: singleObject,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                }); 
                console.log('Updated MSD Record ID:', recordId);
            } catch (error) {
                console.error('Error MSD updating record:', error);
            }
        }

        let currentLoadOrderData = currRec.getValue({
            fieldId: 'custpage_update_load_order_data',
        })

        let arrLoadOrderData = currentLoadOrderData ? JSON.parse(currentLoadOrderData) : [];


        let intLoadOrderId = currRec.getValue({
            fieldId: 'custpage_so_number',
        })

        if (arrLoadOrderData.length > 0 && intLoadOrderId){
            let arrDateFields = ['custbody19', 'custbody20', 'custbody23', 'custbody24']
            try {
                const loadOrderObj = arrLoadOrderData.reduce((acc, obj) => {
                    let fixedObj = { ...obj };
                    return { ...acc, ...fixedObj };
                }, {});
                
                console.log('loadOrderObj', loadOrderObj)
                let recordId = record.submitFields.promise({
                    type: 'salesorder',
                    id: intLoadOrderId,
                    values: loadOrderObj,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                }); 
                console.log('Updated Load Order Record ID:', recordId);
            } catch (error) {
                console.error('Error Load Order updating record:', error);
            }
        }

        let currentOrderLineData = currRec.getValue({
            fieldId: 'custpage_update_load_order_line',
        })

        let arrOrderLineData = currentOrderLineData ? JSON.parse(currentOrderLineData) : [];

        if (arrOrderLineData.length > 0 && intLoadOrderId) {
            updateLoadOrderLineItem(arrOrderLineData, intLoadOrderId)
        }

        return true
    }

    const getSublistData = (sublistName) => {
        let arrSOData = [];
        try {         
            let currRec = currentRecord.get()
            let lineCount = currRec.getLineCount({ sublistId: sublistName });
            if(lineCount > 0){
                for (let i = 0; i < lineCount; i++) {
                    let objData = {}
                    for (var strKey in slMapping.SUITELET.form.sublistfieldsCommodity) {
                        let fieldInfo = slMapping.SUITELET.form.sublistfieldsCommodity[strKey];
                        let fieldValue = currRec.getSublistValue({
                            sublistId: sublistName,
                            fieldId: fieldInfo.id,
                            line: i
                        });
                        objData[fieldInfo.id] = fieldValue
                    }
                    if (!objData.custpage_sub_rec_id){
                        arrSOData.push(objData);
                    }
                }
                console.log('getSublistData arrSOData', arrSOData)
            }
        } catch (error) {
            console.log('Error: getSublistData', error.message)
        }
        return arrSOData
    }

    const refreshPage = () => {
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

    const fldMapping = () => {
        let objFldMapping = {}
        let arrCommodityFld = []
        let arrBodyField = []
        let arrLocationField = []
        let arrLoadOrderLineField = []


        for (var strKey in slMapping.SUITELET.form.sublistfieldsLocation) {
            let subfieldId = slMapping.SUITELET.form.sublistfieldsLocation[strKey].id;
            arrLocationField.push(subfieldId)
        }
    
        for (var strKey in slMapping.SUITELET.form.sublistfieldsCommodity) {
            let subfieldId = slMapping.SUITELET.form.sublistfieldsCommodity[strKey].id;
            if (subfieldId != 'custpage_is_updated'){
                arrCommodityFld.push(subfieldId)
            }
        }
    
        for (var strKey in slMapping.SUITELET.form.fields) {
            let bodyfieldId = slMapping.SUITELET.form.fields[strKey].id;
            if (bodyfieldId != 'custpage_update_msd_data' &&
                bodyfieldId != 'custpage_update_load_order_data' &&
                bodyfieldId != 'custpage_update_load_order_line' &&
                bodyfieldId != 'custpage_create_sub_item_data'
            ){
                arrBodyField.push(bodyfieldId)
            }
        }

        for (var strKey in slMapping.SUITELET.form.sublistfieldsLoadOrderLine) {
            let subfieldId = slMapping.SUITELET.form.sublistfieldsLoadOrderLine[strKey].id;
            arrLoadOrderLineField.push(subfieldId)
        }

        objFldMapping.arrCommodityFld = arrCommodityFld
        objFldMapping.arrBodyField = arrBodyField
        objFldMapping.arrLocationField = arrLocationField
        objFldMapping.arrLoadOrderLineField = arrLoadOrderLineField



        return objFldMapping
    }

    const fldSwitch = (fldId) => {
        switch (fldId) {
            case 'custpage_pu_city_state':
                return 'custbody_pu_city_state';
            case 'custpage_drop_city_state':
                return 'custbody_drop_city_state';
            case 'custpage_pick_up_date':
                return 'custbody19';
            case 'custpage_pick_up_hours':
                return 'custbody23';
            case 'custpage_drop_date':
                return 'custbody20';
            case 'custpage_drop_hours':
                return 'custbody24';
            case 'custpage_pu_appointment':
                return 'custbody22';
            case 'custpage_drop_appointment':
                return 'custbody21';
            case 'custpage_drop_appointment':
                return 'custbody21';
            default:
                return fldId.replace('custpage', 'custbody'); 
        }
    };

    const stringToDate = (date)  => {          
        return format.format({value: new Date(date), type: format.Type.DATE, timezone: format.Timezone.AMERICA_LOS_ANGELES}) 
    }

    const stringToTime = (date)  => {          
        return format.format({value: new Date(date), type: format.Type.TIMEOFDAY, timezone: format.Timezone.AMERICA_LOS_ANGELES}) 
    }

    const updateLoadOrderLineItem = (arrOrderLineData, intLoadOrderId)  => {
        try {
            let objRecord = record.load({
                type: 'salesorder',
                id: intLoadOrderId,
                isDynamic: true,
            });
            log.debug("updateLoadOrderLineItem objRecord", objRecord)
            if (objRecord){
                arrOrderLineData.forEach(data => {
                    var intLineRec = objRecord.findSublistLineWithValue({
                        sublistId:'item',
                        fieldId:'lineuniquekey',
                        value:data.custpage_lineuniquekey
                    })
                    log.debug('updateLoadOrderLineItem: intLineRec', intLineRec)
                    if(intLineRec != -1){
                        objRecord.selectLine({
                            sublistId:'item',
                            line:intLineRec
                        });
                        for (let fldId in data) {
                            let fldValue = data[fldId];
                            if (fldId !== 'custpage_lineuniquekey'){
                                objRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: fldId,
                                    value: fldValue
                                });
                            }
                        }
                        
                        objRecord.commitLine({sublistId:'item'})
                    }
                });
                let recordId = objRecord.save.promise({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })
                log.debug('updateLoadOrderLineItem recordId Updated', recordId) 
            }
        } catch (err) {
            log.error('updateLoadOrderLineItem error', err.message);
        }
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
        refreshPage: refreshPage,
        closeWindow: closeWindow
    };

});



