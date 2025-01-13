/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/runtime', 'N/ui/dialog', 'N/ui/message'],
/**
 * @param{currentRecord} currency
 * @param{runtime} runtime
 */
function(currentRecord, runtime, dialog, message) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */

    const ISLAURENT = 3672
    const ISJOHN = 8126

    const CUSTOMER_AM_NS_PRESOURCE = 3450
    const SAVED_LOCATION_AM_NS = 201

    const FORM_AIG_Load_Order_Laurent = 253;
    const FORM_AIG_Laurent_LC = 255; 
    const LOAD_STATUS_COVERED = 3; 

    const NUCOR_LOGISTICS_CENTER = 3685

    function pageInit(scriptContext) {
        console.log('TEST BY JOHN')
        let newRecord = scriptContext.currentRecord;
        let recType = newRecord.type
        let intEntity = newRecord.getValue({
            fieldId: 'entity'
        })
        log.debug('pageInit intEntity', intEntity);

        let currentUser = runtime.getCurrentUser();
        log.debug('pageInit Current User ID', currentUser.id);
    
        let intNewFormValue = null

        if (currentUser.id == ISLAURENT) {
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
                        // { fieldId: 'custbody_saved_locations', value: SAVED_LOCATION_AM_NS }
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

    function fieldChanged(scriptContext) {
        let currentUser = runtime.getCurrentUser();
        let newRecord = scriptContext.currentRecord;
        let recType = newRecord.type
        
        if (scriptContext.fieldId == 'entity' && recType == 'salesorder'){
            let intEntity = newRecord.getValue({ fieldId: 'entity' });
            if (intEntity == NUCOR_LOGISTICS_CENTER) {
                isFieldsDisplay(newRecord, true)
            } else {
                if (currentUser.id != ISLAURENT){
                    isFieldsDisplay(newRecord, false)
                } else {
                    isFieldsDisplay(newRecord, true)
                }
            }
        }
    }

    // Private Function

    function isFieldsDisplay(currentRecord, blnValue) {
        // log.debug('blnValue', blnValue);
        // List of fields to unhide
        var fieldsToShow = [
            'custbody_saved_locations', 'custbody_locations_public_notes', 'custbody_locations_private_notes',
            'custbody_saved_locations_2', 'custbody_public_notes_drop', 'custbody_private_notes_drop'
        ];
        
        fieldsToShow.forEach(function(field) {
            try {
                let strField = currentRecord.getField({ fieldId: field })
                strField.isDisplay = blnValue;
                strField.isVisible = blnValue
                log.debug('strField', strField);
            } catch (e) {
                log.error('Field Error', e.message);
            }
        });
        
        message.create({
            title: 'Field Visibility Update',
            message: 'Some fields have been successfully hidden or made visible.',
            type: message.Type.CONFIRMATION
        }).show({ duration: 5000 });
    }


    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged

    };
    
});
