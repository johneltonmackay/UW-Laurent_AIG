/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/file', 'N/redirect'],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, record, file, redirect) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const CONTEXT_METHOD = {
            GET: "GET",
            POST: "POST"
        };

        const onRequest = (scriptContext) => {
            log.debug('scriptContext', scriptContext);
            if (scriptContext.request.method == CONTEXT_METHOD.GET) {
                let scriptObj = scriptContext.request.parameters;
                log.debug('GET onRequest scriptObj', scriptObj);
                let arrLineData = JSON.parse(scriptObj.lineData)

                let intPOId = null
                const arrFieldsToUpdate = ['rate', 'amount']

                if(scriptObj.soid && scriptObj.custid && arrLineData.length > 0){
                    log.debug('GET onRequest scriptObj.soid', scriptObj.soid);
                    log.debug('GET onRequest scriptObj.custid', scriptObj.custid);
                    log.debug('GET onRequest arrLineData', arrLineData);

                    try {
                        const VENDOR_TO_BE_ASSIGNED = 7855;
                        let purchaseOrder = record.create({
                            type: record.Type.PURCHASE_ORDER,
                            isDynamic: true,
                            defaultValues: {
                                'recordmode' : 'dynamic',
                                'soid' : scriptObj.soid,
                                'dropship' : 'T',
                                // 'specord' : 'T',
                                'custid' : scriptObj.custid,
                                'entity': VENDOR_TO_BE_ASSIGNED,
                                'poentity': VENDOR_TO_BE_ASSIGNED,
                            }
                        });
                        log.debug('purchaseOrder', purchaseOrder)
                        if (purchaseOrder){
                            let lineCount = purchaseOrder.getLineCount({sublistId: 'item'})
                            log.debug('GET onRequest lineCount', lineCount);

                            if (lineCount == 0){

                                intPOId = record.submitFields.promise({
                                    type: 'salesorder',
                                    id: scriptObj.soid,
                                    values: {
                                        'custbody_auto_drop_ship': true
                                    },
                                    options: {
                                        enableSourcing: true,
                                        ignoreMandatoryFields : true
                                    }
                                })
                                // log.debug('GET onRequest recordId', recordId);
                                redirect.toSuitelet({
                                    scriptId: 'customscript_monday_sales_data_main_sl',
                                    deploymentId: 'customdeploy_monday_sales_data_main_sl',
                                    parameters: {
                                        'closeWindow': true
                                    }
                                });
                                // const arrFields = ['rate', 'amount', 'commodity']

                                // purchaseOrder.setValue({
                                //     fieldId: 'createdfrom',
                                //     value: scriptObj.soid
                                // })

                                // arrLineData.forEach(data => {
                                //     purchaseOrder.selectNewLine({
                                //         sublistId: 'item',
                                //     })

                                //     purchaseOrder.setCurrentSublistValue({
                                //         sublistId: 'item',
                                //         fieldId: 'item',
                                //         value: data.custpage_item
                                //     });

                                //     for (const key in data) {
                                //         let fieldIds = key.replace('custpage_', '')
                                //         let rateFieldValue = data['custpage_amount']
    
                                //         let fieldValue = data[key]
                                //         if (arrFieldsToUpdate.includes(fieldIds)){
                                //             if (fieldIds == 'amount'){
                                //                 // log.debug('GET onRequest rate', fieldIds);
    
                                //                 purchaseOrder.setCurrentSublistValue({
                                //                     sublistId: 'item',
                                //                     fieldId: fieldIds,
                                //                     value: fieldValue
                                //                 });
    
                                //                 purchaseOrder.setCurrentSublistValue({
                                //                     sublistId: 'item',
                                //                     fieldId: 'rate',
                                //                     value: rateFieldValue
                                //                 });
                                //             } else {
                                //                 // log.debug('GET onRequest else', fieldIds);
    
                                //                 if (fieldIds == 'commodity'){
                                //                     fieldIds = fieldIds.replace(fieldIds, `custcol_${fieldIds}`)
                                //                 } 
    
                                //                 purchaseOrder.setCurrentSublistValue({
                                //                     sublistId: 'item',
                                //                     fieldId: fieldIds,
                                //                     value: fieldValue
                                //                 });
                                //             }
                                //         }
                                //     }

                                //     purchaseOrder.commitLine({
                                //         sublistId: 'item',
                                //     })
                                // })
                            } else {
                                arrLineData.forEach((data, index) => {
                                    log.debug('GET onRequest data', data);
                                    log.debug('GET onRequest index', index);
    
                                    purchaseOrder.selectLine({
                                        sublistId: 'item',
                                        line: index
                                    })
                                    for (const key in data) {
                                        let fieldIds = key.replace('custpage_', '')
                                        let rateFieldValue = data['custpage_amount']
    
                                        let fieldValue = data[key]
                                        if (arrFieldsToUpdate.includes(fieldIds)){
                                            if (fieldIds == 'amount'){
                                                // log.debug('GET onRequest rate', fieldIds);
    
                                                purchaseOrder.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: fieldIds,
                                                    line: index,
                                                    value: fieldValue
                                                });
    
                                                purchaseOrder.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    line: index,
                                                    value: rateFieldValue
                                                });
                                            } else {
                                                // log.debug('GET onRequest else', fieldIds);
    
                                                if (fieldIds == 'commodity'){
                                                    fieldIds = fieldIds.replace(fieldIds, `custcol_${fieldIds}`)
                                                } 
    
                                                purchaseOrder.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: fieldIds,
                                                    line: index,
                                                    value: fieldValue
                                                });
                                            }
                                        }
                                    }
                                    purchaseOrder.commitLine({
                                        sublistId: 'item',
                                    })
                                })

                                intPOId = purchaseOrder.save({
                                    ignoreMandatoryFields: true
                                });
                            }



                            
                            log.debug('GET intPOId', intPOId) 
                            if (intPOId){
                                scriptContext.response.write({
                                    output: JSON.stringify({
                                        success: true,
                                        message: 'Record created successfully.',
                                        objLogs: intPOId
                                    })
                                });
                                redirect.toSuitelet({
                                    scriptId: 'customscript_monday_sales_data_main_sl',
                                    deploymentId: 'customdeploy_monday_sales_data_main_sl',
                                    parameters: {
                                        'closeWindow': true
                                    }
                                });
                            }
                        }
                    } catch (dropShipError) {
                        log.error('dropShipError error', dropShipError)
                        scriptContext.response.write({
                            output: JSON.stringify({
                                success: false,
                                message: 'Error creating record: ' + dropShipError
                            })
                        });
                    }
                }
            } 
        }

        return {onRequest}

    });

    // let numLines = purchaseOrder.getLineCount({ sublistId: 'item' });
    // log.debug('createPO numLines', numLines)

    // for (let index = 0; index < numLines; index++) {
    //     purchaseOrder.selectLine({
    //         sublistId: 'item',
    //         line: index
    //     })
    //     arrFieldsToUpdate.forEach(fieldId => {
    //         purchaseOrder.setCurrentSublistValue({
    //             sublistId: 'item',
    //             fieldId: fieldId,
    //             line: index,
    //             value: arrLineData[index].fieldId
    //         });
    //     })
    //     purchaseOrder.commitLine({
    //         sublistId: 'item',
    //     })
    // }



    // let recordId = record.submitFields.promise({
    //     type: 'salesorder',
    //     id: scriptObj.soid,
    //     values: {
    //         'custbody_auto_drop_ship': true
    //     },
    //     options: {
    //         enableSourcing: true,
    //         ignoreMandatoryFields : true
    //     }
    // })
    // log.debug('GET onRequest recordId', recordId);
    // redirect.toSuitelet({
    //     scriptId: 'customscript_monday_sales_data_main_sl',
    //     deploymentId: 'customdeploy_monday_sales_data_main_sl',
    //     parameters: {
    //         'closeWindow': true
    //     }
    // });