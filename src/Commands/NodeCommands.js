define(['utils','underscore','Drawing/NodeDrawing'],function(util,_,NodeDraw){
    "use strict";
    //All of the commands for the normal node mode of the shell
    /**
       To define the user actions that can be performed on a typical node in the shell
       @implements module:Commands/CommandTemplate
       @exports Commands/NodeCommands
    */
    var nodeCommands = {
        /** Draw */
        "draw" : function(globalData,values){
            if(NodeDraw.dummy === undefined){
                NodeDraw.drawNode(globalData,globalData.shell.cwd);
            }
        },
        /** Cleanup */
        "cleanup" : function(globalData, values){
            if(NodeDraw.dummy === undefined){
                NodeDraw.cleanup();
            }
        },
        /** Print a Node to Console */
        "printNode" : function(globalData,values){
            console.log(globalData.shell.cwd);
        },
        /** Print the shell to console */
        "printShell" : function(globalData,values){
            console.log(globalData.shell);
        },
        /** Create a new node */
        "new" : function(globalData,values,sourceId){
            //new -> addNode,
            //Expand out simplifications
            var target = values[0];
            if(target === "child") { target = "children"; }
            if(target === "parent") { target  = "parents"; }
            console.log("Target:",target);
            globalData.shell.addNode(values[2],target,values[1],values.slice(3),sourceId);
        },
        /** new child utility function */
        "nc" : function(globalData,values){
            var chars = {
                "n" : "node",
                "i" : "institution",
                "r" : "role",
                "a" : "activity",
                "rc": "rulecontainer",
            };
            if(chars[values[0]]){
                globalData.shell.addNode(values[1],'children',chars[values[0]],values.slice(2));
            }else{
                globalData.shell.addNode(values[1],'children',values[0],values.slice(2));
            }
        },
        /** new parent */
        "np" : function(globalData,values){
            var chars = {
                "n" : "node",
                "i" : "institution",
                "r" : "role",
                "a" : "activity",
                "rc": "rulecontainer",
            };
            if(chars[values[0]]){
                globalData.shell.addNode(values[1],'parents',chars[values[0]],values.slice(2));
            }else{
                globalData.shell.addNode(values[1],'parents',values[0],values.slice(2));
            }
        },
        /** New Child Node */
        "ncn" : function(globalData,values){
            globalData.shell.addNode(values[0],'children','node');
        },
        /** New Child Institution */
        "nci" : function(globalData,values){
            globalData.shell.addNode(values[0],'children','institution');
        },
        /** Remove Node */
        "rm" : function(globalData,values,sourceId){
            //rm -> removeNode,
            globalData.shell.rm(values[0],values[1],values[2],sourceId);
        },
        /** Change Working node */
        "cd" : function(globalData,values){
            //cd -> cd
            globalData.shell.cd(values[0]);
        },
        /** Set */
        "set" : function(globalData,values,sourceId){
            //set -> setParameter
            globalData.shell.setParameter(values[0],values[1],values[2],sourceId);
        },
        /** link */
        "link" : function(globalData,values,sourceId){
            //link -> link
            var target = values[0];
            if(target === 'child') { target = 'children'; }
            if(target === 'parent') { target = 'parents'; }
            globalData.shell.link(target,values[1],false,sourceId);
        },
        /** linkr */
        "linkr" : function(globalData,values,sourceId){
            var target = values[0];
            if(target === 'child') { target = 'children'; }
            if(target === 'parent') { target = 'parents'; }
            globalData.shell.link(target,values[1],true,sourceId);

        },
        /** rename */
        "rename" : function(globalData,values){
            //rename -> rename
            globalData.shell.rename(values[0]);
        },
        /** help */
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
