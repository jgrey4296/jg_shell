({
    //http://www.sitepoint.com/building-library-with-requirejs/
    baseUrl: "./src",
    paths : {
        requireLib : "../node_modules/requirejs/require",
        underscore : "../libs/underscore-min",
        d3 : "../libs/d3.min",
        Parse : "Parse/Parse",
        GraphNode : "Node/GraphNode",
        //CLI
        HelpCLI : "CLI/HelpCLI",
        MainCommandCLI : "CLI/MainCommandCLI",
        //Shell
        TotalShell : "TotalShell",
        //Rete
        Rete : "../libs/Rete.min"

    },
    shim: {
        underscore : {
            exports : "_"
        }
    },
    exclude : ['underscore'],
    //keepAmdefine : true,
    include : ['../node_modules/almond/almond','TotalShell'],
    //cjsTranslate : true,
    name : "TotalShell",
    insertRequire : [ "TotalShell"],
    out: "./libs/Shell.min.js",
    optimize: "none",
    wrap : {
        startFile : "startWrap.js",
        end : "define('underscore',function() { return _; }); return require('TotalShell'); }));"
    },
})
