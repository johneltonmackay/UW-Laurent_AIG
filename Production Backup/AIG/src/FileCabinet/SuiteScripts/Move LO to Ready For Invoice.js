/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {

    function afterSubmit(context) {
        try {
            if (context.type === context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                var oldRecord = context.oldRecord;

                // Get the new value of 'custbody4' (Status) on the Purchase Order
                var newStatus = newRecord.getValue({ fieldId: 'custbody4' });
                var oldStatus = oldRecord ? oldRecord.getValue({ fieldId: 'custbody4' }) : null;

                // Log the new and old status values
                log.debug({
                    title: 'Status Values',
                    details: 'Old Status: ' + oldStatus + ', New Status: ' + newStatus
                });

                // Log the new status value directly to ensure we are getting the correct value
                log.debug({
                    title: 'New Status Value',
                    details: 'New Status ID: ' + newStatus
                });

                // Proceed only if the new status is "Completed" (internal ID 6)
                if (parseInt(newStatus) === 6 ) {
                    // Get the originating Sales Order ID from the 'createdfrom' field on the Purchase Order
                    var originatingSoId = newRecord.getValue({ fieldId: 'createdfrom' });

                    // Log the originating Sales Order ID
                    log.debug({
                        title: 'Originating Sales Order ID',
                        details: 'Originating SO ID: ' + originatingSoId
                    });

                    if (originatingSoId) {
                        try {
                            // Load the originating Sales Order
                            var salesOrder = record.load({
                                type: record.Type.SALES_ORDER,
                                id: originatingSoId
                            });

                            // Log the Sales Order load confirmation
                            log.debug({
                                title: 'Sales Order Loaded',
                                details: 'Sales Order ID: ' + originatingSoId
                            });

                            // Update the 'custbody10' field on the Sales Order to "Ready for Invoice" (internal ID 4)
                            salesOrder.setValue({
                                fieldId: 'custbody10',
                                value: 4 // "Ready For Invoice"
                            });

                            // Save the updated Sales Order
                            salesOrder.save();

                            // Log the update confirmation
                            log.debug({
                                title: 'Sales Order Updated',
                                details: 'Sales Order ' + originatingSoId + ' status updated to Ready for Invoice (4).'
                            });
                        } catch (e) {
                            log.error({
                                title: 'Error Updating Sales Order',
                                details: e.toString()
                            });
                        }
                    } else {
                        log.debug({
                            title: 'No Originating Sales Order Found',
                            details: 'Unable to find originating Sales Order.'
                        });
                    }
                } else {
                    // Log if the new status is not "Completed"
                    log.debug({
                        title: 'Status Check',
                        details: 'New Status is not "Completed" (4). No action taken.'
                    });
                }
            } else {
                // Log if the context type is not "EDIT"
                log.debug({
                    title: 'Context Type Check',
                    details: 'Context type is not "EDIT". No action taken.'
                });
            }
        } catch (e) {
            log.error({
                title: 'Unexpected Error',
                details: e.toString()
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});