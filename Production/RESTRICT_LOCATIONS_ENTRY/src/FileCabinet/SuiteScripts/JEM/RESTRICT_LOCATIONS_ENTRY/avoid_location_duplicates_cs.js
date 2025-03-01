/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search', 'N/ui/dialog'], function(search, dialog) {

    function pageInit(context) {
        console.log('TEST DUPLICATES BY JOHN')
    }

    function saveRecord(context) {
        let currentRecord = context.currentRecord;
        let strName = currentRecord.getValue({ fieldId: 'name' });

        if (strName) {
            let duplicateSearch = search.create({
                type: 'customrecord_locations',
                filters: [
                    ['name', 'is', strName]
                ],
                columns: ['internalid']
            });

            let searchResult = duplicateSearch.run().getRange({ start: 0, end: 1 });

            if (searchResult.length > 0) {
                dialog.alert({
                    title: 'Duplicate Found',
                    message: 'A location with this name already exists. Please add City next to the name.'
                });

                return false; // Prevent saving the record
            }
        }

        return true; // Allow saving if no duplicate is found
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };
});
