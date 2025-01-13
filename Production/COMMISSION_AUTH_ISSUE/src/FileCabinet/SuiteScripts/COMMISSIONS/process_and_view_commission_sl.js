/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/redirect', 'N/search', 'N/ui/serverWidget', 'N/url'],
    /**
 * @param{record} record
 * @param{redirect} redirect
 * @param{search} search
 */
    (record, redirect, search, serverWidget, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */

        const CONTEXT_METHOD = {
            GET: "GET",
            POST: "POST"
        };

        const onRequest = (scriptContext) => {
            if (scriptContext.request.method == CONTEXT_METHOD.GET) {
                let scriptObj = scriptContext.request.parameters;
                let objParam = JSON.parse(scriptObj.paramDataGet)
                let arrParam = objParam.data
                log.debug('GET onRequest objParam', objParam);
                if (arrParam.length > 1 && arrParam){
                    let intVendorBillId = createVendorBill(arrParam)
                    if (intVendorBillId){
                        redirect.toRecord({
                            type: record.Type.VENDOR_BILL,
                            id: intVendorBillId,
                            isEditMode: true
                        });
                    }
                } else {
                    scriptContext.response.write({
                        output: JSON.stringify({
                            success: false,
                            message: 'Error creating record: ' + e.message
                        })
                    });
                }
            }
        }

        // Private Function

        const createVendorBill = (arrParam) => {
            let arrForUpdate = []
            let arrSelectedCommissions = []
            let arrSelectedSalesOrder = []
            let intVendorBillId = null
            let intTotalCommissionAmount = 0
            try {
                arrParam.forEach(data => {
                    intTotalCommissionAmount += data.commissionAmount ? data.commissionAmount : 0;
                    arrSelectedCommissions.push(data.commissionId)
                    arrSelectedSalesOrder.push(data.soId)
                });

                let objVendorBill = record.create({
                    type: record.Type.VENDOR_BILL,
                    isDynamic: true,
                    defaultValues: {
                        customform: 257 
                    }
                });
                if (objVendorBill){
                    objVendorBill.setValue('entity', arrParam[0].vendorId);
                    objVendorBill.setValue('approvalstatus', 1); // Pending Approval
                    objVendorBill.setValue('custbody_commission_auth_id', arrSelectedCommissions);
                    arrParam.forEach(data => {
                        objVendorBill.selectNewLine('item');
                        objVendorBill.setCurrentSublistValue('item', 'item', 48); // Commission; 
                        objVendorBill.setCurrentSublistValue('item', 'quantity', 1);
                        objVendorBill.setCurrentSublistValue('item', 'rate', data.commissionAmount ? data.commissionAmount : null);
                        objVendorBill.setCurrentSublistValue('item', 'description', 'Commission for Sales Order ' + data.soDocNum);
                        objVendorBill.setCurrentSublistValue('item', 'custcol_comm_auth_id', data.commissionId);
                        objVendorBill.commitLine('item');
                    });

                }

                intVendorBillId = objVendorBill.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                if (intVendorBillId){
                    arrParam.forEach(data => {
                        arrForUpdate.push({
                            vbId: intVendorBillId,
                            caId: data.commissionId
                        })
                    });
                }
            } catch (error) {
                log.error('ERROR_RECORD_CREATION:', error.message)
            }
            log.debug('createVendorBill intVendorBillId', intVendorBillId)

            arrForUpdate.forEach(data => {
                updateCommissionAuthorization(data)
            });

            return intVendorBillId
        }

        const updateCommissionAuthorization = (data) => {
            try {
                var id = record.submitFields({
                    type: 'customrecord_commission_authorization',
                    id: data.caId,
                    values: {
                        custrecord_vendor_bill_id: data.vbId
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                });
                log.debug('updateCommissionAuthorization record id', id)
            } catch (error) {
                log.error('ERROR_UPDATE_COMMISSION_AUTHORIZATION:', error.message)
            }
        }

        return {onRequest}

    });
