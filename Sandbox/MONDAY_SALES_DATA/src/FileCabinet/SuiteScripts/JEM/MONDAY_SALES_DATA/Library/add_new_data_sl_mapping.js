/**
 * @NApiVersion 2.1
 */
define([],
    
    () => {

        const SUITELET = {
            scriptid: 'customscript_msd_add_new_data_sl',
            deploymentid: 'customdeploy_msd_add_new_data_sl',
            form: {
                title: "Monday Sales Data: Add New Data",
                fields: {
                    PU_LOCATION: {
                        id: "custpage_pu_location",
                        type: "TEXT",
                        label: "PU LOCATION",
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location",
                        type: "TEXT",
                        label: "DROP LOCATION",
                    },
                    STATUS: {
                        id: "custpage_status",
                        type: "MULTISELECT",
                        label: "STATUS:",
                        source: 'customlist787'
                    },
                    CUSTOMER_NAME: {
                        id: "custpage_customer",
                        label: "CUSTOMER NAME",
                        type: 'SELECT',
                        source: 'customer'
                    },
                    PU_LOCATION: {
                        id: "custpage_pu_location",
                        label: "PU LOCATION",
                        type: 'text',
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location",
                        label: "DROP LOCATION",
                        type: "text",
                    },
                    MILES: {
                        id: "custpage_miles",
                        label: "MILES",
                        type: "text",
                    },
                    PU_TIMELINE: {
                        id: "custpage_pu_timeline",
                        label: "PU TIMELINE",
                        type: "text",
                    },
                    DROP_TIMELINE: {
                        id: "custpage_drop_timeline",
                        label: "DROP TIMELINE",
                        type: "text",
                    },
                    UPDATE: {
                        id: "custpage_update",
                        label: "UPDATE",
                        type: "text",
                    },
                    PO_NUMER: {
                        id: "custpage_po_number",
                        label: "PO NUMER",
                        type: "text",
                    },
                    APPOINTMENT: {
                        id: "custpage_appointment",
                        label: "APPOINTMENT",
                        type: "text",
                    },
                    TENDER_FILE_ATTACHMENT: {
                        id: "custpage_tender_files",
                        label: "TENDER",
                        type: "file",
                    },
                    OTHER_FILE_ATTACHMENT: {
                        id: "custpage_other_files",
                        label: "OTHER FILES",
                        type: "file",
                    },
                    SO_DATA: {
                        id: "custpage_so_data",
                        label: "SO DATA",
                        type: "longtext",
                    },
                    NOTES: {
                        id: "custpage_notes",
                        label: "NOTES",
                        type: "longtext",
                    },
                },
                buttons: {
                    SUBMIT: {
                        label: 'SAVE',
                    },
                },
                sublistfields: {
                    ITEM_ID: {
                        id: "custpage_item",
                        label: "ITEM",
                        type: 'SELECT',
                        source: 'item'
                    },
                    AMOUNT: {
                        id: "custpage_amount",
                        label: "AMOUNT",
                        type: 'text',
                    },
                    COMMODITY: {
                        id: "custpage_commodity",
                        label: "COMMODITY",
                        type: 'text',
                    },
                },

                CS_PATH: '../CS/add_new_data_cs.js',
            },
        }

        const NOTIFICATION = {
            REQUIRED: {
                title: 'REQUIRED FIELDS MISSING',
                message: "Kindly ensure all mandatory fields are completed before proceeding with the preview."
            },
        }

        return { SUITELET, NOTIFICATION }

    });
