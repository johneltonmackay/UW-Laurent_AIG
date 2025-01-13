/**
 * @NApiVersion 2.1
 */
define([],
    
    () => {

        const SUITELET = {
            scriptid: 'customscript_monday_sales_data_main_sl',
            deploymentid: 'customdeploy_monday_sales_data_main_sl',
            form: {
                title: "Monday Sales Data",
                fields: {
                    ACTIVE_TAB: {
                        id: "custpage_active_tab",
                        type: "SELECT",
                        label: "ACTIVE TAB",
                        isDisabled: true,
                        hasOptions: true,
                        arrOptions: [
                            { value: 'custpage_tab_load_orderlnk', text: 'Load Order' },
                            { value: 'custpage_tab_load_confirmationlnk', text: 'Load Confirmation' },
                        ],
                        container: 'custpage_field_group_filter'
                    },
                    PU_LOCATION: {
                        id: "custpage_pu_location",
                        type: "TEXT",
                        label: "PICK UP LOCATION",
                        container: 'custpage_field_group_filter'
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location",
                        type: "TEXT",
                        label: "DROP LOCATION",
                        container: 'custpage_field_group_filter'
                    },
                    SORT_BY: {
                        id: "custpage_sortby",
                        type: "SELECT",
                        label: "SORT BY:",
                        hasOptions: true,
                        arrOptions: [
                            { value: 'internalid', text: 'Record ID' },
                            { value: 'custrecord_customer', text: 'Customer' },
                            { value: 'custrecord_status', text: 'Status' },
                        ],
                        container: 'custpage_field_group_filter',
                    },
                    LOAD_ORDER: {
                        id: "custpage_load_order",
                        type: "MULTISELECT",
                        label: "LOAD ORDER",
                        source: 'salesorder',
                        container: 'custpage_field_group_filter_order'
                    },
                    CUSTOMER_ID: {
                        id: "custpage_customer_id",
                        type: "SELECT",
                        label: "CUSTOMER",
                        source: 'customer',
                        container: 'custpage_field_group_filter_order',
                    },
                    CUSTOMER_PO: {
                        id: "custpage_customer_po",
                        type: "TEXT",
                        label: "CUSTOMER PO",
                        container: 'custpage_field_group_filter_order'
                    },
                    LOAD_ORDER_STATUS: {
                        id: "custpage_status",
                        type: "MULTISELECT",
                        label: "LOAD ORDER STATUS:",
                        source: 'customlist787',
                        container: 'custpage_field_group_filter_order'
                    },
                    LOAD_CONFIRMATION: {
                        id: "custpage_load_confirmation",
                        type: "MULTISELECT",
                        label: "LOAD CONFIRMATION",
                        source: 'purchaseorder',
                        container: 'custpage_field_group_filter_confirmation'
                    },
                    VENDOR_ID: {
                        id: "custpage_vendor_id",
                        type: "SELECT",
                        label: "VENDOR",
                        source: 'vendor',
                        container: 'custpage_field_group_filter_confirmation',
                    },
                    LOAD_CONFIRMATION_STATUS: {
                        id: "custpage_status_lc",
                        type: "MULTISELECT",
                        label: "LOAD CONFIRMATION STATUS:",
                        source: 'customlist786',
                        container: 'custpage_field_group_filter_confirmation'
                    },
                },
                buttons: {
                    ADD_NEW: {
                        label: 'ADD NEW',
                        id: 'custpage_add_new_btn',
                        functionName: 'addNewSalesData()'
                    },
                    // FILTER_DATA: {
                    //     label: 'FILTER',
                    //     id: 'custpage_filter_btn',
                    //     functionName: 'searchItems()'
                    // },
                    REFRESH: {
                        label: 'REFRESH',
                        id: 'custpage_refresh_btn',
                        functionName: 'refreshPage()'
                    },
                },
                sublistfields: {
                    MONDAY_SALES_DATA_ID: {
                        id: "custpage_name",
                        label: "MONDAY SALES DATA ID",
                        type: 'text',
                        isEdit: false,
                        isHidden: true
                    },
                    ADD_SUB_REC: {
                        id: "custpage_chk_add_sub_rec",
                        label: "ADD SUB RECORD",
                        type: "checkbox",
                        isEdit: true,
                        isHidden: true
                    },
                    VIEW_SUB_REC: {
                        id: "custpage_view_sub_rec",
                        label: "View Sub Record",
                        type: "TEXTAREA",
                        isEdit: false,
                        isHidden: false
                    },
                    CUSTOMER_NAME: {
                        id: "custpage_customer",
                        label: "CUSTOMER NAME",
                        type: 'select',
                        isEdit: false,
                        isHidden: false,
                        source: 'customer',
                    },
                    PU_LOCATION: {
                        id: "custpage_pu_location",
                        label: "PU LOCATION",
                        type: 'text',
                        isEdit: true,
                        isHidden: false
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location",
                        label: "DROP LOCATION",
                        type: "text",
                        isEdit: true,
                        isHidden: false
                    },
                    MILES: {
                        id: "custpage_miles",
                        label: "MILES",
                        type: "text",
                        isEdit: true,
                        isHidden: false
                    },
                    NOTES: {
                        id: "custpage_notes",
                        label: "NOTES",
                        type: "textarea",
                        isEdit: true,
                        isHidden: true
                    },
                    AMOUNT: {
                        id: "custpage_amount",
                        label: "AMOUNT",
                        type: "text",
                        isEdit: true,
                        isHidden: false
                    },
                    TARGET_RATE: {
                        id: "custpage_target_rate",
                        label: "TARGETRATE",
                        type: "text",
                        isEdit: true,
                        isHidden: false
                    },
                    COMMODITY: {
                        id: "custpage_commodity",
                        label: "COMMODITY",
                        type: "text",
                        isEdit: true,
                        isHidden: false
                    },
                    CUSTOMER_PO_NUMBER: {
                        id: "custpage_po_number",
                        label: "CUSTOMER PO",
                        type: "text",
                        isEdit: true,
                        isHidden: false
                    },
                    PU_TIMELINE: {
                        id: "custpage_pu_timeline",
                        label: "PU TIMELINE",
                        type: "text",
                        isEdit: true,
                        isHidden: true
                    },
                    DROP_TIMELINE: {
                        id: "custpage_drop_timeline",
                        label: "DROP TIMELINE",
                        type: "text",
                        isEdit: true,
                        isHidden: true
                    },
                    STATUS: {
                        id: "custpage_status",
                        label: "STATUS",
                        type: "select",
                        isEdit: false,
                        source: 'customlist787',
                        isHidden: false
                    },
                    UPDATE: {
                        id: "custpage_update",
                        label: "UPDATE",
                        type: "text",
                        isEdit: true,
                        isHidden: true
                    },
                    APPOINTMENT: {
                        id: "custpage_appointment",
                        label: "APPOINTMENT",
                        type: "text",
                        isEdit: true,
                        isHidden: true
                    },
                    LOAD_ORDER: {
                        id: "custpage_load_order",
                        label: "LOAD ORDER",
                        type: "text",
                        isHidden: false
                    },
                    TENDER_FILE: {
                        id: "custpage_tender_files",
                        label: "TENDER FILES",
                        type: "text",
                        isHidden: true
                    },
                    TENDER_FILE_URL: {
                        id: "custpage_tender_files_url",
                        label: "TENDER FILES URL",
                        type: "text",
                        isHidden: true
                    },
                    OTHER_FILE: {
                        id: "custpage_other_files",
                        label: "OTHER FILES",
                        type: "text",
                        isHidden: true
                    },
                    TENDER_FILE_URL: {
                        id: "custpage_other_files_url",
                        label: "OTHER FILES URL",
                        type: "text",
                        isHidden: true
                    },
                    
                },
                sublistfields2nd: {
                    RECORD_ID: {
                        id: "custpage_rec_id",
                        label: "RECORD ID",
                        type: 'text',
                        isEdit: false
                    },
                    DOCUMENT_NUMBER: {
                        id: "custpage_doc_num",
                        label: "DOCUMENT NUMBER",
                        type: 'text',
                        isEdit: false,
                    },
                    DATE: {
                        id: "custpage_date",
                        label: "DATE",
                        type: 'text',
                        isEdit: false
                    },
                    NAME: {
                        id: "custpage_name",
                        label: "NAME",
                        type: "text",
                        isEdit: false
                    },
                    MEMO: {
                        id: "custpage_memo",
                        label: "MEMO",
                        type: "text",
                        isEdit: false
                    },
                    AMOUNT: {
                        id: "custpage_amount",
                        label: "AMOUNT",
                        type: "text",
                        isEdit: false
                    },
                    ORDER_STATUS: {
                        id: "custpage_order_status",
                        label: "ORDER STATUS",
                        type: "text",
                        isEdit: false
                    },
                    PICK_UP_LOCATION: {
                        id: "custpage_pu_location",
                        label: "PICK UP LOCATION",
                        type: "TEXTAREA",
                        isEdit: false
                    },
                },
                sublistfields3rd: {
                    RECORD_ID: {
                        id: "custpage_rec_id",
                        label: "RECORD ID",
                        type: 'text',
                        isEdit: false
                    },
                    DOCUMENT_NUMBER: {
                        id: "custpage_doc_num",
                        label: "Conf #",
                        type: 'text',
                        isEdit: false,
                    },
                    VENDOR: {
                        id: "custpage_vendor",
                        label: "Vendor",
                        type: 'text',
                        isEdit: false
                    },
                    STATUS: {
                        id: "custpage_status",
                        label: "Status",
                        type: "text",
                        isEdit: false
                    },
                    ETA: {
                        id: "custpage_eta",
                        label: "ETA",
                        type: "text",
                        isEdit: false
                    },
                    DEL_DATE: {
                        id: "custpage_del_date",
                        label: "DEL Date",
                        type: "text",
                        isEdit: false
                    },
                    PU_CITY: {
                        id: "custpage_pu_city",
                        label: "PU City",
                        type: "text",
                        isEdit: false
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location",
                        label: "DROP LOCATION",
                        type: "text",
                        isEdit: false
                    },
                    CREATED_FROM: {
                        id: "custpage_created_from",
                        label: "CREATED FROM",
                        type: "TEXTAREA",
                        isEdit: false
                    },
                    CUSTOMER: {
                        id: "custpage_customer",
                        label: "CUSTOMER",
                        type: "text",
                        isEdit: false
                    },
                },
                sublistfields4th: {
                    RECORD_ID: {
                        id: "custpage_rec_id",
                        label: "RECORD ID",
                        type: 'text',
                        isEdit: false
                    },
                    DOCUMENT_NUMBER: {
                        id: "custpage_doc_num",
                        label: "Conf #",
                        type: 'text',
                        isEdit: false,
                    },
                    VENDOR: {
                        id: "custpage_vendor",
                        label: "Vendor",
                        type: 'text',
                        isEdit: false
                    },
                    ORDER_STATUS: {
                        id: "custpage_order_status",
                        label: "Status",
                        type: "text",
                        isEdit: false
                    },
                    ETA: {
                        id: "custpage_eta",
                        label: "ETA",
                        type: "text",
                        isEdit: false
                    },
                    PU_DATE: {
                        id: "custpage_pu_date",
                        label: "DEL Date",
                        type: "text",
                        isEdit: false
                    },
                    PU_CITY: {
                        id: "custpage_pu_city",
                        label: "PU City",
                        type: "text",
                        isEdit: false
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location",
                        label: "DROP LOCATION",
                        type: "text",
                        isEdit: false
                    },
                },

                CS_PATH: '../CS/monday_sales_data_cs.js',
            },
        }

        const NOTIFICATION = {
            REQUIRED: {
                title: 'REQUIRED FIELDS MISSING',
                message: "Kindly ensure atleast one field has value before proceeding with the filter."
            },
        }

        return { SUITELET, NOTIFICATION }

    });
