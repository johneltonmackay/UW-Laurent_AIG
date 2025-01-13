/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search'],
    /**
 * @param{record} record
 */
    (record, runtime, search) => {
        const ISLAURENT = 3672
        const ISJOHN = 15
        const arrSOLineFieldIds = ['item', 'custcol_commodity', 'rate', 'amount', 'lineuniquekey', 'custcol6'];
        const afterSubmit = (scriptContext) => {
            log.debug('afterSubmit scriptContext', scriptContext)
            log.debug('afterSubmit executionContext', runtime.executionContext)

            if (runtime.executionContext == runtime.ContextType.USER_INTERFACE){
                let currentUser = runtime.getCurrentUser();
                log.debug('Current User ID', currentUser.id);
                if (currentUser.id == ISLAURENT || currentUser.id == ISJOHN) {
                    try {
                        let newRecord = scriptContext.newRecord
                        let intRecId = newRecord.id
                        let strRecType = newRecord.type
        
                        let objRecord = record.load({
                            type: strRecType,
                            id: intRecId,
                            isDynamic: true
                        })
        
                        if (objRecord){
                            let strStatus = objRecord.getValue({
                                fieldId: 'status'
                            })
        
                            if (strStatus == 'Pending Billing'){
    
                                let intCustomerId = objRecord.getValue({
                                    fieldId: 'entity'
                                })

                                let strPublicNotes = objRecord.getValue({
                                    fieldId: 'custbody_locations_public_notes'
                                })

                                let strPublicNotesDrop = objRecord.getValue({
                                    fieldId: 'custbody_public_notes_drop'
                                })

                                
                                let objSOData = {
                                    custbody_public_notes: strPublicNotes,
                                    custbody_public_notes_drop: strPublicNotesDrop
                                }

                                log.debug('afterSubmit objSOData', objSOData)
    
                                
                                let intPOId = createPO(objSOData, intRecId, intCustomerId)
                                log.debug('afterSubmit intPOId', intPOId)
                                
                            }
                            log.debug('afterSubmit strStatus', strStatus)
                        }
                    } catch (error) {
                        log.error('afterSubmit error', error.message)
                    }
                }
            }

        }

        const createPO = (objSOData, intRecId, intCustomerId) => {
            let intPOId = null
            const arrFieldsToUpdate = ['rate', 'amount']
            try {

                let salesOrderId = intRecId;
                const VENDOR_TO_BE_ASSIGNED = '7855';

                let purchaseOrder = record.create({
                    type: record.Type.PURCHASE_ORDER,
                    isDynamic: true,
                    defaultValues: {
                        'recordmode' : 'dynamic',
                        'soid' : salesOrderId,
                        'dropship' : 'T',
                        // 'specord' : 'T',
                        'custid' : intCustomerId,
                        'entity': VENDOR_TO_BE_ASSIGNED
                    }
                });

                if (purchaseOrder){

                    Object.keys(objSOData).forEach(key => {
                        if (objSOData[key]) {
                            purchaseOrder.setValue({
                                fieldId: key,
                                value: objSOData[key]
                            });
                        }
                    });

                    let numLines = purchaseOrder.getLineCount({ sublistId: 'item' });
                    log.debug('createPO numLines', numLines)

                    for (let index = 0; index < numLines; index++) {
                        purchaseOrder.selectLine({
                            sublistId: 'item',
                            line: index
                        })
                        arrFieldsToUpdate.forEach(fieldId => {
                            purchaseOrder.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: fieldId,
                                line: index,
                                value: 0
                            });
                        })
                        purchaseOrder.commitLine({
                            sublistId: 'item',
                        })
                    }
                }

                intPOId = purchaseOrder.save({
                    ignoreMandatoryFields: true
                });

            } catch (error) {
                log.error('createPO error', error.message)
            }
            return intPOId
        }

        return {afterSubmit}

    });
