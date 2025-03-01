/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {


        const getInputData = (inputContext) => {
            let arrTransaction = [];
            try {
                let objTransactionSearch = search.create({
                    type: 'purchaseorder',
                    filters: [
                        ['type', 'anyof', 'PurchOrd'],
                        'AND',
                        ['custbody_driver_instructions', 'isnotempty', ''],
                        'AND',
                        ['mainline', 'is', 'T'],
                      ],
                    columns: [
                        search.createColumn({ name: 'custbody_driver_instructions', summary: search.Summary.GROUP }),
                        search.createColumn({ name: 'internalid', summary: search.Summary.COUNT }),
                    ],

                });
                var searchResultCount = objTransactionSearch.runPaged().count;
                if (searchResultCount != 0) {
                    var pagedData = objTransactionSearch.runPaged({pageSize: 1000});
                    for (var i = 0; i < pagedData.pageRanges.length; i++) {
                        var currentPage = pagedData.fetch(i);
                        var pageData = currentPage.data;
                        if (pageData.length > 0) {
                            for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                var custbody_driver_instructions = pageData[pageResultIndex].getValue({ name: 'custbody_driver_instructions', summary: search.Summary.GROUP });
                                var existingIndex = arrTransaction.findIndex(item => item.custbody_driver_instructions === custbody_driver_instructions);
                                if (existingIndex == -1) {
                                    arrTransaction.push({
                                        custbody_driver_instructions: custbody_driver_instructions,
                                    });
                                } else {
                                    arrTransaction[existingIndex].custbody_driver_instructions.push(custbody_driver_instructions);
                                }
                            }
                        }
                    }
                }
                // log.debug(`getInputData: arrTransaction ${Object.keys(arrTransaction).length}`, arrTransaction);
                return arrTransaction;
            } catch (err) {
                log.error('getInputData error', err.message);
            }
        }

        const map = (mapContext) => {
            let objMapValue = JSON.parse(mapContext.value)   
            mapContext.write({
                key: mapContext.key,
                value: objMapValue
            })
        }

        const reduce = (reduceContext) => {
            let objReduceValues = JSON.parse(reduceContext.values)
            log.debug("reduce objReduceValues", objReduceValues)

            try {
                let newRecord = record.create({
                    type: 'customrecord_saved_driver_instructions', 
                    isDynamic: true
                });
    
                newRecord.setValue({
                    fieldId: 'custrecord_instructions', 
                    value: objReduceValues.custbody_driver_instructions
                });
 
                    let recordId = newRecord.save();
                log.debug("Record created successfully", `Record ID: ${recordId}`);
            } catch (e) {
                log.error("Error creating record", e.message);
            }
        }

        const summarize = (summaryContext) => {

        }

        return {getInputData, map, reduce, summarize}

    });
