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
                '{SELTEXT}\n<hr>':'{SELTEXT}\n[line]'
              }
            }
        },
        autoresize: false,
        resize_maxheight: 400
    }

    // GTM dataLayer init
    window.dataLayer = window.dataLayer || [];


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
            delay: 3500,
            timer: 1000,
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
        // editorType will be determined by the output option chosen by the user (when the other formats/editors are implemented)
        editorType: 'wysibb',
        wysibbInBBCodeMode: false,
        templateTagsSeparator: ': ',
        currentShipDataString: '',
        currentShipDataArray: [{}],
        shipInfoInputPattern: new RegExp(/SHIP_([^;]+);(.*)/g),
        shipInfoOutputPattern: new RegExp(/{([^\|\*]+)\|\*(\w+)}/g),
        tagWatcherInterval: null,

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
                    while((match = ait.shipDataExporter.shipInfoInputPattern.exec(ait.shipDataExporter.currentShipDataString)) != null) ait.shipDataExporter.currentShipDataArray.push(match);
                    
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

                        // Create editor instance
                        // TODO: Move this into its own function when other output options such as Markdown are available, so we only initialise the editor we need
                        // And Note: WysiBB doesn't get .destroy()ed properly, so when other output options are available, we'll need to ask which format the user wants BEFORE any editors are created
                        switch (ait.shipDataExporter.editorType) {
                            case 'wysibb':
                                $shipdataexporter_template.wysibb(wbbOpt);
                                break;
                            default:
                                ait.showNotification("Please choose a template format first!","error_outline","danger");
                        }

                        // Scroll the page to where the labels are
                        $('html, body').animate({
                            scrollTop: $shipdataexporter_labelsandtemplate.offset().top-20
                        }, 350);

                        // Start the tag watcher if it hasn't already been started
                        if (ait.shipDataExporter.tagWatcherInterval == null) {
                            ait.shipDataExporter.tagWatcherInterval = setInterval(ait.shipDataExporter.initTagWatcher, 500);
                        }
                    } else {
                        ait.showNotification("Unable to process source ship data","error_outline","danger");
                    }
                } else {
                    ait.showNotification("The source data doesn't seem to contain any ship stats","warning","warning");
                }
            }
        },
        initTagWatcher: function() {
            var editorOutput = ait.shipDataExporter.getEditorOutput();
            
            // Iterate over each tag label 
            $('span.badge[data-itemtag]').each((function() {
                // Reset the tag label classes
                $(this).removeClass('badge-light').removeClass('badge-secondary').removeClass('badge-primary').removeClass('badge-success');

                var tagName = $(this).data('itemtag');
                var templateContainsName = false;
                var templateContainsValue = false;

                // Does this tag exist in the template, asking for a Name or Value?
                if (editorOutput.indexOf('{' + tagName + '|*name}') != -1) templateContainsName = true;
                if (editorOutput.indexOf('{' + tagName + '|*value}') != -1) templateContainsValue = true;

                if (templateContainsName && templateContainsValue) {
                    // The template wants both Name and Value for this tag
                    $(this).addClass('badge-secondary');
                } else if (templateContainsName) {
                    // The template wants just Name for this tag
                    $(this).addClass('badge-primary');
                } else if (templateContainsValue) {
                    // The template wants just Value for this tag
                    $(this).addClass('badge-success');
                } else {
                    // This tag is not in the template
                    $(this).addClass('badge-light');
                }
            }));
        },
        insertTag: function(event, sender) {
            if (!$shipdataexporter_sourcelabels.find('#shipdataexporter_modewarning').is(':visible')) {
                var itemTag = $(sender).data('itemtag');

                // The switches are here for when there's multiple formats (not just BBCode, e.g. Markdown, HTML) as we need to know which editor we're using so the correct methods are called

                if (event.shiftKey) {
                    // Insert just Name tag
                    switch (ait.shipDataExporter.editorType) {
                        case 'wysibb':
                            $shipdataexporter_template.insertAtCursor($shipdataexporter_template.val() + '{' + itemTag + '|*name}');
                            break;
                        default:
                            $shipdataexporter_template.val($shipdataexporter_template.val() + '{' + itemTag + '|*name}');
                    }
                    
                    //$(sender).addClass('badge-success');
                } else if (event.altKey) {
                    // Insert just Value tag
                    switch (ait.shipDataExporter.editorType) {
                        case 'wysibb':
                            $shipdataexporter_template.insertAtCursor($shipdataexporter_template.val() + '{' + itemTag + '|*value}');
                            break;
                        default:
                            $shipdataexporter_template.val($shipdataexporter_template.val() + '{' + itemTag + '|*value}');
                    }

                    //$(sender).addClass('badge-primary');
                } else {
                    // Insert Name and Value tag
                    // TODO: Field on page to set custom separator, default is ': '
                    switch (ait.shipDataExporter.editorType) {
                        case 'wysibb':
                            $shipdataexporter_template.insertAtCursor($shipdataexporter_template.val() + '{' + itemTag + '|*name}' + ait.shipDataExporter.templateTagsSeparator + '{' + itemTag + '|*value}');
                            break;
                        default:
                            $shipdataexporter_template.val($shipdataexporter_template.val() + '{' + itemTag + '|*name}' + ait.shipDataExporter.templateTagsSeparator + '{' + itemTag + '|*value}');
                    }

                    //$(sender).addClass('badge-secondary');
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
            switch (ait.shipDataExporter.editorType) {
                case 'wysibb':
                    if (ait.shipDataExporter.wysibbInBBCodeMode) {
                        var defaultTemplate = '[b][size=3]{name|*value}[/size][/b]\n' +
                        '\n' +
                        '[img]https://via.placeholder.com/600x400.png?text=Placeholder+image+-+click+and+change+via+Image+icon[/img]\n' +
                        '\n' +
                        '[b][size=3]Primary Ship Details[/size][/b]\n' +
                        '{type|*name}' + ait.shipDataExporter.templateTagsSeparator + '{type|*value}\n' +
                        '{class|*name}' + ait.shipDataExporter.templateTagsSeparator + '{class|*value}\n' +
                        '{manufacturer|*name}' + ait.shipDataExporter.templateTagsSeparator + '{manufacturer|*value}\n' +
                        '{active_slots|*name}' + ait.shipDataExporter.templateTagsSeparator + '{active_slots|*value}\n' +
                        '{passive_slots|*name}' + ait.shipDataExporter.templateTagsSeparator + '{passive_slots|*value}\n' +
                        '{base_price|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_price|*value}\n' +
                        '\n' +
                        '[b][size=3]Base Attributes[/size][/b]\n' +
                        '{base_shield|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_shield|*value}\n' +
                        '{base_energy|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_energy|*value}\n' +
                        '{impact_resistance|*name}' + ait.shipDataExporter.templateTagsSeparator + '{impact_resistance|*value}\n' +
                        '{energy_resistance|*name}' + ait.shipDataExporter.templateTagsSeparator + '{energy_resistance|*value}\n' +
                        '{explosive_resistance|*name}' + ait.shipDataExporter.templateTagsSeparator + '{explosive_resistance|*value}\n' +
                        '\n' +
                        '{base_engine_burn|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_engine_burn|*value}\n' +
                        '{base_recharge|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_recharge|*value}\n' +
                        '{base_turn|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_turn|*value}\n' +
                        '{base_thrust|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_thrust|*value}\n' +
                        '{base_mass|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_mass|*value}\n' +
                        '\n' +
                        '{base_cargo|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_cargo|*value}\n' +
                        '{base_lifesupport|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_lifesupport|*value}\n' +
                        '\n' +
                        '{base_scan_speed|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_scan_speed|*value}\n' +
                        '{base_scan_max_targets|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_scan_max_targets|*value}\n' +
                        '{base_scan_pulserange|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_scan_pulserange|*value}\n' +
                        '{base_scan_pulsespeed|*name}' + ait.shipDataExporter.templateTagsSeparator + '{base_scan_pulsespeed|*value}\n';

                        // Note: WysiBB doesn't get .destroy()ed properly, so when other output options are available, we'll need to ask which format the user wants BEFORE any editors are created
                        $shipdataexporter_template.bbcode(defaultTemplate);
                        $shipdataexporter_template.val(defaultTemplate);
                        $shipdataexporter_template.sync();
                    } else {
                        ait.showNotification("Please switch the editor to BBCode mode first","warning","warning");
                    }
                    break;
                default:
                    $shipdataexporter_template.val($shipdataexporter_template.val() + '{' + itemTag + '|*value}');
            }
        },
        generateOutput: function() {
            // Generate output code (when multiple formats are up, could do if statement to call the editor's specific "get source code" function), in WysiBB's case its .bbcode())
            var editorOutput = ait.shipDataExporter.getEditorOutput();
            var matches = [];
            var match;
            
            // Get tags from the editor output and put them into an array
            while((match = ait.shipDataExporter.shipInfoOutputPattern.exec(editorOutput)) != null) {
                matches.push(match);
            }

            // Iterate each tag
            $.each(matches, (function(idx, match) {
                var tagMakeup = '{' + match[1] + '|*' + match[2] + '}';

                /* The matching tag indices are
                0 = The full match, e.g. {base_thrust|*name}
                1 = Output data key, e.g. base_thrust
                2 = Output data type, e.g. name
                */
                
                // Now find the corresponding data from the Ship Data Array
                // It's basically picking out the ship data item that has the same value in its "key" column as the current tag's "key" column. e.g. base_lifesupport
                var resultArray = ait.shipDataExporter.currentShipDataArray.find(x => x[1] === match[1]);

                if (resultArray != undefined) {
                    if (match[2] == 'name') {
                        // This template tag wants its name, e.g. Base Life Support
                        editorOutput = editorOutput.replace(tagMakeup, makeBetterLabelText(resultArray[1]));
                    } else if (match[2] == 'value') {
                        // This template tag wants its value, e.g. 480
                        editorOutput = editorOutput.replace(tagMakeup, resultArray[2]);
                    }
                } else {
                    // Somehow, there is no matching key in the ship data, so just remove this tag from the template
                    // Catch any tags followed by the separator
                    // TODO: Field on page to set the custom separator, default is ': '
                    editorOutput = editorOutput.replace(tagMakeup + ait.shipDataExporter.templateTagsSeparator, '');
                    // Catch any tags followed by a new line
                    editorOutput = editorOutput.replace(tagMakeup + '\n', '');
                    // And just in case there is only one line or it's the last tag..
                    editorOutput = editorOutput.replace(tagMakeup, '');
                }
            }));

            $shipdataexporter_outputarea.val(editorOutput);
            $modal_shipdataexporter_output.modal('show');
        },
        getEditorOutput: function() {
            var editorOutput;

            switch (ait.shipDataExporter.editorType) {
                case 'wysibb':
                    editorOutput = $shipdataexporter_template.bbcode();
                    break;
                default:
                    editorOutput = "Editor not set!";
            }

            return editorOutput;
        }
    }



    /**
     * Do stuff when document is ready
     */
    $((function () {
        if ($shipdataexporter_sourcedata.length) ait.shipDataExporter.init();
        $shipdataexporter_sourcelabels.on('click', 'span.badge', (function (e) { ait.shipDataExporter.insertTag(e, this) }));

        $('.main-panel .content').on('click', 'button', (function() {
            window.dataLayer.push({
                'event' : 'contentButtonClicked',
                'elementText' : $(this).text(),
                'elementID' : $(this).attr('id')
            });
        }));
        $('.modal').on('click', 'button', (function() {
            window.dataLayer.push({
                'event' : 'modalButtonClicked',
                'elementText' : $(this).text(),
                'elementID' : $(this).attr('id')
            });
        }));
    }));

}(window.ait = window.ait || {}, jQuery));