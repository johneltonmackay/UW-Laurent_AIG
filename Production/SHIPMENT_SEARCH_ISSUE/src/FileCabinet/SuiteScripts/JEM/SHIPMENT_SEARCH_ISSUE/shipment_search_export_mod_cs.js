/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord'],
/**
 * @param{currentRecord} currentRecord
 */
function(currentRecord) {
    
    const pageInit = (scriptContext) => {
        console.log('Shipment Search: Page Fully Loaded.');
    }

    const exportCSV = (scriptContext) => {
        try {         
            let currRec = currentRecord.get()
            let lineCount = currRec.getLineCount({ sublistId: 'custpage_results' });

            const mapping = fieldMapping();
            const fields = Object.keys(mapping.sublistfields);

            let csvHeader = ""; 

            fields.forEach(field => {
                const { text } = mapping.sublistfields[field];
                csvHeader += `${text},`; 
            });

            // Remove the last comma and add a newline at the end of the header
            csvHeader = csvHeader.slice(0, -1) + "\n"; 

            let csvContent = csvHeader; 

            for (let i = 0; i < lineCount; i++) {
                let columnValues = [];
                for (var strKey in mapping.sublistfields) {
                    let fieldInfo = mapping.sublistfields[strKey];
                    let columnValue = currRec.getSublistValue({
                        sublistId: 'custpage_results',
                        fieldId: fieldInfo.id,
                        line: i
                    });

                    columnValues.push(columnValue);
                }

                csvContent += columnValues.map(value => 
                    typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                ).join(',') + '\n';
            }

            let blob = new Blob([csvContent], { type: 'text/csv' });
            let url = URL.createObjectURL(blob);
            
            let a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Shipment_Search.csv';
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.log('Error: exportCSV', error.message)
        }
    }

    const fieldMapping = () => {
        return {
            sublistfields: {
                TRANS_ID: {
                    id: "custpage_po_tranid",
                    text: "PO Transaction ID"
                },
                VIEW_PO: {
                    id: "custpage_view_po",
                    text: "View PO"
                },
                VENDOR_COMPANY: {
                    id: "custpage_vendor_company",
                    text: "Vendor Company Name"
                },
                SO_TRANS_ID: {
                    id: "custpage_so_tranid",
                    text: "SO Transaction ID"
                },
                VIEW_SO: {
                    id: "custpage_view_so",
                    text: "View SO"
                },
                CUSTOMER: {
                    id: "custpage_customer",
                    text: "Customer"
                },
                ORDER_STATUS: {
                    id: "custpage_order_status",
                    text: "SO Status"
                },
                STATUS: {
                    id: "custpage_status",
                    text: "PO Status"
                },
                FROM_ADDRESS: {
                    id: "custpage_from_address",
                    text: "From Address"
                },
                TO_ADDRESS: {
                    id: "custpage_to_address",
                    text: "To Address"
                },
                PO_AMOUNT: {
                    id: "custpage_po_amount",
                    text: "PO Amount"
                },
                SO_TOTAL: {
                    id: "custpage_so_total",
                    text: "SO Total Amount"
                },
                TRAILER_TYPE: {
                    id: "custpage_trailer_type",
                    text: "Trailer Type"
                },
                LOAD_DETAILS: {
                    id: "custpage_load_detailsgeorge",
                    text: "Load Details"
                },
                LENGTH_FEET: {
                    id: "custpage_length_feet",
                    text: "Length (Feet)"
                },
                LOAD_WEIGHT: {
                    id: "custpage_load_weight",
                    text: "Load Weight"
                },
                PU_DATE: {
                    id: "custpage_pu_date",
                    text: "PU Date"
                },
                DROP_DATE: {
                    id: "custpage_drop_date",
                    text: "Drop Date"
                },
            }
        };
    };
    
    return {
        pageInit: pageInit,
        exportCSV: exportCSV,
    };
    
});
