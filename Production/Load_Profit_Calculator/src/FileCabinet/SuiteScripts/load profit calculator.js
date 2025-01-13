/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/log', 'N/url'], function(ui, search, runtime, log, url) {
    function onRequest(context) {
        try {
            log.debug({ title: 'Suitelet Execution', details: 'Script started.' });
            
            if (context.request.method === 'GET') {
                log.debug({ title: 'Request Method', details: 'GET' });
                
                var form = ui.createForm({
                    title: 'Sales Order Profit Calculation'
                });

                // Date fields
                form.addField({
                    id: 'custpage_start_date',
                    type: ui.FieldType.DATE,
                    label: 'Start Date'
                });
                form.addField({
                    id: 'custpage_end_date',
                    type: ui.FieldType.DATE,
                    label: 'End Date'
                });

                // Customer field
                form.addField({
                    id: 'custpage_customer',
                    type: ui.FieldType.SELECT,
                    label: 'Customer',
                    source: 'customer'
                });


                // Add a submit button
                form.addSubmitButton({
                    label: 'Calculate Profit'
                });

                log.debug({ title: 'Form Creation', details: 'Form created successfully.' });

                context.response.writePage(form);
            } else {
                log.debug({ title: 'Request Method', details: 'POST' });

                var form = ui.createForm({
                    title: 'Sales Order Profit Calculation'
                });

                // Add a back button
                form.addButton({
                    id: 'custpage_back',
                    label: 'Back',
                    functionName: "window.history.back();"
                });

                var sublist = form.addSublist({
                    id: 'custpage_salesorder_list',
                    type: ui.SublistType.LIST,
                    label: 'Sales Orders'
                });

                sublist.addField({
                    id: 'custpage_so_id',
                    type: ui.FieldType.TEXT,
                    label: 'Sales Order Number'
                });
                sublist.addField({
                    id: 'custpage_so_date',
                    type: ui.FieldType.DATE,
                    label: 'Date'
                });
                sublist.addField({
                    id: 'custpage_customer',
                    type: ui.FieldType.TEXT,
                    label: 'Customer'
                });
                sublist.addField({
                    id: 'custpage_from',
                    type: ui.FieldType.TEXT,
                    label: 'From'
                });
                sublist.addField({
                    id: 'custpage_to',
                    type: ui.FieldType.TEXT,
                    label: 'To'
                });
                sublist.addField({
                    id: 'custpage_pickup_number',
                    type: ui.FieldType.TEXT,
                    label: 'Pickup Number'
                });
                sublist.addField({
                    id: 'custpage_load_status',
                    type: ui.FieldType.TEXT,
                    label: 'Load Status'
                });
                sublist.addField({
                    id: 'custpage_total_profit',
                    type: ui.FieldType.CURRENCY,
                    label: 'Total Profit'
                });
                
                var request = context.request;
                var startDate = request.parameters.custpage_start_date;
                var endDate = request.parameters.custpage_end_date;
                var customer = request.parameters.custpage_customer;

                log.debug({
                    title: 'Request Parameters',
                    details: 'Start Date: ' + startDate + ', End Date: ' + endDate + ', Customer: ' + customer 
                });

                var filters = [
                    ['status', 'anyof', 'SalesOrd:G'],
                    'AND',
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['cogs', 'is', 'F'],
                    'AND',
                    ['taxline', 'is', 'F'],
                    'AND',
                    ['shipping', 'is', 'F'],
                    'AND',
                    ['closed', 'is', 'F'],
                ];

                if (startDate && endDate) {
                    filters.push('AND', ['trandate', 'within', startDate, endDate]);
                }

                if (customer) {
                    filters.push('AND', ['entity', search.Operator.ANYOF, customer]);
                }

                log.debug({ title: 'Search Filters', details: JSON.stringify(filters) });

                let arrLineItem = getPORate(filters)
                var totalProfit = 0;
                var lineIndex = 0;

                arrLineItem.forEach((data, index) => {
                    try {
                        // Retrieve item-level fields
                        itemAmount = data.amount ? data.amount : 0;
                        porate = data.porate ? data.porate : 0;; 

                        var profit = itemAmount - porate;
                        totalProfit += profit;

                        var strRecUrl = url.resolveRecord({
                            recordType: 'salesorder',
                            recordId: data.internalid
                        });
                        let recLink = `<a href='${strRecUrl}' target="_blank" rel="noopener noreferrer">${data.salesOrderId}</a>`

                        sublist.setSublistValue({
                            id: 'custpage_so_id',
                            line: index,
                            value: recLink
                        });
                        sublist.setSublistValue({
                            id: 'custpage_so_date',
                            line: index,
                            value: data.salesOrderDate
                        });
                        sublist.setSublistValue({
                            id: 'custpage_customer',
                            line: index,
                            value: data.salesOrderCustomer
                        });
                        sublist.setSublistValue({
                            id: 'custpage_from',
                            line: index,
                            value: data.fromLocation ? data.fromLocation : null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_to',
                            line: index,
                            value: data.toLocation ? data.toLocation : null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_pickup_number',
                            line: index,
                            value: data.pickupNumber ? data.pickupNumber : null
                        });
                        sublist.setSublistValue({
                            id: 'custpage_load_status',
                            line: index,
                            value: data.recStatus
                        });
                        sublist.setSublistValue({
                            id: 'custpage_total_profit',
                            line: index,
                            value: profit ? profit.toFixed(2) : 0
                        });

                        // Governance check
                        if (runtime.getCurrentScript().getRemainingUsage() < 100) {
                            log.warning({
                                title: 'Low Governance Units',
                                details: 'Remaining usage is below 100 units.'
                            });
                        }
                    } catch (itemError) {
                        log.error({
                            title: 'Error Processing Sales Order Line',
                            details: itemError
                        });
                    }

                });

                context.response.writePage(form);
            }
        } catch (e) {
            log.error({
                title: 'Suitelet Execution Error',
                details: e
            });
            // Display a user-friendly error message
            var errorForm = ui.createForm({ title: 'Error' });
            errorForm.addField({
                id: 'custpage_error_message',
                type: ui.FieldType.INLINEHTML,
                label: 'Error Message'
            }).defaultValue = '<div style="color:red;">An unexpected error occurred. Please contact your administrator.</div>';
            context.response.writePage(errorForm);
        }
    }

    const getPORate = (filters) => {
        let arrPORate = [];
        try {
            let objSearch = search.create({
                type: 'salesorder',
                filters: filters,
                columns: [
                    search.createColumn({ name: 'porate'}),
                    search.createColumn({ name: 'amount'}),
                    search.createColumn({ name: 'internalid'}),
                    search.createColumn({ name: 'tranid'}),
                    search.createColumn({ name: 'trandate'}),
                    search.createColumn({ name: 'entity'}),
                    search.createColumn({ name: 'custbody_pu_location'}),
                    search.createColumn({ name: 'custbody_drop_location'}),
                    search.createColumn({ name: 'custbody_customer_po_numbers'}),
                    search.createColumn({ name: 'statusref'}),
                ]
            });
            var aggregatedData = {};
            var searchResultCount = objSearch.runPaged().count;
            if (searchResultCount != 0) {
                var pagedData = objSearch.runPaged({pageSize: 1000});
                for (var i = 0; i < pagedData.pageRanges.length; i++) {
                    var currentPage = pagedData.fetch(i);
                    var pageData = currentPage.data;
                    if (pageData.length > 0) {
                        for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                            var internalid = pageData[pageResultIndex].getValue({ name: 'internalid' });
                            var porate = parseFloat(pageData[pageResultIndex].getValue({ name: 'porate' }) || 0);
                            var amount = parseFloat(pageData[pageResultIndex].getValue({ name: 'amount' }) || 0);
                    
                            // Get additional fields
                            var salesOrderId = pageData[pageResultIndex].getValue({ name: 'tranid' });
                            var salesOrderDate = pageData[pageResultIndex].getValue({ name: 'trandate' });
                            var salesOrderCustomer = pageData[pageResultIndex].getText({ name: 'entity' });
                            var fromLocation = pageData[pageResultIndex].getValue({ name: 'custbody_pu_location' });
                            var toLocation = pageData[pageResultIndex].getValue({ name: 'custbody_drop_location' });
                            var pickupNumber = pageData[pageResultIndex].getValue({ name: 'custbody_customer_po_numbers' });
                            var recStatus = pageData[pageResultIndex].getText({ name: 'statusref' });
                    
                            // If the internalid is not in the aggregatedData object, initialize it
                            if (!aggregatedData[internalid]) {
                                aggregatedData[internalid] = {
                                    porate: 0,
                                    amount: 0,
                                    salesOrderId: salesOrderId,
                                    salesOrderDate: salesOrderDate,
                                    salesOrderCustomer: salesOrderCustomer,
                                    fromLocation: fromLocation,
                                    toLocation: toLocation,
                                    pickupNumber: pickupNumber,
                                    recStatus: recStatus
                                };
                            }
                    
                            // Sum up the values
                            aggregatedData[internalid].porate += porate;
                            aggregatedData[internalid].amount += amount;
                        }

                        // Convert the aggregated data into an array if needed
                        arrPORate = Object.keys(aggregatedData).map(function (internalid) {
                            return {
                                internalid: internalid,
                                porate: aggregatedData[internalid].porate,
                                amount: aggregatedData[internalid].amount,
                                salesOrderId: aggregatedData[internalid].salesOrderId,
                                salesOrderDate: aggregatedData[internalid].salesOrderDate,
                                salesOrderCustomer: aggregatedData[internalid].salesOrderCustomer,
                                fromLocation: aggregatedData[internalid].fromLocation,
                                toLocation: aggregatedData[internalid].toLocation,
                                pickupNumber: aggregatedData[internalid].pickupNumber,
                                recStatus: aggregatedData[internalid].recStatus
                            };
                        });
                    }
                }
            }
        } catch (err) {
            log.error('getPORate', err.message);
        }
        log.debug("getPORate arrPORate", arrPORate)

        return arrPORate;
    };

    return {
        onRequest: onRequest
    };
});
