/**
   @purpose Defines Shell prototype methods relating to string modification. mainly utilities
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['underscore','Parse'],function(_,Parse){
    "use strict";
    var ShellPrototype = {};


    /**
       @class CompleteShell
       @method getNodeListByIds
       @utility
       @purpose To retrieve the actual node objects indicated by an array of ids
       @param idList
       @return array of node objects
     */
    ShellPrototype.getNodeListByIds = function(idList){
        var retList = idList.map(function(d){
                return this.getNode(d);
        },this).filter(function(d){ return d;});
        return retList;
    };
    
    //Utility functions for display Output:
    /**
       @class CompleteShell
       @method nodeToShortString
       @utility
       @purpose To convert a node to a text representation for display on screen
       @param node
       @param i
     */
    ShellPrototype.nodeToShortString = function(node){
        console.log("NTSS:",node);
        if(node.tags.type === "action"){
            return "(" + node.id + "): " + node.name;
        }else if(node.tags.type === "aggregate"){
            return "Group of: " + node.noOfValues;            
        }else if(node.name){
            return "(" + node.id + "): " + node.name + " (" + node.tags.type + ")";
        }else{
            return "(" + node.id + "): (" + node.tags.type + ")";
        }
    };

    /**
       @class CompleteShell
       @method nodeToStringList
       @utility
       @stub
       @purpose To convert a node to a list of strings
       @param node
     */
    ShellPrototype.nodeToStringList = function(node){
        return [];
    };

    /**
       @class CompleteShell
       @method ruleToStringList
       @utility
       @purpose Convert a rule to a string representation
       @param node
     */
    ShellPrototype.ruleToStringList = function(node){
        var retList = [];
        retList.push("(" + node.id +"): " + node.name);
        return retList;
    };
    

    /**
       @method traceNode
       @purpose convert node and subnodes to a tracery style string
     */
    ShellPrototype.traceNode = function(node){
        //console.log("Tracing node:",node);
        //no message: node is an array of children
        //message: node is a rule

        //message exists:
        //create the grammar object:
        var descendents = this.dfs(node.id).map(function(d){
            return this.getNode(d);
        },this),
            //link node name to expansion string -> grammar
            grammar = descendents.reduce(function(m,v){
                if(m[v.name] === undefined){
                    m[v.name] = [];
                }
                if(v.values.message !== undefined){
                    m[v.name].push(v.values.message);
                }else{
                    //turn each child into a rule, or use the name of the node
                    m[v.name] = _.values(v.children).length > 0 ? m[v.name].concat(_.values(v.children).map(function(d){
                        return "$"+d;
                    })) : m[v.name].concat([v.name]);
                }                
                return m;
            },{});

        var retString;
        try{
            retString = Parse(grammar,node.name);
        }catch(e){
            console.log("Trace error:",e);
        }finally{
            return retString || node.name;
        }
    };
    
    

    return ShellPrototype;
});
