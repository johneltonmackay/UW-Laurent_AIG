/**
 * @NApiVersion 2.1
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
                let arrCommisionAuth = getCommisionAuth(department)

                arrCommisionAuth.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        if (value){
                            if (key == 'custpage_commission_auth_internal_id'){
                                var strRecUrl = url.resolveRecord({
                                    recordType: 'customrecord_commission_authorization',
                                    recordId: value
                                });
                                let recLink = `<a href='${strRecUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                sublist.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: recLink,
                                });
                            } else if (key == 'custpage_sales_order'){
                                var stSOUrl = url.resolveRecord({
                                    recordType: 'salesorder',
                                    recordId: value
                                });
                                let recLink = `<a href='${stSOUrl}' target="_blank" rel="noopener noreferrer">${value}</a>`
                                sublist.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: recLink,
                                });
                            } else {
                                sublist.setSublistValue({
                                    id: key,
                                    line: index,
                                    value: value,
                                });
                            }
                        }
                    }
                    
                });
            }

            form.addSubmitButton({
                label: 'Authorize'
            });
        } else {
            // Parameter Must Be Array of Objects
            var selectedCommissions = context.request.parameters.custpage_selected_commissions;

            log.debug({
                title: 'Selected Commissions',
                details: selectedCommissions
            });
            // Need To Change into For Loop
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
                var defaultVendorId = record.load({ // Sourced Already Employee Linked Vendor
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

                    var commissionRecord = record.load({ // Use Parameter from CS To avoid usage limit error
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

                    var salesOrderTranId = record.load({ // Use Parameter from CS To avoid usage limit error
                        type: record.Type.SALES_ORDER,
                        id: salesOrderId
                    }).getValue('tranid');

                    log.debug({
                        title: 'Adding Line Item to Vendor Bill',
                        details: 'Sales Order ID: ' + salesOrderId + ', Commission Amount: ' + commissionAmount
                    });
                    vendorBill.selectNewLine('item');
                    vendorBill.setCurrentSublistValue('item', 'item', 48); // Item ID for the "Commission" item; 
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

    const getCommisionAuth = (department) => {
        let arrCommisionAuth = [];
        try {
            let objCommissionAuthSearch = search.create({
                type: 'customrecord_commission_authorization',
                filters: [
                    ['custrecord_commission_status', 'anyof', '1'], // Pending
                    'AND',
                    ['custrecord_auth_employee.department', 'anyof', department],
                    'AND',
                    ['custrecord_order_closed', 'is', 'F'] 
                ],

                columns: [
                    search.createColumn({ name: 'internalid', label: 'custpage_commission_auth_internal_id'}),
                    search.createColumn({ name: 'custrecord_custrecord167', label: 'custpage_sales_order' }),
                    search.createColumn({ name: 'custrecord_auth_employee', label: 'custpage_employee' }),
                    search.createColumn({ name: 'custrecord_comm_customer', label: 'custpage_customer' }),
                    search.createColumn({ name: 'custrecord_auth_commission_amount', label: 'custpage_commission_amount' }),
                    search.createColumn({ name: 'custrecord_commission_status', label: 'custpage_auth_status' }),
                    search.createColumn({ name: 'custrecord_comm_vendor_rate', label: 'custpage_vendor_rate' }),
                    search.createColumn({ name: 'custrecord_comm_total_profit', label: 'custpage_total_profit' }),
                    search.createColumn({ name: 'custrecord_comm_customer_rate', label: 'custpage_customer_rate' }),
                    search.createColumn({ name: 'custrecord_load_order_status', label: 'custpage_order_status' }),
                ]
            });
            
            var searchResultCount = objCommissionAuthSearch.runPaged().count;
            log.debug("getCommisionAuth searchResultCount", searchResultCount)
            if (searchResultCount != 0) {
                var pagedData = objCommissionAuthSearch.runPaged({pageSize: 1000});
                for (var i = 0; i < pagedData.pageRanges.length; i++) {
                    var currentPage = pagedData.fetch(i);
                    var pageData = currentPage.data;
                    var pageColumns = currentPage.data[0].columns;
                    if (pageData.length > 0) {
                        for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                            let objData = {};
                            pageColumns.forEach(function (result) {
                                let resultLabel = result.label;
                                if (resultLabel == 'custpage_auth_status'){
                                    objData[resultLabel] = pageData[pageResultIndex].getText(result)
                                } else if (resultLabel == 'custpage_order_status'){
                                    let strStaus = pageData[pageResultIndex].getValue(result)
                                    objData[resultLabel] = strStaus === 'Load Order:Billed' ? 'Order Paid' : 'Order Not Paid';
                                } else {
                                    objData[resultLabel] = pageData[pageResultIndex].getValue(result)
                                }
                            })
                            arrCommisionAuth.push(objData);
                        }
                    }
                }
            }
        } catch (err) {
            log.error('getCommisionAuth', err.message);
        }
        log.debug("getCommisionAuth arrCommisionAuth", arrCommisionAuth)

        return arrCommisionAuth;
    };

    return {
        onRequest: onRequest
    };
});
