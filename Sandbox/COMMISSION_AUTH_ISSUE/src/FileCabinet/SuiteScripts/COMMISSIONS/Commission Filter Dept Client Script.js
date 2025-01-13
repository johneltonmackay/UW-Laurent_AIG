/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'], function(currentRecord, url) {

    function pageInit(context) {
        var currentRecord = context.currentRecord;
        let urlParams = new URLSearchParams(window.location.search);
        let dataParam = urlParams.get('custpage_department');
        if (dataParam) {
            currentRecord.setValue({
                fieldId: 'custpage_department',
                value: dataParam
            });
        }

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

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_commission_report', 
            deploymentId: 'customdeploy_suitelet_commisions', 
            params: {
                custpage_department: department
            }
        });

        window.location.href = suiteletUrl;
    }

    return {
        pageInit: pageInit,
        filterResults: filterResults,
        fieldChanged: fieldChanged,
    };
});
