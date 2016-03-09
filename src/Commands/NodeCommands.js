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
            //console.log("Target:",target);
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
        "rename" : function(globalData,values,sourceId){
            //rename -> rename
            globalData.shell.rename(values[0],sourceId);
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
        /**
           Minimise a node in the view
        */
        "min" : function(globalData,values){
            var node = globalData.shell.getNode(values.shift());
            if(node){
                node.minimised = ! node.minimised;
            }
        },        
        /** help 
            @param globalData
            @param values
        */
        "help" : function(globalData,values){
            return {
                "printNode" : ["","Print the current node to console"],
                "printShell" : ["","Print the shell to the console"],
                "new" : ["$target $type $name","Create a new node in the target field of the current node"],
                "nc" : ["$[ni]/$type $name","Synonym for new child (node/institution/other)"],
                "np" : ["$[ni]/$type $name","Synonym for new parent (node/institution/other)"],
                "ncn" : ["$name","Synonym for new child node"],
                "nci" : ["$name","Synonym for new child institution"],
                "rm" : ["$nodeId","Remove the specified node from the current node"],
                "cd" : ["$nodeId/$nodeName","Set the current node to the specified node, by name or id"],
                "set" : ["$field $parameter $value","Set the node[field][parameter] = value"],
                "sv" : ["$parameter $value","Synonym for set values"],
                "st" : ["$parameter $value","Synonym for set tags"],
                "link" : ["$target $nodeId","Link an existing node as a $target of the current node"],
                "linkr" : ["$target $nodeId","link reciprocally"],
                "rename" : ["$name","Change the name of the current node"],
                "cp" : ["$sourceId $targetId $deep","Copy an existing node to be a child of the targetId, todo: deep copy"],
                "min" : ["$nodeId", "Minimise a node representation"]
            };
        }
    };

    return nodeCommands;
});
