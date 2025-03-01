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
                        id: "custpage_pu_location_head",
                        type: "TEXT",
                        label: "PICK UP LOCATION",
                        container: 'custpage_field_group_filter'
                    },
                    DROP_LOCATION: {
                        id: "custpage_drop_location_head",
                        type: "TEXT",
                        label: "DROP LOCATION",
                        container: 'custpage_field_group_filter'
                    },
                    DEPARTMENT: {
                        id: "custpage_department_head",
                        type: "SELECT",
                        label: "DEPARTMENT:",
                        source: 'department',
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
                            { value: 'custrecord_need_call', text: 'Need Call' },
                        ],
                        container: 'custpage_field_group_filter',
                    },
                    LOAD_ORDER: {
                        id: "custpage_load_order_head",
                        type: "TEXT",
                        label: "LOAD ORDER",
                        container: 'custpage_field_group_filter_order'
                    },
                    CUSTOMER_ID: {
                        id: "custpage_customer_id",
                        type: "TEXT",
                        label: "CUSTOMER",
                        container: 'custpage_field_group_filter_order',
                    },
                    CUSTOMER_PO: {
                        id: "custpage_customer_po",
                        type: "TEXT",
                        label: "CUSTOMER PO",
                        container: 'custpage_field_group_filter_order'
                    },
                    LOAD_ORDER_STATUS: {
                        id: "custpage_status_head",
                        type: "SELECT",
                        label: "LOAD ORDER STATUS:",
                        source: 'customlist787',
                        container: 'custpage_field_group_filter_order'
                    },
                    LOAD_CONFIRMATION: {
                        id: "custpage_load_confirmation",
                        type: "TEXT",
                        label: "LOAD CONFIRMATION",
                        container: 'custpage_field_group_filter_confirmation'
                    },
                    VENDOR_ID: {
                        id: "custpage_vendor_id",
                        type: "TEXT",
                        label: "VENDOR",
                        container: 'custpage_field_group_filter_confirmation',
                    },
                    LOAD_CONFIRMATION_STATUS: {
                        id: "custpage_status_lc",
                        type: "SELECT",
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
                    LOAD_ORDER_ID: {
                        id: "custpage_load_order_id",
                        label: "LOAD ORDER ID",
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
                        label: "Sub Record",
                        type: "TEXTAREA",
                        isEdit: false,
                        isHidden: false
                    },
                    VIEW_NOTES_REC: {
                        id: "custpage_view_notes_rec",
                        label: "NOTES",
                        type: "TEXTAREA",
                        isEdit: false,
                        isHidden: false
                    },
                    NEED_CALL: {
                        id: "custpage_need_call",
                        label: "NEED CALL?",
                        type: 'checkbox',
                        isEdit: true,
                        isHidden: false,
                    },
                    CUSTOMER_NAME: {
                        id: "custpage_customer",
                        label: "CUSTOMER NAME",
                        type: 'select',
                        isEdit: false,
                        isHidden: false,
                        source: 'customer',
                        isInLine: true,
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
                        isEdit: false,
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
                        id: "custpage_load_detailsgeorge",
                        label: "COMMODITY",
                        type: "text",
                        isEdit: true,
                        isHidden: false
                    },
                    CUSTOMER_PO_NUMBER: {
                        id: "custpage_customer_po_numbers",
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
                    FILE_CABINET_ID: {
                        id: "custpage_file_cabinet_id",
                        label: "FILE CABINET ID",
                        type: "text",
                        isHidden: true
                    },
                    SO_TRAN_ID: {
                        id: "custpage_tran_id",
                        label: "SO TRAN ID",
                        type: "text",
                        isHidden: true
                    },
                    DEPARTMENT: {
                        id: "custpage_department",
                        label: "DEPARTMENT",
                        type: "text",
                        isHidden: true
                    },
                    LENGTH_IN_FEET: {
                        id: "custpage_lenght_feet",
                        label: "LENGTH IN FEET",
                        type: "text",
                        isHidden: true,
                    },
                    WIDTH_IN_FEET: {
                        id: "custpage_width_feet",
                        label: "WIDTH IN FEET",
                        type: "text",
                        isHidden: true,
                    },
                    HEIGHT_IN_FEET: {
                        id: "custpage_height_feet",
                        label: "HEIGHT IN FEET",
                        type: "text",
                        isHidden: true,
                    },
                    WEIGHT: {
                        id: "custpage_load_weight",
                        label: "WEIGHT",
                        type: 'text',
                        isHidden: true,
                    },
                    
                },
                sublistfields2nd: {
                    RECORD_ID: {
                        id: "custpage_rec_id",
                        label: "RECORD ID",
                        type: 'text',
                        isEdit: false,
                        isHidden: true
                    },
                    PO_TRAN_ID: {
                        id: "custpage_po_tran_id",
                        label: "PO TRAN ID",
                        type: "text",
                        isHidden: true
                    },
                    DOCUMENT_NUMBER: {
                        id: "custpage_doc_num",
                        label: "DOCUMENT NUMBER",
                        type: 'text',
                        isEdit: false,
                    },
                    COMPANY_NAME: {
                        id: "custpage_company_name",
                        label: "COMPANY NAME",
                        type: "text",
                        isEdit: false
                    },
                    TRAN_DATE: {
                        id: "custpage_trans_date",
                        label: "DATE",
                        type: 'text',
                        isEdit: false
                    },
                    PU_DATE: {
                        id: "custpage_pu_date",
                        label: "PU DATE",
                        type: 'text',
                        isEdit: false
                    },
                    DROP_DATE: {
                        id: "custpage_drop_date",
                        label: "DROP DATE",
                        type: 'text',
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
                        type: "select",
                        isEdit: true,
                        source: 'customlist786',
                        isHidden: false
                    },
                    PICK_UP_LOCATION: {
                        id: "custpage_pu_location",
                        label: "PICK UP LOCATION",
                        type: "TEXTAREA",
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
