/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/record'], function(record) {

    var sortOrder = {}; // Store the sort order for each column

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        console.log('context.fieldId', context.fieldId)
        if (context.fieldId === 'custpage_document_selector') {
            var documentUrl = currentRecord.getValue('custpage_document_selector');

            if (documentUrl) {
                currentRecord.setValue({
                    fieldId: 'custpage_document_display',
                    value: '<a href="' + documentUrl + '" target="_blank">Open File</a>'
                });
            } else {
                currentRecord.setValue({
                    fieldId: 'custpage_document_display',
                    value: 'No document selected'
                });
            }
        }

        if (context.fieldId === 'custpage_pu_location') {
            var customRecordId = currentRecord.getCurrentSublistValue({
                sublistId: 'custpage_sales_list',
                fieldId: 'custpage_record_id'
            });
            if (customRecordId){
                var sublistValue = currentRecord.getCurrentSublistValue({
                    sublistId: 'custpage_sales_list',
                    fieldId: context.fieldId
                });
                let recId = record.submitFields({
                    type: 'customrecord_my_sales_data',
                    id: customRecordId,
                    values: {
                        [context.fieldId]: sublistValue
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                })
                console.log('recId', recId)
            }
        }
    }

    function onSearch() {
        // Disable the onbeforeunload event to prevent the popup
        window.onbeforeunload = null;

        var loadOrder = nlapiGetFieldValue('custpage_load_order_filter');
        var puLocation = nlapiGetFieldValue('custpage_pu_location_filter');
        var dropLocation = nlapiGetFieldValue('custpage_drop_location_filter');

        var url = nlapiResolveURL('SUITELET', 'customscript_monday_dashboard', 'customdeploy_monday_dash');

        // Include the filter parameters in the URL only if they have values
        if (loadOrder && loadOrder.trim()) {
            url += '&custpage_load_order_filter=' + encodeURIComponent(loadOrder.trim());
        }
        if (puLocation && puLocation.trim()) {
            url += '&custpage_pu_location_filter=' + encodeURIComponent(puLocation.trim());
        }
        if (dropLocation && dropLocation.trim()) {
            url += '&custpage_drop_location_filter=' + encodeURIComponent(dropLocation.trim());
        }

        // Disable the "Save Changes" button since a filter is applied
        disableSaveButton();

        window.location.href = url;
    }

    function onClearFilters() {
        // Disable the onbeforeunload event to prevent the popup
        window.onbeforeunload = null;

        var url = nlapiResolveURL('SUITELET', 'customscript_monday_dashboard', 'customdeploy_monday_dash');

        // Re-enable the "Save Changes" button when filters are cleared
        enableSaveButton();

        window.location.href = url;
    }

    function handleEnterKey(event) {
        if (event.which === 13 || event.keyCode === 13) {
            event.preventDefault(); // Prevent the Enter key from triggering any action
        }
    }

    function disableSaveButton() {
        var saveButton = document.getElementById('custpage_save_button');
        if (saveButton) {
            saveButton.disabled = true;
        }
    }

    function enableSaveButton() {
        var saveButton = document.getElementById('custpage_save_button');
        if (saveButton) {
            saveButton.disabled = false;
        }
    }

    function pageInit(context) {
        var loadOrderFilterField = document.getElementById('custpage_load_order_filter');
        var puLocationFilterField = document.getElementById('custpage_pu_location_filter');
        var dropLocationFilterField = document.getElementById('custpage_drop_location_filter');

        if (loadOrderFilterField) {
            loadOrderFilterField.addEventListener('keydown', handleEnterKey);
        }
        if (puLocationFilterField) {
            puLocationFilterField.addEventListener('keydown', handleEnterKey);
        }
        if (dropLocationFilterField) {
            dropLocationFilterField.addEventListener('keydown', handleEnterKey);
        }

        addSortFunctionality(); // Initialize the sorting functionality
    }

    function addSortFunctionality() {
        var sublistTable = document.getElementById('custpage_sales_list_splits'); // Ensure this ID is correct

        if (sublistTable) {
            var headers = sublistTable.getElementsByTagName('th');

            for (var i = 0; i < headers.length; i++) {
                headers[i].style.cursor = 'pointer'; // Make header clickable
                headers[i].addEventListener('click', function() {
                    var columnIndex = this.cellIndex;
                    var order = sortOrder[columnIndex] === 'asc' ? 'desc' : 'asc';
                    sortSublist(columnIndex, order);
                    sortOrder[columnIndex] = order; // Toggle order
                });
            }
        }
    }

    function sortSublist(columnIndex, order) {
        var sublistTable = document.getElementById('custpage_sales_list_splits'); // Ensure this ID is correct

        var rows = Array.prototype.slice.call(sublistTable.getElementsByTagName('tr'), 1); // Get all rows except the header

        var sortedRows = rows.sort(function(a, b) {
            var aText = a.cells[columnIndex].innerText.trim();
            var bText = b.cells[columnIndex].innerText.trim();

            if (order === 'asc') {
                return aText.localeCompare(bText);
            } else {
                return bText.localeCompare(aText);
            }
        });

        // Reorder the table based on the sorted rows
        for (var i = 0; i < sortedRows.length; i++) {
            sublistTable.appendChild(sortedRows[i]);
        }
    }

    return {
        fieldChanged: fieldChanged,
        pageInit: pageInit,
        onSearch: onSearch,
        onClearFilters: onClearFilters
    };
});
