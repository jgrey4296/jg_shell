({
    //http://www.sitepoint.com/building-library-with-requirejs/
    baseUrl: "./src",
    paths : {
        requireLib : "../node_modules/requirejs/require",
        lodash : "../libs/lodash.min",
        //underscore : "../libs/underscore-min",
        d3 : "../libs/d3.min",
        Parse : "Parse",
        GraphNode : "Node/GraphNode",
        //CLI
        HelpCLI : "CLI/HelpCLI",
        MainCommandCLI : "CLI/MainCommandCLI",
        //Shell
        Shell : "Shell",
        //Rete
        Rete : "../libs/Rete.min",
        //Simulation:
        Simulation : "Simulation/Simulation"
    },
    shim: {
        //underscore : {
        //    exports : "_"
        //}
    },
    exclude : ['lodash'],
    //keepAmdefine : true,
    include : ['../node_modules/almond/almond','Shell'],
    //cjsTranslate : true,
    name : "Shell",
    //insertRequire : [ "Shell"],
    out: "./libs/Shell.min.js",
    optimize: "none",
    wrap : {
        startFile : "startWrap.js",
        end : "define('lodash',function() { return _; }); return require('Shell'); }));"
    },
});
