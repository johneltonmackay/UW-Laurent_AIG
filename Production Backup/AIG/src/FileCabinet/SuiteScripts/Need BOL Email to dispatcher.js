/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @ModuleScope Public
 */
define(['N/record', 'N/email', 'N/log', 'N/runtime'], function(record, email, log, runtime) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
            var newRecord = context.newRecord;

            // Check if the custbody4 field is set to "Need BOL" (internal ID 4)
            var orderStatus = parseInt(newRecord.getValue({ fieldId: 'custbody4' }), 10);
            log.debug('Order Status', orderStatus);
            if (orderStatus !== 4) {
                log.debug('Script Exit', 'Order status is not Need BOL');
                return;
            }

            var poId = newRecord.id;
            var poTranId = newRecord.getValue({ fieldId: 'tranid' });
            var dispatcherEmail = newRecord.getValue({ fieldId: 'custbody_dispatcher_email' });

            // Log purchase order details
            log.debug('Purchase Order Details', 'PO ID: ' + poId + ', PO Tran ID: ' + poTranId + ', Dispatcher Email: ' + dispatcherEmail);

            if (!dispatcherEmail) {
                log.debug('Missing Dispatcher Email', 'Purchase Order ID: ' + poTranId + ' (Internal ID: ' + poId + ') does not have a dispatcher email.');
                return;
            }

            // Prepare the email body
            var emailBody = 'Please provide the proof of delivery for Purchase Order ID: ' + poTranId + '.\n\n' + 'Thank you.';

            log.debug('Preparing to send email', 'Recipient: ' + dispatcherEmail);

            // Send the email
            try {
                email.send({
                    author: runtime.getCurrentUser().id,
                    recipients: dispatcherEmail,
                    subject: 'Request for Proof of Delivery',
                    body: emailBody,
                    relatedRecords: {
                      transactionId: poId
                    }
                });
                log.debug('Email Sent', 'Email sent successfully to: ' + dispatcherEmail);

                // Create a message record to log the communication under the Communications tab of the Purchase Order
                /* var msg = record.create({
                    type: record.Type.MESSAGE
                });
                msg.setValue({fieldId: 'subject', value: 'Request for Proof of Delivery'});
                msg.setValue({fieldId: 'author', value: runtime.getCurrentUser().id});
                msg.setValue({fieldId: 'recipientemail', value: dispatcherEmail});
                msg.setValue({fieldId: 'message', value: 'Email with request for proof of delivery sent to dispatcher.'});
                msg.setValue({fieldId: 'transaction', value: poId});
                msg.save(); */

                log.debug('Message Saved', 'Message record saved successfully under Purchase Order ID: ' + poTranId);

            } catch (e) {
                log.error('Email Send Error', 'Error sending email: ' + e.toString());
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
