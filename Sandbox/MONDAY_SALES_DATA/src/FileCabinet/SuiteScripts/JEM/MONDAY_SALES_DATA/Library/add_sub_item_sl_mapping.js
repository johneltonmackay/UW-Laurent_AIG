/**
 * @NApiVersion 2.1
 */
define([],
    
    () => {

        const SUITELET = {
            scriptid: 'customscript_add_sub_item_main_page_sl',
            deploymentid: 'customdeploy_add_sub_item_main_page_sl',
            form: {
                title: "Monday Sales Data: SUB ITEM",
                fields: {
                    MONDAY_SALES_ID: {
                        id: "custpage_monday_parent_id",
                        type: "SELECT",
                        label: "MONDAY SALES ID",
                        source: 'customrecord_my_sales_data',
                        hasDefault: true
                    },
                    SO_NUMBER: {
                        id: "custpage_so_number",
                        label: "SO NUMBER",
                        type: "SELECT",
                        source: 'salesorder',
                        hasDefault: true
                    },
                    CUSTOMER_NAME: {
                        id: "custpage_customer_name",
                        label: "CUSTOMER NAME",
                        type: "MULTISELECT",
                        source: 'customer',
                        hasDefault: true
                    },
                    FROM: {
                        id: "custpage_from",
                        label: "FROM",
                        type: "TEXT",
                        hasDefault: true
                    },
                    TO: {
                        id: "custpage_to",
                        label: "TO",
                        type: "TEXT",
                        hasDefault: true
                    },
                    AMOUNT: {
                        id: "custpage_amount",
                        label: "AMOUNT",
                        type: "text",
                        hasDefault: true
                    },
                    TARGET_RATE: {
                        id: "custpage_target_rate",
                        label: "TARGET RATE",
                        type: "text",
                        hasDefault: true
                    },
                    TENDER_FILE: {
                        id: "custpage_tender_files",
                        label: "TENDER FILE",
                        type: "text",
                        hasDefault: true,
                        isInLine: true
                    },
                    OTHER_FILE: {
                        id: "custpage_other_files",
                        label: "OTHER FILE",
                        type: "text",
                        hasDefault: true,
                        isInLine: true
                    },
                    
                    SUB_ITEM_DATA: {
                        id: "custpage_sub_item_data",
                        label: "SUB ITEM DATA",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true
                    },
                },
                buttons: {
                    SUBMIT: {
                        label: 'SAVE',
                    },
                },
                sublistfields: {
                    COMMODITY: {
                        id: "custpage_commodity",
                        label: "COMMODITY",
                        type: 'text',
                    },
                    DIMS: {
                        id: "custpage_dims",
                        label: "DIMS",
                        type: 'text',
                    },
                    WEIGHT: {
                        id: "custpage_weight",
                        label: "WEIGHT",
                        type: 'text',
                    },
                    REQUIREMENTS: {
                        id: "custpage_requirements",
                        label: "REQUIREMENTS",
                        type: 'text',
                    },
                    ADDITIONAL_DETAILS: {
                        id: "custpage_addtional_details",
                        label: "ADDITIONAL_DETAILS",
                        type: 'text',
                    },
                },
                sublistfields2nd: {
                    PU_LOCATION: {
                        id: "custpage_pu_location",
                        label: "PU LOCATION",
                        type: 'text',
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location",
                        label: "DROP LOCATION",
                        type: 'text',
                    },
                    PICK_UP_DATE: {
                        id: "custpage_pick_up_date",
                        label: "PICK UP DATE",
                        type: 'text',
                    },
                    PICK_UP_HOURS: {
                        id: "custpage_pick_up_hours",
                        label: "PICK UP HOURS",
                        type: 'text',
                    },
                    DROP_DATE: {
                        id: "custpage_drop_date",
                        label: "DROP DATE",
                        type: 'text',
                    },
                    DROP_HOURS: {
                        id: "custpage_drop_hours",
                        label: "DROP HOURS",
                        type: 'text',
                    },
                },
                sublistfields3rd: {
                    BOOK_CARRIER: {
                        id: "custpage_book_carrier",
                        label: "BOOK CARRIER",
                        type: 'text',
                    },
                    DRIVER_NAME: {
                        id: "custpage_driver_name",
                        label: "DRIVER NAME",
                        type: 'text',
                    },
                    DRIVE_NUMBER: {
                        id: "custpage_driver_number",
                        label: "DRIVE NUMBER",
                        type: 'text',
                    },
                    DISPATCH_NAME: {
                        id: "custpage_dispatch_name",
                        label: "DISPATCH NAME",
                        type: 'text',
                    },
                    DISPATCH_NUMBER: {
                        id: "custpage_dispatch_number",
                        label: "DISPATCH NUMBER",
                        type: 'text',
                    },
                    LINKED_PO: {
                        id: "custpage_linked_po",
                        label: "LINKED PO",
                        type: 'text',
                    },
                },

                CS_PATH: '../CS/add_sub_item_cs.js',
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
