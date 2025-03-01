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
                    TRANSKEY: {
                        id: "custpage_page_transkey",
                        label: "PAGE TRANSKEY",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true,
                        isDisabled: true,
                        isHidden: true,
                    },
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
                    SO_FILE: {
                        id: "custpage_so_files",
                        label: "FILE CABINET",
                        type: "longtext",
                        hasDefault: true,
                        isInLine: true,
                    },
                    LENGTH_IN_FEET: {
                        id: "custpage_lenght_feet",
                        label: "LENGTH IN FEET",
                        type: "text",
                        container: 'custpage_tab_commodity',
                        hasDefault: true,
                    },
                    WIDTH_IN_FEET: {
                        id: "custpage_width_feet",
                        label: "WIDTH IN FEET",
                        type: "text",
                        container: 'custpage_tab_commodity',
                        hasDefault: true,
                    },
                    HEIGHT_IN_FEET: {
                        id: "custpage_height_feet",
                        label: "HEIGHT IN FEET",
                        type: "text",
                        container: 'custpage_tab_commodity',
                        hasDefault: true,
                    },
                    WEIGHT: {
                        id: "custpage_load_weight",
                        label: "WEIGHT",
                        type: 'text',
                        container: 'custpage_tab_commodity',
                        hasDefault: true,
                    },
                    UPDATE_MSD_DATA: {
                        id: "custpage_update_msd_data",
                        label: "UPDATE MSD DATA",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true,
                        isDisabled: true,
                        isHidden: true,
                    },
                    UPDATE_LOAD_ORDER_DATA: {
                        id: "custpage_update_load_order_data",
                        label: "UPDATE LOAD ORDER DATA",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true,
                        isDisabled: true,
                        isHidden: true,
                    },
                    UPDATE_LOAD_ORDER_LINE: {
                        id: "custpage_update_load_order_line",
                        label: "UPDATE LOAD ORDER LINE",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true,
                        isDisabled: true,
                        isHidden: true,
                    },
                    CREATE_SUB_ITEM_DATA: {
                        id: "custpage_create_sub_item_data",
                        label: "CREATE SUB ITEM DATA",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true,
                        isHidden: true,
                    },
                },
                buttons: {
                    SUBMIT: {
                        label: 'SAVE',
                        isCustom: false
                    },
                    CLOSE: {
                        label: 'CLOSE',
                        id: 'custpage_close_btn',
                        functionName: 'closeWindow()',
                        isCustom: true
                    },
                },
                sublistfieldsCommodity: {
                    SUB_REC_ID: {
                        id: "custpage_sub_rec_id",
                        label: "SUB REC ID",
                        type: 'text',
                        isHidden: true
                    },
                    COMMODITY: {
                        id: "custpage_commodity_sub",
                        label: "COMMODITY",
                        type: 'text',
                    },
                    REQUIREMENTS: {
                        id: "custpage_requirements",
                        label: "REQUIREMENTS",
                        type: 'text',
                    },
                    ADDITIONAL_DETAILS: {
                        id: "custpage_addtional_details",
                        label: "ADDITIONAL DETAILS",
                        type: 'text',
                    },
                    IS_UPDATED: {
                        id: "custpage_is_updated",
                        label: "IS UPDATED",
                        type: 'checkbox',
                        isDisabled: true,
                        isHidden: true
                    },
                },
                sublistfieldsLocation: {
                    PU_LOCATION: {
                        id: "custpage_pu_city_state",
                        label: "PU LOCATION",
                        type: 'textarea',
                        isEdit: true,
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_city_state",
                        label: "DROP LOCATION",
                        type: 'textarea',
                        isEdit: true,
                    },
                    PICK_UP_DATE: {
                        id: "custpage_pick_up_date",
                        label: "PICK UP DATE",
                        type: 'date',
                        isEdit: true,
                    },
                    PICK_UP_HOURS: {
                        id: "custpage_pick_up_hours",
                        label: "PICK UP HOURS",
                        type: 'TIMEOFDAY',
                        isEdit: true,
                    },
                    PU_APPOINTMENT: {
                        id: "custpage_pu_appointment",
                        label: "PU APPOINTMENT",
                        type: "select",
                        source: 'customlist843',
                        isEdit: true,
                    },
                    DROP_DATE: {
                        id: "custpage_drop_date",
                        label: "DROP DATE",
                        type: 'date',
                        isEdit: true,
                    },
                    DROP_HOURS: {
                        id: "custpage_drop_hours",
                        label: "DROP HOURS",
                        type: 'TIMEOFDAY',
                        isEdit: true,
                    },
                    DROP_APPOINTMENT: {
                        id: "custpage_drop_appointment",
                        label: "DROP APPOINTMENT",
                        type: "select",
                        source: 'customlist843',
                        isEdit: true,
                    },
                    APPOINTMENT_INFORMATION: {
                        id: "custpage_appointment_information",
                        label: "APPOINTMENT INFORMATION",
                        type: "text",
                        isEdit: true,
                    },
                },
                sublistfieldsLoadOrder: {
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
                        type: 'TEXTAREA',
                    },
                },
                sublistfieldsLoadOrderLine: {
                    ITEM: {
                        id: "custpage_item",
                        label: "ITEM",
                        type: 'select',
                        source: 'item',
                        isEdit: false,
                        isHidden: false,
                        isInLine: true,
                    },
                    ITEM_ID: {
                        id: "custpage_item_id",
                        label: "ITEM ID",
                        type: 'text',
                        isHidden: true,
                    },
                    LINE_UNIQUE_KEY: {
                        id: "custpage_lineuniquekey",
                        label: "LINE UNIQUE KEY",
                        type: 'text',
                        isHidden: true,
                    },
                    COMMODITY: {
                        id: "custpage_commodity",
                        label: "COMMODITY",
                        type: 'text',
                        isEdit: true,
                    },
                    AMOUNT: {
                        id: "custpage_line_amount",
                        label: "AMOUNT",
                        type: 'float',
                        isEdit: true,
                    },
                    CREATE_PO: {
                        id: "custpage_createpo",
                        label: "CREATE PO",
                        type: 'TEXTAREA',
                    },
                    PO_VENDOR: {
                        id: "custpage_povendor",
                        label: "PO VENDOR",
                        type: 'text',
                    },
                    CURRENCY: {
                        id: "custpage_pocurrency",
                        label: "CURRENCY",
                        type: 'text',
                    },
                    PO_RATE: {
                        id: "custpage_porate",
                        label: "PO RATE",
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
