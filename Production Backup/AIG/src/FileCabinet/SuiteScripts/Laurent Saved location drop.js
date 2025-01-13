/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search'], function(record, search) {
    
    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;

        // Check if the changed field is 'Saved Locations 2'
        if (fieldId === 'custbody_saved_locations_2') {
            var locationId = currentRecord.getValue({ fieldId: 'custbody_saved_locations_2' });

            if (locationId) {
                // Fetch the location record
                var locationRecord = search.lookupFields({
                    type: 'customrecord_locations',
                    id: locationId,
                    columns: ['name', 'custrecord_location_address', 'custrecord_location_pnotes', 'custrecord_location_personal_notes']  // Adjust the address and notes field IDs as per your custom record
                });

                // Set the Drop Company and Drop Location fields
                currentRecord.setValue({
                    fieldId: 'custbody_drop_company',
                    value: locationRecord.name
                });

                currentRecord.setValue({
                    fieldId: 'custbody_drop_location',
                    value: locationRecord.custrecord_location_address
                });

                // Set the Drop Public Notes field
                currentRecord.setValue({
                    fieldId: 'custbody_public_notes_drop',
                    value: locationRecord.custrecord_location_pnotes
                });

                // Set the Drop Private Notes field
                currentRecord.setValue({
                    fieldId: 'custbody_private_notes_drop',
                    value: locationRecord.custrecord_location_personal_notes
                });
            } else {
                // Clear the fields if no location is selected
                currentRecord.setValue({
                    fieldId: 'custbody_drop_company',
                    value: ''
                });

                currentRecord.setValue({
                    fieldId: 'custbody_drop_location',
                    value: ''
                });

                currentRecord.setValue({
                    fieldId: 'custbody_public_notes_drop',
                    value: ''
                });

                currentRecord.setValue({
                    fieldId: 'custbody_private_notes_drop',
                    value: ''
                });
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});
