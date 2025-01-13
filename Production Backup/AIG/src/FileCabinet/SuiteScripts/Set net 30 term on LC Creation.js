/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function(record, log) {

    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            return;
        }

        var newRecord = context.newRecord;

        // Set the payment terms to 'Net 30' (internal ID 2)
        var termsFieldId = 'terms';
        var net30InternalId = 2;

        newRecord.setValue({
            fieldId: termsFieldId,
            value: net30InternalId
        });

        log.debug('Payment Terms Set', 'Payment terms set to Net 30 for purchase order.');
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
