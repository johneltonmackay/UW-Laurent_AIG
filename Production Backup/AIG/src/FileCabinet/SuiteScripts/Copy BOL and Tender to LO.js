/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/file'], function(record, log, file) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var newRecord = context.newRecord;

            // Get the originating Sales Order ID from the 'createdfrom' field on the Purchase Order
            var originatingSoId = newRecord.getValue({ fieldId: 'createdfrom' });

            if (originatingSoId) {
                try {
                    // Load the originating Sales Order
                    var salesOrder = record.load({
                        type: record.Type.SALES_ORDER,
                        id: originatingSoId
                    });

                    // Get file attachments from Purchase Order
                    var bolDocument = newRecord.getValue({ fieldId: 'custbody_boldocument' });
                    var tenderAttachment = newRecord.getValue({ fieldId: 'custbody_tenderattachment' });

                    // Log the file IDs
                    log.debug({
                        title: 'File IDs from Purchase Order',
                        details: 'BOL Document: ' + bolDocument + ', Tender Attachment: ' + tenderAttachment
                    });

                    // Update the Sales Order with the same file attachments
                    if (bolDocument) {
                        salesOrder.setValue({
                            fieldId: 'custbody_boldocument',
                            value: bolDocument
                        });
                    }

                    if (tenderAttachment) {
                        salesOrder.setValue({
                            fieldId: 'custbody_tenderattachment',
                            value: tenderAttachment
                        });
                    }

                    // Save the updated Sales Order
                    salesOrder.save();

                    // Log the update confirmation
                    log.debug({
                        title: 'Sales Order Updated',
                        details: 'Sales Order ' + originatingSoId + ' updated with file attachments.'
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
            log.debug({
                title: 'Context Type Check',
                details: 'Context type is not "CREATE" or "EDIT". No action taken.'
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
