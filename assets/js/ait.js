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
            // Enable the Process button when data has been entered
            $shipdataexporter_sourcedata.on('change keyup paste', function() {
                if ($shipdataexporter_sourcedata.val().length) {
                    $shipdataexporter_process.removeClass('disabled');
                } else {
                    $shipdataexporter_process.addClass('disabled');
                }
            });
        },
        startProcess: function () {
            // Clear out previous runs
            ait.shipDataExporter.currentShipDataString = $shipdataexporter_sourcedata.val();

            if (ait.shipDataExporter.currentShipDataString.length) {
                // Does the data provided have SHIP_ data in it?
                // Can't use [pattern].test([string]) here as it nudges the internal cursor once which causes .exec to skip the first result
                if (ait.shipDataExporter.currentShipDataString.indexOf('SHIP_') !== -1) {
                    ait.shipDataExporter.currentShipDataArray = [];

                    // Get SHIP_ data lines and put them into an array
                    var match;
                    while((match = ait.shipDataExporter.shipInfoPattern.exec(ait.shipDataExporter.currentShipDataString)) != null) ait.shipDataExporter.currentShipDataArray.push(match);
                    
                    if (ait.shipDataExporter.currentShipDataArray.length) {
                        // Sort the array alphabetically
                        ait.shipDataExporter.currentShipDataArray.sort();

                        // Clear out previous labels
                        $shipdataexporter_sourcelabels.empty();

                        // Make a label for every ship data item
                        $.each(ait.shipDataExporter.currentShipDataArray, function(idx, item) {
                            /* The array indices are
                            0 = The full match, e.g. SHIP_base_thrust;242
                            1 = Ship data key ("SHIP_" is stripped), e.g. base_thrust
                            2 = Ship data value, e.g. 242 or in the case of array values like engine colour, 0.0;0.69;1.0;0.85
                            */
                            var itemHTML = '<span class="badge badge-light" data-itemtag="' + item[1] + '">' + makeBetterLabelText(item[1]) + '</span> ';
                            $shipdataexporter_sourcelabels.append(itemHTML);
                        });

                        ait.showNotification("Successfully processed ship data","done","success");

                        // Update page to show the labels and template editor
                        $shipdataexporter_labelsandtemplate.removeClass('d-none');

                        // Create WysiBB instance
                        // TODO: Move this into its own function when other output options such as Markdown are available, so we only initialise the editor we need
                        var wbbOpt = {
                            buttons: "bold,italic,underline,strike,code,spoiler,quote,|,img,video,link,|,bullist,numlist,|,fontcolor,fontsize,fontfamily,|,justifyleft,justifycenter,justifyright,|,removeFormat",
                            allButtons: {
                                spoiler: {
                                  title: 'Insert spoiler',
                                  buttonText: 'spoiler',
                                  transform: {
                                    '<div class="spoiler">{SELTEXT}</div>':'[spoiler]{SELTEXT}[/spoiler]'
                                  }
                                }
                              }
                        }
                        $('#shipdataexporter_template').wysibb(wbbOpt);

                        // Scroll the page to where the labels are
                        $('html, body').animate({
                            scrollTop: $shipdataexporter_labelsandtemplate.offset().top-20
                        }, 350);
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
            $(sender).removeClass('badge-light').removeClass('badge-secondary').removeClass('badge-primary').removeClass('badge-success');

            // TODO: When there's multiple formats (not just BBCode, e.g. Markdown) we need to work out which editor we're using so the correct methods can be called

            if (event.shiftKey) {
                // Insert just Name tag
                //$shipdataexporter_template.val($shipdataexporter_template.val() + '{' + itemTag + '|*name}');
                $shipdataexporter_template.insertAtCursor($shipdataexporter_template.val() + '{' + itemTag + '|*name}');
                $(sender).addClass('badge-success');
            } else if (event.altKey) {
                // Insert just Value tag
                //$shipdataexporter_template.val($shipdataexporter_template.val() + '{' + itemTag + '|*value}');
                $shipdataexporter_template.insertAtCursor($shipdataexporter_template.val() + '{' + itemTag + '|*value}');
                $(sender).addClass('badge-primary');
            } else {
                // Insert Name and Value tag
                // TODO: Custom separator, default to ': '
                //$shipdataexporter_template.val($shipdataexporter_template.val() + '{' + itemTag + '|*name}: {' + itemTag + '|*value}');
                $shipdataexporter_template.insertAtCursor($shipdataexporter_template.val() + '{' + itemTag + '|*name}: {' + itemTag + '|*value}');
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