/**
   @file altWebMain
 */

//Setup requirejs
//For soe server: baseUrl -> /~jgrey/src
//and libs -> /~jgrey/libs
require.config({
    baseUrl: "/src",
    paths:{
        //General Utils
        underscore : "/libs/underscore",
        uContrib : "/libs/underscore-contrib.min",
        utils : "utils",
        d3 : "/libs/d3.min",
        Parse : "Parse/Parse",
        //Nodes:
        GraphNode : "Node/GraphNode",
        GraphStructureConstructors:"Node/GraphStructureConstructors",
        //Commands
        NodeCommands : "Commands/NodeCommands",
        RuleCommands : "Commands/RuleCommands",
        ReteCommands : "Commands/ReteCommands",
        GeneralCommands: "Commands/GeneralCommands",
        SimulationCommands : "Commands/SimulationCommands",
        BookMarkCommands : "Commands/BookMarkCommands",
        TraceCommands : "Commands/TraceCommands",
        //CLI
        HelpCLI : "CLI/HelpCLI",
        MainCommandCLI : "CLI/MainCommandCLI",
        //Shell
        TotalShell : "TotalShell",
        //Rete
        Rete : "/libs/Rete.min"
    },
    shim:{
        underscore :{
            exports:'_'
        },
        uContrib :{
            exports :'_'
        },
    }
});

/**
   @require [d3,TotalShell,underscore,NodeCommands,RuleCommands,ReteCommands,utils]
   @purpose The main web program. Creates a shell, visualises it, and listens for user input
*/
require(['d3','TotalShell','underscore',"NodeCommands","RuleCommands","ReteCommands","utils","GeneralCommands","HelpCLI","MainCommandCLI","SimulationCommands","BookMarkCommands","TraceCommands"],function(d3,Shell,_,NodeCommands,RuleCommands,ReteCommands,utils,GeneralCommands,HelpCLI,MainCommandCLI,SimulationCommands,BookMarkCommands,TraceCommands){
    "use strict";

    //----------------------------------------
    //GLOBALS
    //----------------------------------------
    var globalData = {
        maxNumberOfNodesInAColumn : 10,
        maxNumberOfChildrenVisible : 40,

        //Commands stored in here:
        commands : {
            "node" : NodeCommands,
            "rule" : RuleCommands,
            "rete" : ReteCommands,
            "general" : GeneralCommands,
            "sim"  : SimulationCommands,
            "bookmark" : BookMarkCommands,
            "trace" : TraceCommands,
        },
        //The order that commands will be checked if they arent found in the current mode
        commandFallBackOrder : [
            "node","rule","rete","sim","general","bookmark","trace"
        ],
        
        currentCommandMode : "node",
    
        //The simulated shell:
        shell : new Shell.CompleteShell(),

        lastSetOfSearchResults : [],
        MainCommandCLIRef : MainCommandCLI,

        //selection for applying actions to multiple nodes
        currentSelection : [],
        
        //COLOURS:
        scaleToColour : d3.scale.linear()
            .range([0,20])
            .domain([0,20]),
        colourScale : d3.scale.category20b(),
        colours : {
            grey : d3.rgb(19,21,27),
            text : d3.rgb(237,255,255),
            textBlue : d3.rgb(98,188,238),
            textGrey : d3.rgb(132,146,154),
            darkBlue : d3.rgb(23,50,77),
            darkerBlue : d3.rgb(20,38,60),
            lightBlue: d3.rgb(53,99,142),
            green : d3.rgb(108,141,7),

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

        //Sizes:
        drawOffset : 50,
        columnHeight : 300,
        columnWidth : 200,
        usableWidth : window.innerWidth - 30,
        usableHeight : window.innerHeight - 30,
        helpSize : 600,

        halfWidth : function(){ return this.usableWidth * 0.5;},
        halfHeight : function(){ return this.usableHeight * 0.5;},
        
        //The main svg:
        svg : null,
        //Columns:
        columns : {},

    //Utility Functions:
        calcWidth : function(availableWidth,noOfColumns){
            return availableWidth / (noOfColumns + 2);
        },

        columnPosition : function(oneColWidth,columnNumber){
            return oneColWidth + (oneColWidth * columnNumber);
        },
   
        getColumnObject : function(columnName){
            if(globalData.columns[columnName] === undefined){
                throw new Error("Unrecognised Column Name: " + columnName);
            }
            return globalData.columns[columnName];
        },

        initColumn : function(name,columnNumber,columnWidth){
            //todo
        },

        lookupOrFallBack : function(commandName,globalData){
            if(globalData === undefined) globalData = this;
            var commandToExecute;
            if(globalData.commands[globalData.currentCommandMode]
               && globalData.commands[globalData.currentCommandMode][commandName]){
                //console.log("Command Search: Found");
                commandToExecute = globalData.commands[globalData.currentCommandMode][commandName];
            }else{        
                //command not found, fallback
                //console.log("Command Search: Fallback");
                var fallBacks = _.clone(globalData.commandFallBackOrder);
                while(fallBacks.length > 0){
                    var currentFallback = fallBacks.shift();
                    if(globalData.commands[currentFallback][commandName] !== undefined){
                        commandToExecute = globalData.commands[currentFallback][commandName];
                    }
                }
            }
            return commandToExecute;
        },

        
    };
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
        }catch(err){
            console.log("Input Error: ",err);
        }
    });

    //----------------------------------------
    //Startup:
    //set focus:
    d3.select("#shellInput").node().focus();
    //Setup the svg:
    globalData.svg = d3.select("body").append("svg")
        .attr("width",globalData.usableWidth)
        .attr("height",globalData.usableHeight)
        .style("background",globalData.colours.grey);

    MainCommandCLI("",globalData);
    
});


