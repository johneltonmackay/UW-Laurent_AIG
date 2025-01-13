/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/log'], function(ui, search, runtime, log) {
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

                // Load Status field
                form.addField({
                    id: 'custpage_load_status',
                    type: ui.FieldType.SELECT,
                    label: 'Load Status',
                    source: 'customlist787'
                });

                // Add a submit button
                form.addSubmitButton({
                    label: 'Calculate Profit'
                });

                log.debug({ title: 'Form Creation', details: 'Form created successfully.' });

                context.response.writePage(form);
            } else {
                log.debug({ title: 'Request Method', details: 'POST' });
                
                var request = context.request;
                var startDate = request.parameters.custpage_start_date;
                var endDate = request.parameters.custpage_end_date;
                var customer = request.parameters.custpage_customer;
                var loadStatus = request.parameters.custpage_load_status;

                log.debug({
                    title: 'Request Parameters',
                    details: 'Start Date: ' + startDate + ', End Date: ' + endDate + ', Customer: ' + customer + ', Load Status: ' + loadStatus
                });

                var filters = [['mainline', search.Operator.IS, true]];

                if (startDate) {
                    filters.push('AND', ['trandate', search.Operator.ONORAFTER, startDate]);
                }

                if (endDate) {
                    filters.push('AND', ['trandate', search.Operator.ONORBEFORE, endDate]);
                }

                if (customer) {
                    filters.push('AND', ['entity', search.Operator.ANYOF, customer]);
                }

                if (loadStatus) {
                    filters.push('AND', ['custbody10', search.Operator.ANYOF, loadStatus]);
                }

                log.debug({ title: 'Search Filters', details: JSON.stringify(filters) });

                var salesOrderSearch = search.create({
                    type: search.Type.SALES_ORDER,
                    filters: filters,
                    columns: [
                        'internalid',
                        'tranid',
                        'trandate',
                        'entity',
                        'custbody_pu_location',
                        'custbody_drop_location',
                        'custbody_customer_po_numbers',
                        'custbody10',
                        'total',
                        // Ensure these fields exist and are correct
                        'item.amount',
                        'item.custcol_porate' // Replace with actual field ID if different
                    ]
                });

                log.debug({ title: 'Search Created', details: 'Sales Order search created successfully.' });

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

                var resultSet = salesOrderSearch.runPaged({ pageSize: 1000 });
                var totalProfit = 0;
                var lineIndex = 0;

                log.debug({ title: 'Search Execution', details: 'Running the search.' });

                resultSet.pageRanges.forEach(function(pageRange) {
                    var page = resultSet.fetch({ index: pageRange.index });
                    log.debug({ title: 'Processing Page', details: 'Page index: ' + pageRange.index + ', Page count: ' + page.data.length });
                    
                    page.data.forEach(function(result) {
                        try {
                            var salesOrderId = result.getValue('tranid');
                            var salesOrderDate = result.getValue('trandate');
                            var salesOrderCustomer = result.getText('entity');
                            var fromLocation = result.getValue('custbody_pu_location');
                            var toLocation = result.getValue('custbody_drop_location');
                            var pickupNumber = result.getValue('custbody_customer_po_numbers');
                            var loadStatusValue = result.getText('custbody10');
                            var totalAmount = parseFloat(result.getValue('total')) || 0;

                            log.debug({
                                title: 'Processing Sales Order',
                                details: 'ID: ' + salesOrderId + ', Date: ' + salesOrderDate + ', Customer: ' + salesOrderCustomer
                            });

                            // Retrieve item-level fields
                            var itemAmount = parseFloat(result.getValue('item.amount')) || 0;
                            var porate = parseFloat(result.getValue('item.custcol_porate')) || 0; // Replace with actual field ID

                            var profit = itemAmount - porate;
                            totalProfit += profit;

                            log.debug({
                                title: 'Profit Calculation',
                                details: 'Sales Order ID: ' + salesOrderId + ', Sales Amount: ' + itemAmount + ', PO Rate: ' + porate + ', Profit: ' + profit
                            });

                            sublist.setSublistValue({
                                id: 'custpage_so_id',
                                line: lineIndex,
                                value: salesOrderId
                            });
                            sublist.setSublistValue({
                                id: 'custpage_so_date',
                                line: lineIndex,
                                value: salesOrderDate
                            });
                            sublist.setSublistValue({
                                id: 'custpage_customer',
                                line: lineIndex,
                                value: salesOrderCustomer
                            });
                            sublist.setSublistValue({
                                id: 'custpage_from',
                                line: lineIndex,
                                value: fromLocation
                            });
                            sublist.setSublistValue({
                                id: 'custpage_to',
                                line: lineIndex,
                                value: toLocation
                            });
                            sublist.setSublistValue({
                                id: 'custpage_pickup_number',
                                line: lineIndex,
                                value: pickupNumber
                            });
                            sublist.setSublistValue({
                                id: 'custpage_load_status',
                                line: lineIndex,
                                value: loadStatusValue
                            });
                            sublist.setSublistValue({
                                id: 'custpage_total_profit',
                                line: lineIndex,
                                value: profit.toFixed(2)
                            });

                            lineIndex++;

                            // Governance check
                            if (runtime.getCurrentScript().getRemainingUsage() < 100) {
                                log.warning({
                                    title: 'Low Governance Units',
                                    details: 'Remaining usage is below 100 units.'
                                });
                                // Optionally, handle low usage scenario
                            }
                        } catch (itemError) {
                            log.error({
                                title: 'Error Processing Sales Order Line',
                                details: itemError
                            });
                        }
                    });
                });

                log.debug({ title: 'Total Profit Calculated', details: totalProfit });

                // Add a field to display total profit
                form.addField({
                    id: 'custpage_total_profit_display',
                    type: ui.FieldType.CURRENCY,
                    label: 'Total Profit'
                }).updateDisplayType({
                    displayType: ui.FieldDisplayType.INLINE
                }).defaultValue = totalProfit.toFixed(2);

                log.debug({ title: 'Form Population', details: 'Populated sublist and total profit.' });

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

    return {
        onRequest: onRequest
    };
});
