define(['utils','underscore','Drawing/NodeDrawing'],function(util,_,NodeDraw){
    "use strict";
    //All of the commands for the normal node mode of the shell
    /**
       To define the user actions that can be performed on a typical node in the shell
       @implements module:Commands/CommandTemplate
       @exports Commands/NodeCommands
    */
    var nodeCommands = {
        /** Draw a Node and its parents+children 
         @param globalData
         @param values
         */
        "draw" : function(globalData,values){
            if(NodeDraw.dummy === undefined){
                NodeDraw.drawNode(globalData,globalData.shell.cwd);
            }
        },
        /** Cleanup the drawn node/parents/children
            @param globalData
            @param values
         */
        "cleanup" : function(globalData, values){
            if(NodeDraw.dummy === undefined){
                NodeDraw.cleanup();
            }
        },
        /** Print a Node to Console 
            @param globalData
            @param values
         */
        "printNode" : function(globalData,values){
            console.log(globalData.shell.cwd);
        },
        /** Print the shell to console 
            @param globalData
            @param values
         */
        "printShell" : function(globalData,values){
            console.log(globalData.shell);
        },
        /** Create a new node 
            @param globalData
            @param values
            @param sourceId
         */
        "new" : function(globalData,values,sourceId){
            //new -> addNode,
            //Expand out simplifications
            var target = values[0];
            if(target === "child") { target = "children"; }
            if(target === "parent") { target  = "parents"; }
            console.log("Target:",target);
            globalData.shell.addNode(values[2],target,values[1],values.slice(3),sourceId);
        },
        /** new child utility function 
            @param globalData
            @param values
         */
        "nc" : function(globalData,values){
            const chars = new Map([
                ["n" , "node"],
                ["i" , "institution"],
                ["r" , "role"],
                ["a" , "activity"],
                ["rc", "rulecontainer"],
            ]);
            if(chars.has(values[0])){
                globalData.shell.addNode(values[1],'children',chars.get(values[0]),values.slice(2));
            }else{
                globalData.shell.addNode(values[1],'children',values[0],values.slice(2));
            }
        },
        /** new parent 
            @param globalData
            @param values
         */
        "np" : function(globalData,values,sourceId){
            var chars = {
                "n" : "node",
                "i" : "institution",
                "r" : "role",
                "a" : "activity",
                "rc": "rulecontainer",
            };
            if(chars[values[0]]){
                globalData.shell.addNode(values[1],'parents',chars[values[0]],values.slice(2),sourceId);
            }else{
                globalData.shell.addNode(values[1],'parents',values[0],values.slice(2),sourceId);
            }
        },
        /** New Child Node 
            @param globalData
            @param values
         */
        "ncn" : function(globalData,values,sourceId){
            console.log("ncn:",values,sourceId);
            globalData.shell.addNode(values[0],'children','node',undefined,sourceId);
        },
        /** New Child Institution 
            @param globalData
            @param values
         */
        "nci" : function(globalData,values){
            globalData.shell.addNode(values[0],'children','institution');
        },
        /** Remove Node 
            @param globalData
            @param values
            @param sourceId
         */
        "rm" : function(globalData,values,sourceId){
            //rm -> removeNode,
            globalData.shell.rm(values[0],values[1],values[2],sourceId);
        },
        /** Change Working node 
            @param globalData
            @param values
        */
        "cd" : function(globalData,values){
            //cd -> cd
            globalData.shell.cd(values[0]);
        },
        /** Set 
            @param globalData
            @param values
            @param sourceId
        */
        "set" : function(globalData,values,sourceId){
            //set -> setParameter
            globalData.shell.setParameter(values[0],values[1],values[2],sourceId);
        },
        /**
           sv: shortcut for set values
           @param globalData
           @param values
           @param sourceId
        */
        "sv" : function(globalData,values,sourceId){
            globalData.shell.setParameter("values",values[0],values[1],sourceId);
        },
        /**
           st : shortcut for set tags
           @param globalData
           @param values
           @param sourceId
        */
        "st" : function(globalData,values,sourceId){
            globalData.shell.setParameter("tags",values[0],values[1],sourceId);
        },        
        /** link a node to another one
            @param globalData
            @param values
            @param sourceId
        */
        "link" : function(globalData,values,sourceId){
            //link -> link
            var target = values[0];
            if(target === 'child') { target = 'children'; }
            if(target === 'parent') { target = 'parents'; }
            globalData.shell.link(target,values[1],false,sourceId);
        },
        /** Link two nodes, reciprocally
            @param globalData
            @param values
            @param sourceId
         */
        "linkr" : function(globalData,values,sourceId){
            var target = values[0];
            if(target === 'child') { target = 'children'; }
            if(target === 'parent') { target = 'parents'; }
            globalData.shell.link(target,values[1],true,sourceId);

        },
        /** Rename the node 
            @param globalData
            @param values
         */
        "rename" : function(globalData,values){
            //rename -> rename
            globalData.shell.rename(values[0]);
        },
        /**
           Copy a node to be a child of a different node
           @param globalData
           @param values Comprised of 
           @param nodeToCopy the source node to copy
           @param target the target to copy to
           @param deepOrNot whether to dfs the copy, or do it shallowly
         */
        "cp" : function(globalData,values){
            var nodeToCopy = values.shift(),
                target = values.shift(),
                deepOrNot = values.shift();
            globalData.shell.copyNode(nodeToCopy,target);
        },
        /** help 
            @param globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "help#general" : ["", "Display General Commands Help"],
                "new"   : ["$target $type $name", "Add a node to the graph."],
                "nc"    : [ "[n | i | r | a ] $name", " Shortcuts for adding children. Nodes, institutions, roles, activities."],
                "np"    : [ "[n | i | r | a ] $name", " Shortcuts for adding parents."],
                "[ncn | nci]" : [ "$name", "new child node/institution."],
                "rm"    : [ "$id", " Remove a node by id number."],
                "cd"    : [ "[.. | $name | $id]", " Move to a node by name or id."],
                "rename": [ "$name", " Rename a node."],
                "set"   : [ "$field $parameter $value", " Set a value of a node. ie: set tag type myType."],
                "link"  : [ "$target $id", " Link two existing nodes."],
                "linkr" : [ "$target $id", " Link two existing nodes reciprocally."],
                "search" : [ "$target $pattern $focusType", " Search for all nodes where a pattern applied to a type in the target field matches."],
            };
        }
    };

    return nodeCommands;
});
