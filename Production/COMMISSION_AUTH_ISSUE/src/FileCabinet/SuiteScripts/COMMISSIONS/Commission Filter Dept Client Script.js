/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'], function(currentRecord, url) {

    function pageInit(context) {
        var currentRecord = context.currentRecord;
        let urlParams = new URLSearchParams(window.location.search);

        let arrUrlParamFields = ['custpage_department', 'custpage_order_status']

        arrUrlParamFields.forEach(field => {
            let value = urlParams.get(field);
            if (value) {
                currentRecord.setValue({ fieldId: field, value });
            }
        })

        calculateTotal();
    }

    function fieldChanged(context) {
        
        if (context.sublistId === 'custpage_commission_list' && context.fieldId === 'custpage_select') {
            calculateTotal();
            getSelected()
        }
    }

    function calculateTotal() {
        var rec = currentRecord.get();
        var lineCount = rec.getLineCount({ sublistId: 'custpage_commission_list' });
        var totalAmount = 0;

        for (var i = 0; i < lineCount; i++) {
            var isSelected = rec.getSublistValue({
                sublistId: 'custpage_commission_list',
                fieldId: 'custpage_select',
                line: i
            });

            if (isSelected) {
                var commissionAmount = rec.getSublistValue({
                    sublistId: 'custpage_commission_list',
                    fieldId: 'custpage_commission_amount',
                    line: i
                });

                totalAmount += parseFloat(commissionAmount) || 0;
            }
        }

        rec.setValue({
            fieldId: 'custpage_total_amount',
            value: parseFloat(totalAmount).toFixed(2)
        });
    }

    function getSelected() {
        var rec = currentRecord.get();
        var lineCount = rec.getLineCount({ sublistId: 'custpage_commission_list' });
        var selectedCommissions = [];

        const fields = [
            { id: 'custpage_commission_auth_internal_id', key: 'commissionId' },
            { id: 'custpage_linked_vendor', key: 'vendorId' },
            { id: 'custpage_commission_amount', key: 'commissionAmount' },
            { id: 'custpage_sales_order_id_hidden', key: 'soId' },
            { id: 'custpage_sales_order_id_text_hidden', key: 'soDocNum' }
            
        ];
        
        for (let i = 0; i < lineCount; i++) {
            const isSelected = rec.getSublistValue({
                sublistId: 'custpage_commission_list',
                fieldId: 'custpage_select',
                line: i
            });
        
            if (isSelected) {
                let objParam = {};
        
                fields.forEach(field => {
                    objParam[field.key] = rec.getSublistValue({
                        sublistId: 'custpage_commission_list',
                        fieldId: field.id,
                        line: i
                    });
                });
        
                selectedCommissions.push(objParam);
            }
        }

        rec.setValue({
            fieldId: 'custpage_selected_commissions',
            value: JSON.stringify(selectedCommissions)
        });
    }

    function filterResults() {
        var rec = currentRecord.get();
        var department = rec.getValue({ fieldId: 'custpage_department' });
        var strOrderStatus = rec.getValue({ fieldId: 'custpage_order_status' });

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_commission_report', 
            deploymentId: 'customdeploy_suitelet_commisions', 
            params: {
                custpage_department: department,
                custpage_order_status: strOrderStatus
            }
        });

        window.location.href = suiteletUrl;
    }

    function markAll() {
        chkBoxValue(true)
        calculateTotal();
    }

    function unmarkAll() {
        chkBoxValue(false)
        calculateTotal();
    }

    function chkBoxValue(blnValue) {
        var rec = currentRecord.get();
        var lineCount = rec.getLineCount({ sublistId: 'custpage_commission_list' });
        for (var i = 0; i < lineCount; i++) {
            rec.selectLine({
                sublistId: 'custpage_commission_list',
                line: i
            });
            rec.setCurrentSublistValue({
                sublistId: 'custpage_commission_list',
                fieldId: 'custpage_select',
                value: blnValue,
                ignoreFieldChange: true,
                forceSyncSourcing: true
            })
            rec.commitLine({
                sublistId: 'custpage_commission_list'
            });
        }
    }

    const exportCSV = (context) => {
        try {         
            let currRec = currentRecord.get()
            let lineCount = currRec.getLineCount({ sublistId: 'custpage_commission_list' });

            const mapping = fieldMapping();
            const fields = Object.keys(mapping.sublistfields);

            let csvHeader = ""; 

            fields.forEach(field => {
                const { text } = mapping.sublistfields[field];
                csvHeader += `${text},`; 
            });

            // Remove the last comma and add a newline at the end of the header
            csvHeader = csvHeader.slice(0, -1) + "\n"; 

            let csvContent = csvHeader; 

            for (let i = 0; i < lineCount; i++) {
                let columnValues = [];
                for (var strKey in mapping.sublistfields) {
                    let fieldInfo = mapping.sublistfields[strKey];
                    let columnValue = currRec.getSublistValue({
                        sublistId: 'custpage_commission_list',
                        fieldId: fieldInfo.id,
                        line: i
                    });

                    columnValues.push(columnValue);
                }

                csvContent += columnValues.map(value => 
                    typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                ).join(',') + '\n';
            }

            let blob = new Blob([csvContent], { type: 'text/csv' });
            let url = URL.createObjectURL(blob);
            
            let a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Commission_Authorization.csv';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.log('Error: exportCSV', error.message)
        }
    }

    const fieldMapping = () => {
        return {
            sublistfields: {
                SALES_ORDER: {
                    id: "custpage_sales_order_id_text_hidden",
                    text: "SALES ORDER"
                },
                COMMISSION_ID: {
                    id: "custpage_commission_auth_internal_id",
                    text: "COMMISSION ID"
                },
                EMPLOYEE_ID: {
                    id: "custpage_employee",
                    text: "EMPLOYEE"
                },
                CUSTOMER_NAME: {
                    id: "custpage_customer",
                    text: "CUSTOMER"
                },
                VENDOR_RATE: {
                    id: "custpage_vendor_rate",
                    text: "VENDOR RATE"
                },
                TOTAL_PROFIT: {
                    id: "custpage_total_profit",
                    text: "TOTAL PROFIT"
                },
                COMMISION_AMOUNT: {
                    id: "custpage_commission_amount",
                    text: "COMMISION AMOUNT"
                },
                ORDER_STATUS: {
                    id: "custpage_order_status",
                    text: "ORDER STATUS"
                },
                CUSTOMER_RATE: {
                    id: "custpage_customer_rate",
                    text: "CUSTOMER RATE"
                },
                AUTHORIZATION_STATUS: {
                    id: "custpage_auth_status",
                    text: "AUTHORIZATION_STATUS"
                },
            }
        };
    };
    

    return {
        pageInit: pageInit,
        filterResults: filterResults,
        fieldChanged: fieldChanged,
        markAll: markAll,
        unmarkAll: unmarkAll,
        exportCSV: exportCSV
    };
});
