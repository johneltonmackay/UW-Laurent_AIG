/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'], function(currentRecord, url) {

    function pageInit(context) {
        var rec = currentRecord.get();
        let fldSelectedCommission = rec.getField({ fieldId: 'custpage_selected_commissions' })
        if (fldSelectedCommission){
            fldSelectedCommission.isDisplay = true;
        }

        calculateTotal(); // Initial calculation of total
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
            value: totalAmount
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
            { id: 'custpage_sales_order_id_hidden', key: 'soId' }
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

    function fieldChanged(context) {
        if (context.sublistId === 'custpage_commission_list' && context.fieldId === 'custpage_select') {
            calculateTotal();
            getSelected()
        }
    }

    function filterResults() {
        var rec = currentRecord.get();
        var department = rec.getValue({ fieldId: 'custpage_department' });

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_commission_report', // Your Suitelet script ID
            deploymentId: 'customdeploy_suitelet_commisions', // Your Suitelet deployment ID
            params: {
                custpage_department: department
            }
        });

        window.location.href = suiteletUrl;
    }

    function refreshPage() {
        try {          
            var sURL = url.resolveScript({
                scriptId : 'customscript_commission_report',
                deploymentId : 'customdeploy_suitelet_commisions',
                returnExternalUrl : false,
            });
        
            window.onbeforeunload = null;
            window.location = sURL;
        } catch (error) {
            console.log('Error: refreshPage', error.message)
        }
    }

    return {
        pageInit: pageInit,
        filterResults: filterResults,
        fieldChanged: fieldChanged,
        refreshPage: refreshPage
    };
});
