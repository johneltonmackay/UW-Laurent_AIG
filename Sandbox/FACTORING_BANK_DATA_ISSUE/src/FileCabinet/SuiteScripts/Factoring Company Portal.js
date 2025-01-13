/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log'], function(ui, search, record, log) {

    function onRequest(context) {
        var form;

        if (context.request.method === 'GET') {
            // Step 1: Show security question form with disclaimer
            form = ui.createForm({
                title: 'Security Check'
            });

            form.addField({
                id: 'custpage_disclaimer',
                type: ui.FieldType.INLINEHTML,
                label: 'Disclaimer'
            }).defaultValue = '<div style="color: red; font-weight: bold;">Using this form will not hold AIG Enterprises accountable for any details shown. They are mostly for reference and might not be correct.</div>';

            form.addField({
                id: 'custpage_tranid',
                type: ui.FieldType.TEXT,
                label: 'Load Confirmation # (e.g., LC123456)'
            });

            form.addField({
                id: 'custpage_entityid',
                type: ui.FieldType.TEXT,
                label: 'Entity ID (e.g., MC1103676)'
            });

            // Add the date field
            form.addField({
                id: 'custpage_date',
                type: ui.FieldType.DATE,
                label: 'Transaction Date'
            });

            form.addSubmitButton({
                label: 'Validate'
            });

            context.response.writePage(form);

        } else {
            var transactionId = context.request.parameters.custpage_tranid;
            var entityId = context.request.parameters.custpage_entityid;
            var transactionDate = context.request.parameters.custpage_date;

            // Validate the inputs
            if (!transactionId || !entityId || !transactionDate) {
                // Show error message popup
                form = ui.createForm({
                    title: 'Security Check'
                });

                form.addField({
                    id: 'custpage_disclaimer',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Disclaimer'
                }).defaultValue = '<div style="color: red; font-weight: bold;">Using this form will not hold AIG Enterprises accountable for any details shown. They are mostly for reference and might not be correct.</div>';

                form.addField({
                    id: 'custpage_tranid',
                    type: ui.FieldType.TEXT,
                    label: 'Load Confirmation # (e.g., LC11111)'
                }).defaultValue = transactionId;

                form.addField({
                    id: 'custpage_entityid',
                    type: ui.FieldType.TEXT,
                    label: 'Entity ID (e.g., MC1103676)'
                }).defaultValue = entityId;

                form.addField({
                    id: 'custpage_date',
                    type: ui.FieldType.DATE,
                    label: 'Transaction Date'
                }).defaultValue = transactionDate;

                form.addSubmitButton({
                    label: 'Validate'
                });

                form.addField({
                    id: 'custpage_error',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Error'
                }).defaultValue = '<script>alert("All fields are required. Please fill in all fields and try again.");</script>';

                context.response.writePage(form);
                return;
            }

            var vendorId = validateInputs(transactionId, entityId, transactionDate);

            if (!vendorId) {
                // Show error message and prompt again with disclaimer and fields
                form = ui.createForm({
                    title: 'Security Check'
                });

                form.addField({
                    id: 'custpage_disclaimer',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Disclaimer'
                }).defaultValue = '<div style="color: red; font-weight: bold;">Using this form will not hold AIG Enterprises accountable for any details shown. They are mostly for reference and might not be correct.</div>';

                form.addField({
                    id: 'custpage_tranid',
                    type: ui.FieldType.TEXT,
                    label: 'Load Confirmation # (e.g., LC11111)'
                }).defaultValue = transactionId;

                form.addField({
                    id: 'custpage_entityid',
                    type: ui.FieldType.TEXT,
                    label: 'Entity ID (e.g., MC1103676)'
                }).defaultValue = entityId;

                form.addField({
                    id: 'custpage_date',
                    type: ui.FieldType.DATE,
                    label: 'Transaction Date'
                }).defaultValue = transactionDate;

                form.addSubmitButton({
                    label: 'Validate'
                });

                form.addField({
                    id: 'custpage_error',
                    type: ui.FieldType.INLINEHTML,
                    label: 'Error'
                }).defaultValue = '<div style="color: red;">Invalid Transaction ID, Entity ID, or Transaction Date. Please try again.</div>';

                context.response.writePage(form);
            } else {
                // Step 3: Show Purchase Orders for the valid Entity ID
                showPurchaseOrders(context, vendorId, transactionId, transactionDate);
            }
        }
    }

    function validateInputs(transactionId, entityId, transactionDate) {
        // Search to validate entityId and transactionId
        var vendorSearch = search.create({
            type: search.Type.VENDOR,
            filters: [
                ['entityid', 'is', entityId]
            ],
            columns: ['internalid']
        });

        var vendorResults = vendorSearch.run().getRange({
            start: 0,
            end: 1
        });

        if (vendorResults.length === 0) {
            return null;
        }

        var vendorId = vendorResults[0].getValue('internalid');

        var poSearch = search.create({
            type: search.Type.PURCHASE_ORDER,
            filters: [
                ['tranid', 'is', transactionId],
                'AND',
                ['entity', 'anyof', vendorId],
                'AND',
                ['trandate', 'on', transactionDate]
            ]
        });

        var poResults = poSearch.run().getRange({
            start: 0,
            end: 1
        });

        return poResults.length > 0 ? vendorId : null;
    }

    function showPurchaseOrders(context, vendorId, transactionId, transactionDate) {
        var form = ui.createForm({
            title: 'Vendor Purchase Orders Status'
        });

        // Fetch vendor details
        var vendorRecord = record.load({
            type: record.Type.VENDOR,
            id: vendorId
        });

        var entityId = vendorRecord.getValue('entityid');
        var companyName = vendorRecord.getValue('companyname');
        var factoringCompany = vendorRecord.getText('custentity_vend_factoring_company');
        var emailAddress = vendorRecord.getValue('custentity_2663_email_address_notif');

        // Display vendor details
        form.addField({
            id: 'custpage_entityid',
            type: ui.FieldType.TEXT,
            label: 'Vendor ID'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.INLINE
        }).defaultValue = entityId;

        form.addField({
            id: 'custpage_companyname',
            type: ui.FieldType.TEXT,
            label: 'Company Name'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.INLINE
        }).defaultValue = companyName;

        form.addField({
            id: 'custpage_factoringcompany',
            type: ui.FieldType.TEXT,
            label: 'Factoring Company'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.INLINE
        }).defaultValue = factoringCompany;

        form.addField({
            id: 'custpage_emailaddress',
            type: ui.FieldType.TEXT,
            label: 'Notification Email'
        }).updateDisplayType({
            displayType: ui.FieldDisplayType.INLINE
        }).defaultValue = emailAddress;

        var poSearch = search.create({
            type: search.Type.PURCHASE_ORDER,
            filters: [
                ['entity', 'anyof', vendorId],
                'AND',
                ['tranid', 'is', transactionId],
                'AND',
                ['trandate', 'on', transactionDate]
            ],
            columns: [
                'tranid',
                'total',
                'statusref',
                'custbody_pu_location',
                'custbody_drop_location',
                'custbody4'
            ]
        });

        var poResults = poSearch.run().getRange({
            start: 0,
            end: 1
        });

        var sublist = form.addSublist({
            id: 'custpage_pos',
            type: ui.SublistType.LIST,
            label: 'Purchase Orders'
        });

        sublist.addField({
            id: 'custpage_tranid',
            type: ui.FieldType.TEXT,
            label: 'Transaction ID'
        });

        sublist.addField({
            id: 'custpage_total',
            type: ui.FieldType.CURRENCY,
            label: 'Total Amount'
        });

        sublist.addField({
            id: 'custpage_status',
            type: ui.FieldType.TEXT,
            label: 'Status'
        });

        sublist.addField({
            id: 'custpage_pu_location',
            type: ui.FieldType.TEXT,
            label: 'PU Location'
        });

        sublist.addField({
            id: 'custpage_drop_location',
            type: ui.FieldType.TEXT,
            label: 'Drop Location'
        });

        sublist.addField({
            id: 'custpage_custbody4',
            type: ui.FieldType.TEXT,
            label: 'Custom Status'
        });

        sublist.addField({
            id: 'custpage_otherrefnum',
            type: ui.FieldType.TEXT,
            label: 'Vendor Bill Reference'
        });

        poResults.forEach(function(result, index) {
            try {
                var tranid = result.getValue({name: 'tranid'}) || '';
                var total = result.getValue({name: 'total'}) || 0;
                var status = result.getText({name: 'statusref'}) || '';
                var puLocation = result.getValue({name: 'custbody_pu_location'}) || '';
                var dropLocation = result.getValue({name: 'custbody_drop_location'}) || '';
                var custbody4 = result.getText({name: 'custbody4'}) || ''; // Use getText to get the label of the custom status field

                // Search for vendor bill associated with the purchase order
                var vendorBillSearch = search.create({
                    type: search.Type.VENDOR_BILL,
                    filters: [
                        ['createdfrom.tranid', 'is', tranid],
                        'AND',
                        ['entity', 'anyof', vendorId]
                    ],
                    columns: ['tranid']
                });

                var vendorBillResults = vendorBillSearch.run().getRange({
                    start: 0,
                    end: 1
                });

                var otherRefNum = vendorBillResults.length > 0 ? vendorBillResults[0].getValue('tranid') : '';

                if (tranid) {
                    sublist.setSublistValue({
                        id: 'custpage_tranid',
                        line: index,
                        value: tranid
                    });
                }

                if (total) {
                    sublist.setSublistValue({
                        id: 'custpage_total',
                        line: index,
                        value: total
                    });
                }

                if (status) {
                    sublist.setSublistValue({
                        id: 'custpage_status',
                        line: index,
                        value: status
                    });
                }

                if (custbody4) {
                    sublist.setSublistValue({
                        id: 'custpage_custbody4',
                        line: index,
                        value: custbody4
                    });
                }

                if (puLocation) {
                    sublist.setSublistValue({
                        id: 'custpage_pu_location',
                        line: index,
                        value: puLocation
                    });
                }

                if (dropLocation) {
                    sublist.setSublistValue({
                        id: 'custpage_drop_location',
                        line: index,
                        value: dropLocation
                    });
                }

                if (otherRefNum) {
                    sublist.setSublistValue({
                        id: 'custpage_otherrefnum',
                        line: index,
                        value: otherRefNum
                    });
                }
            } catch (e) {
                log.error({
                    title: 'Error setting sublist value',
                    details: e.message
                });
            }
        });

        // Add a "Back" button
        form.addButton({
            id: 'custpage_back',
            label: 'Back',
            functionName: "history.back()"
        });

        context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };
});
