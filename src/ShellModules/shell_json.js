/**
   @purpose Defines methods related to importing or exporting json from the shell
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['underscore','../Node/GraphNode'],function(_,GraphNode){
    "use strict";
    //Object that will be copied into the shell's prototype:
    var ShellPrototype = {};

        /**
       @class CompleteShell
       @method exportJson
       @purpose Converts all defined nodes to a json array of objects
       @return A JSON string

       @note As nodes only store ID numbers, the information does not contain cycles
     */
    ShellPrototype.exportJson = function(){
        var graphJson = JSON.stringify(_.values(this.allNodes),undefined,4);
        console.log("Converted to JSON:",graphJson);
        return graphJson;
    };

    /**
       @class CompleteShell
       @method importJson
       @purpose To create a graph based on an incoming array of objects
       @param allNodes an array or object of key:object pairs describing all nodes to load
     */
    ShellPrototype.importJson = function(importNodes){
        //console.log("importing type:", typeof allNodes,allNodes.length);
        //clear the shell:
        this.allNodes = [];
        
        if(importNodes instanceof Array){
            importNodes.forEach(function(d){
                this.addNodeFromJson(d);
            },this);
        }else{
            _.values(importNodes).forEach(function(d){
                this.addNodeFromJson(d);
            },this);
        }
        this.cwd = this.allNodes[0];
    };

    /**
       @class CompleteShell
       @method addNodeFromJson
       @purpose create a node from loaded json data, forcing a specific ID number
       @param obj The object data to use for the node
       @return a new node object
     */
    ShellPrototype.addNodeFromJson = function(obj){
        //console.log("Loading Object:",obj);
        var newNode = new GraphNode(obj.name,obj._originalParent,obj.parents[obj._originalParent],obj.type,obj.id);
        _.keys(obj).forEach(function(d){
            newNode[d] = obj[d];
        });
        
        if(newNode.id !== obj.id) { throw new Error("Ids need to match"); }
        if(this.allNodes[newNode.id] !== undefined){
            console.warn("Json loading into existing node:",newNode,this.allNodes[newNode.id]);
        }
        this.allNodes[newNode.id] = newNode;

        //If necessary (from older versions)
        //swap the keys/values pairings in children/parents
        //ie: KEY should be a NUMBER, swap otherwise
        var keys = _.keys(newNode.children);
        if(keys.length > 0 && isNaN(Number(keys[0]))){
            //console.log("Converting from old format");
            newNode.children = this.convertObject(newNode.children);
        }

        keys = _.keys(newNode.parents);
        if(keys.length > 0 && isNaN(Number(keys[0]))){
            //console.log("Converting from old format");
            newNode.parents = this.convertObject(newNode.parents);
        }
        return newNode;
    };

    /**
       @class CompleteShell
       @method convertObject
       @purpose convert old style links of name->id to new style id->name
       @param object The object to switch around
       @return an output object of value:key pairs
    */
    ShellPrototype.convertObject = function(object){
        var keys = _.keys(object),
            values = _.values(object),
            newObject = {};
        _.zip(values,keys).forEach(function(d){
            newObject[d[0]] = d[1];
        });

        return newObject;
    };


    return ShellPrototype;
});
