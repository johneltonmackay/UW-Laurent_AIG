/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/runtime', 'N/ui/dialog'],
/**
 * @param{currentRecord} currency
 * @param{runtime} runtime
 */
function(currentRecord, runtime, dialog) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {
        console.log('TEST BY JOHN')
        let newRecord = scriptContext.currentRecord;
        let recType = newRecord.type

        let currentUser = runtime.getCurrentUser();
        log.debug('Current User ID', currentUser.id);
    
        const ISLAURENT = 3672
        const ISJOHN = 15

        const CUSTOMER_AM_NS_PRESOURCE = 3450
        const SAVED_LOCATION_AM_NS = 201

        const FORM_AIG_Load_Order_Laurent = 253;
        const FORM_AIG_Laurent_LC = 255; 
        const LOAD_STATUS_COVERED = 3; 
        
        let intNewFormValue = null

        if (currentUser.id == ISLAURENT || currentUser.id == ISJOHN) {
            try {
                let intFormValue = newRecord.getValue({
                    fieldId: 'customform',
                })

                if (recType == 'salesorder'){
                    intNewFormValue = FORM_AIG_Load_Order_Laurent
                } else if (recType == 'purchaseorder'){
                    intNewFormValue = FORM_AIG_Laurent_LC
                }

                if (intFormValue !=  intNewFormValue){

                    let defaultForm = recType == 'salesorder' 
                        ? FORM_AIG_Load_Order_Laurent 
                        : recType == 'purchaseorder' 
                        ? FORM_AIG_Laurent_LC 
                        : null;

                    if (defaultForm) {
                        newRecord.setValue({
                            fieldId: 'customform',
                            value: defaultForm,
                            fireSlavingSync: true,
                            ignoreFieldChanged: true
                        });

                        log.debug({
                            title: 'Form set successfully',
                            details: 'Form ID: ' + defaultForm
                        });
                    }   
                }

                if (recType === 'salesorder' && (scriptContext.mode === 'create' || scriptContext.mode === 'copy')) {
                    const fieldsToSet = [
                        { fieldId: 'custbody10', value: LOAD_STATUS_COVERED },
                        { fieldId: 'entity', value: CUSTOMER_AM_NS_PRESOURCE },
                        { fieldId: 'custbody_saved_locations', value: SAVED_LOCATION_AM_NS }
                    ];
                
                    fieldsToSet.forEach(field => {
                        newRecord.setValue({
                            fieldId: field.fieldId,
                            value: field.value,
                            fireSlavingSync: true,
                            ignoreFieldChanged: true
                        });
                    });
                }
                


            } catch (e) {
                log.error('Error setting form', e.message);
            }
        }
    }

    return {
        pageInit: pageInit,

    };
    
});
