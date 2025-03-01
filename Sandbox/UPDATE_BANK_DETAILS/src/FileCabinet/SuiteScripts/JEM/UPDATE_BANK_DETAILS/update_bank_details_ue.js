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

        const afterSubmit = (scriptContext) => {
            if (scriptContext.type == 'edit'){
                let objRecord = scriptContext.newRecord
                let isFactoringCompany = validateParentVendor(objRecord)
                log.debug('isFactoringCompany', isFactoringCompany)

                if (isFactoringCompany){
                    let arrBankDetailsName = searchBankDetailsName(objRecord)
                    if (arrBankDetailsName.length > 0){
                        log.debug('arrBankDetailsName', arrBankDetailsName.length)
                        let fldValuesObj = buildBankDetailsData(objRecord)
                        if (fldValuesObj){
                            log.debug('fldValuesObj', fldValuesObj)
                            updateCarrierBankDetails(arrBankDetailsName, fldValuesObj)    
                        }
                       
                    }
                }

            }
        }

        const updateCarrierBankDetails = (arrBankDetailsName, fldValuesObj) => {
            // log.debug('updateCarrierBankDetails fldValuesObj', fldValuesObj)
            // log.debug('updateCarrierBankDetails id', data.internalid)

            arrBankDetailsName.forEach(data => {
                let submitFieldsPromise = record.submitFields.promise({
                    type: 'customrecord_2663_entity_bank_details',
                    id: data.internalid,
                    values: fldValuesObj,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                });

                submitFieldsPromise.then(function(recordId) {
                    log.debug({
                        title: 'Record updated',
                        details: 'Id of updated record: ' + recordId + ' ' + JSON.stringify(fldValuesObj)
                    });
            
                }, function(e) {
                    log.error({
                        title: e.name,
                        details: e.message
                    });
                });
            });
        }

        const buildBankDetailsData = (objRecord) => {
            let fldValuesObj = {}
            let arrFldToUpdate = [
                'custrecord_2663_entity_acct_no',
                'custrecord_2663_entity_bank_no',
                'custrecord_2663_entity_country_check',
                'custrecord_2663_entity_bank_code',
                'custrecord_2663_entity_processor_code',
                'custrecord_2663_entity_bank_acct_type',
            ]

            arrFldToUpdate.forEach(fldId => {
                let fldValue = objRecord.getValue({
                    fieldId: fldId
                })
                fldValuesObj[fldId] = fldValue
            })

            return fldValuesObj
        }

        const validateParentVendor = (objRecord) => {
            let isFactoringCompany = false
            let intParentVendor = objRecord.getValue({
                fieldId: 'custrecord_2663_parent_vendor'
            })
            if (intParentVendor){
                let fieldLookUp = search.lookupFields({
                    type: 'vendor',
                    id: intParentVendor,
                    columns: 'category'
                });
                log.debug('fieldLookUp', fieldLookUp)
                if (fieldLookUp){
                    intCategory = fieldLookUp.category[0].value;
                    log.debug('intCategory', intCategory)
                    if (intCategory == 5){
                        isFactoringCompany = true
                    } else {
                        isFactoringCompany = false
                    }
                }
            }

            return isFactoringCompany
        }

        const searchBankDetailsName = (objRecord) => {
            let arrBankDetailsName = [];

            let strBankDetailsName = objRecord.getValue({
                fieldId: 'name'
            })
            if (strBankDetailsName){
                try {
                    let objSearch = search.create({
                        type: 'customrecord_2663_entity_bank_details',
                        filters:  [
                          ['name', 'is', strBankDetailsName],
                          'AND',
                          ['custrecord_2663_parent_vendor.category', 'anyof', '6'], // Carrier
                        ],
                        columns: [
                            search.createColumn({ name: 'internalid' }),
                        ]
                    });
                    
                    var searchResultCount = objSearch.runPaged().count;
                    if (searchResultCount != 0) {
                        var pagedData = objSearch.runPaged({pageSize: 1000});
                        for (var i = 0; i < pagedData.pageRanges.length; i++) {
                            var currentPage = pagedData.fetch(i);
                            var pageData = currentPage.data;
                            if (pageData.length > 0) {
                                for (var pageResultIndex = 0; pageResultIndex < pageData.length; pageResultIndex++) {
                                  arrBankDetailsName.push({
                                        internalid: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                    });
                                }
                            }
                        }
                    }
                } catch (err) {
                    log.error('searchBankDetailsName', err.message);
                }
            }

            return arrBankDetailsName;
        }

        return {afterSubmit}

    });
