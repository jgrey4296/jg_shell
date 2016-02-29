
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
        /** stash */
        "stash" : function(globalData,values){
            globalData.shell.stash();
        },
        /** unstash */
        "unstash" : function(globalData,values){
            globalData.shell.unstash();
        },
        /** top */
        "top" : function(globalData,values){
            globalData.shell.top();
        },
        /** prev */
        "prev" : function(globalData,values){
            globalData.shell.cd(globalData.shell.previousLocation);
        },
        /** Change Mode */
        "mode" : function(globalData,values){
            //get the available modes
            var modes = _.keys(globalData.commands),
                newMode = modes.indexOf(values[0]) > -1 ? values[0] : modes[0];

            //cleanup the current mode
            globalData.commands[globalData.currentCommandMode].cleanup(globalData,[]);
            //Change to new mode
            globalData.currentCommandMode = newMode;
        },
        /** Select nodes */
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
        /** Clear Selection */
        "clearSelection" : function(globalData,values){
            globalData.currentSelection = [];
        },
        //eg: applyToSelection set tags wme 1
        //made for node::[new,rm,set,link,linkr],rule::[new,if,rm,set]
        //rete::assert
        "applyToSelection" : function(globalData,values){
            var command = globalData.lookupOrFallBack(values.shift(),globalData);
            globalData.currentSelection.forEach(function(d){
                command(globalData,values,d);                
            });
        },
        /** print selection to console */
        "printSelection" : function(globalData,values){
            console.log("Current Selection:",globalData.currentSelection);

        },        
        /** Search */ 
        "search" : function(globalData,values){
            globalData.lastSearch = "(?)."+values.join(".");
            globalData.lastSetOfSearchResults = globalData.shell.searchForFieldTagValue(values);
        },
        /** refine a search */
        "refine" : function(globalData,values){
            globalData.lastSetOfSearchResults = globalData.shell.searchForFieldTagValue(values,globalData.lastSetOfSearchResults);
        },
        /** inspect */
        "inspect" : function(globalData,values){
            var nodeId = values.shift(),
                key = values.shift(),
                node = globalData.shell.allNodes[nodeId] !== undefined ? globalData.shell.allNodes[nodeId] : globalData.shell.cwd,                
                pairs = key === "#all" ? _.keys(node) : _.pairs(node[key]) || [];

            globalData.lastInspection = "(" + node.id + ")." + key;
            globalData.lastInspectData = pairs;
        },
        /** Draw */
        "draw" : function(globalData,values){
            //Draw the Stash:
            //drawStash(globalData,globalData.shell._nodeStash);
            GeneralDrawing.drawStash(globalData,globalData.shell._nodeStash);
            //Draw search results:
            //drawSearchResults(globalData,globalData.lastSetOfSearchResults);
            GeneralDrawing.drawSearchResults(globalData,globalData.lastSetOfSearchResults);
            
            //draw inspect data
            //drawInspectBar(globalData,globalData.lastInspectData);
            GeneralDrawing.drawInspectResults(globalData,globalData.lastInspectData);

            //TODO:
            //Draw Selection
            GeneralDrawing.drawSelection(globalData,globalData.currentSelection);

        },
        /** Load a file from the server */
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
        /** Import a text form of json data: */
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
        /** Save the current graph to the server */
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
        /** Json */
        "json" : function(globalData,values){
            var text = globalData.shell.exportJson().replace(/’/g,"'").replace(/–/g,"-");
            window.exportedJson = text;

            //From: http://stackoverflow.com/questions/10472927/add-content-to-a-new-open-window
            window.open('data:application/json;' + (window.btoa?'base64,'+btoa(text):text));
        },
        /** Files */
        "files" : function(globalData,values){
            window.open("./data/","_blank");
        },
        /** Help */
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
        /** print Conditions to console */
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
        /** Modes */
        "modes" : function(globalData,values){
            console.log("Available Modes:",_.keys(globalData.commands));

        }
    };
    
    return GeneralCommands;
});
