//------------------------------
// SEARCH method prototype
//------------------------------
//eg: search name root
//    search tags type
//    search tags type GraphNode
//    search children 0
//    search children blah
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['lodash'],function(_){
    "use strict";
    /**
       @exports ShellModules/shell_search
     */
    var ShellPrototype = {};

    /**
       Search the graph for fields, tags, and regexs
       @method
       @param values
       @param nodeSelection
       @todo adapt this to new linkedNodes structure
     */
    ShellPrototype.searchForFieldTagValue = function(values,nodeSelection){
        let field = values.shift(),
            tag = values.shift(),
            tagValue = values.shift(),
            pattern = new RegExp(tag,"i");
        
        if(nodeSelection === undefined){
            nodeSelection = _.values(this.allNodes);
        }
        
        if(field === undefined || tag === undefined){
            this.lastSearchResults = [];
        }
        
        let nodes = nodeSelection.filter(function(node){
            if(node[field] === undefined) { return false; }
            //if field is a string
            if(typeof node[field] === "string"){
                //using default pattern of tag
                if(pattern.test(node[field])){
                    return true;
                }else{
                    return false;
                }
            }

            if(node[field] instanceof Array && node[field].length === 1){
                if(pattern.test(node[field][0])){
                    return true;
                }else{
                    return false;
                }
            }

            //if field exists, tag specified, but value isnt:
            if(field && tag && tagValue === undefined){
                let keys = _.keys(node[field]).filter(d=>pattern.test(d));
                if(keys.length > 0){
                    return true;
                }else{
                    return false;
                }
            }
            
            //if field is an object
            if(node[field][tag] !== undefined){
                    pattern = new RegExp(tagValue);
                    if(pattern.test(node[field][tag])){
                        return true;
                    }else{
                        return false;
                    }
            }
            return false;
        });
        this.lastSearchResults = nodes;
        return this.lastSearchResults;
    };

    ShellPrototype.searchComparatively = function(values,nodeSelection){
        //TODO
    };

    
    /**
       Get a node by its id, utility method
       @method
       @param nodeId
     */
    ShellPrototype.getNode = function(nodeId){
        nodeId = Number(nodeId);
        if(this.allNodes[nodeId]){
            return this.allNodes[nodeId];
        }else{
            throw new Error("Unknown node specified: " + nodeId);
        }        
    };

    
    return ShellPrototype;
});
