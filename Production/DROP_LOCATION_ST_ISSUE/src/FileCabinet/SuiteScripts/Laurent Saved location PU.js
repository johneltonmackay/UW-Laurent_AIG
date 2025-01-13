/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search'], function(record, search) {
    
    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;

        // Check if the changed field is 'Saved Locations'
        if (fieldId === 'custbody_saved_locations') {
            var locationId = currentRecord.getValue({ fieldId: 'custbody_saved_locations' });

            if (locationId) {
                // Fetch the location record
                var locationRecord = search.lookupFields({
                    type: 'customrecord_locations',
                    id: locationId,
                    columns: ['name', 'custrecord_location_address', 'custrecord_location_pnotes', 'custrecord_location_personal_notes']  // Adjust the address and notes field IDs as per your custom record
                });

                // Set the PU Company and Pick-up Location fields
                currentRecord.setValue({
                    fieldId: 'custbodypu_company_name',
                    value: locationRecord.name
                });

                let locationAddress = locationRecord.custrecord_location_address.replace(/\n/g, ' ').trim();
                console.log('custbody_drop_location: ', locationAddress)

                currentRecord.setValue({
                    fieldId: 'custbody_pu_location',
                    value: locationAddress
                });

                // Set the Public Notes field
                currentRecord.setValue({
                    fieldId: 'custbody_locations_public_notes',
                    value: locationRecord.custrecord_location_pnotes
                });

                // Set the Private Notes field
                currentRecord.setValue({
                    fieldId: 'custbody_locations_private_notes',
                    value: locationRecord.custrecord_location_personal_notes
                });
            } else {
                // Clear the fields if no location is selected
                currentRecord.setValue({
                    fieldId: 'custbodypu_company_name',
                    value: ''
                });

                currentRecord.setValue({
                    fieldId: 'custbody_pu_location',
                    value: ''
                });

                currentRecord.setValue({
                    fieldId: 'custbody_locations_public_notes',
                    value: ''
                });

                currentRecord.setValue({
                    fieldId: 'custbody_locations_private_notes',
                    value: ''
                });
            }
        }
    }

    return {
        fieldChanged: fieldChanged
    };
});
