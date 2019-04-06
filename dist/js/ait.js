/*!
 * astrox-imperium-tools v0.0.1
 * Various tools to do various things for the game Astrox Imperium
 * (c) 2019 
 * MIT License
 * git+https://github.com/sharpshifter/ait.git
 */

(function (ait, $, undefined) {

    // Utility Functions

    /**
    * Convert first character of each word to uppercase
     */
    function toTitleCase(str) {
        str = str.replace(/[^\s]+/g, (function(word) {
            return word.replace(/^./, (function(first) {
                return first.toUpperCase();
            }));
        }));
        return str;
    }

    /**
     * Make data file strings more user friendly
     */
    function makeBetterLabelText(str) {
        var result = '';
        var strArr = str.split('_');
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

    /**
    * Ship Info Exporter Functions
     */
    ait.shipDataExporter = {
        currentShipDataString: '',
        currentShipDataArray: [{}],
        shipInfoPattern: new RegExp(/SHIP_([^;]+);(.*)/g),

        init: function () {
            $shipdataexporter_sourcedata.on('change keyup paste', (function() {
                if ($shipdataexporter_sourcedata.val().length) {
                    $shipdataexporter_process.removeClass('disabled');
                } else {
                    $shipdataexporter_process.addClass('disabled');
                }
            }));
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

                        $('.processarrow1').removeClass('d-none');
                        $shipdataexporter_sourcelabels.empty();

                        $.each(ait.shipDataExporter.currentShipDataArray, (function(idx, item) {
                            var itemHTML = '<a href="#" class="badge badge-primary" data-itemlbl="'+ item[1]+'" data-itemval="'+ item[2]+'">' + makeBetterLabelText(item[1]) + '</a> ';
                            $shipdataexporter_sourcelabels.append(itemHTML);
                        }));

                        ait.showNotification("Successfully processed ship data","done","success");
                    } else {
                        ait.showNotification("Unable to process source ship data","error_outline","danger");
                    }
                } else {
                    ait.showNotification("The source data doesn't seem to contain any ship stats","warning","warning");
                }
            }
        }
    }



    /**
     * Do stuff when document is ready
     */
    $((function () {
        if ($shipdataexporter_sourcedata.length) ait.shipDataExporter.init();
    }));

}(window.ait = window.ait || {}, jQuery));