/*!
 * astrox-imperium-tools v0.0.1
 * Various tools to do various things for the game Astrox Imperium
 * (c) 2019 
 * MIT License
 * git+https://github.com/sharpshifter/ait.git
 */

(function (ait, $, undefined) {

    // Local vars
    var wbbOpt = {
        buttons: "bold,italic,underline,strike,code,spoiler,line,quote,|,img,video,link,|,bullist,numlist,|,fontcolor,fontsize,fontfamily,|,justifyleft,justifycenter,justifyright,|,removeFormat",
        allButtons: {
            spoiler: {
              title: 'Insert spoiler',
              buttonText: 'spoiler',
              transform: {
                '<div class="spoiler">{SELTEXT}</div>':'[spoiler]{SELTEXT}[/spoiler]'
              }
            },
            line: {
              title: 'Insert horizontal rule/line',
              buttonText: 'line',
              transform: {
                '{SELTEXT}<hr>':'{SELTEXT}[line]'
              }
            }
        },
        autoresize: false,
        resize_maxheight: 400
    }

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
    var $shipdataexporter_usedefaulttemplatelabels = $('#shipdataexporter_usedefaulttemplatelabels');
    var $shipdataexporter_modewarning = $('#shipdataexporter_modewarning');
    var $shipdataexporter_generateoutput = $('#shipdataexporter_generateoutput');
    var $modal_shipdataexporter_output = $('#modal_shipdataexporter_output');
    var $shipdataexporter_outputarea = $('#shipdataexporter_outputarea');
    var $shipdataexporter_copytoclipboard = $('#shipdataexporter_copytoclipboard');

    /**
    * Ship Info Exporter Functions
     */
    ait.shipDataExporter = {
        wysibbInBBCodeMode: false,
        currentShipDataString: '',
        currentShipDataArray: [{}],
        shipInfoPattern: new RegExp(/SHIP_([^;]+);(.*)/g),

        init: function () {
            // Enable the Process button when data has been entered
            $shipdataexporter_sourcedata.on('change keyup paste', (function() {
                if ($shipdataexporter_sourcedata.val().length) {
                    $shipdataexporter_process.removeClass('disabled');
                } else {
                    $shipdataexporter_process.addClass('disabled');
                }
            }));

            // Set up clipboard on the Generate button
            if ($shipdataexporter_copytoclipboard.length) {
                var clipboard = new ClipboardJS($shipdataexporter_copytoclipboard[0]);

                clipboard.on('success', (function(e) {
                    ait.showNotification("Successfully copied code to clipboard!","done","success");
                }));

                clipboard.on('error', (function(e) {
                    ait.showNotification("Unable to copy code to clipboard","error_outline","danger");
                }));
            }
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
                        $shipdataexporter_sourcelabels.append($shipdataexporter_modewarning);

                        // Make a label for every ship data item
                        $.each(ait.shipDataExporter.currentShipDataArray, (function(idx, item) {
                            /* The array indices are
                            0 = The full match, e.g. SHIP_base_thrust;242
                            1 = Ship data key ("SHIP_" is stripped), e.g. base_thrust
                            2 = Ship data value, e.g. 242 or in the case of array values like engine colour, 0.0;0.69;1.0;0.85
                            */
                            var itemHTML = '<span class="badge badge-light" data-itemtag="' + item[1] + '">' + makeBetterLabelText(item[1]) + '</span> ';
                            $shipdataexporter_sourcelabels.append(itemHTML);
                        }));

                        ait.showNotification("Successfully processed ship data","done","success");

                        // Update page to show the labels and template editor
                        $shipdataexporter_labelsandtemplate.removeClass('d-none');

                        // Create WysiBB instance
                        // TODO: Move this into its own function when other output options such as Markdown are available, so we only initialise the editor we need
                        $shipdataexporter_template.wysibb(wbbOpt);

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
            if (!$shipdataexporter_sourcelabels.find('#shipdataexporter_modewarning').is(':visible')) {
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
            }
        },
        doWysibbMode: function(modestatus) {
            ait.shipDataExporter.wysibbInBBCodeMode = modestatus;
            if(modestatus) {
                // Editor is now in BBCode mode, show warning over labels
                $shipdataexporter_sourcelabels.addClass('blurred').find('#shipdataexporter_modewarning').show();
            } else {
                // Editor has now left BBCode mode, hide warning over labels
                $shipdataexporter_sourcelabels.removeClass('blurred').find('#shipdataexporter_modewarning').hide();
            }
        },
        useDefaultTemplate: function() {
            if (ait.shipDataExporter.wysibbInBBCodeMode) {
                var defaultTemplate = '[b][size=3]{name|*value}[/size][/b]\n' +
                '\n' +
                '[img]https://via.placeholder.com/550x400.png?text=Ship+Image+Here[/img]\n' +
                '\n' +
                '[b][size=3]Primary Ship Details[/size][/b]\n' +
                '{type|*name}: {type|*value}\n' +
                '{class|*name}: {class|*value}\n' +
                '{manufacturer|*name}: {manufacturer|*value}\n' +
                '{active_slots|*name}: {active_slots|*value}\n' +
                '{passive_slots|*name}: {passive_slots|*value}\n' +
                '{base_price|*name}: {base_price|*value}\n' +
                '\n' +
                '[b][size=3]Base Attributes[/size][/b]\n' +
                '{base_shield|*name}: {base_shield|*value}\n' +
                '{base_energy|*name}: {base_energy|*value}\n' +
                '{impact_resistance|*name}: {impact_resistance|*value}\n' +
                '{energy_resistance|*name}: {energy_resistance|*value}\n' +
                '{explosive_resistance|*name}: {explosive_resistance|*value}\n' +
                '\n' +
                '{base_engine_burn|*name}: {base_engine_burn|*value}\n' +
                '{base_recharge|*name}: {base_recharge|*value}\n' +
                '{base_turn|*name}: {base_turn|*value}\n' +
                '{base_thrust|*name}: {base_thrust|*value}\n' +
                '{base_mass|*name}: {base_mass|*value}\n' +
                '\n' +
                '{base_cargo|*name}: {base_cargo|*value}\n' +
                '{base_lifesupport|*name}: {base_lifesupport|*value}\n' +
                '\n' +
                '{base_scan_speed|*name}: {base_scan_speed|*value}\n' +
                '{base_scan_max_targets|*name}: {base_scan_max_targets|*value}\n' +
                '{base_scan_pulserange|*name}: {base_scan_pulserange|*value}\n' +
                '{base_scan_pulsespeed|*name}: {base_scan_pulsespeed|*value}\n';

                $shipdataexporter_template.bbcode(defaultTemplate);
                $shipdataexporter_template.val(defaultTemplate);
                $shipdataexporter_template.sync();
            } else {
                alert('Switch the editor to BBCode mode first');
            }
        },
        generateOutput: function() {
            // Generate output code, populate the modal then show it (don't forget copy to clipboard button)
            $shipdataexporter_outputarea.val($shipdataexporter_template.bbcode());
            $modal_shipdataexporter_output.modal('show');
        }
    }



    /**
     * Do stuff when document is ready
     */
    $((function () {
        if ($shipdataexporter_sourcedata.length) ait.shipDataExporter.init();
        $shipdataexporter_sourcelabels.on('click', 'span.badge', (function (e) { ait.shipDataExporter.insertTag(e, this) }));
    }));

}(window.ait = window.ait || {}, jQuery));