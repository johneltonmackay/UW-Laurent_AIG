/**
 * @NApiVersion 2.1
 */
define([],
    
    () => {

        const SUITELET = {
            scriptid: 'customscript_add_sub_notes_main_page_sl',
            deploymentid: 'customdeploy_add_sub_notes_main_page_sl',
            form: {
                title: "Monday Sales Data: SUB NOTES",
                fields: {
                    MONDAY_SALES_ID: {
                        id: "custpage_monday_parent_id",
                        type: "SELECT",
                        label: "MONDAY SALES ID",
                        source: 'customrecord_my_sales_data',
                        hasDefault: true,
                        container: 'custpage_tab_notes',
                        isDisabled: true,
                    },
                    UPDATE_SUB_NOTES_DATA: {
                        id: "custpage_update_sub_notes_data",
                        label: "UPDATE SUB NOTES DATA",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true,
                        container: 'custpage_tab_notes',
                        isDisabled: true,
                        isHidden: true
                    },
                    CREATE_SUB_NOTES_DATA: {
                        id: "custpage_sub_notes_data",
                        label: "SUB NOTES DATA",
                        type: "longtext",
                        hasDefault: false,
                        isInLine: true,
                        container: 'custpage_tab_notes',
                        isDisabled: true,
                        isHidden: true
                    },
                },
                buttons: {
                    SUBMIT: {
                        label: 'SAVE',
                    },
                    CLOSE: {
                        label: 'CLOSE',
                        id: 'custpage_close_btn',
                        functionName: 'closeWindow()',
                        isCustom: true
                    },
                },
                sublistfieldsNotes: {
                    SUB_REC_ID: {
                        id: "custpage_sub_rec_id",
                        label: "SUB REC ID",
                        type: 'text',
                        isHidden: true
                    },
                    AUTHOR: {
                        id: "custpage_author_notes",
                        label: "AUTHOR",
                        type: 'text',
                        isDisabled: true,
                    },
                    NOTE: {
                        id: "custpage_note_notes",
                        label: "NOTES",
                        type: 'textarea',
                    },
                    NOTE_DATE: {
                        id: "custpage_notedate_notes",
                        label: "NOTE DATE",
                        type: 'TEXT',
                        isDisabled: true,
                    },
                    TITLE: {
                        id: "custpage_title_notes",
                        label: "MONDAY SALES ID",
                        type: 'text',
                        isHidden: true
                    },
                    IS_UPDATED: {
                        id: "custpage_is_updated",
                        label: "IS UPDATED",
                        type: 'checkbox',
                        isDisabled: true,
                        isHidden: true
                    },
                },

                CS_PATH: '../CS/add_sub_notes_cs.js',
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
