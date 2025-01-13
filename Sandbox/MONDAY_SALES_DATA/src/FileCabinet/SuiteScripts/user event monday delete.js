/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function(record, search, log) {

    function afterSubmit(context) {
        try {
            // Check if the context is a Sales Order and the status is set to Billed
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                var status = newRecord.getValue('status');

                // You might need to adjust the status value depending on your NetSuite setup.
                // Common status values are:
                // "Billed" status might be something like "Billed" or a specific ID.

                if (status === 'Billed') { // Replace 'Billed' with your actual status value or ID
                    var customRecordId = newRecord.getValue('custbody_monday_sales_data_id');

                    if (customRecordId) {
                        // Delete the custom record associated with this sales order
                        record.delete({
                            type: 'customrecord_my_sales_data',
                            id: customRecordId
                        });

                        log.debug('Custom Record Deleted', 'Custom record with ID ' + customRecordId + ' has been deleted.');
                    }
                }
            }
        } catch (e) {
            log.error('Error in afterSubmit', e.toString());
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});
