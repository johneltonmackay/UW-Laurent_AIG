/**
 * @NApiVersion 2.x
 * @NScriptType Portlet
 */
define(['N/url'], function(url) {

    function render(params) {
        var portlet = params.portlet;
        portlet.title = ' Sales Data';

        // Get the URL of the Suitelet using scriptId and deploymentId
        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_monday_dashboard', // Replace with your actual Suitelet script ID
            deploymentId: 'customdeploy_monday_dash'   // Replace with your actual Suitelet deployment ID
        });

        // Optional: Remove NetSuite UI elements
        suiteletUrl += '&whence=';

        // Embed the Suitelet using an iframe
        portlet.html = '<iframe src="' + suiteletUrl + '" width="100%" height="800px" frameborder="0"></iframe>';
    }

    return {
        render: render
    };
});
