import _ from 'lodash';
import { util } from '../utils';


/**
   Implements non-specific commands like loading and saving for the shell
   @implements module:Commands/CommandTemplate
   @exports Commands/GeneralCommands
*/
let GeneralCommands = {
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
        let modes = _.keys(globalData.commands),
            newMode = modes.indexOf(values[0]) > -1 ? values[0] : null;

        globalData.currentCommandMode.unshift(newMode);
    },
    /**
       specify the regex for node children/parent connections
    */
    "view" : function(globalData,values){
        console.log("View values:",values);
        let mode = values.shift(),
            regex1 = values.shift(),
            regex2 = values.shift();
        
        if (mode && globalData.modeState[mode] !== undefined){
            if (regex1 !== undefined && regex1 !== "/"){
                globalData.modeState[mode].left = new RegExp(regex1);
            } else {
                globalData.modeState[mode].left = null;
            }
            if (regex2 !== undefined && regex2 !== '/'){
                globalData.modeState[mode].right = new RegExp(regex2);
            } else {
                globalData.modeState[mode].right = null;
            }
        }
        console.log(globalData.modeState);
    },
    /**
       Draw the selection (by piggy backing on draw search)
       @param globalData
       @param values
    */
    "selection" : function(globalData,values){
        let selection = globalData.currentSelection.map(d=>globalData.shell.getNode(d));
        globalData.lastSetOfSearchResults = selection;
    },
    /** Add specified nodes to the current selection
        @param globalData
        @param values
    */
    "select" : function(globalData,values){
        if (values.length === 0) { values = [globalData.shell.cwd.id]; }
        values.forEach((d) => {
            let id = Number(d);
            if (Number.isNaN(id)) { return; }
            //selection is not included, add it:
            if (globalData.currentSelection.indexOf(id) === -1){
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
        let command = globalData.lookupOrFallBack(values.shift(),globalData);
        globalData.currentSelection.forEach((d) => {
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
        let nodeId = values.shift(),
            key = values.shift(),
            node = globalData.shell.allNodes[nodeId] !== undefined ? globalData.shell.allNodes[nodeId] : globalData.shell.cwd,
            pairs = key === "#all" ? _.keys(node) : _.toPairs(node[key]) || [];

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
        ////GeneralDrawing.drawStash(globalData,globalData.shell._nodeStash);
        //Draw search results:
        //drawSearchResults(globalData,globalData.lastSetOfSearchResults);
        //console.log("Last Search results:",globalData.lastSetOfSearchResults);
        ////GeneralDrawing.drawSearchResults(globalData,globalData.lastSetOfSearchResults);
        
        //draw inspect data
        //drawInspectBar(globalData,globalData.lastInspectData);
        ////GeneralDrawing.drawInspectResults(globalData,globalData.lastInspectData);

        //TODO:
        //Draw Selection
        ////GeneralDrawing.drawSelection(globalData,globalData.currentSelection);

    },
    /** Load a file from the server
        @param globalData
        @param values
    */
    "load" : function(globalData,values){
        let request = new XMLHttpRequest();
        request.onreadystatechange = function(){
            if (request.readyState===4){
                try {
                    let receivedJson = JSON.parse(request.responseText);
                    console.log("Received JSON:",receivedJson);
                    globalData.shell.importJson(receivedJson);
                    globalData.lookupOrFallBack("draw",globalData)(globalData,[]);
                } catch (err){
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
        try {
            //let reconstructedJsonString = values.join(" ");
            let stringMinusCommand = globalData.rawCurrentLine.replace(/^import /,"");
            let reconJson = JSON.parse(stringMinusCommand);
            globalData.shell.importJson(reconJson);
        } catch (err){
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
        let request = new XMLHttpRequest();
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
        let text = globalData.shell.exportJson().replace(/’/g,"'").replace(/–/g,"-");
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
            "stash" : ["","Temporarily store the current node in a stack"],
            "unstash" : ["","Pop off from the temp store, and move to that node"],
            "top" : ["","Move to the top of the stack, but don't pop"],
            "prev" : ["","Move to the node you were at immediately prior to the current node"],
            "mode" : ["$modeName","Change to the specified mode, prioritises that modes commands, and drawing routines"],
            "selection" : ["","Display in the left sidebar the currently selected nodes"],
            "select" : ["$nodeId $nodeId..","Add the specified nodes to a selection list"],
            "selectSearch" : ["","Copy the selection into the search result list"],
            "clearSelection" : ["","Empty the selection list"],
            "applyToSelection" : ["$command $vars...","Apply the command to every node in the selection. Ie: 'set tags type test'"],
            "apply" : ["$command $vars","Synonym for applyToSelection"],
            "printSelection" : ["","Print the selection list to the console"],
            "search" : ["$field $tag $tagValue?","Search all nodes for the specified (regex) pattern. Ie: 'search tags type node'"],
            "refine" : ["$field $tag $tagValue?","Search the current search results, further constraining them"],
            "inspect" : ["$id [#all $field]","Display details about a node in the right sidebar"],
            "load" : ["$fileName","Load a json file from the server"],
            "import" : ["$rawJSONString","Import a raw json string copy pasted into the cli bar"],
            "json" : ["","Open a new tab with the pretty printed json of the current shell displayed"],
            "files" : ["","Display in a new tab the files available for loading"],
            "printGlobal" : ["","Print the global object to the console"]
            
        };
    },
    /** Print All Conditions in the graph
        @param globalData
        @param values
    */
    "printConditions" : function(globalData,values){
        let allConditions = _.values(globalData.shell.allNodes).filter((node) => {
            if (node.tags.type === "condition"){
                return true;
            }
                return false;
            
        });
        console.log("Conditions:",allConditions);

        //for each condition, aggregate the fields of its tests
        let aggregateObjects = allConditions.map((condition) => {
            let tests = _.keys(condition.constantTests).map((testId) => {
                return globalData.shell.allNodes[testId];
            });
            let aggregateFields = tests.reduce((m,test) => {
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

    },
    /**
       debug command to check for disconnected nodes
    */
    "printDisconnected" : function(globalData,values){
        //from the root, dfs for ['children','parents','conditions','actions','events','states',
        //and expectation nodes etc, statepairs,
        let allNodes = _.keys(globalData.shell.allNodes).map(d=>parseInt(d,10)),
            foundNodes = globalData.shell.dfs('0'),
            unconnected = _.difference(allNodes,foundNodes);

        console.log("AllNodes:",allNodes);
        console.log("Found Nodes:",foundNodes);
        console.log("Unconnected:",unconnected);
    }
    
};

export { GeneralCommands };

