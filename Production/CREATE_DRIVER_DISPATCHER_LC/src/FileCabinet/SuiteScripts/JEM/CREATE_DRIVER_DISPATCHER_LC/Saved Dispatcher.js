/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/search', 'N/log', 'N/ui/dialog', 'N/record'], function(search, log, dialog, record) {

    function pageInit(context) {
        // Initialization logic if needed
    }

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;

        log.debug('Field Changed', 'Field ID: ' + fieldId);

        // Check if the changed field is 'Dispatcher'
        if (fieldId === 'custbody_saved_dispatch') {
            var dispatcherId = currentRecord.getValue({ fieldId: 'custbody_saved_dispatch' });

            log.debug('Dispatcher Selected', 'Dispatcher ID: ' + dispatcherId);

            if (dispatcherId) {
                try {
                    var dispatcherSearch = search.create({
                        type: 'customrecord_dispatchers',
                        filters: [['internalid', 'is', dispatcherId]],
                        columns: ['name', 'custrecord_dispatch_phone', 'custrecord_dispatch_email']
                    });

                    dispatcherSearch.run().each(function(result) {
                        var dispatcherName = result.getValue('name');
                        var dispatcherPhone = result.getValue('custrecord_dispatch_phone');
                        var dispatcherEmail = result.getValue('custrecord_dispatch_email');

                        log.debug('Dispatcher Result', 'Dispatcher Name: ' + dispatcherName + ', Dispatcher Phone: ' + dispatcherPhone + ', Dispatcher Email: ' + dispatcherEmail);

                        currentRecord.setValue({
                            fieldId: 'custbody_dispatcher_name',
                            value: dispatcherName
                        });

                        currentRecord.setValue({
                            fieldId: 'custbody_dispatcher_phone',
                            value: dispatcherPhone
                        });

                        currentRecord.setValue({
                            fieldId: 'custbody_dispatcher_email',
                            value: dispatcherEmail
                        });

                        return true;
                    });
                } catch (e) {
                    log.error('Error', 'Error getting dispatcher details: ' + e.message);
                }
            } else {
                log.debug('Dispatcher Selection', 'No dispatcher selected');
                clearDispatcherFields(currentRecord);
            }
        }
    }

    function clearDispatcherFields(currentRecord) {
        currentRecord.setValue({
            fieldId: 'custbody_dispatcher_name',
            value: ''
        });

        currentRecord.setValue({
            fieldId: 'custbody_dispatcher_phone',
            value: ''
        });

        currentRecord.setValue({
            fieldId: 'custbody_dispatcher_email',
            value: ''
        });
    }

    function saveRecord(context) {
        const objCurrentRecord = context.currentRecord;
        console.log("saveRecord objCurrentRecord", objCurrentRecord)
        let strDispatcherName = objCurrentRecord.getValue({
            fieldId: 'custbody_dispatcher_name'
        })
        let strDispatcherPhone = objCurrentRecord.getText({
            fieldId: 'custbody_dispatcher_phone'
        })
        let intVendorId = objCurrentRecord.getValue({
            fieldId: 'entity'
        })
        let strEmail = objCurrentRecord.getValue({
            fieldId: 'custbody_dispatcher_email'
        })
        
        if (strDispatcherName && strDispatcherPhone){
            let formattedPhoneNumber = strDispatcherPhone.split('+1 ')[1] || strDispatcherPhone;

            let options = {
                custrecord_dispatch_vendor: intVendorId,
                name: strDispatcherName,
                custrecord_dispatch_phone:formattedPhoneNumber,
                custrecord_dispatch_email: strEmail
            }
            let arrDispatcherData = validateDispatcher(options)
            if (arrDispatcherData.length > 0){
                console.log("saveRecord arrDispatcherData", arrDispatcherData)
                let msgAlert = {
                    title: 'INFORMATION',
                    message: 'Dispatcher Details Already Exist!'
                };
                dialog.alert(msgAlert)
            } else {
                let msgAlert = {
                    title: 'Dispatcher Details Not Found!',
                    message: 'Dispatcher Details Saved, Click Ok to Continue.'
                };
                dialog.alert(msgAlert)
                createDispatcherRecord(options)
            }
        }
        
        return true;
    }

    function validateDispatcher(options) {
        console.log("validateDispatcher options", options)
        let arrDispatcherData = [];
        try {
            let objSearch = search.create({
                type: 'customrecord_dispatchers',
                filters:  [
                    ['name', 'is', options.name],
                    'AND',
                    ['custrecord_dispatch_phone', 'is', options.custrecord_dispatch_phone],
                    'AND',
                    ['custrecord_dispatch_vendor', 'anyof', options.custrecord_dispatch_vendor],
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'name' }),
                    search.createColumn({ name: 'custrecord_dispatch_phone' }),
                    search.createColumn({ name: 'custrecord_dispatch_vendor' }),
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
                            arrDispatcherData.push({
                                internalid: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                name: pageData[pageResultIndex].getValue({name: 'name'}),
                                custrecord_dispatch_phone: pageData[pageResultIndex].getValue({name: 'custrecord_dispatch_phone'}),
                                custrecord_dispatch_vendor: pageData[pageResultIndex].getValue({name: 'custrecord_dispatch_vendor'}),
                            });
                        }
                    }
                }
            }
        } catch (err) {
            log.error('validateDispatcher', err.message);
        }
        log.debug("validateDispatcher arrDispatcherData", arrDispatcherData)
        return arrDispatcherData;
    }

    function createDispatcherRecord(options) {
        let intDispatcherDetailsId = null
        let objDispatcherRec = record.create({
            type: 'customrecord_dispatchers',
            isDynamic: true,
        });

        if (objDispatcherRec){
            Object.keys(options).forEach(key => {
                if (options[key]) {
                    objDispatcherRec.setValue({
                        fieldId: key,
                        value: options[key]
                    });
                }
            });

            intDispatcherDetailsId = objDispatcherRec.save({
                ignoreMandatoryFields: true
            });
        }
        console.log('createDispatcherRecord intDispatcherDetailsId', intDispatcherDetailsId)
        return intDispatcherDetailsId
    }

    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        pageInit: pageInit
    };
});