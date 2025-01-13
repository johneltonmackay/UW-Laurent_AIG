/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/redirect', 'N/log'], function(record, search, serverWidget, url, redirect, log) {
    function onRequest(context) {
        var form = serverWidget.createForm({
            title: 'Commission Authorization'
        });

        form.addFieldGroup({
            id: 'filters',
            label: 'Filters'
        });

        form.addField({
            id: 'custpage_department',
            type: serverWidget.FieldType.SELECT,
            label: 'Department',
            container: 'filters',
            source: 'department' // Source list of departments
        });

        form.clientScriptFileId = 104747;

        form.addButton({
            id: 'custpage_filter',
            label: 'Filter',
            functionName: 'filterResults' // This is the client script function
        });

        form.addField({
            id: 'custpage_selected_commissions',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'Selected Commissions',
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        // Add a field to display the total amount
        form.addField({
            id: 'custpage_total_amount',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Total Selected Commission Amount',
            container: 'filters'
        }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.INLINE
        });

        var sublist = form.addSublist({
            id: 'custpage_commission_list',
            type: serverWidget.SublistType.LIST,
            label: 'Pending Commissions'
        });

        var sublistFields = [
            { id: 'custpage_select', type: serverWidget.FieldType.CHECKBOX, label: 'Select' },
            { id: 'custpage_sales_order', type: serverWidget.FieldType.TEXT, label: 'Sales Order' },
            { id: 'custpage_commission_auth_internal_id', type: serverWidget.FieldType.TEXT, label: 'ID' },
            { id: 'custpage_employee', type: serverWidget.FieldType.TEXT, label: 'Employee' },
            { id: 'custpage_customer', type: serverWidget.FieldType.TEXT, label: 'Customer' },
            { id: 'custpage_vendor_rate', type: serverWidget.FieldType.CURRENCY, label: 'Vendor Rate' },
            { id: 'custpage_total_profit', type: serverWidget.FieldType.CURRENCY, label: 'Total Profit' },
            { id: 'custpage_commission_amount', type: serverWidget.FieldType.CURRENCY, label: 'Commission Amount' },
            { id: 'custpage_order_status', type: serverWidget.FieldType.TEXT, label: 'Order Status' },
            { id: 'custpage_customer_rate', type: serverWidget.FieldType.CURRENCY, label: 'Customer Rate' },
            { id: 'custpage_auth_status', type: serverWidget.FieldType.TEXT, label: 'Authorization Status' },
        ];

        sublistFields.forEach(function(field) {
            sublist.addField(field);
        });

        if (context.request.method === 'GET') {
            if (context.request.parameters.custpage_department) {
                var department = context.request.parameters.custpage_department;

                var filters = [
                    ['custrecord_commission_status', 'anyof', 1], // Assuming 1 represents 'Pending'
                    'AND',
                    ['custrecord_auth_employee.department', 'anyof', department],
                    'AND',
                    ['custrecord_order_closed', 'is', 'F'] // Filter out records where 'Order Closed' is checked
                ];

                var commissionSearch = search.create({
                    type: 'customrecord_commission_authorization',
                    filters: filters,
                    columns: [
                        'internalid',
                        'custrecord_auth_employee',
                        'custrecord_custrecord167',
                        'custrecord_auth_commission_amount',
                        'custrecord_commission_status',
                        'custrecord_comm_customer',
                        'custrecord_comm_vendor_rate',
                        'custrecord_comm_total_profit',
                        'custrecord_comm_customer_rate',
                    ]
                });

                var resultSet = commissionSearch.run();
                var i = 0;
                resultSet.each(function(result) {
                    var commissionAuthInternalId = result.getValue('internalid');
                    var salesOrderId = result.getValue('custrecord_custrecord167');
                    if (!salesOrderId) {
                        log.error({
                            title: 'Invalid Sales Order ID',
                            details: 'Sales Order ID is null or undefined'
                        });
                        return true;
                    }

                    // Load the sales order record to check its current status
                    var salesOrder = record.load({
                        type: record.Type.SALES_ORDER,
                        id: salesOrderId
                    });

                    var salesOrderTranId = salesOrder.getValue('tranid');
                    var orderStatus = salesOrder.getValue('status');
                    orderStatus = orderStatus === 'Billed' ? 'Order Paid' : 'Order Not Paid';

                    var sublistData = {
                        'custpage_sales_order': '<a href="' + url.resolveRecord({
                            recordType: record.Type.SALES_ORDER,
                            recordId: salesOrderId
                        }) + '" target="_blank">' + salesOrderTranId + '</a>',
                        'custpage_commission_auth_internal_id': commissionAuthInternalId,
                        'custpage_employee': result.getText('custrecord_auth_employee'),
                        'custpage_customer': result.getValue('custrecord_comm_customer'),
                        'custpage_vendor_rate': result.getValue('custrecord_comm_vendor_rate'),
                        'custpage_total_profit': result.getValue('custrecord_comm_total_profit'),
                        'custpage_commission_amount': result.getValue('custrecord_auth_commission_amount'),
                        'custpage_order_status': orderStatus,
                        'custpage_customer_rate': result.getValue('custrecord_comm_customer_rate'),
                        'custpage_auth_status': result.getText('custrecord_commission_status'),
                    };

                    for (var fieldId in sublistData) {
                        if (sublistData[fieldId]) {
                            sublist.setSublistValue({
                                id: fieldId,
                                line: i,
                                value: sublistData[fieldId]
                            });
                        }
                    }

                    i++;
                    return true;
                });
            }

            form.addSubmitButton({
                label: 'Authorize'
            });
        } else {
            var selectedCommissions = context.request.parameters.custpage_selected_commissions;

            log.debug({
                title: 'Selected Commissions',
                details: selectedCommissions
            });

            if (selectedCommissions) {
                selectedCommissions = JSON.parse(selectedCommissions);

                // Create custom Vendor Bill with custom form ID 257
                var vendorBill = record.create({
                    type: record.Type.VENDOR_BILL,
                    isDynamic: true,
                    defaultValues: {
                        customform: 257 // Custom Form ID
                    }
                });

                var firstCommission = record.load({
                    type: 'customrecord_commission_authorization',
                    id: selectedCommissions[0]
                });

                var firstEmployeeId = firstCommission.getValue('custrecord_auth_employee');
                var defaultVendorId = record.load({
                    type: record.Type.EMPLOYEE,
                    id: firstEmployeeId
                }).getValue('custentity_linked_vendor');

                if (!defaultVendorId) {
                    throw new Error('No linked vendor for employee ID ' + firstEmployeeId);
                }

                vendorBill.setValue('entity', defaultVendorId);
                vendorBill.setValue('approvalstatus', 1); // Set to Pending Approval

                selectedCommissions.forEach(function(commissionAuthInternalId) {
                    if (!commissionAuthInternalId) {
                        log.error({
                            title: 'Missing Commission Auth Internal ID',
                            details: 'Commission Auth Internal ID is missing or invalid'
                        });
                        return; // Skip this iteration if the ID is invalid
                    }

                    var commissionRecord = record.load({
                        type: 'customrecord_commission_authorization',
                        id: commissionAuthInternalId
                    });

                    var commissionAmount = commissionRecord.getValue('custrecord_auth_commission_amount');
                    var salesOrderId = commissionRecord.getValue('custrecord_custrecord167');

                    if (!salesOrderId) {
                        log.error({
                            title: 'Missing Sales Order ID',
                            details: 'Sales Order ID is missing for commission authorization ID: ' + commissionAuthInternalId
                        });
                        return; // Skip this iteration if Sales Order ID is missing
                    }

                    var salesOrderTranId = record.load({
                        type: record.Type.SALES_ORDER,
                        id: salesOrderId
                    }).getValue('tranid');

                    log.debug({
                        title: 'Adding Line Item to Vendor Bill',
                        details: 'Sales Order ID: ' + salesOrderId + ', Commission Amount: ' + commissionAmount
                    });

                    vendorBill.selectNewLine('item');
                    vendorBill.setCurrentSublistValue('item', 'item', 48); // Item ID for the "Commission" item; replace this with a valid item ID
                    vendorBill.setCurrentSublistValue('item', 'quantity', 1);
                    vendorBill.setCurrentSublistValue('item', 'rate', commissionAmount);
                    vendorBill.setCurrentSublistValue('item', 'description', 'Commission for Sales Order ' + salesOrderTranId);
                    vendorBill.setCurrentSublistValue('item', 'custcol_comm_auth_id', commissionAuthInternalId);
                    vendorBill.commitLine('item');
                });

                var vendorBillId = vendorBill.save();

                redirect.toRecord({
                    type: record.Type.VENDOR_BILL,
                    id: vendorBillId,
                    isEditMode: true
                });
            }
        }

        context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };
});
