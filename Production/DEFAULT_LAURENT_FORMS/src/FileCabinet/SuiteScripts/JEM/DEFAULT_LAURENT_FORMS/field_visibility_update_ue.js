/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget', 'N/runtime', 'N/ui/dialog', 'N/ui/message'],
    /**
 * @param{record} record
 * @param{serverWidget} serverWidget
 */
    (record, serverWidget, runtime, dialog, message) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */

        const ISLAURENT = 3672
        const NUCOR_LOGISTICS_CENTER = 3685

        const beforeLoad = (scriptContext) => {
            let newRecord = scriptContext.newRecord
            let objForm = scriptContext.form
            let intEntity = newRecord.getValue({
                fieldId: 'entity'
            })
            log.debug('beforeLoad intEntity', intEntity);
    
            let currentUser = runtime.getCurrentUser();
            log.debug('beforeLoad Current User ID', currentUser.id);

            if (!intEntity) {
                isFieldsDisplay(objForm, true)
            } else if (intEntity != NUCOR_LOGISTICS_CENTER && currentUser.id != ISLAURENT){
                isFieldsDisplay(objForm, false)
            } else {
                isFieldsDisplay(objForm, true)
            }
        }

        // Private Function

        function isFieldsDisplay(objForm, blnValue) {
            // log.debug('blnValue', blnValue);
            // List of fields to unhide
            let fieldsToShow = [
                'custbody_saved_locations', 'custbody_locations_public_notes', 'custbody_locations_private_notes',
                'custbody_saved_locations_2', 'custbody_public_notes_drop', 'custbody_private_notes_drop'
            ];

            let arrInLineFields = [
                'custbody_locations_public_notes', 'custbody_locations_private_notes', 'custbody_public_notes_drop', 'custbody_private_notes_drop'
            ]
            
            fieldsToShow.forEach(function(field) {
                try {
                    let strField = objForm.getField({ id: field })
                    if (!blnValue){
                        strField.updateDisplayType({
                            displayType: serverWidget.FieldDisplayType.HIDDEN
                        });
                    } else {
                        if (arrInLineFields.includes(field)){
                            strField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.INLINE
                            });
                        } else {
                            strField.updateDisplayType({
                                displayType: serverWidget.FieldDisplayType.NORMAL
                            });
                        }
                    }
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


        return {beforeLoad}

    });
