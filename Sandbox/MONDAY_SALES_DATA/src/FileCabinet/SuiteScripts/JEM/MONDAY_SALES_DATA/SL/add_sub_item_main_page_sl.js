/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/search', "../Library/add_sub_item_sl_module.js", "../Library/add_sub_item_sl_mapping.js", "N/redirect"],
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
            try {
                if (scriptContext.request.method === CONTEXT_METHOD.POST) {
                    let scriptObj = scriptContext.request.parameters;
                    log.debug('POST onRequest scriptObj', scriptObj);
                
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
                
                    log.debug('Extracted Field Values', arrFieldValues);

                    if (arrFieldValues.length > 0){
                        let arrCustomRecId = module.ACTIONS.createSubItem({ 
                            postParam: arrFieldValues 
                        });
                        if (arrCustomRecId.length > 0){
                            redirect.toSuitelet({
                                scriptId: 'customscript_monday_sales_data_main_sl',
                                deploymentId: 'customdeploy_monday_sales_data_main_sl',
                            });
                        }
                    }
                }
                else {
                    let scriptObj = scriptContext.request.parameters;
                    log.debug('GET onRequest scriptObj', scriptObj);

                    if(scriptObj.transkey){
                        objForm = module.ACTIONS.viewResults({
                            title: mapping.SUITELET.form.title,
                            transkey: scriptObj.transkey
                        });  
                    } else {
                        objForm = module.FORM.buildForm({ 
                            title: mapping.SUITELET.form.title,
                            contextParam: scriptObj 
                        });
                    }
                        
                    scriptContext.response.writePage(objForm);
                }
                
            } catch (err) {
                log.error('ERROR ONREQUEST:', err)
            }
        }

        return {onRequest}

    });
