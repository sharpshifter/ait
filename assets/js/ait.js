(function (ait, $, undefined) {

    // Utility Functions

    /**
    * Convert first character of each word to uppercase
     */
    function toTitleCase(str) {
        str = str.replace(/[^\s]+/g, function(word) {
            return word.replace(/^./, function(first) {
                return first.toUpperCase();
            });
        });
        return str;
    }

    /**
     * Make data file strings more user friendly
     */
    function makeBetterLabelText(str) {
        var result = '';
        var strArr = str.replace('_lifesupport', '_life_support');
        strArr = strArr.replace('ls_', 'life_support_');
        strArr = strArr.split('_');
        for (var i = 0; i < strArr.length; i++) {
            if (i > 0) {
                result += ' ' + toTitleCase(strArr[i]);
            } else {
                result += toTitleCase(strArr[i]);
            }
        }
        return result;
    }

    /**
     * Show a notification
     */
    ait.showNotification = function(message,icon='add_alert',type='info') {
        $.notify({
            icon: icon,
            message: message
        }, {
            type: type,
            timer: 2000,
            placement: {
                from: 'top',
                align: 'center'
            }
        });
    }


    /**
    * Ship Info Exporter Variables
     */
    var $shipdataexporter_sourcedata = $('#shipdataexporter_sourcedata');
    var $shipdataexporter_process = $('#shipdataexporter_process');
    var $shipdataexporter_sourcelabels = $('#shipdataexporter_sourcelabels');
    var $shipdataexporter_template = $('#shipdataexporter_template');
    var $shipdataexporter_labelsandtemplate = $('#shipdataexporter_labelsandtemplate');
    var $shipdataexporter_generateoutput = $('#shipdataexporter_generateoutput');

    /**
    * Ship Info Exporter Functions
     */
    ait.shipDataExporter = {
        currentShipDataString: '',
        currentShipDataArray: [{}],
        shipInfoPattern: new RegExp(/SHIP_([^;]+);(.*)/g),

        init: function () {
            $shipdataexporter_sourcedata.on('change keyup paste', function() {
                if ($shipdataexporter_sourcedata.val().length) {
                    $shipdataexporter_process.removeClass('disabled');
                } else {
                    $shipdataexporter_process.addClass('disabled');
                }
            });
        },
        startProcess: function () {
            ait.shipDataExporter.currentShipDataString = $shipdataexporter_sourcedata.val();
            if (ait.shipDataExporter.currentShipDataString.length) {
                if (ait.shipDataExporter.shipInfoPattern.test(ait.shipDataExporter.currentShipDataString)) {
                    ait.shipDataExporter.currentShipDataArray = [];
                    var match;
                    while((match = ait.shipDataExporter.shipInfoPattern.exec(ait.shipDataExporter.currentShipDataString)) != null) ait.shipDataExporter.currentShipDataArray.push(match);
                    
                    if (ait.shipDataExporter.currentShipDataArray.length) {
                        ait.shipDataExporter.currentShipDataArray.sort();

                        $shipdataexporter_sourcelabels.empty();

                        $.each(ait.shipDataExporter.currentShipDataArray, function(idx, item) {
                            var itemHTML = '<span class="badge badge-primary" data-itemtag="' + item[1] + '">' + makeBetterLabelText(item[1]) + '</span> ';
                            $shipdataexporter_sourcelabels.append(itemHTML);
                        });

                        ait.showNotification("Successfully processed ship data","done","success");

                        $shipdataexporter_labelsandtemplate.removeClass('d-none');
                        $('.main-panel').scrollTop($shipdataexporter_labelsandtemplate.offset().top-50);
                    } else {
                        ait.showNotification("Unable to process source ship data","error_outline","danger");
                    }
                } else {
                    ait.showNotification("The source data doesn't seem to contain any ship stats","warning","warning");
                }
            }
        },
        insertTag: function(event, sender) {
            var itemTag = $(sender).data('itemtag');
            $(sender).removeClass('badge-primary').removeClass('badge-secondary').removeClass('badge-success').removeClass('badge-info');

            if (event.shiftKey) {
                // Insert just Name tag
                $shipdataexporter_template.val($shipdataexporter_template.val() + '[' + itemTag + '|*name]');
                $(sender).addClass('badge-success');
            } else if (event.altKey) {
                // Insert just Value tag
                $shipdataexporter_template.val($shipdataexporter_template.val() + '[' + itemTag + '|*value]');
                $(sender).addClass('badge-info');
            } else {
                // Insert Name and Value tag
                // TODO: Custom separator, default to ': '
                $shipdataexporter_template.val($shipdataexporter_template.val() + '[' + itemTag + '|*name]: [' + itemTag + '|*value]');
                $(sender).addClass('badge-secondary');
            }
        },
        generateOutput: function() {
            // Generate output code, populate the modal then show it (don't forget copy to clipboard button)
            console.log('Generate Output');
        }
    }



    /**
     * Do stuff when document is ready
     */
    $(function () {
        if ($shipdataexporter_sourcedata.length) ait.shipDataExporter.init();
        $shipdataexporter_sourcelabels.on('click', 'span.badge', function (e) { ait.shipDataExporter.insertTag(e, this) });
    });

}(window.ait = window.ait || {}, jQuery));