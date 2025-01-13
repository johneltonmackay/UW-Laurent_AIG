/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log', 'N/error'], function(record, search, log, error) {
    function afterSubmit(context) {
        var newRecord = context.newRecord;

        // Only process Vendor Bills
        if (newRecord.type !== record.Type.VENDOR_BILL) {
            return;
        }

        // Handle delete event to set commission status back to pending
        if (context.type === context.UserEventType.DELETE) {
            log.debug({
                title: 'Handling Vendor Bill Deletion',
                details: 'Vendor Bill ID: ' + newRecord.id
            });

            updateCommissionStatusOnDelete(newRecord);
            return;
        }

        // Check if the approval status is 'Approved' (2)
        var approvalStatus = newRecord.getValue({ fieldId: 'approvalstatus' });

        log.debug({
            title: 'Approval Status Check',
            details: 'Approval Status: ' + approvalStatus
        });

        if (approvalStatus == 2) { // Assuming 2 represents 'Approved'
            log.debug({
                title: 'Approval Status Approved',
                details: 'Approval Status: ' + approvalStatus
            });
            updateCommissionAuthorization(newRecord);
        } else {
            log.debug({
                title: 'Approval Status Not Approved',
                details: 'Approval Status: ' + approvalStatus
            });
        }

        log.debug({
            title: 'afterSubmit Exit',
            details: 'Finished processing Vendor Bill'
        });
    }

    function updateCommissionAuthorization(newRecord) {
        var lineCount = newRecord.getLineCount({ sublistId: 'item' });

        log.debug({
            title: 'Line Count',
            details: 'Number of Lines: ' + lineCount
        });

        for (var i = 0; i < lineCount; i++) {
            var commissionAuthId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_comm_auth_id',
                line: i
            });

            log.debug({
                title: 'Commission Auth ID',
                details: 'Line ' + i + ': ' + commissionAuthId
            });

            if (commissionAuthId) {
                // Convert the commissionAuthId to an integer
                commissionAuthId = parseInt(commissionAuthId, 10);

                log.debug({
                    title: 'Updating Commission Authorization',
                    details: 'Commission Authorization ID: ' + commissionAuthId
                });

                // Load the commission authorization record
                var commissionAuthRecord = record.load({
                    type: 'customrecord_commission_authorization',
                    id: commissionAuthId
                });

                // Get and validate the commission amount
                var commissionAmount = commissionAuthRecord.getValue({ fieldId: 'custrecord_auth_commission_amount' });

                // Convert to a float and validate the format
                commissionAmount = parseFloat(commissionAmount);

                if (isNaN(commissionAmount) || commissionAmount === null || commissionAmount === undefined) {
                    throw error.create({
                        name: 'INVALID_NUMBER',
                        message: 'Commission amount is not a valid number: ' + commissionAmount
                    });
                }

                log.debug({
                    title: 'Valid Commission Amount',
                    details: 'Commission Amount: ' + commissionAmount
                });

                // Set the commission status to 'Authorized' (assuming 2 represents 'Authorized')
                commissionAuthRecord.setValue({
                    fieldId: 'custrecord_commission_status',
                    value: 2
                });

                // Set the Vendor Bill ID on the commission authorization record
                commissionAuthRecord.setValue({
                    fieldId: 'custrecord_vendor_bill_id',
                    value: newRecord.id
                });

                // Save the commission authorization record
                commissionAuthRecord.save();

                log.debug({
                    title: 'Commission Authorization Updated',
                    details: 'Commission Authorization ID: ' + commissionAuthId
                });
            } else {
                log.debug({
                    title: 'No Commission Auth ID Found',
                    details: 'Line ' + i
                });
            }
        }
    }

    function updateCommissionStatusOnDelete(newRecord) {
        var lineCount = newRecord.getLineCount({ sublistId: 'item' });

        log.debug({
            title: 'Line Count on Delete',
            details: 'Number of Lines: ' + lineCount
        });

        for (var i = 0; i < lineCount; i++) {
            var commissionAuthId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_comm_auth_id',
                line: i
            });

            log.debug({
                title: 'Commission Auth ID on Delete',
                details: 'Line ' + i + ': ' + commissionAuthId
            });

            if (commissionAuthId) {
                // Convert the commissionAuthId to an integer
                commissionAuthId = parseInt(commissionAuthId, 10);

                log.debug({
                    title: 'Updating Commission Authorization on Delete',
                    details: 'Commission Authorization ID: ' + commissionAuthId
                });

                // Load the commission authorization record
                var commissionAuthRecord = record.load({
                    type: 'customrecord_commission_authorization',
                    id: commissionAuthId
                });

                // Set the commission status back to 'Pending' (assuming 1 represents 'Pending')
                commissionAuthRecord.setValue({
                    fieldId: 'custrecord_commission_status',
                    value: 1
                });

                // Clear the Vendor Bill ID on deletion
                commissionAuthRecord.setValue({
                    fieldId: 'custrecord_vendor_bill_id',
                    value: ''
                });

                // Save the commission authorization record
                commissionAuthRecord.save();

                log.debug({
                    title: 'Commission Authorization Updated to Pending',
                    details: 'Commission Authorization ID: ' + commissionAuthId
                });
            } else {
                log.debug({
                    title: 'No Commission Auth ID Found on Delete',
                    details: 'Line ' + i
                });
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
