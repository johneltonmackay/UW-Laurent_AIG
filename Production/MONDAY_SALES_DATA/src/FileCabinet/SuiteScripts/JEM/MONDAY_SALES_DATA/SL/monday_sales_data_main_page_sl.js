/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record', 'N/search', "../Library/monday_sales_data_sl_module.js", "../Library/monday_sales_data_sl_mapping.js", "N/redirect"],
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
                if (scriptContext.request.method == CONTEXT_METHOD.POST) {
                    let scriptObj = scriptContext.request.parameters;
                    log.debug('POST onRequest scriptObj', scriptObj);
                    
                } else {
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
