/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/url', 'N/record'],
function(serverWidget, search, url, record) {
    function onRequest(context) {
        if (context.request.method === 'GET') {
            // Create the search form
            var form = serverWidget.createForm({
                title: 'Shipment Search',
                hideNavBar: true
            });

            // Add search fields
            form.addField({
                id: 'custpage_from_address',
                type: serverWidget.FieldType.TEXT,
                label: 'From Address'
            });

            form.addField({
                id: 'custpage_to_address',
                type: serverWidget.FieldType.TEXT,
                label: 'To Address'
            });

            form.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.SELECT,
                source: 'customer',
                label: 'Customer'
            });

            form.addField({
                id: 'custpage_pu_date',
                type: serverWidget.FieldType.DATE,
                label: 'PU Date'
            });

            form.addField({
                id: 'custpage_drop_date',
                type: serverWidget.FieldType.DATE,
                label: 'Drop Date'
            });


            // Define the statuses with their corresponding values for Load Order
            var loadOrderStatuses = [
                { text: '', value: '' },
                { text: 'Load Order:Pending Approval', value: 'SalesOrd:A' },
                { text: 'Load Order:Pending Fulfillment', value: 'SalesOrd:B' },
                { text: 'Load Order:Cancelled', value: 'SalesOrd:C' },
                { text: 'Load Order:Partially Fulfilled', value: 'SalesOrd:D' },
                { text: 'Load Order:Pending Billing/Partially Fulfilled', value: 'SalesOrd:E' },
                { text: 'Load Order:Pending Billing', value: 'SalesOrd:F' },
                { text: 'Load Order:Billed', value: 'SalesOrd:G' },
                { text: 'Load Order:Closed', value: 'SalesOrd:H' }
            ];

            // Add the SELECT field for Load Order Status
            var loadOrderField = form.addField({
                id: 'custpage_load_order_status',
                type: serverWidget.FieldType.SELECT,
                label: 'Load Order Status'
            });

            // Loop through the statuses and add them as options
            loadOrderStatuses.forEach(function(status) {
                loadOrderField.addSelectOption({
                    value: status.value, // Set the mapped value
                    text: status.text    // Set the mapped text
                });
            });


            // Define the statuses with their corresponding values for Load Confirmation
            var loadConfirmationStatuses = [
                { text: '', value: '' },
                { text: 'Load Confirmation:Pending Supervisor Approval', value: 'PurchOrd:A' },
                { text: 'Load Confirmation:Pending Receipt', value: 'PurchOrd:B' },
                { text: 'Load Confirmation:Rejected by Supervisor', value: 'PurchOrd:C' },
                { text: 'Load Confirmation:Partially Received', value: 'PurchOrd:D' },
                { text: 'Load Confirmation:Pending Billing/Partially Received', value: 'PurchOrd:E' },
                { text: 'Load Confirmation:Pending Bill', value: 'PurchOrd:F' },
                { text: 'Load Confirmation:Fully Billed', value: 'PurchOrd:G' },
                { text: 'Load Confirmation:Closed', value: 'PurchOrd:H' },
                { text: 'Load Confirmation:Planned', value: 'PurchOrd:P' }
            ];

            // Add the SELECT field
            var loadConfirmationField = form.addField({
                id: 'custpage_load_confirmation_status',
                type: serverWidget.FieldType.SELECT,
                label: 'Load Confirmation Status'
            });

            // Loop through the statuses and add them as options
            loadConfirmationStatuses.forEach(function(status) {
                loadConfirmationField.addSelectOption({
                    value: status.value, // Set the mapped value
                    text: status.text    // Set the mapped text
                });
            });

            // Add a submit button
            form.addSubmitButton({
                label: 'Search'
            });

            // Write the form to the response
            context.response.writePage(form);
        } else {
            log.debug('parameters', context.request.parameters)
            // Handle POST request: perform the search and display results

            // Retrieve search parameters from the request
            var fromAddress = context.request.parameters.custpage_from_address;
            var toAddress = context.request.parameters.custpage_to_address;
            var customer = context.request.parameters.custpage_customer;
            var puDate = context.request.parameters.custpage_pu_date;
            var dropDate = context.request.parameters.custpage_drop_date;
            var loadOrderStatus = context.request.parameters.custpage_load_order_status;
            var loadConfirmationStatus = context.request.parameters.custpage_load_confirmation_status;

            // Initialize search filters
            var searchFilters = [
                ['type', 'anyof', 'PurchOrd'], // Purchase Orders
                'AND',
                ['mainline', 'is', 'T'], // Only mainline records
                'AND',
                ['createdfrom.type', 'anyof', 'SalesOrd'] // POs created from Sales Orders
            ];

            // Add filters based on Sales Order fields via 'createdFrom' join
            if (fromAddress) {
                searchFilters.push('AND', ['createdfrom.custbody_pu_location', 'contains', fromAddress]);
            }
            if (toAddress) {
                searchFilters.push('AND', ['createdfrom.custbody_drop_location', 'contains', toAddress]);
            }
            if (customer) {
                searchFilters.push('AND', ['createdfrom.entity', 'anyof', customer]);
            }
            if (puDate) {
                searchFilters.push('AND', ['createdfrom.custbody19', 'on', puDate]); // PU Date
            }
            if (dropDate) {
                searchFilters.push('AND', ['createdfrom.custbody20', 'on', dropDate]); // Drop Date
            }
            if (loadOrderStatus) {
                searchFilters.push('AND', ['createdfrom.status', 'anyof', loadOrderStatus]);
            }
            if (loadConfirmationStatus) {
                searchFilters.push('AND', ['status', 'anyof', loadConfirmationStatus]);
            }

            // Define search columns without grouping or summary functions
            var searchColumns = [
                search.createColumn({ name: 'internalid' }), // PO Internal ID
                search.createColumn({ name: 'tranid' }), // PO Transaction ID
                search.createColumn({ name: 'entity' }), // PO Vendor (Entity ID)
                search.createColumn({ name: 'companyname', join: 'vendor' }), // Vendor Company Name
                search.createColumn({ name: 'status' }), // PO Status
                search.createColumn({ name: 'total' }), // PO Total Amount

                // Sales Order Fields via 'createdFrom' join
                search.createColumn({ name: 'tranid', join: 'createdFrom' }), // SO Document Number
                search.createColumn({ name: 'internalid', join: 'createdFrom' }), // SO Transaction ID
                search.createColumn({ name: 'entity', join: 'createdFrom' }), // SO Customer
                search.createColumn({ name: 'total', join: 'createdFrom' }), // SO Total Amount
                search.createColumn({ name: 'custbody_pu_location', join: 'createdFrom' }),
                search.createColumn({ name: 'custbody_drop_location', join: 'createdFrom' }),
                search.createColumn({ name: 'custbody_load_detailsgeorge', join: 'createdFrom' }),
                search.createColumn({ name: 'custbody_lenght_feet', join: 'createdFrom' }),
                search.createColumn({ name: 'custbody_load_weight', join: 'createdFrom' }),
                search.createColumn({ name: 'custbody19', join: 'createdFrom' }), // PU Date
                search.createColumn({ name: 'custbody20', join: 'createdFrom' }), // Drop Date
                search.createColumn({ name: 'custbody_trailer_type', join: 'createdFrom' }), // Trailer Type
                search.createColumn({ name: 'status', join: 'createdFrom' }), // SO Status
            ];

            // Create the search
            var shipmentSearch = search.create({
                type: search.Type.PURCHASE_ORDER,
                filters: searchFilters,
                columns: searchColumns
            });

            // Run the search
            var resultSet = shipmentSearch.run();

            // Create the results form
            var form = serverWidget.createForm({
                title: 'Shipment Search Results',
                hideNavBar: true
            });

            // Add a sublist to display results
            var sublist = form.addSublist({
                id: 'custpage_results',
                type: serverWidget.SublistType.LIST,
                label: 'Results'
            });

            // Define sublist fields
            sublist.addField({
                id: 'custpage_po_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'PO Transaction ID'
            });

            sublist.addField({
                id: 'custpage_view_po',
                type: serverWidget.FieldType.URL,
                label: 'View PO'
            }).linkText = 'View PO';

            // Added Vendor Company Name field
            sublist.addField({
                id: 'custpage_vendor_company',
                type: serverWidget.FieldType.TEXT,
                label: 'Vendor Company Name'
            });

            sublist.addField({
                id: 'custpage_so_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'SO Transaction ID'
            });

            sublist.addField({
                id: 'custpage_view_so',
                type: serverWidget.FieldType.URL,
                label: 'View SO'
            }).linkText = 'View SO';

            sublist.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.TEXT,
                label: 'Customer'
            });

            sublist.addField({
                id: 'custpage_order_status',
                type: serverWidget.FieldType.TEXT,
                label: 'SO Status'
            });

            sublist.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.TEXT,
                label: 'PO Status'
            });

            sublist.addField({
                id: 'custpage_from_address',
                type: serverWidget.FieldType.TEXT,
                label: 'From Address'
            });

            sublist.addField({
                id: 'custpage_to_address',
                type: serverWidget.FieldType.TEXT,
                label: 'To Address'
            });

            sublist.addField({
                id: 'custpage_po_amount',
                type: serverWidget.FieldType.CURRENCY,
                label: 'PO Amount'
            });

            sublist.addField({
                id: 'custpage_so_total',
                type: serverWidget.FieldType.CURRENCY,
                label: 'SO Total Amount'
            });

            sublist.addField({
                id: 'custpage_trailer_type',
                type: serverWidget.FieldType.TEXT,
                label: 'Trailer Type'
            });

            sublist.addField({
                id: 'custpage_load_detailsgeorge',
                type: serverWidget.FieldType.TEXT,
                label: 'Load Details'
            });

            sublist.addField({
                id: 'custpage_length_feet',
                type: serverWidget.FieldType.TEXT,
                label: 'Length (Feet)'
            });

            sublist.addField({
                id: 'custpage_load_weight',
                type: serverWidget.FieldType.TEXT,
                label: 'Load Weight'
            });

            sublist.addField({
                id: 'custpage_pu_date',
                type: serverWidget.FieldType.DATE,
                label: 'PU Date'
            });

            sublist.addField({
                id: 'custpage_drop_date',
                type: serverWidget.FieldType.DATE,
                label: 'Drop Date'
            });

            // Populate the sublist with search results
            var i = 0;
            resultSet.each(function(result) {
                log.debug('POST result', result)

                // Set PO Transaction ID
                var poTranId = result.getValue({ name: 'tranid' });
                setSublistValueSafe(sublist, 'custpage_po_tranid', i, poTranId);

                // Construct URL for Purchase Order
                var poInternalId = result.getValue({ name: 'internalid' });
                var poUrl = url.resolveRecord({
                    recordType: record.Type.PURCHASE_ORDER,
                    recordId: poInternalId,
                    isEdit: false
                });
                setSublistValueSafe(sublist, 'custpage_view_po', i, poUrl);

                // Set Vendor Company Name
                var vendorCompanyName = result.getValue({ name: 'companyname', join: 'vendor' });
                setSublistValueSafe(sublist, 'custpage_vendor_company', i, vendorCompanyName);

                // Set SO Transaction ID
                var soTranId = result.getValue({ name: 'tranid', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_so_tranid', i, soTranId);

                // Construct URL for Sales Order
                var soInternalId = result.getValue({ name: 'internalid', join: 'createdFrom' });
                var soUrl = url.resolveRecord({
                    recordType: record.Type.SALES_ORDER,
                    recordId: soInternalId,
                    isEdit: false
                });
                setSublistValueSafe(sublist, 'custpage_view_so', i, soUrl);

                // Set Customer
                var customerName = result.getText({ name: 'entity', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_customer', i, customerName);

                // Set SO Status
                var orderStatus = result.getText({ name: 'status', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_order_status', i, orderStatus);

                // Set PO Status
                var status = result.getText({ name: 'status' });
                setSublistValueSafe(sublist, 'custpage_status', i, status);

                // Set From Address
                var fromAddr = result.getValue({ name: 'custbody_pu_location', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_from_address', i, fromAddr);

                // Set To Address
                var toAddr = result.getValue({ name: 'custbody_drop_location', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_to_address', i, toAddr);

                // Set PO Amount
                var poAmount = result.getValue({ name: 'total' });
                setSublistValueSafe(sublist, 'custpage_po_amount', i, poAmount);

                // Set SO Total Amount
                var soTotalAmount = result.getValue({ name: 'total', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_so_total', i, soTotalAmount);

                // Set Trailer Type
                var trailerType = result.getText({ name: 'custbody_trailer_type', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_trailer_type', i, trailerType);

                // Set Load Details
                var loadDetails = result.getValue({ name: 'custbody_load_detailsgeorge', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_load_detailsgeorge', i, loadDetails);

                // Set Length (Feet)
                var lengthFeet = result.getValue({ name: 'custbody_lenght_feet', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_length_feet', i, lengthFeet);

                // Set Load Weight
                var loadWeight = result.getValue({ name: 'custbody_load_weight', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_load_weight', i, loadWeight);

                // Set PU Date
                var puDateVal = result.getValue({ name: 'custbody19', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_pu_date', i, puDateVal);

                // Set Drop Date
                var dropDateVal = result.getValue({ name: 'custbody20', join: 'createdFrom' });
                setSublistValueSafe(sublist, 'custpage_drop_date', i, dropDateVal);

                i++;
                return true; // Continue iterating
            });

            // Add a back button to return to the search form
            // form.addButton({
            //     id: 'custpage_back',
            //     label: 'Back',
            //     functionName: 'history.back()'
            // });

            form.clientScriptFileId = 185351; // shipment_search_export_mod_cs.js

            form.addButton({
                id: 'custpage_csv_export',
                label: 'CSV Export',
                functionName: 'exportCSV'
            });

            // Write the results form to the response
            context.response.writePage(form);
        }


        function setSublistValueSafe(sublist, id, line, value) {
            if (value !== null && value !== undefined && value !== '') {
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value.toString()
                });
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
