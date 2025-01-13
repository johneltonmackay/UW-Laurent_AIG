/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url'], function(url) {
    function pageInit(context) {
        console.log("Page initialized.");

        // Load the Google Places API script from Suitelet
        loadGooglePlacesApi();

        // Wait for the Google Places API to be available
        var interval = setInterval(function() {
            if (window.google && window.google.maps && window.google.maps.places) {
                clearInterval(interval);
                console.log("Google Places API loaded.");
                // Attach autocomplete to the custom fields
                attachAutocomplete('custbody_pu_location');
                attachAutocomplete('custbody_drop_location'); // Added line for the drop location
            } else {
                console.log("Waiting for Google Places API to load...");
            }
        }, 1000); // Check every second
    }

    function loadGooglePlacesApi() {
        if (!window.google) {
            console.log("Loading Google Places API script...");
            var script = document.createElement('script');
            script.src = url.resolveScript({
                scriptId: 'customscript836', // Update this with the correct Script ID for Google API Proxy from production
                deploymentId: 'customdeploy1' // Update this with the correct Deployment ID for Google API Proxy from production
            });
            script.async = true;
            script.onload = function() {
                console.log("Google Places API script loaded successfully.");
                loadAdditionalGoogleScripts();
            };
            script.onerror = function() {
                console.error("Error loading Google Places API script.");
            };
            document.head.appendChild(script);
        } else {
            console.log("Google Places API script already loaded.");
        }
    }

    function loadAdditionalGoogleScripts() {
        var scripts = [
            {
                scriptId: 'customscript832', // Update this with the correct script ID for Common.js from production
                deploymentId: 'customdeploy1' // Update this with the correct deployment ID for Common.js from production
            },
            {
                scriptId: 'customscript833', // Update this with the correct script ID for util.js from production
                deploymentId: 'customdeploy1' // Update this with the correct deployment ID for util.js from production
            },
            {
                scriptId: 'customscript834', // Update this with the correct script ID for controls.js from production
                deploymentId: 'customdeploy1' // Update this with the correct deployment ID for controls.js from production
            },
            {
                scriptId: 'customscript835', // Update this with the correct script ID for places_impl.js from production
                deploymentId: 'customdeploy1' // Update this with the correct deployment ID for places_impl.js from production
            }
        ];

        scripts.forEach(function(scriptInfo) {
            var script = document.createElement('script');
            script.src = url.resolveScript({
                scriptId: scriptInfo.scriptId,
                deploymentId: scriptInfo.deploymentId
            });
            script.async = true;
            script.onload = function() {
                console.log(scriptInfo.scriptId + " script loaded successfully.");
            };
            script.onerror = function() {
                console.error("Error loading " + scriptInfo.scriptId + " script.");
            };
            document.head.appendChild(script);
        });
    }

    function attachAutocomplete(fieldId) {
        var field = document.getElementById(fieldId);
        console.log("Field element: ", field); // Debugging line to check the field element
        if (field && field.tagName === 'INPUT') {
            console.log("Field found and is an input element: " + fieldId);
            var autocomplete = new google.maps.places.Autocomplete(field, { types: ['geocode'] });

            autocomplete.addListener('place_changed', function() {
                var place = autocomplete.getPlace();
                console.log('Selected place:', place);
                // Here you can handle the place details if needed
            });
        } else {
            console.error("Field not found or not an input element: " + fieldId);
        }
    }

    return {
        pageInit: pageInit
    };
});
