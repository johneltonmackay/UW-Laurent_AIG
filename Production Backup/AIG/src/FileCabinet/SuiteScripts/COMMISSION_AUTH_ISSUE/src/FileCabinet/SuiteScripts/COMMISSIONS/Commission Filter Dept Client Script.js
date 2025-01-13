/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'], function(currentRecord, url) {
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

    function saveRecord() {
        var rec = currentRecord.get();
        var selectedCommissions = [];

        var lineCount = rec.getLineCount({ sublistId: 'custpage_commission_list' });

        for (var i = 0; i < lineCount; i++) {
            var isSelected = rec.getSublistValue({
                sublistId: 'custpage_commission_list',
                fieldId: 'custpage_select',
                line: i
            });

            if (isSelected) {
                var commissionAuthInternalId = rec.getSublistValue({
                    sublistId: 'custpage_commission_list',
                    fieldId: 'custpage_commission_auth_internal_id',
                    line: i
                });
                // Need To Convert it into Object that includes Commission Amount, Commssion ID, SO ID
                selectedCommissions.push(parseInt(commissionAuthInternalId, 10));
            }
        }

        rec.setValue({
            fieldId: 'custpage_selected_commissions',
            value: JSON.stringify(selectedCommissions)
        });

        return true;
    }

    function pageInit(context) {
        var rec = currentRecord.get();
        rec.getField({ fieldId: 'custpage_selected_commissions' }).isDisplay = false;

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

    function fieldChanged(context) {
        if (context.sublistId === 'custpage_commission_list' && context.fieldId === 'custpage_select') {
            calculateTotal();
        }
    }

    return {
        pageInit: pageInit,
        filterResults: filterResults,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged
    };
});
