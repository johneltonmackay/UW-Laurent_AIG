/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/ui/serverWidget'], function(record, runtime, serverWidget) {

    function beforeLoad(scriptContext) {

        let currentUser = runtime.getCurrentUser();
        log.debug('Current User ID', currentUser.id);

        let objRecord = scriptContext.newRecord;
        let strRecType = objRecord.type
        let objForm = scriptContext.form;

        let defaultForm = null
        const ISLAURENT = 3672
        const ISJOHN = 15

        const FORM_AIG_Load_Order_Laurent = 253;
        const FORM_AIG_Laurent_LC = 255; 

        if (strRecType == 'salesorder'){
            defaultForm = FORM_AIG_Load_Order_Laurent
        } else if (recType == 'purchaseorder'){
            defaultForm = FORM_AIG_Laurent_LC
        }
        log.debug('defaultForm: ', defaultForm);
        if (currentUser.id == ISLAURENT || currentUser.id == ISJOHN) {
            if (defaultForm){
                try {
                    var objField = objForm.getField({
                        id: 'customform',
                    });
                    log.debug("objField", objField)

                    objField.defaultValue = defaultForm.toString
                    log.debug('Form set successfully', 'Form ID: ' + defaultForm);

                    // let intFormValue = newRecord.getValue({
                    //     fieldId: '',
                    // })
                    // if (intFormValue !=  FORM_AIG_Load_Order_Laurent){
                    // objRecord.setValue({
                    //     fieldId: 'customform',
                    //     value: defaultForm,
                    //     fireSlavingSync: true,
                    //     ignoreFieldChanged: true
                    // });
                    // objRecord.setValue({
                    //     fieldId: 'memo',
                    //     value: defaultForm,
                    // });
                    // log.debug('Form set successfully', 'Form ID: ' + defaultForm);
                    // }

                } catch (e) {
                    log.error('Error setting form', e.message);
                }
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
