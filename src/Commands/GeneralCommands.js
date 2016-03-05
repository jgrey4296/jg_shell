
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','d3','utils','Drawing/GeneralDrawing'],function(_,d3,util,GeneralDrawing){
    "use strict";

    /**
       Implements non-specific commands like loading and saving for the shell
       @implements module:Commands/CommandTemplate
       @exports Commands/GeneralCommands
    */
    var GeneralCommands = {
        /** Store the current working node on a stack 
            @param globalData
            @param values
        */
        "stash" : function(globalData,values){
            globalData.shell.stash();
        },
        /** Pop off the stack and go to that node 
            @param globalData
            @param values
        */
        "unstash" : function(globalData,values){
            globalData.shell.unstash();
        },
        /** Go to the top of the stack, without popping
            @param globalData
            @param values
        */
        "top" : function(globalData,values){
            globalData.shell.top();
        },
        /** Go To the last node prior to the current node 
            @param globalData
            @param values
        */
        "prev" : function(globalData,values){
            globalData.shell.cd(globalData.shell.previousLocation);
        },
        /** Change the active mode
            @param globalData
            @param values
        */
        "mode" : function(globalData,values){
            //get the available modes
            var modes = _.keys(globalData.commands),
                newMode = modes.indexOf(values[0]) > -1 ? values[0] : modes[0];

            //cleanup the current mode
            globalData.commands[globalData.currentCommandMode].cleanup(globalData,[]);
            //Change to new mode
            globalData.currentCommandMode = newMode;
        },
        /**
           Draw the selection (by piggy backing on draw search)
           @param globalData
           @param values
        */
        "selection" : function(globalData,values){
            var selection = globalData.currentSelection.map(d=>globalData.shell.getNode(d));
            globalData.lastSetOfSearchResults = selection;
        },
        /** Add specified nodes to the current selection
            @param globalData
            @param values
        */
        "select" : function(globalData,values){
            if(values.length === 0) { values = [globalData.shell.cwd.id]; }
            values.forEach(function(d){
                var id = Number(d);
                if(Number.isNaN(id)) { return; }
                //selection is not included, add it:
                if(globalData.currentSelection.indexOf(id) === -1){
                    globalData.currentSelection.push(id);
                }
            });
        },
        /**
           Select all results in the search column
           @param globalData
           @param values
        */
        "selectSearch" : function(globalData,values){
            globalData.shell.lastSearchResults.forEach(d=>globalData.currentSelection.push(d.id));
        },
        /** Clear the current selection 
            @param globalData
            @param values
        */
        "clearSelection" : function(globalData,values){
            globalData.currentSelection = [];
        },
        //eg: applyToSelection set tags wme 1
        //made for node::[new,rm,set,link,linkr],rule::[new,if,rm,set,rete::assert]
        /** apply the specified command to the current selection
            @param globalData
            @param values
         */
        "applyToSelection" : function(globalData,values){
            var command = globalData.lookupOrFallBack(values.shift(),globalData);
            globalData.currentSelection.forEach(function(d){
                command(globalData,values,d);                
            });
        },
        "apply" : function(globalData,values){
            GeneralCommands.applyToSelection(globalData,values);
        },
        /** print the current selection to console 
            @param globalData
            @param values
        */
        "printSelection" : function(globalData,values){
            console.log("Current Selection:",globalData.currentSelection);

        },        
        /** Search all nodes for the specified constraints 
            @param globalData
            @param values
        */ 
        "search" : function(globalData,values){
            globalData.lastSearch = "(?)."+values.join(".");
            globalData.lastSetOfSearchResults = globalData.shell.searchForFieldTagValue(values);
        },
        /** Search through the current search results further
            @param globalData
            @param values
        */
        "refine" : function(globalData,values){
            globalData.lastSetOfSearchResults = globalData.shell.searchForFieldTagValue(values,globalData.lastSetOfSearchResults);
        },
        /** Inspect the values of a node 
            @param globalData
            @param values
        */
        "inspect" : function(globalData,values){
            var nodeId = values.shift(),
                key = values.shift(),
                node = globalData.shell.allNodes[nodeId] !== undefined ? globalData.shell.allNodes[nodeId] : globalData.shell.cwd,                
                pairs = key === "#all" ? _.keys(node) : _.pairs(node[key]) || [];

            globalData.lastInspection = "(" + node.id + ")." + key;
            globalData.lastInspectData = pairs;
        },
        /** Draw the stash, search results, inspection results, and selection
            @param globalData
            @param values
        */
        "draw" : function(globalData,values){
            //Draw the Stash:
            //drawStash(globalData,globalData.shell._nodeStash);
            GeneralDrawing.drawStash(globalData,globalData.shell._nodeStash);
            //Draw search results:
            //drawSearchResults(globalData,globalData.lastSetOfSearchResults);
            console.log("Last Search results:",globalData.lastSetOfSearchResults);
            GeneralDrawing.drawSearchResults(globalData,globalData.lastSetOfSearchResults);
            
            //draw inspect data
            //drawInspectBar(globalData,globalData.lastInspectData);
            GeneralDrawing.drawInspectResults(globalData,globalData.lastInspectData);

            //TODO:
            //Draw Selection
            GeneralDrawing.drawSelection(globalData,globalData.currentSelection);

        },
        /** Load a file from the server 
            @param globalData
            @param values
        */
        "load" : function(globalData,values){
            var request = new XMLHttpRequest();
            request.onreadystatechange = function(){
                if(request.readyState===4){
                    try{
                        var receivedJson = JSON.parse(request.responseText);
                        console.log("Received JSON:",receivedJson);
                        globalData.shell.importJson(receivedJson);
                        globalData.lookupOrFallBack("draw",globalData)(globalData,[]);
                    }catch(err){
                        alert("Error loading data: \n" + err.message);
                        console.log("Error loading data:",err);
                    }
                }
            };
            request.open("GET","/data/"+values[0]+".json",true);
            request.send();
        },
        /** Import json data typed into the command line
            @param globalData
            @param values
        */
        "import" : function(globalData,values){
            try{
                //var reconstructedJsonString = values.join(" ");
                var stringMinusCommand = globalData.rawCurrentLine.replace(/^import /,"");
                var reconJson = JSON.parse(stringMinusCommand);
                globalData.shell.importJson(reconJson);
            }catch(err){
                alert("Error Importing Json String:\n" + err.message);
                console.log("Error Importing Json Data: ",err);
            }            
        },
        /** Save the current graph to the server 
            @param globalData
            @param values
        */
        "save" : function(globalData,values){
            console.log("Saving:",values);
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                if (request.readyState===4){
                    console.log("Finished");
                    console.log(request.responseText);
                }
            };
            request.open("POST","saveData="+values[0],true);
            request.send(globalData.shell.exportJson());
        },
        /** Open a new page of the exported json of the graph 
            @param globalData
            @param values
        */
        "json" : function(globalData,values){
            var text = globalData.shell.exportJson().replace(/’/g,"'").replace(/–/g,"-");
            window.exportedJson = text;

            //From: http://stackoverflow.com/questions/10472927/add-content-to-a-new-open-window
            window.open('data:application/json;' + (window.btoa?'base64,'+btoa(text):text));
        },
        /** Display the files available to be loaded
            @param globalData
            @param values
        */
        "files" : function(globalData,values){
            window.open("./data/","_blank");
        },
        /**
           Print the global data to console
        */
        "printGlobal" : function(globalData,values){
            console.log(globalData);
        },        
        /** Print the help menu for general commands 
            @param globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "load"  : [ "$fileName", " Load a specified file in to populate the shell"],
                "save"  : [ "$fileName", " Save to a specified file. With paired server ONLY"],
                "json"  : [ "", " Open a tab with the shell as json"],
                "files" : [ "", " Display a list of available files to load"],
                "stash" : [ "", " Add the current node to the temp stack."],
                "unstash": ["", " Pop off and move to the head of the temp stack."],
                "top"   : [ "", " Move to the top of the temp stack."],
                "prev"  : [ "", " Move to the node previously you were at before the current node. "],
                "search" : ["$field $tag $value", "Search for nodes with a field, tag, value. Last param is a regex"],
                "refine" : ["$field $tag $value", "Searches through the currently displayed search results"],
                "inspect" : ["$key ($id)?", "Display the values of a key. Specify $id to inspect a remote node. Use #all to inspect all keys of a node"],
                "select" : ["$nodeId?", "add the cwd or a specific node to a temp selection"],
                "clearSelection" : ["","Clear the temp selection"],
                "applyToSelection" : [ "$command","Apply new,rm,set,link,linkr,if commands to every node in the selection"],
                "printSelection" : ["","Print the node ids in the selection to console"],
                "mode"  : ["$modeType", "Changes to the specified command mode. (node,rule,rete at the moment)"]               
            };
        },
        /** Print All Conditions in the graph
            @param globalData
            @param values
        */
        "printConditions" : function(globalData,values){
            var allConditions = _.values(globalData.shell.allNodes).filter(function(node){
                if(node.tags.type === "condition"){
                    return true;
                }else{
                    return false;
                }
            });
            console.log("Conditions:",allConditions);

            //for each condition, aggregate the fields of its tests
            var aggregateObjects = allConditions.map(function(condition){
                var tests = _.keys(condition.constantTests).map(function(testId){
                    return globalData.shell.allNodes[testId];
                });
                var aggregateFields = tests.reduce(function(m,test){
                    m[test.values.field] = 1;
                    return m;
                },{});
                return aggregateFields;
            });

            console.log("Prototypes:",aggregateObjects);
        },
        /** Print all available modes 
            @param globalData
            @param values
        */
        "modes" : function(globalData,values){
            console.log("Available Modes:",_.keys(globalData.commands));

        }
    };
    
    return GeneralCommands;
});
