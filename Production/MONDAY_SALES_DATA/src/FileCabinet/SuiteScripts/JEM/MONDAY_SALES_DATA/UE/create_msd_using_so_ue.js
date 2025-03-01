/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

        const beforeLoad = (scriptContext) => {
            let arrFieldIds = ['custbody_commission_auth_id', 'custbody_monday_sales_data_id', 'custbody_commission_amount', 'custbody_profit',  ];
            
            if (scriptContext.type === scriptContext.UserEventType.COPY || scriptContext.type === scriptContext.UserEventType.CREATE) { 
                const objRec = scriptContext.newRecord;
                
                arrFieldIds.forEach((fieldId) => {
                    objRec.setValue({
                        fieldId: fieldId,
                        value: null
                    });
                });
            }
        };
        

        const afterSubmit = (scriptContext) => {
            log.debug('afterSubmit scriptContext.type', scriptContext.type)
            try {
                if (scriptContext.type === scriptContext.UserEventType.EDIT || scriptContext.type === scriptContext.UserEventType.COPY || scriptContext.type === scriptContext.UserEventType.CREATE) {
                    let arrSOData = []
                    const objRec = scriptContext.newRecord
                    const objCurrentRecord = record.load({
                        type: objRec.type,
                        id: objRec.id,
                        isDynamic: true
                    })
                    let intMSDId = objCurrentRecord.getValue('custbody_monday_sales_data_id')
                    if (!intMSDId) {
                        let arrFieldIds = fieldSOFieldsIds();
                        let objData = {};
                        
                        arrFieldIds.forEach(fldID => {
                            let fldValue = objCurrentRecord.getValue({ fieldId: fldID });
                            objData[fldID] = fldValue;
                        });
                        
                        arrSOData.push(objData);
                    }

                    if (arrSOData.length > 0){
                        let intMSDId = createCustomRecord(arrSOData)

                        objCurrentRecord.setValue({
                            fieldId: 'custbody_monday_sales_data_id',
                            value: intMSDId
                        })

                        if (scriptContext.type === scriptContext.UserEventType.CREATE || scriptContext.type === scriptContext.UserEventType.COPY ){
                            let folderId = createFolder(arrSOData[0])

                            objCurrentRecord.setValue({
                                fieldId: 'custbody_file_cabinet_id',
                                value: folderId
                            })
                        }
                        
                        let recordId = objCurrentRecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })
                        log.debug('afterSubmit recordId', recordId)
                    }

                    
                    log.debug('afterSubmit arrSOData', arrSOData)
                }
            } catch (error) {
                log.error('afterSubmit error', error.message)
            }
        }

        const createCustomRecord = (options) => {
            let customRecId = null
            try {
                let arrParamData = options
                if (arrParamData.length > 0){
                    let objRecData = record.create({
                        type: 'customrecord_my_sales_data',
                        isDynamic: true
                    })
                    if (objRecData){
                        arrParamData.forEach(data => {
                            for (const key in data) {
                                let fieldId = fieldMapping(key)
                                let fieldValue = data[key]
                                if (fieldId){
                                    objRecData.setValue({
                                        fieldId: fieldId,
                                        value: fieldValue
                                    }) 
                                }
                            }
                        });
                        customRecId = objRecData.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })
                        log.debug('createCustomRecord recordId', customRecId) 
                    }
                }
            } catch (error) {
                log.error('createCustomRecord error', error.message)
            }
            return customRecId
        }

        const createFolder = (options) => {
            let folderRecId = null
            try {
                if (options.tranid){
                    let objRecData = record.create({
                        type: 'folder',
                        isDynamic: true
                    })
                    if (objRecData){
                        objRecData.setValue({
                            fieldId: 'name',
                            value: options.tranid
                        });

                        objRecData.setValue({
                            fieldId: 'parent',
                            value: 374753 // AIG FILES > Sales Order Documents
                        });
                        
                        folderRecId = objRecData.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })
                        log.debug('createFolder recordId', folderRecId) 
                    }
                }
            } catch (error) {
                log.error('folderRecId error', error.message)
            }
            return folderRecId
        }

        const fieldMapping = (options) => {
            let fldID = null
            let objMSDFields = {
                entity : 'custrecord_customer',
                custbody_customer_po_numbers : 'custrecord_customer_po_numbers',
                custbody_load_detailsgeorge: 'custrecord_load_detailsgeorge',
                total: 'custrecord_amount',
                custbody_pu_city_state : 'custrecord_pu_city_state',
                custbody_drop_city_state : 'custrecord_drop_city_state',
                id : 'custrecord_load_order',
                custbody10 : 'custrecord_status',
                custbody22 : 'custrecord_appointment',
            }

            if (options){
                for (const key in objMSDFields) {
                    if (key == options){
                        fldID = objMSDFields[key]
                    }
                }
            }

            return fldID
        }

        const fieldSOFieldsIds = () => {
            let arrFieldIds = [
                'entity',
                'custbody_customer_po_numbers',
                'custbody_pu_city_state',
                'custbody_drop_city_state',
                'id',
                'tranid',
                'custbody10',
                'custbody22',
                'custbody_load_detailsgeorge',
                'total'
            ]

            return arrFieldIds
        }

        return {beforeLoad, afterSubmit}

    });
