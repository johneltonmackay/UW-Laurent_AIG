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

        // Check if the changed field is 'Driver'
        if (fieldId === 'custbody_custbody_driver') {
            var driverId = currentRecord.getValue({ fieldId: 'custbody_custbody_driver' });

            log.debug('Driver Selected', 'Driver ID: ' + driverId);

            if (driverId) {
                try {
                    var driverSearch = search.create({
                        type: 'customrecord_drivers',
                        filters: [['internalid', 'is', driverId]],
                        columns: ['name', 'custrecord_driver_phone', 'custrecord_teuck_trailer']
                    });

                    driverSearch.run().each(function(result) {
                        var driverName = result.getValue('name');
                        var driverPhone = result.getValue('custrecord_driver_phone');
                        var truckTrailer = result.getValue('custrecord_teuck_trailer');

                        log.debug('Driver Result', 'Driver Name: ' + driverName + ', Driver Phone: ' + driverPhone + ', Truck/Trailer: ' + truckTrailer);

                        currentRecord.setValue({
                            fieldId: 'custbody_driver_name',
                            value: driverName
                        });

                        currentRecord.setValue({
                            fieldId: 'custbody_driver_phone',
                            value: driverPhone
                        });

                        currentRecord.setValue({
                            fieldId: 'custbody_truck_trailer_',
                            value: truckTrailer
                        });

                        return true;
                    });
                } catch (e) {
                    log.error('Error', 'Error getting driver details: ' + e.message);
                }
            } else {
                log.debug('Driver Selection', 'No driver selected');
                clearDriverFields(currentRecord);
            }
        }
    }

    function saveRecord(context) {
        const objCurrentRecord = context.currentRecord;
        console.log("saveRecord objCurrentRecord", objCurrentRecord)
        let strDriverName = objCurrentRecord.getValue({
            fieldId: 'custbody_driver_name'
        })
        let strDriverPhone = objCurrentRecord.getText({
            fieldId: 'custbody_driver_phone'
        })
        let intVendorId = objCurrentRecord.getValue({
            fieldId: 'entity'
        })
        let strTruckTrailer = objCurrentRecord.getValue({
            fieldId: 'custbody_truck_trailer_'
        })
        
        if (strDriverName && strDriverPhone){
            let formattedPhoneNumber = strDriverPhone.split('+1 ')[1] || strDriverPhone;

            let options = {
                custrecord_driver_vendor: intVendorId,
                name: strDriverName,
                custrecord_driver_phone:formattedPhoneNumber,
                custrecord_teuck_trailer: strTruckTrailer
            }
            let arrDriverData = validateDriver(options)
            if (arrDriverData.length > 0){
                console.log("saveRecord arrDriverData", arrDriverData)
                let msgAlert = {
                    title: 'Information',
                    message: 'Driver Details Already Exist!'
                };
                dialog.alert(msgAlert)
            } else {
                let msgAlert = {
                    title: 'Driver Details Not Found!',
                    message: 'Driver Details Saved, Click Ok to Continue.'
                };
                dialog.alert(msgAlert)
                createDriverRecord(options)
            }
        }
        
        return true;
    }

    function validateDriver(options) {
        console.log("validateDriver options", options)
        let arrDriverData = [];
        try {
            let objSearch = search.create({
                type: 'customrecord_drivers',
                filters:  [
                    ['name', 'is', options.name],
                    'AND',
                    ['custrecord_driver_phone', 'is', options.custrecord_driver_phone],
                    'AND',
                    ['custrecord_driver_vendor', 'anyof', options.custrecord_driver_vendor],
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'name' }),
                    search.createColumn({ name: 'custrecord_driver_phone' }),
                    search.createColumn({ name: 'custrecord_driver_vendor' }),
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
                            arrDriverData.push({
                                internalid: pageData[pageResultIndex].getValue({name: 'internalid'}),
                                name: pageData[pageResultIndex].getValue({name: 'name'}),
                                custrecord_driver_phone: pageData[pageResultIndex].getValue({name: 'custrecord_driver_phone'}),
                                custrecord_driver_vendor: pageData[pageResultIndex].getValue({name: 'custrecord_driver_vendor'}),
                            });
                        }
                    }
                }
            }
        } catch (err) {
            log.error('validateDriver', err.message);
        }
        log.debug("validateDriver arrDriverData", arrDriverData)
        return arrDriverData;
    }

    function createDriverRecord(options) {
        let intDriverDetailsId = null
        let objDriverRec = record.create({
            type: 'customrecord_drivers',
            isDynamic: true,
        });

        if (objDriverRec){
            Object.keys(options).forEach(key => {
                if (options[key]) {
                    objDriverRec.setValue({
                        fieldId: key,
                        value: options[key]
                    });
                }
            });

            intDriverDetailsId = objDriverRec.save({
                ignoreMandatoryFields: true
            });
        }
        console.log('createDriverRecord intDriverDetailsId', intDriverDetailsId)
        return intDriverDetailsId
    }

    function clearDriverFields(currentRecord) {
        currentRecord.setValue({
            fieldId: 'custbody_driver_name',
            value: ''
        });

        currentRecord.setValue({
            fieldId: 'custbody_driver_phone',
            value: ''
        });

        currentRecord.setValue({
            fieldId: 'custbody_truck_trailer_',
            value: ''
        });
    }


    return {
        fieldChanged: fieldChanged,
        saveRecord: saveRecord,
        pageInit: pageInit
    };
});
