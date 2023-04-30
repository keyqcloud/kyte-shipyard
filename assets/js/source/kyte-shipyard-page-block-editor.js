// editor.js module
import 'https://cdn.jsdelivr.net/npm/@editorjs/editorjs@latest';
// editor.js block tool plugins
import 'https://cdn.jsdelivr.net/npm/@editorjs/header@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/link@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/raw';
import 'https://cdn.jsdelivr.net/npm/@editorjs/simple-image@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/checklist@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/list@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/embed@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/quote@latest';
import 'https://cdn.jsdelivr.net/npm/editorjs-alert@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/table@latest';
import 'https://cdn.jsdelivr.net/npm/editorjs-button@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/delimiter@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/warning@latest';
import 'https://cdn.jsdelivr.net/npm/editorjs-undo@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/paragraph@latest';
// editor.js inline toolbar plugin
import 'https://cdn.jsdelivr.net/npm/editorjs-style@latest';
import 'https://cdn.jsdelivr.net/npm/editorjs-text-color-plugin@2.0.2/dist/bundle.js';
import 'https://cdn.jsdelivr.net/npm/editorjs-tooltip@latest';
import 'https://cdn.jsdelivr.net/npm/@sotaproject/strikethrough@latest';
// editor.js tune plugin
import 'https://cdn.jsdelivr.net/npm/editorjs-text-alignment-blocktune@latest';
import 'https://cdn.jsdelivr.net/npm/@editorjs/text-variant-tune@latest';
// editor.js layout tool plugin
import 'https://cdn.jsdelivr.net/npm/@calumk/editorjs-columns@latest';
import 'https://cdn.jsdelivr.net/npm/@calumk/editorjs-paragraph-linebreakable';

var page;

// editor js tools
let element_tools = {
    style: EditorJSStyle.StyleInlineTool,
    Color: {
        class: window.ColorPlugin, // if load from CDN, please try: window.ColorPlugin
        config: {
           colorCollections: ['#EC7878','#9C27B0','#673AB7','#3F51B5','#0070FF','#03A9F4','#00BCD4','#4CAF50','#8BC34A','#CDDC39', '#FFF'],
           defaultColor: '#FF1300',
           type: 'text', 
           customPicker: true // add a button to allow selecting any colour  
        }     
    },
    Marker: {
    class: window.ColorPlugin, // if load from CDN, please try: window.ColorPlugin
    config: {
        defaultColor: '#FFBF00',
        type: 'marker',
        icon: `<svg fill="#000000" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M17.6,6L6.9,16.7c-0.2,0.2-0.3,0.4-0.3,0.6L6,23.9c0,0.3,0.1,0.6,0.3,0.8C6.5,24.9,6.7,25,7,25c0,0,0.1,0,0.1,0l6.6-0.6 c0.2,0,0.5-0.1,0.6-0.3L25,13.4L17.6,6z"></path> <path d="M26.4,12l1.4-1.4c1.2-1.2,1.1-3.1-0.1-4.3l-3-3c-0.6-0.6-1.3-0.9-2.2-0.9c-0.8,0-1.6,0.3-2.2,0.9L19,4.6L26.4,12z"></path> </g> <g> <path d="M28,29H4c-0.6,0-1-0.4-1-1s0.4-1,1-1h24c0.6,0,1,0.4,1,1S28.6,29,28,29z"></path> </g> </g></svg>`
        }       
    },
    paragraph: {
        class: editorjsParagraphLinebreakable,//Paragraph, 
        inlineToolbar: true,
        tunes: ['alignmentTune','textVariant'],
    },
    header: {
        class: Header, 
        inlineToolbar: true,
        tunes: ['alignmentTune'],
    },
    strikethrough: Strikethrough,
    delimiter: Delimiter,
    table: Table,
    linkTool: {
        class: LinkTool,
        inlineToolbar: true,
        tunes: ['alignmentTune'],
    },
    rawTool: {
        class: RawTool,
        inlineToolbar: true
    },
    imageTool: {
        class: SimpleImage,
        inlineToolbar: true,
    },
    checklistTool: {
        class: Checklist,
        inlineToolbar: true,
        tunes: ['alignmentTune'],
    },
    listTool: {
        class: List,
        inlineToolbar: true,
        config: {
            defaultStyle: 'unordered'
        },
        tunes: ['alignmentTune'],
    },
    warning: {
        class: Warning,
        tunes: ['alignmentTune'],
    },
    class: alert,
    AnyButton: {
        class: AnyButton,
        inlineToolbar: false,
        config:{
            css:{
            "btnColor": "btn--gray",
            }
        },
        tunes: ['alignmentTune'],
    },
    embedTool: {
        class: Embed,
        inlineToolbar: true,
        tunes: ['alignmentTune'],
    },
    quoteTool: {
          class: Quote,
          inlineToolbar: true,
          config: {
              quotePlaceholder: 'Enter a quote',
              captionPlaceholder: 'Quote\'s author',
          },
          tunes: ['alignmentTune'],
    },
    tooltip: {
        class: Tooltip,
        config: {
            location: 'left',
            highlightColor: '#FFEFD5',
            underline: true,
            backgroundColor: '#154360',
            textColor: '#FDFEFE',
            holder: 'editorId',
        }
    },
    // Tunes
    textVariant: TextVariantTune,
    alignmentTune: {
        class: AlignmentBlockTune,
        config:{
            default: "left",
            blocks: {
                header: 'center',
                list: 'left'
            }
        },
    }
}
let layout_tool = {
    columns : {
        class : editorjsColumns,
        EditorJsLibrary : EditorJS, // Pass the library instance to the columns instance.
        config : {
          tools : element_tools, // IMPORTANT! ref the column_tools
        }
    },
}
let main_tool = Object.assign({}, layout_tool, element_tools);

const blockEditor = new EditorJS({
    /** 
     * Id of Element that should contain the Editor 
     */ 
    holder: 'blockEditor', 
    
    /** 
     * Available Tools list. 
     * Pass Tool's class or Settings object for each Tool you want to use 
     */ 
    tools: main_tool,
    
    /**
     * Enable autofocus
     */ 
    autofocus: true,
    
    //
    // onReady: () => {
    //   new Undo({ blockEditor });
    // },
});

$(document).ready(function() {
    let sidenav = new KyteSidenav("#sidenav", subnavPage, "#Page");
    sidenav.create();
    sidenav.bind();

    $('#pageLoaderModal').modal('show');

    let hash = location.hash;
    hash = hash == "" ? '#Page' : hash;
    $(hash).removeClass('d-none');
    $(hash+'-nav-link').addClass('active');
    
    if (k.isSession()) {
        // get url param
        let idx = k.getPageRequest();
        idx = idx.idx;

        k.get("Page", "id", idx, [], function(r) {
            if (r.data[0]) {
                page = r.data[0];
                let hidden = [
                    {
                        'name': 'site',
                        'value': page.site.id
                    }
                ];

                $("#setting-page-title").val(page.title);
                $("#setting-page-description").val(page.description);
                
                if (page.page_type != 'block') {
                    let obj = {'model': 'Page', 'idx':idx};
                    let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                    window.location = '/app/page/index.html?request='+encoded;
                }

                // load blocks
                let blocks = {};
                if (page.block_layout.length > 0) {
                    try {
                        blocks = JSON.parse(page.block_layout);
                        blockEditor.blocks.render(blocks);
                    } catch(e) {
                        console.error(e+" => "+page.block_layout);
                        alert(e);
                    }
                }

                // hide after editor generation
                if (hash != '#Page') {
                    $("#Page").addClass('d-none');
                }

                let obj = {'model': 'Site', 'idx':page.site.id};
                let encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                $("#backToSite").attr('href', '/app/site/?request='+encoded);

                $("#page-title").html(page.title);
                $("#viewPage").attr('href','https://'+page.site.cfDomain+'/'+page.s3key);
                // $("#domain-name").attr('href', 'https://'+data.cfDomain);
                // $("#region").html(data.region);
                obj = {'model': 'Application', 'idx':page.site.application.id};
                encoded = encodeURIComponent(btoa(JSON.stringify(obj)));
                
                k.get('Navigation', 'site', page.site.id, [], function(r) {
                    let main_navigation = page.main_navigation ? page.main_navigation.id : 0;
                    for (data of r.data) {
                        $("#setting-main-navigation").append('<option value="'+data.id+'"'+(main_navigation == data.id ? ' selected' : '')+'>'+data.name+'</option>');
                    }
                });

                k.get('SideNav', 'site', page.site.id, [], function(r) {
                    let side_navigation = page.side_navigation ? page.side_navigation.id : 0;
                    for (data of r.data) {
                        $("#setting-side-navigation").append('<option value="'+data.id+'"'+(side_navigation == data.id ? ' selected' : '')+'>'+data.name+'</option>');
                    }
                });

                let appnav = generateAppNav(page.site.application.name, encoded);
            
                let navbar = new KyteNav("#mainnav", appnav, null, 'Kyte Shipyard<sup>&trade;</sup>', 'Sites');
                navbar.create();

                $("#saveCode").click(function() {
                    $('#pageLoaderModal').modal('show');
                    let payload = {
                        'main_navigation':$("#setting-main-navigation").val(),
                        'side_navigation':$("#setting-side-navigation").val(),
                        'title':$("#setting-page-title").val(),
                        'description':$("#setting-page-description").val(),
                    };
                    blockEditor.save().then((outputData) => {
                        payload.block_layout = JSON.stringify(outputData);
                        k.put('Page', 'id', idx, payload, null, [], function(r) {
                            $('#pageLoaderModal').modal('hide');
                        });
                    }).catch((error) => {
                        console.log('Saving failed: ', error);
                        alert('Saving failed: ', error);
                        return;
                    });
                });

                $("#publishPage").click(function() {
                    $('#pageLoaderModal').modal('show');
                    // create kyte connect js
                    let connect = "let endpoint = 'https://"+page.api_endpoint+"';var k = new Kyte(endpoint, '"+r.kyte_pub+"', '"+r.kyte_iden+"', '"+r.kyte_num+"', '"+page.application_identifier+"');k.init();\n\n";

                    let obfuscatedConnect = JavaScriptObfuscator.obfuscate(connect,
                        {
                            compact: true,
                            controlFlowFlattening: true,
                            controlFlowFlatteningThreshold: 1,
                            numbersToExpressions: true,
                            simplify: true,
                            stringArrayEncoding: ['base64'],
                            stringArrayShuffle: true,
                            splitStrings: true,
                            stringArrayWrappersType: 'variable',
                            stringArrayThreshold: 1
                        }
                    );
                    console.log(obfuscatedConnect);
                    
                    let payload = {
                        'main_navigation':$("#setting-main-navigation").val(),
                        'side_navigation':$("#setting-side-navigation").val(),
                        'title':$("#setting-page-title").val(),
                        'description':$("#setting-page-description").val(),
                        'state': 1,
                        'kyte_connect': connect
                    };
                    blockEditor.save().then((outputData) => {
                        payload.block_layout = JSON.stringify(outputData);
                        k.put('Page', 'id', idx, payload, null, [], function(r) {
                            $('#pageLoaderModal').modal('hide');
                        }, function(err) {
                            if (err == 'Unable to create new invalidation') {
                                setTimeout(() => {
                                    k.put('Page', 'id', idx, payload, null, [], function(r) {
                                        $('#pageLoaderModal').modal('hide');
                                    }, function(err) {
                                        alert(err);
                                        $('#pageLoaderModal').modal('hide');
                                    });
                                }, "500");
                            } else {
                                alert(err);
                                $('#pageLoaderModal').modal('hide');
                            }
                        });
                    }).catch((error) => {
                        console.log('Saving failed: ', error);
                        alert('Saving failed: ', error);
                        return;
                    });
                });
            } else {
                alert("ERROR");
            }
            $('#pageLoaderModal').modal('hide');
        });

    } else {
        location.href="/?redir="+encodeURIComponent(window.location);
    }
});