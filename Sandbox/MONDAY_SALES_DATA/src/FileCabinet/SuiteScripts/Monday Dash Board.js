/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/log', 'N/file', 'N/runtime'], 
    function(serverWidget, record, search, log, file, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = createForm(context.request);
            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            saveRecords(context.request);
            var form = createForm(context.request);
            context.response.writePage(form);
        }
    }
    
    function createForm(request) {
        var form = serverWidget.createForm({ 
            title: 'Manage Sales Data'
        });

        // File upload field
        form.addField({
            id: 'custpage_file_upload',
            type: serverWidget.FieldType.FILE,
            label: 'Upload Document'
        });

        // Add a "Filter" field group
        form.addFieldGroup({
            id: 'custpage_filter_group',
            label: 'Filter'
        });

        var puLocationFilterField = form.addField({
            id: 'custpage_pu_location_filter',
            type: serverWidget.FieldType.TEXT,
            label: 'PU Location',
            container: 'custpage_filter_group'
        });

        var dropLocationFilterField = form.addField({
            id: 'custpage_drop_location_filter',
            type: serverWidget.FieldType.TEXT,
            label: 'Drop Location',
            container: 'custpage_filter_group'
        });

        var loadOrderFilterField = form.addField({
            id: 'custpage_load_order_filter',
            type: serverWidget.FieldType.TEXT,
            label: 'Load Order',
            container: 'custpage_filter_group'
        });

        // Add a Status filter field
        var statusFilterField = form.addField({
            id: 'custpage_status_filter',
            type: serverWidget.FieldType.SELECT,
            label: 'Status',
            container: 'custpage_filter_group'
        });

        // Add options to the Status filter field
        statusFilterField.addSelectOption({ value: '', text: '' });
        statusFilterField.addSelectOption({ value: '1', text: 'Pending' });
        statusFilterField.addSelectOption({ value: '2', text: 'Needs Carrier' });
        statusFilterField.addSelectOption({ value: '3', text: 'Covered' });
        statusFilterField.addSelectOption({ value: '4', text: 'Ready For Invoice' });
        statusFilterField.addSelectOption({ value: '5', text: 'Canceled' });
        statusFilterField.addSelectOption({ value: '6', text: 'HOT!' });

        // Set default values for filters if provided
        // if (request && request.parameters.custpage_load_order_filter) {
        //     loadOrderFilterField.defaultValue = request.parameters.custpage_load_order_filter;
        // }
        // if (request && request.parameters.custpage_pu_location_filter) {
        //     puLocationFilterField.defaultValue = request.parameters.custpage_pu_location_filter;
        // }
        // if (request && request.parameters.custpage_drop_location_filter) {
        //     dropLocationFilterField.defaultValue = request.parameters.custpage_drop_location_filter;
        // }
        // if (request && request.parameters.custpage_status_filter) {
        //     statusFilterField.defaultValue = request.parameters.custpage_status_filter;
        // }

        form.addButton({
            id: 'custpage_search_button',
            label: 'Search',
            functionName: 'onSearch'
        });

        form.addButton({
            id: 'custpage_clear_button',
            label: 'Clear Filters',
            functionName: 'onClearFilters'
        });

        // Add a "Documents" field group
        form.addFieldGroup({
            id: 'custpage_documents_group',
            label: 'Documents'
        });

        var salesOrderField = form.addField({
            id: 'custpage_sales_order',
            type: serverWidget.FieldType.SELECT,
            label: 'Attach to Sales Order',
            container: 'custpage_documents_group'
        });
        salesOrderField.addSelectOption({ value: '', text: '' });

        var documentSelectField = form.addField({
            id: 'custpage_document_selector',
            type: serverWidget.FieldType.SELECT,
            label: 'Select Record to View Document',
            container: 'custpage_documents_group'
        });
        documentSelectField.addSelectOption({ value: '', text: '' });

        var documentDisplayField = form.addField({
            id: 'custpage_document_display',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Document',
            container: 'custpage_documents_group'
        });
        documentDisplayField.defaultValue = '<span id="documentLink">No document selected</span>';

        var sublist = form.addSublist({
            id: 'custpage_sales_list',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'Sales Data List'
        });

        sublist.addField({
            id: 'custpage_record_id',
            type: serverWidget.FieldType.TEXT,
            label: 'Record ID (Internal)'
         }).updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
         });

        sublist.addField({ 
            id: 'custpage_customer', 
            type: serverWidget.FieldType.SELECT, 
            label: 'Customer', 
            source: 'customer'
        })

        sublist.addField({ 
            id: 'custpage_pu_location',
            type: serverWidget.FieldType.TEXT,
            label: 'PU Location'
         });
    
        sublist.addField({ id: 'custpage_drop_location', type: serverWidget.FieldType.TEXT, label: 'Drop Location' });

        sublist.addField({
            id: 'custpage_miles',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'Miles'
        });

        sublist.addField({ id: 'custpage_amount', type: serverWidget.FieldType.TEXT, label: 'Amount' });

        sublist.addField({
            id: 'custpage_target_rate',
            type: serverWidget.FieldType.CURRENCY,
            label: 'Target Rate'
        });

        sublist.addField({
            id: 'custpage_commodity',
            type: serverWidget.FieldType.TEXT,
            label: 'Commodity'
        });

        sublist.addField({
            id: 'custpage_pu_timeline',
            type: serverWidget.FieldType.TEXT,
            label: 'PU Timeline'
        });

        sublist.addField({
            id: 'custpage_drop_timeline',
            type: serverWidget.FieldType.TEXT,
            label: 'Drop Timeline'
        });

        var statusField = sublist.addField({
            id: 'custpage_status',
            type: serverWidget.FieldType.SELECT,
            label: 'Status'
        });

        statusField.addSelectOption({ value: '1', text: 'Pending' });
        statusField.addSelectOption({ value: '2', text: 'Needs Carrier' });
        statusField.addSelectOption({ value: '3', text: 'Covered' });
        statusField.addSelectOption({ value: '4', text: 'Ready For Invoice' });
        statusField.addSelectOption({ value: '5', text: 'Canceled' });
        statusField.addSelectOption({ value: '6', text: 'HOT!' });

        sublist.addField({
            id: 'custpage_update',
            type: serverWidget.FieldType.TEXTAREA,
            label: 'Update'
        });

        sublist.addField({ id: 'custpage_po_number', type: serverWidget.FieldType.TEXT, label: 'PO Number' });

        sublist.addField({
            id: 'custpage_appointment',
            type: serverWidget.FieldType.TEXT,
            label: 'Appointment'
        });

        var loadOrderField = sublist.addField({
            id: 'custpage_load_order',
            type: serverWidget.FieldType.SELECT,
            label: 'Load Order',
            source: 'transaction'
        });

        // Create the search filters array and add filters if values are provided
        var filters = [];
        if (request && request.parameters.custpage_load_order_filter) {
            var filterValue = request.parameters.custpage_load_order_filter.trim();
            if (filterValue) {
                filters.push(search.createFilter({
                    name: 'formulatext',
                    formula: '{custrecord_load_order}',
                    operator: search.Operator.CONTAINS,
                    values: filterValue
                }));
            }
        }
        if (request && request.parameters.custpage_pu_location_filter) {
            var puLocationValue = request.parameters.custpage_pu_location_filter.trim();
            if (puLocationValue) {
                filters.push(search.createFilter({
                    name: 'custrecord_pu_location',
                    operator: search.Operator.CONTAINS,
                    values: puLocationValue
                }));
            }
        }
        if (request && request.parameters.custpage_drop_location_filter) {
            var dropLocationValue = request.parameters.custpage_drop_location_filter.trim();
            if (dropLocationValue) {
                filters.push(search.createFilter({
                    name: 'custrecord_drop_location',
                    operator: search.Operator.CONTAINS,
                    values: dropLocationValue
                }));
            }
        }

        // Add the Status filter to the filters array
        if (request && request.parameters.custpage_status_filter) {
            var statusValue = request.parameters.custpage_status_filter.trim();
            if (statusValue) {
                filters.push(search.createFilter({
                    name: 'custrecord_status',
                    operator: search.Operator.ANYOF,
                    values: statusValue
                }));
            }
        }

        var searchResults = search.create({
        type: 'customrecord_my_sales_data',
        filters: filters, // Apply filters if provided
        columns: [
            { name: 'internalid' },
            { name: 'custrecord_customer' },
            { name: 'custrecord_pu_location' },
            { name: 'custrecord_drop_location' },
            { name: 'custrecord_miles' },
            { name: 'custrecord_amount' },
            { name: 'custrecord_target_rate' },
            { name: 'custrecord_commodity' },
            { name: 'custrecord_pu_timeline' },
            { name: 'custrecord_drop_timeline' },
            { name: 'custrecord_status', sort: search.Sort.ASC }, // Sorting by Status
            { name: 'custrecord_update' },
            { name: 'custrecord_po_number' },
            { name: 'custrecord_appointment' },
            { name: 'custrecord_load_order' },
            { name: 'custrecord_files' }
        ]
        }).run().getRange({
        start: 0,
        end: 100
        });

        for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];

            setSublistValueSafe(sublist, 'custpage_record_id', i, result.getValue('internalid'));
            setSublistValueSafe(sublist, 'custpage_customer', i, result.getValue('custrecord_customer'));
            setSublistValueSafe(sublist, 'custpage_pu_location', i, result.getValue('custrecord_pu_location'));
            setSublistValueSafe(sublist, 'custpage_drop_location', i, result.getValue('custrecord_drop_location'));
            setSublistValueSafe(sublist, 'custpage_miles', i, result.getValue('custrecord_miles'));
            setSublistValueSafe(sublist, 'custpage_amount', i, result.getValue('custrecord_amount'));
            setSublistValueSafe(sublist, 'custpage_target_rate', i, result.getValue('custrecord_target_rate'));
            setSublistValueSafe(sublist, 'custpage_commodity', i, result.getValue('custrecord_commodity'));
            setSublistValueSafe(sublist, 'custpage_pu_timeline', i, result.getValue('custrecord_pu_timeline'));
            setSublistValueSafe(sublist, 'custpage_drop_timeline', i, result.getValue('custrecord_drop_timeline'));
            setSublistValueSafe(sublist, 'custpage_status', i, result.getValue('custrecord_status'));
            setSublistValueSafe(sublist, 'custpage_update', i, result.getValue('custrecord_update'));
            setSublistValueSafe(sublist, 'custpage_po_number', i, result.getValue('custrecord_po_number'));
            setSublistValueSafe(sublist, 'custpage_appointment', i, result.getValue('custrecord_appointment'));
            setSublistValueSafe(sublist, 'custpage_load_order', i, result.getValue('custrecord_load_order'));

            var loadOrderValue = result.getText('custrecord_load_order');
            if (loadOrderValue) {
                var displayText = loadOrderValue;
                var fileId = result.getValue('custrecord_files');
                if (fileId) {
                    displayText += ' (File Attached)';
                }
                salesOrderField.addSelectOption({ value: result.getValue('custrecord_load_order'), text: displayText });
            }

            if (fileId) {
                var fileObj = file.load({ id: fileId });
                var fileUrl = fileObj.url;

                documentSelectField.addSelectOption({
                    value: fileUrl,
                    text: loadOrderValue + ' (File Attached)'
                });
            }
        }

        form.clientScriptFileId = 130699; // Update with your actual Client Script ID

        // Only add the "Save Changes and Create Sales Orders" button if no filters are applied
        if (!request.parameters.custpage_load_order_filter &&
            !request.parameters.custpage_pu_location_filter &&
            !request.parameters.custpage_drop_location_filter) {
            form.addSubmitButton({ label: 'Save Changes and Create Sales Orders' });
        }

        return form;
    }

    function saveRecords(request) {
        try {
            var lineCount = request.getLineCount({ group: 'custpage_sales_list' });
            var existingRecordIds = {};
            var selectedSalesOrder = request.parameters.custpage_sales_order;
            var uploadedFile = request.files['custpage_file_upload'];

            for (var i = 0; i < lineCount; i++) {
                var recordId = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_record_id', line: i });
                var customer = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_customer', line: i });
                var puLocation = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_pu_location', line: i });
                var dropLocation = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_drop_location', line: i });
                var miles = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_miles', line: i });
                var amount = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_amount', line: i });
                var targetRate = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_target_rate', line: i });
                var commodity = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_commodity', line: i });
                var puTimeline = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_pu_timeline', line: i });
                var dropTimeline = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_drop_timeline', line: i });
                var status = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_status', line: i });
                var update = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_update', line: i });
                var poNumber = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_po_number', line: i });
                var appointment = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_appointment', line: i });
                var loadOrder = request.getSublistValue({ group: 'custpage_sales_list', name: 'custpage_load_order', line: i });

                try {
                    var rec;
                    if (recordId) {
                        rec = record.load({ type: 'customrecord_my_sales_data', id: recordId, isDynamic: true });
                        existingRecordIds[recordId] = true;
                    } else {
                        rec = record.create({ type: 'customrecord_my_sales_data', isDynamic: true });
                    }

                    // Set fields on the custom record
                    rec.setValue({ fieldId: 'custrecord_customer', value: customer });
                    rec.setValue({ fieldId: 'custrecord_pu_location', value: puLocation });
                    rec.setValue({ fieldId: 'custrecord_drop_location', value: dropLocation });
                    rec.setValue({ fieldId: 'custrecord_miles', value: miles });
                    rec.setValue({ fieldId: 'custrecord_amount', value: amount });
                    rec.setValue({ fieldId: 'custrecord_target_rate', value: targetRate });
                    rec.setValue({ fieldId: 'custrecord_commodity', value: commodity });
                    rec.setValue({ fieldId: 'custrecord_pu_timeline', value: puTimeline });
                    rec.setValue({ fieldId: 'custrecord_drop_timeline', value: dropTimeline });
                    rec.setValue({ fieldId: 'custrecord_status', value: status });
                    rec.setValue({ fieldId: 'custrecord_update', value: update });
                    rec.setValue({ fieldId: 'custrecord_po_number', value: poNumber });
                    rec.setValue({ fieldId: 'custrecord_appointment', value: appointment });
                    rec.setValue({ fieldId: 'custrecord_load_order', value: loadOrder });

                    // Handle file upload and attach only to the selected Sales Order
                    if (uploadedFile && loadOrder === selectedSalesOrder) {
                        var fileObj = file.create({
                            name: uploadedFile.name,
                            fileType: uploadedFile.fileType,
                            contents: uploadedFile.getContents(),
                            folder: 123 // Change to your target folder ID
                        });

                        var fileId = fileObj.save();
                        rec.setValue({ fieldId: 'custrecord_files', value: fileId });

                        // Link the file to the selected sales order
                        record.attach({
                            record: {
                                type: 'file',
                                id: fileId
                            },
                            to: {
                                type: record.Type.SALES_ORDER,
                                id: selectedSalesOrder
                            }
                        });
                    }

                    var salesOrder;
                    if (loadOrder) {
                        salesOrder = record.load({ type: record.Type.SALES_ORDER, id: loadOrder, isDynamic: true });
                    } else {
                        salesOrder = record.create({
                            type: record.Type.SALES_ORDER,
                            isDynamic: true
                        });
                    }

                    salesOrder.setValue('entity', customer);
                    salesOrder.setValue('otherrefnum', poNumber);
                    salesOrder.setValue('custbody10', status || 1);

                    // Get the current employee's department
                    var employeeId = runtime.getCurrentUser().id;
                    var employeeRecord = record.load({
                        type: record.Type.EMPLOYEE,
                        id: employeeId
                    });
                    var employeeDepartment = employeeRecord.getValue('department');

                    // Set the department on the Sales Order
                    salesOrder.setValue('department', employeeDepartment);

                    // Set the custom record ID in the hidden field on the sales order
                    salesOrder.setValue({
                        fieldId: 'custbody_monday_sales_data_id',
                        value: rec.id
                    });

                    if (!loadOrder) {
                        salesOrder.selectNewLine('item');
                        salesOrder.setCurrentSublistValue('item', 'item', 23);
                        salesOrder.setCurrentSublistValue('item', 'quantity', 1);
                        salesOrder.setCurrentSublistValue('item', 'rate', amount);
                        salesOrder.setCurrentSublistValue('item', 'custcol_commodity', commodity);
                        salesOrder.commitLine('item');
                    }

                    var salesOrderId = salesOrder.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

                    rec.setValue({
                        fieldId: 'custrecord_load_order',
                        value: salesOrderId
                    });

                    var salesOrderStatus = salesOrder.getValue('custbody10');
                    rec.setValue({
                        fieldId: 'custrecord_status',
                        value: salesOrderStatus
                    });

                    var savedRecordId = rec.save({ enableSourcing: false, ignoreMandatoryFields: true });
                    existingRecordIds[savedRecordId] = true;

                    if (status !== salesOrderStatus) {
                        record.submitFields({
                            type: record.Type.SALES_ORDER,
                            id: salesOrderId,
                            values: { 'custbody10': status },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                    }
                } catch (e) {
                    if (e.name === 'RCRD_DSNT_EXIST' || e.name === 'CUSTOM_RECORD_COLLISION') {
                        // Log a warning but continue processing other records
                        log.audit('Record Skipped', 'Record with ID ' + recordId + ' was skipped because it was deleted or modified by another user.');
                        continue; // Skip processing this record and move to the next
                    } else {
                        throw e; // Re-throw any other error
                    }
                }
            }

            deleteRemovedRecords(existingRecordIds);
        } catch (e) {
            log.error('Error in saveRecords', e);
            throw e;
        }
    } 

    function deleteRemovedRecords(existingRecordIds) {
        try {
            var searchResults = search.create({
                type: 'customrecord_my_sales_data',
                columns: ['internalid', 'custrecord_load_order']
            }).run().getRange({
                start: 0,
                end: 1000
            });

            searchResults.forEach(function(result) {
                var recordId = result.getValue('internalid');
                var salesOrderId = result.getValue('custrecord_load_order');

                if (!existingRecordIds[recordId]) {
                    if (salesOrderId) {
                        record.delete({
                            type: record.Type.SALES_ORDER,
                            id: salesOrderId
                        });
                    }

                    record.delete({
                        type: 'customrecord_my_sales_data',
                        id: recordId
                    });
                }
            });
        } catch (e) {
            log.error('Error in deleteRemovedRecords', e);
            throw e;
        }
    }

    function setSublistValueSafe(sublist, fieldId, line, value) {
        try {
            if (value !== null && value !== undefined && value !== '') {
                sublist.setSublistValue({
                    id: fieldId,
                    line: line,
                    value: value
                });
            }
        } catch (e) {
            log.error('Error in setSublistValueSafe', e);
            throw e;
        }
    }

    return { onRequest: onRequest };
});
