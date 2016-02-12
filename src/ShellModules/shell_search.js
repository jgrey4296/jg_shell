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


define(['underscore'],function(_){
    "use strict";
    var ShellPrototype = {};
    
    ShellPrototype.searchForFieldTagValue = function(values,nodeSelection){
        var field = values.shift(),
            tag = values.shift(),
            tagValue = values.shift(),
            pattern = new RegExp(tag,"i");
        
        if(nodeSelection === undefined){
            nodeSelection = _.values(this.allNodes);
        }
        
        if(field === undefined || tag === undefined){
            this.lastSearchResults = [];
        }
        
        var nodes = nodeSelection.filter(function(node){
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
            
            //if field is an object
            if(node[field][tag] !== undefined){
                if(tagValue === undefined){
                    return true;
                }else{
                    pattern = new RegExp(tagValue);
                    if(pattern.test(node[field][tag])){
                        return true;
                    }else{
                        return false;
                    }
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

    return ShellPrototype;
});
