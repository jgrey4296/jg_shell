//Setup requirejs
//For soe server: baseUrl -> /~jgrey/src
//and libs -> /~jgrey/libs
require.config({
    baseUrl: "/src",
    paths:{
        //General Utils
        underscore : "/libs/underscore-min",
        //uContrib : "/libs/underscore-contrib.min",
        utils : "utils",
        d3 : "/libs/d3.min",
        Parse : "Parse/Parse",
        //Nodes:
        GraphNode : "Node/GraphNode",
        //Commands:
        AllCommands : "Commands/Command_Aggregate",
        //CLI
        HelpCLI : "CLI/HelpCLI",
        MainCommandCLI : "CLI/MainCommandCLI",
        //Shell
        Shell : "Shell",
        //Shell : "/libs/Shell.min",
        //Rete
        Rete : "/libs/Rete.min",
        ReteAlert : "ReteActions/alertAction",
        //Simulation:
        Simulation : "Simulation/Simulation"
    },
    shim:{
        'underscore' :{
            exports:'_'
        },
    }
});

/**
   The main web program. Creates a shell, visualises it, and listens for user input
   @module Browser/WebMain
   @requires d3
   @requires underscore
   @requires module:Shell
   @requires module:Commands/NodeCommands
   @requires module:Commands/RuleCommands
   @requires module:Commands/ReteCommands
   @requires module:utils
   @see module:globalData
*/
require(['d3','Shell','underscore',"HelpCLI","MainCommandCLI","AllCommands",'ReteAlert'],function(d3,Shell,_,HelpCLI,MainCommandCLI,AllCommands,ReteAlert){
    "use strict";

    /**
       The Data Passed around for global purposes
       @exports globalData
    */
    var globalData = {
        /** The maximum allowed number of nodes in a column before grouping. */
        maxNumberOfNodesInAColumn : 10,
        /** The maximum number of children to display at one time */
        maxNumberOfChildrenVisible : 40,

        /** 
            Command aggregate object stored here, giving interface to commands:
            @see module:Commands/Command_Aggregate
        */
        commands : AllCommands,
        
        /** The order that commands will be checked if they arent found in the current mode */
        commandFallBackOrder : [
            "node","rule","fsm","rete","sim","general","bookmark","trace"
        ],

        //A lookup to automatically set the mode based on node type:
        nodeModeLookup : {
            'graphnode' : 'node',
            'node' : 'node',
            'fsm' : 'fsm',
            'rule' : 'rule',
            'state' : 'fsm',
            'event' : 'fsm',
            'condition' : 'node',
            'action' : 'node'
        },
        
        /** State for control of modes */
        modeState : {
            "rete" : {},
            "node" : {},
            "rule" : {},
        },
        
        /** The current command node to use initially AS A QUEUE */
        currentCommandMode : ['node'],
        
        /** The Shell the web component uses
            @type {Shell}
         */
        shell : null,

        /** The last set of nodes found by searching
            @type {Array.<Node/GraphNode>}
        */
        lastSetOfSearchResults : [],
        /** The last component set to be inspected
            @type {Array}
        */
        lastInspectData : [],
        /** The current set of selected node ids
            @type {Node/GraphNode#id}
        */
        currentSelection : [],

        /**
           Rete outputs:
           @type {Array}
         */
        reteOutput : [],

        /**
           Trace output
           @type {Object}
        */
        lastTraces : {
            id : null,
            name : null,
            values : null
        },
        
        /**
           General Reference to the CLI, to allow internal commands to be called easily
           @see module:CLI/MainCommandCLI
         */
        MainCommandCLIRef : MainCommandCLI,

        
        scaleToColour : d3.scale.linear()
            .range([0,20])
            .domain([0,20]),
        colourScale : d3.scale.category20b(),
        /**
           Colours to use in the visualisations
         */
        colours : {
            grey : d3.rgb(19,21,27),
            greyTwo : d3.rgb(40,40,40),
            text : d3.rgb(237,255,255),
            textBlue : d3.rgb(98,188,238),
            textGrey : d3.rgb(132,146,154),
            darkBlue : d3.rgb(23,50,77),
            darkerBlue : d3.rgb(20,38,60),
            lightBlue: d3.rgb(53,99,142),
            green : d3.rgb(108,141,7),

            //from trapdoor palette:
            title : d3.rgb("#da7346"),
            test : d3.rgb("#927a82"),
            binding : d3.rgb("#6cbd6c"),
            link : d3.rgb("#684828"),
            tags : d3.rgb("#383820"),
            data : d3.rgb("#887668"),
            arith : d3.rgb("#308888"),
            regex : d3.rgb("#7a2a1e"),
            priority : d3.rgb("#cf8f8e"),

            warning : d3.rgb("red"),
            
            //Specifics?
            //node
            //rule
            //action
            //condition
            //interiorRect1
            //interiorRect2
            //interiorRect3
            regexAction : "rgb(123,23,5)"
            
        },

        /** The draw offset for a component */
        drawOffset : 50,
        /** The height of a column */
        columnHeight : 300,
        /** The width of a column */
        columnWidth : 200,
        /** The total width on the screen available for use */
        usableWidth : window.innerWidth - 30,
        /** The total height on the screen available for use */
        usableHeight : window.innerHeight - 30,
        /** The Size of the help window */
        helpSize : 600,

        /** Utility function to get the mid point based on usable width */
        halfWidth : function(){ return this.usableWidth * 0.5;},
        /** Utility function to get the mid point based on usable height */
        halfHeight : function(){ return this.usableHeight * 0.5;},
        
        /** The main svg of the view */
        svg : null,
        
        /** Calculate the width of a column
            @param availableWidth
            @param noOfColumsn 
        */
        calcWidth : function(availableWidth,noOfColumns){
            return availableWidth / (noOfColumns + 2);
        },
        /**
           Calculate the position of a column
           @param oneColWidth
           @param columnNumber
         */
        columnPosition : function(oneColWidth,columnNumber){
            return oneColWidth + (oneColWidth * columnNumber);
        },

        /**
           Lookup a command, falling back in order to find the first available match
           @param commandName
           @param globalData
         */
        lookupOrFallBack : function(commandName,globalData,mode){
            if(globalData === undefined) { globalData = this; }
            mode = mode || globalData.currentCommandMode[0];
            let commandToExecute;

            //Check the current command mode:
            if(mode && globalData.commands[mode] && globalData.commands[mode][commandName]){
                //console.log("Command Search: Found");
                commandToExecute = globalData.commands[mode][commandName];
            }else{        
                //command not found, fallback
                //console.log("Command Search: Fallback");
                let fallBacks = _.clone(globalData.commandFallBackOrder);
                while(fallBacks.length > 0){
                    let currentFallback = fallBacks.shift();
                    if(globalData.commands[currentFallback][commandName] !== undefined){
                        commandToExecute = globalData.commands[currentFallback][commandName];
                        break;
                    }
                }
            }
            return commandToExecute;
        },

        
    };
    //Create the shell, passing global data in as context for retealert
    globalData.shell = new Shell([ReteAlert(globalData)]),

    
    //End of utilities
    //--------------------
    //Set up CLI:
    d3.select("#shellInput").on("keydown",function(err){
        try{
            var currentLine = d3.select(this).node().value;
            if(currentLine.length === 0) { return; }
            
            if(d3.event.keyCode === 13){ //ENTER
                //clear the input:
                d3.select(this).node().value = "";
                MainCommandCLI(currentLine,globalData);
            }else{//Not enter, still typing:
                HelpCLI(currentLine + d3.event.key,globalData);
            }
        }catch(e){
            console.log("Input Error: ",e);
        }
    });

    //----------------------------------------
    //Startup:
    //set focus:
    d3.select("#shellInput").node().focus();
    //Setup the svg:
    globalData.svg = d3.select("body").insert("svg","#shellInput")
        .attr("width",globalData.usableWidth)
        .attr("height",globalData.usableHeight)
        .style("background",globalData.colours.grey);

    MainCommandCLI("",globalData);
    
});


