/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @ModuleScope Public
 */
define(['N/record', 'N/email', 'N/log', 'N/runtime'], 
    /**
     * @param{record} record
     * @param{runtime} runtime
     */

    (record, email, log, runtime) => {

    const afterSubmit = (scriptContext) => {

        var newRecord = scriptContext.newRecord;
        let recType = newRecord.type
        let poTranId = newRecord.id
        const NEEDS_BOL = 4

        let objLogs = {
            scriptContextType: scriptContext.type,
            recordId: poTranId,
            recordType: recType
        }

        if (scriptContext.type =='edit' || scriptContext.type == 'xedit' || scriptContext.type == 'create') {
            try {
                const objCurrRec = record.load({
                    type: recType,
                    id: poTranId,
                    isDynamic: true
                })

                if (objCurrRec) {
                    let isSent = objCurrRec.getValue({
                        fieldId: 'custbody_needs_bol_email_sent'
                    });
                    let orderStatus = objCurrRec.getValue({
                        fieldId: 'custbody4' // Order Status
                    });
                    let strDocNum = objCurrRec.getValue({
                        fieldId: 'tranid'
                    });
                    let strPUCompany = objCurrRec.getValue({
                        fieldId: 'custbodypu_company_name'
                    });
                    let strPUAddress = objCurrRec.getValue({
                        fieldId: 'custbody_pu_location'
                    });
                    let strDropCompany = objCurrRec.getValue({
                        fieldId: 'custbody_drop_company'
                    });
                    let strDropAddress = objCurrRec.getValue({
                        fieldId: 'custbody_drop_location'
                    });

                    let strFromBody = 'PU Company: ' + strPUCompany  + ' PU Address: ' + strPUAddress
                    let strToBody = 'Drop Company: ' + strDropCompany  + ' Drop Address: ' + strDropAddress

                    if (orderStatus == NEEDS_BOL && !isSent){
                        let dispatcherEmail = objCurrRec.getValue({
                            fieldId: 'custbody_dispatcher_email'
                        });
                        if (dispatcherEmail){
                            let emailBody = 'Please provide the proof of delivery for ' + strDocNum + '.\n\n' +
                                            'From: ' + strFromBody + '\n' +
                                            'To: ' + strToBody + '\n\n' +
                                            'Thank you.';


                            email.send({
                                author: runtime.getCurrentUser().id,
                                recipients: dispatcherEmail,
                                subject: 'Request for Proof of Delivery AIG Enterprises ' + strDocNum,
                                body: emailBody,
                                relatedRecords: {
                                  transactionId: poTranId
                                }
                            });

                            log.debug('Email Sent', 'Email sent successfully to: ' + dispatcherEmail);
                            log.debug('Message Saved', 'Message record saved successfully under Purchase Order ID: ' + poTranId);

                            objCurrRec.setValue({
                                fieldId: 'custbody_needs_bol_email_sent',
                                value: true
                            });

                            var recordId = objCurrRec.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug("Needs BOL Email Sent recordId", recordId)

                        }
                    }
                }
            } catch (error) {
                objLogs.error = error.message
                log.error('afterSubmit Error sending email: ', objLogs);
            }
        } else {
            log.debug('afterSubmit else objLogs', objLogs)
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
