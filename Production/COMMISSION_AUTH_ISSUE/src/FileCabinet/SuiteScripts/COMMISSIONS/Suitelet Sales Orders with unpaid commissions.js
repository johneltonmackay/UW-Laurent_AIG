/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/url', 'N/redirect', 'N/log'], function(record, search, serverWidget, url, redirect, log) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
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
                source: 'department'
            });

            let selFldOrderStatus = form.addField({
                id: 'custpage_order_status',
                type: serverWidget.FieldType.SELECT,
                label: 'Order Status',
                container: 'filters'
            })

            selFldOrderStatus.addSelectOption({
                value: '',
                text: ''
            })

            selFldOrderStatus.addSelectOption({
                value: 'Order Paid',
                text: 'Order Paid'
            })

            selFldOrderStatus.addSelectOption({
                value: 'Order Not Paid',
                text: 'Order Not Paid'
            });
    
            form.addButton({
                id: 'custpage_filter',
                label: 'Filter',
                functionName: 'filterResults' 
            });

            form.addButton({
                id: 'custpage_csv_export',
                label: 'CSV Export',
                functionName: 'exportCSV' 
            });
    
            form.addField({
                id: 'custpage_selected_commissions',
                type: serverWidget.FieldType.LONGTEXT,
                label: 'Selected Commissions',
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
    
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

            sublist.addButton({
                id : 'custpage_mark_all',
                label : 'Mark All',
                functionName: 'markAll'
            });

            sublist.addButton({
                id : 'custpage_mark_all',
                label : 'Unmark All',
                functionName: 'unmarkAll'
            });


            form.clientScriptFileId = 104747;

    
            var sublistFields = [
                { id: 'custpage_select', type: serverWidget.FieldType.CHECKBOX, label: 'Select' },
                { id: 'custpage_sales_order', type: serverWidget.FieldType.TEXT, label: 'Sales Order' },
                { id: 'custpage_sales_order_id_hidden', type: serverWidget.FieldType.TEXT, label: 'HIDDEN ID' },
                { id: 'custpage_sales_order_id_text_hidden', type: serverWidget.FieldType.TEXT, label: 'HIDDEN ID' },
                { id: 'custpage_commission_auth_link_id', type: serverWidget.FieldType.TEXT, label: 'COMMISSION ID', },
                { id: 'custpage_commission_auth_internal_id', type: serverWidget.FieldType.TEXT, label: 'HIDDEN ID' },
                { id: 'custpage_employee', type: serverWidget.FieldType.TEXT, label: 'Employee' },
                { id: 'custpage_customer', type: serverWidget.FieldType.TEXT, label: 'Customer' },
                { id: 'custpage_linked_vendor', type: serverWidget.FieldType.TEXT, label: 'Linked Vendor' },
                { id: 'custpage_vendor_rate', type: serverWidget.FieldType.CURRENCY, label: 'Vendor Rate' },
                { id: 'custpage_total_profit', type: serverWidget.FieldType.CURRENCY, label: 'Total Profit' },
                { id: 'custpage_commission_amount', type: serverWidget.FieldType.CURRENCY, label: 'Commission Amount' },
                { id: 'custpage_order_status', type: serverWidget.FieldType.TEXT, label: 'Order Status' },
                { id: 'custpage_customer_rate', type: serverWidget.FieldType.CURRENCY, label: 'Customer Rate' },
                { id: 'custpage_auth_status', type: serverWidget.FieldType.TEXT, label: 'Authorization Status' },
            ];
    
            sublistFields.forEach(function(field) {
                let arrHiddenFields = [
                    'custpage_commission_auth_internal_id',
                    'custpage_linked_vendor',
                    'custpage_sales_order_id_hidden',
                    'custpage_sales_order_id_text_hidden'
                ]
                if (arrHiddenFields.includes(field.id)){
                    const hiddenField = sublist.addField({
                        id: field.id,
                        type: serverWidget.FieldType.TEXT,
                        label: 'HIDDEN ID'
                    });
                    hiddenField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });
                } else {
                    sublist.addField(field);
                }
            });
            
            if (context.request.parameters.custpage_department) {
                let department = context.request.parameters.custpage_department;
                let strOrderStatus = context.request.parameters.custpage_order_status;

                let arrCommisionAuth = getCommisionAuth(department, strOrderStatus)

                arrCommisionAuth.forEach((data, index) => {
                    for (const key in data) {
                        let value = data[key];
                        if (value){
                            if (key == 'custpage_commission_auth_link_id'){
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
                                let recLink = `<a href='${stSOUrl}' target="_blank" rel="noopener noreferrer">${data['custpage_sales_order_id_text_hidden']}</a>`
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
                form.addSubmitButton({
                    label: 'Authorize'
                });
            }
            context.response.writePage(form);

        } else {
            var arrSelectedCommissions = JSON.parse(context.request.parameters.custpage_selected_commissions);

            log.debug('arrSelectedCommissions', arrSelectedCommissions);
            arrSelectedCommissions.forEach(data => {
                if (data.vendorId && data.commissionId && data.soId){
                    let objParam = {
                        data: arrSelectedCommissions,
                    }
                    redirect.toSuitelet({
                        scriptId: 'customscript_process_view_commission_sl',
                        deploymentId: 'customdeploy_process_view_commission_sl',
                        parameters: {
                            paramDataGet: JSON.stringify(objParam)
                        }
                    });
                }
            });
        }
    }

    const getCommisionAuth = (department, strOrderStatus) => {
        let arrCommisionAuth = [];
        try {
            let objCommissionAuthSearch = search.create({
                type: 'customrecord_commission_authorization',
                filters: [
                    ['custrecord_commission_status', 'anyof', '1'], // Pending
                    'AND',
                    ['custrecord_auth_employee.department', 'anyof', department],
                    'AND',
                    ['custrecord_order_closed', 'is', 'F'],
                ],

                columns: [
                    search.createColumn({ name: 'internalid', label: 'custpage_commission_auth_link_id'}),
                    search.createColumn({ name: 'internalid', label: 'custpage_commission_auth_internal_id'}),
                    search.createColumn({ name: 'custrecord_custrecord167', label: 'custpage_sales_order' }),
                    search.createColumn({ name: 'custrecord_custrecord167', label: 'custpage_sales_order_id_hidden' }),
                    search.createColumn({ name: 'custrecord_custrecord167', label: 'custpage_sales_order_id_text_hidden' }),
                    search.createColumn({ name: 'custrecord_auth_employee', label: 'custpage_employee' }),
                    search.createColumn({ name: 'custrecord_comm_customer', label: 'custpage_customer' }),
                    search.createColumn({ name: 'custrecord_auth_commission_amount', label: 'custpage_commission_amount' }),
                    search.createColumn({ name: 'custrecord_commission_status', label: 'custpage_auth_status' }),
                    search.createColumn({ name: 'custrecord_comm_vendor_rate', label: 'custpage_vendor_rate' }),
                    search.createColumn({ name: 'custrecord_comm_total_profit', label: 'custpage_total_profit' }),
                    search.createColumn({ name: 'custrecord_comm_customer_rate', label: 'custpage_customer_rate' }),
                    search.createColumn({ name: 'custrecord_load_order_status', label: 'custpage_order_status' }),
                    search.createColumn({ name: 'custrecord_employee_linked_vendor', label: 'custpage_linked_vendor' }),
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
                                    let strStatus = pageData[pageResultIndex].getValue(result)
                                    objData[resultLabel] = strStatus === 'Load Order:Billed' ? 'Order Paid' : 'Order Not Paid';
                                } else if (resultLabel == 'custpage_sales_order_id_text_hidden'){
                                    let strDocNum = pageData[pageResultIndex].getText(result)
                                    let arrDocNum = strDocNum.split('#')
                                    objData[resultLabel] = arrDocNum[1]
                                } else {
                                    objData[resultLabel] = pageData[pageResultIndex].getValue(result)
                                }
                            })
                            if (strOrderStatus){
                                if (objData.custpage_order_status == strOrderStatus){
                                    arrCommisionAuth.push(objData);
                                }
                            } else {
                                arrCommisionAuth.push(objData);
                            }
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
