/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/log'], function(record, runtime, log) {

    function beforeLoad(context) {
        if (context.type !== context.UserEventType.CREATE) {
            return;
        }

        var currentUser = runtime.getCurrentUser();
        log.debug('Current User', currentUser);
        var departmentId = 7; // Internal ID of the department
        var formId = '253'; // Internal ID of the custom form, ensure this is correct

        log.debug('Current User Department', currentUser.department);
        if (currentUser.department === departmentId) {
            try {
                // Use setValue directly on the new record to set the form
                context.newRecord.setValue({
                    fieldId: 'customform',
                    value: formId
                });
                log.debug('Form set successfully', 'Form ID: ' + formId);
            } catch (e) {
                log.error('Error setting form', e.message);
            }
        } else {
            log.debug('User not in department', 'User department: ' + currentUser.department);
        }

        // Final check to verify the form being used
        var currentFormId = context.newRecord.getValue({ fieldId: 'customform' });
        log.debug('Current Form ID after setting', 'Form ID: ' + currentFormId);
    }

    return {
        beforeLoad: beforeLoad
    };
});
