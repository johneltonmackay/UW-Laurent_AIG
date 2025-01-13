/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log', 'N/format', 'N/runtime'], function(record, search, log, format, runtime) {

    function beforeLoad(context) {
        var form = context.form;

        // Hide custbody_profit field
        var profitField = form.getField({
            id: 'custbody_profit'
        });
        if (profitField) {
            profitField.updateDisplayType({
                displayType: 'hidden'
            });
        }

        // Hide custbody_commission_amount field
        var commissionAmountField = form.getField({
            id: 'custbody_commission_amount'
        });
        if (commissionAmountField) {
            commissionAmountField.updateDisplayType({
                displayType: 'hidden'
            });
        }
    }

    function beforeSubmit(context) {
        try {
            var salesOrder = context.newRecord;

            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var totalSalesOrderAmount = 0;
                var totalPurchaseOrderAmount = 0;
                var allLinesClosed = true;

                var lineCount = salesOrder.getLineCount({ sublistId: 'item' });
                log.debug('Line Count', lineCount);

                for (var i = 0; i < lineCount; i++) {
                    var isClosed = salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'isclosed',
                        line: i
                    });

                    log.debug('Line ' + i + ' Closed', isClosed);

                    if (!isClosed) {
                        allLinesClosed = false;
                        var lineAmount = parseFloat(salesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        })) || 0;
                        totalSalesOrderAmount += lineAmount;

                        log.debug('Line ' + i + ' Amount', lineAmount);

                        var linkedPOAmount = parseFloat(salesOrder.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'porate',
                            line: i
                        })) || 0;

                        totalPurchaseOrderAmount += linkedPOAmount;

                        log.debug('Line ' + i + ' PO Amount', linkedPOAmount);
                    }
                }

                log.debug('Total Sales Order Amount:', totalSalesOrderAmount);
                log.debug('Total Purchase Order Amount:', totalPurchaseOrderAmount);

                var profit = totalSalesOrderAmount - totalPurchaseOrderAmount;
                log.debug('Profit', profit);

                var salesRepId = getPrimarySalesRep(salesOrder);
                log.debug('Sales Rep ID', salesRepId);

                var commissionData = getCommissionRate(salesRepId);
                log.debug('Commission Data', commissionData);

                var commissionRate = commissionData.commissionRate;
                log.debug('Commission Rate', commissionRate);

                var commission = profit * commissionRate;
                log.debug('Commission', commission);

                salesOrder.setValue({ fieldId: 'custbody_profit', value: profit });
                salesOrder.setValue({ fieldId: 'custbody_commission_amount', value: commission });
                log.debug('Profit and Commission set', { profit: profit, commission: commission });

                // Optionally log the total PO amount here for debugging
                log.debug('Total PO Amount calculated in beforeSubmit', totalPurchaseOrderAmount);

                // Check if all lines are closed or the order status is closed
                if (allLinesClosed || salesOrder.getValue({ fieldId: 'orderstatus' }) === 'CLOSED') {
                    var commissionAuthId = getCommissionAuthorizationId(salesOrder.id, salesRepId);
                    if (commissionAuthId) {
                        record.submitFields({
                            type: 'customrecord_commission_authorization',
                            id: commissionAuthId,
                            values: {
                                custrecord_order_closed: true
                            }
                        });
                        log.debug('Commission Authorization Record Updated with Order Closed');
                    }
                }
            }
        } catch (e) {
            log.error('Error in beforeSubmit', e.toString());
        }
    }

    function afterSubmit(context) {
        try {
            var salesOrderId = context.newRecord.id;
            log.debug('Sales Order ID', salesOrderId);

            var salesOrder = record.load({
                type: record.Type.SALES_ORDER,
                id: salesOrderId
            });

            var commissionAmount = parseFloat(salesOrder.getValue({ fieldId: 'custbody_commission_amount' }));
            log.debug('Commission Amount', commissionAmount);

            var salesRepId = getPrimarySalesRep(salesOrder);
            log.debug('Sales Rep ID', salesRepId);

            // Recalculate the total purchase order amount in afterSubmit
            var totalPurchaseOrderAmount = 0;
            var lineCount = salesOrder.getLineCount({ sublistId: 'item' });
            log.debug('Line Count in afterSubmit', lineCount);

            var allLinesClosed = true;
            for (var i = 0; i < lineCount; i++) {
                var isClosed = salesOrder.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'isclosed',
                    line: i
                });

                log.debug('Line ' + i + ' Closed in afterSubmit', isClosed);

                if (!isClosed) {
                    allLinesClosed = false;
                    var linkedPOAmount = parseFloat(salesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'porate',
                        line: i
                    })) || 0;

                    totalPurchaseOrderAmount += linkedPOAmount;

                    log.debug('Line ' + i + ' PO Amount in afterSubmit', linkedPOAmount);
                }
            }

            log.debug('Total Purchase Order Amount in afterSubmit:', totalPurchaseOrderAmount);

            if (!isNaN(commissionAmount)) {
                createOrUpdateCommissionAuthorization(salesOrder, salesRepId, commissionAmount, totalPurchaseOrderAmount);
            }

            // Check if all lines are closed or the order status is closed
            if (allLinesClosed || salesOrder.getValue({ fieldId: 'orderstatus' }) === 'CLOSED') {
                var commissionAuthId = getCommissionAuthorizationId(salesOrderId, salesRepId);
                if (commissionAuthId) {
                    record.submitFields({
                        type: 'customrecord_commission_authorization',
                        id: commissionAuthId,
                        values: {
                            custrecord_order_closed: true
                        }
                    });
                    log.debug('Commission Authorization Record Updated with Order Closed');
                }
            }
        } catch (e) {
            log.error('Error in afterSubmit', e.toString());
        }
    }

    function getPrimarySalesRep(salesOrder) {
        var salesRepId = null;

        try {
            var lineCount = salesOrder.getLineCount({ sublistId: 'salesteam' });
            log.debug('Sales Team Line Count', lineCount);

            for (var i = 0; i < lineCount; i++) {
                var contribution = salesOrder.getSublistValue({
                    sublistId: 'salesteam',
                    fieldId: 'contribution',
                    line: i
                });

                log.debug('Sales Team Line ' + i + ' Contribution', contribution);

                if (contribution == 100) {
                    salesRepId = salesOrder.getSublistValue({
                        sublistId: 'salesteam',
                        fieldId: 'employee',
                        line: i
                    });
                    log.debug('Primary Sales Rep ID Found', salesRepId);
                    break;
                }
            }
        } catch (e) {
            log.error('Error in getPrimarySalesRep', e.toString());
        }

        return salesRepId;
    }

    function getCommissionRate(employeeId) {
        var commissionRate = 0;
        var commissionScheduleId = null;
        var today = new Date();

        try {
            var formattedToday = format.format({ value: today, type: format.Type.DATE });
            log.debug('Formatted Today Date', formattedToday);

            var planSearch = search.create({
                type: 'customrecord_commission_plan',
                filters: [
                    ['custrecord160', search.Operator.ANYOF, employeeId],
                    'AND',
                    ['custrecord162', search.Operator.IS, true]
                ],
                columns: ['custrecord161']
            });

            planSearch.run().each(function(result) {
                commissionScheduleId = result.getValue('custrecord161');
                log.debug('Commission Schedule ID', commissionScheduleId);

                var scheduleSearch = search.create({
                    type: 'customrecord_commission_schedule',
                    filters: [
                        ['internalid', search.Operator.ANYOF, commissionScheduleId],
                        'AND',
                        ['custrecord_commission_start_date', search.Operator.ONORBEFORE, formattedToday],
                        'AND',
                        ['custrecord_commission_end_date', search.Operator.ONORAFTER, formattedToday]
                    ],
                    columns: ['custrecord_commission_rate']
                });

                scheduleSearch.run().each(function(result) {
                    commissionRate = parseFloat(result.getValue('custrecord_commission_rate')) / 100;
                    log.debug('Commission Rate Found', commissionRate);
                    return false;
                });

                return false;
            });
        } catch (e) {
            log.error('Error in getCommissionRate', e.toString());
        }

        return { commissionRate: commissionRate, commissionScheduleId: commissionScheduleId };
    }

    function createOrUpdateCommissionAuthorization(salesOrder, salesRepId, commissionAmount, totalPurchaseOrderAmount) {
        try {
            log.debug('Creating or Updating Commission Authorization', { salesOrderId: salesOrder.id, salesRepId: salesRepId, commissionAmount: commissionAmount });

            var commissionData = getCommissionRate(salesRepId);
            var commissionScheduleId = commissionData.commissionScheduleId;
            log.debug('Commission Schedule ID for Authorization', commissionScheduleId);

            var existingAuthSearch = search.create({
                type: 'customrecord_commission_authorization',
                filters: [
                    ['custrecord165', search.Operator.IS, salesOrder.id],
                    'AND',
                    ['custrecord_auth_employee', search.Operator.IS, salesRepId]
                ],
                columns: ['internalid']
            });

            var existingAuthId = null;
            existingAuthSearch.run().each(function(result) {
                existingAuthId = result.getValue({ name: 'internalid' });
                log.debug('Existing Authorization ID', existingAuthId);
                return false;
            });

            var commissionAuthRecord;
            if (existingAuthId) {
                commissionAuthRecord = record.load({
                    type: 'customrecord_commission_authorization',
                    id: existingAuthId
                });
                log.debug('Loading Existing Commission Authorization Record');
            } else {
                commissionAuthRecord = record.create({
                    type: 'customrecord_commission_authorization'
                });
                log.debug('Creating New Commission Authorization Record');
            }

            log.debug('Setting custrecord_auth_employee with value:', salesRepId);
            commissionAuthRecord.setValue({
                fieldId: 'name',
                value: 'Commission Auth for Sales Order ' + salesOrder.id
            });

            commissionAuthRecord.setValue({
                fieldId: 'custrecord165',
                value: salesOrder.id
            });

            commissionAuthRecord.setValue({
                fieldId: 'custrecord_auth_employee',
                value: salesRepId
            });

            commissionAuthRecord.setValue({
                fieldId: 'custrecord_custrecord167',
                value: salesOrder.id
            });

            commissionAuthRecord.setValue({
                fieldId: 'custrecord_auth_commission_amount',
                value: commissionAmount
            });

            commissionAuthRecord.setValue({
                fieldId: 'custrecord_commission_status',
                value: 1 // Set to 'Pending'
            });

            if (commissionScheduleId) {
                commissionAuthRecord.setValue({
                    fieldId: 'custrecordcustrecord168',
                    value: commissionScheduleId
                });
            }

            // Update additional fields in the "Commission Authorization" custom record
            commissionAuthRecord.setValue({
                fieldId: 'custrecord_comm_sales_order_date',
                value: salesOrder.getValue({ fieldId: 'trandate' })
            });

            // Get the customer name instead of the internal ID
            var customerName = salesOrder.getText({ fieldId: 'entity' });
            commissionAuthRecord.setValue({
                fieldId: 'custrecord_comm_customer',
                value: customerName
            });

            commissionAuthRecord.setValue({
                fieldId: 'custrecord_comm_vendor_rate',
                value: totalPurchaseOrderAmount // Correctly passing this value
            });
            log.debug('Setting custrecord_comm_vendor_rate with value:', totalPurchaseOrderAmount);

            commissionAuthRecord.setValue({
                fieldId: 'custrecord_comm_total_profit',
                value: salesOrder.getValue({ fieldId: 'custbody_profit' })
            });

            commissionAuthRecord.setValue({
                fieldId: 'custrecord_comm_customer_rate',
                value: salesOrder.getValue({ fieldId: 'total' })
            });

            var commissionAuthId = commissionAuthRecord.save();
            log.debug('Commission Authorization Record Saved', 'ID: ' + commissionAuthId);
        } catch (e) {
            log.error('Error in createOrUpdateCommissionAuthorization', e.toString());
        }
    }

    function getCommissionAuthorizationId(salesOrderId, salesRepId) {
        var commissionAuthId = null;

        try {
            var existingAuthSearch = search.create({
                type: 'customrecord_commission_authorization',
                filters: [
                    ['custrecord165', search.Operator.IS, salesOrderId],
                    'AND',
                    ['custrecord_auth_employee', search.Operator.IS, salesRepId]
                ],
                columns: ['internalid']
            });

            existingAuthSearch.run().each(function(result) {
                commissionAuthId = result.getValue({ name: 'internalid' });
                log.debug('Existing Authorization ID', commissionAuthId);
                return false;
            });
        } catch (e) {
            log.error('Error in getCommissionAuthorizationId', e.toString());
        }

        return commissionAuthId;
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
