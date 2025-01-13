/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE) {
            var newRecord = context.newRecord;

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

                    // Update the 'custbody10' field on the Sales Order to "Covered" (internal ID 3)
                    salesOrder.setValue({
                        fieldId: 'custbody10',
                        value: 3 // "Covered"
                    });

                    // Save the updated Sales Order
                    salesOrder.save();

                    // Log the update confirmation
                    log.debug({
                        title: 'Sales Order Updated',
                        details: 'Sales Order ' + originatingSoId + ' status updated to Covered (3).'
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
            // Log if the context type is not "CREATE"
            log.debug({
                title: 'Context Type Check',
                details: 'Context type is not "CREATE". No action taken.'
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
