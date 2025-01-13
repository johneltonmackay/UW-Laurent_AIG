/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/search', "../Library/add_new_data_sl_module.js", "../Library/add_new_data_sl_mapping.js", "N/redirect"],
    /**
 * @param{file} file
 * @param{record} record
 * @param{search} search
 */
    (file, record, search, module, mapping, redirect) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const CONTEXT_METHOD = {
            GET: "GET",
            POST: "POST"
        };

        const onRequest = (scriptContext) => {
            var objForm = ""
            var arrFileAttachment = ['custpage_tender_files', 'custpage_other_files']
            try {
                if (scriptContext.request.method === CONTEXT_METHOD.POST) {
                    let scriptObj = scriptContext.request.parameters;
                    let TenderFileObj = scriptContext.request.files.custpage_tender_files;
                    let OtherFileObj = scriptContext.request.files.custpage_other_files;

                    log.debug('POST onRequest scriptObj', scriptObj);
                    log.debug('POST onRequest TenderFileObj', TenderFileObj);
                    log.debug('POST onRequest OtherFileObj', OtherFileObj);

                
                    let arrFieldValues = [];
                
                    for (const strKey in mapping.SUITELET.form.fields) {
                        const field = mapping.SUITELET.form.fields[strKey];
                        const fieldId = field.id;
                    
                        if (scriptObj[fieldId] !== undefined) {
                            arrFieldValues.push({
                                [fieldId]: scriptObj[fieldId], 
                            });
                        }
                    }

                    arrFileAttachment.forEach(fldKey => {
                        let fileObj = scriptContext.request.files[fldKey]; // Access dynamically using square brackets
                        if (fileObj) {
                            fileObj.folder = 123172;
                            let attachmentId = fileObj.save();
                            if (attachmentId) {
                                let mediaObj = file.load({
                                    id: attachmentId
                                });
                    
                                // Build the object dynamically
                                let dynamicFieldValue = {};
                                dynamicFieldValue[`${fldKey}`] = attachmentId;
                                dynamicFieldValue[`${fldKey}_url`] = mediaObj.url;
                    
                                // Push the dynamic object to arrFieldValues
                                arrFieldValues.push(dynamicFieldValue);
                            }
                        }
                    });
                    
                
                    log.debug('Extracted Field Values', arrFieldValues);

                    if (arrFieldValues.length > 0){
                        module.ACTIONS.createSalesOrder({ 
                            postParam: arrFieldValues 
                        });
                    }
                }
                else {
                    let scriptObj = scriptContext.request.parameters;
                    log.debug('GET onRequest scriptObj', scriptObj);

                    objForm = module.FORM.buildForm({ 
                        title: mapping.SUITELET.form.title,
                        contextParam: scriptObj 
                    });
                        
                    scriptContext.response.writePage(objForm);
                }
                
            } catch (err) {
                log.error('ERROR ONREQUEST:', err)
            }
        }

        return {onRequest}

    });
