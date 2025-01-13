/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @ModuleScope Public
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime'], function(record, search, log, runtime) {

    function beforeSubmit(context) {
        // Check if the current user's role is 1218
        
        var currentUserRole = runtime.getCurrentUser().role;
        // if (currentUserRole !== 3) {
        //     return;
        // }

        // if (context.type !== context.UserEventType.CREATE || context.type !== context.UserEventType.EDIT) {
        //     return;
        // }
      
        log.debug('currentUserRole', currentUserRole)

        var vendor = context.newRecord;
        var vendorId = vendor.id;

        // Get the factoring company ID from the vendor record
        var factoringCompanyId = vendor.getValue({ fieldId: 'custentity_vend_factoring_company' });

        // If vendorId is not available (during CREATE), skip the bank details search
        if (!vendorId) {
            log.debug('Vendor ID not available', 'Skipping bank details search for new vendor.');
            return;
        }

        // Search for the vendor's bank details
        var vendorBankDetailsId = searchBankDetails(vendorId);
        log.debug('vendorBankDetailsId', vendorBankDetailsId)
        // If no factoring company is associated
        if (!factoringCompanyId) {
            if (vendorBankDetailsId) {
                // Load the vendor's bank details to check the name
                var vendorBankDetails = record.load({
                    type: 'customrecord_2663_entity_bank_details',
                    id: vendorBankDetailsId
                });

                var bankDetailsName = vendorBankDetails.getValue({ fieldId: 'name' });
                var expectedNamePrefix = 'Bank Details for ';

                // If the name indicates the bank details are for the factoring company, delete them
                if (bankDetailsName && bankDetailsName.indexOf(expectedNamePrefix) === 0) {
                    record.delete({
                        type: 'customrecord_2663_entity_bank_details',
                        id: vendorBankDetailsId
                    });
                    log.debug('Bank Details Deleted', 'No factoring company associated with vendor. Factoring company bank details record deleted.');
                } else {
                    log.debug('Bank Details Retained', 'Vendor bank details retained as they belong to the vendor.');
                }
            } else {
                log.debug('No Bank Details Found', 'No bank details record found for vendor.');
            }
            return;
        }

        // Proceed only if a factoring company is associated
        if (factoringCompanyId) {
            // Load the factoring company's record to get its name
            var factoringCompanyRecord = record.load({
                type: record.Type.VENDOR,
                id: factoringCompanyId
            });
            var factoringCompanyName = factoringCompanyRecord.getValue({ fieldId: 'entityid' });

            // Search for and load the factoring company's bank details
            var factoringBankDetailsId = searchBankDetails(factoringCompanyId);
            if (factoringBankDetailsId) {
                var factoringBankDetails = record.load({
                    type: 'customrecord_2663_entity_bank_details',
                    id: factoringBankDetailsId
                });

                // Extract additional fields from the factoring company
                var fileFormat = factoringBankDetails.getValue({ fieldId: 'custrecord_2663_entity_file_format' });
                var bankNo = factoringBankDetails.getValue({ fieldId: 'custrecord_2663_entity_bank_no' });

                var vendorBankDetails;
                if (!vendorBankDetailsId) {
                    vendorBankDetails = record.create({
                        type: 'customrecord_2663_entity_bank_details',
                        isDynamic: true
                    });
                    vendorBankDetails.setValue({ fieldId: 'custrecord_2663_parent_vendor', value: vendorId });
                    vendorBankDetails.setValue({ fieldId: 'name', value: 'Bank Details for ' + factoringCompanyName });
                    vendorBankDetails.setValue({ fieldId: 'custrecord_2663_entity_bank_type', value: 1 }); // Assuming '1' is for 'Primary'
                } else {
                    vendorBankDetails = record.load({
                        type: 'customrecord_2663_entity_bank_details',
                        id: vendorBankDetailsId
                    });
                    vendorBankDetails.setValue({ fieldId: 'name', value: 'Bank Details for ' + factoringCompanyName }); // Ensure the name is set correctly
                }

                // Set additional fields
                vendorBankDetails.setValue({ fieldId: 'custrecord_2663_entity_acct_no', value: factoringBankDetails.getValue({ fieldId: 'custrecord_2663_entity_acct_no' }) });
                vendorBankDetails.setValue({ fieldId: 'custrecord_2663_entity_file_format', value: fileFormat });
                vendorBankDetails.setValue({ fieldId: 'custrecord_2663_entity_bank_no', value: bankNo });

                // Populate the COUNTRY CHECK, BANK CODE, and PROCESSOR CODE fields
                vendorBankDetails.setValue({ fieldId: 'custrecord_2663_entity_country_check', value: factoringBankDetails.getValue({ fieldId: 'custrecord_2663_entity_country_check' }) });
                vendorBankDetails.setValue({ fieldId: 'custrecord_2663_entity_bank_code', value: factoringBankDetails.getValue({ fieldId: 'custrecord_2663_entity_bank_code' }) });
                vendorBankDetails.setValue({ fieldId: 'custrecord_2663_entity_processor_code', value: factoringBankDetails.getValue({ fieldId: 'custrecord_2663_entity_processor_code' }) });

                let intVendorBankDetailsId = vendorBankDetails.save();
                log.debug('intVendorBankDetailsId', intVendorBankDetailsId)

                log.debug('Bank Details Updated', 'Bank details from factoring company copied to vendor bank details record.');
            }
        }
    }

    function searchBankDetails(vendorId) {
        var searchResult = search.create({
            type: 'customrecord_2663_entity_bank_details',
            filters: [
                ['custrecord_2663_parent_vendor', search.Operator.ANYOF, vendorId]
            ],
            columns: [
                search.createColumn({ name: 'internalid' })
            ]
        }).run().getRange({ start: 0, end: 1 });
        return searchResult.length ? searchResult[0].getValue('internalid') : null;
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
