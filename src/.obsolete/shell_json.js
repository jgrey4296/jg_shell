import _ from 'lodash';
import { GraphNode } from '../Node/GraphNode';


/**
   Defines methods related to importing or exporting json from the shell
   @exports ShellModules/shell_json
*/
let ShellPrototype = {};

/**
   Converts all defined nodes to a json array of objects
   @method exportJson
   @return A JSON string
   @note As nodes only store ID numbers, the information does not contain cycles
*/
ShellPrototype.exportJson = function(){
    //todo: ensure that all nodes have been cleared of relation objects prir to export
    
    let graphJson = JSON.stringify(_.values(this.allNodes),undefined,4);
    console.log("Converted to JSON:",graphJson);
    return graphJson;
};

/**
   To create a graph based on an incoming array of objects
   @method importJson
   @param importNodes an array or object of key:object pairs describing all nodes to load
*/
ShellPrototype.importJson = function(importNodes){
    //console.log("importing type:", typeof allNodes,allNodes.length);
    //clear the shell:
    this.allNodes = {};
    
    if (importNodes instanceof Array){
        importNodes.forEach(function(d){
            this.addNodeFromJson(d);
        },this);
    } else {
        _.values(importNodes).forEach(function(d){
            this.addNodeFromJson(d);
        },this);
    }
    //Create a dummy node that sets the next Id
    let maxId = Math.max.apply(null,_.keys(this.allNodes));
    new GraphNode("dummy",undefined,"dummy",{},maxId);
    
    this.cwd = this.allNodes[0];
};

/**
   Create a node from loaded json data, forcing a specific ID number
   @method addNodeFromJson
   @param obj The object data to use for the node
   @return a new node object
*/
ShellPrototype.addNodeFromJson = function(obj){
    //console.log("Loading Object:",obj);
    
    //get the constructor appropriate for the object
    //and apply it to the object
    //console.log("Using get ctor:",this.getCtor);
    //console.log("Importing:",obj);
    let ctor = this.getCtor(obj.tags.type),
        loadedNode = _.create(ctor.prototype,obj);
    //console.log("Loaded:",loadedNode);
    
    if (this.allNodes[loadedNode.id] !== undefined){
        console.warn("Json loading into existing node:",loadedNode,this.allNodes[loadedNode.id]);
    }
    this.allNodes[loadedNode.id] = loadedNode;

    return loadedNode;
};

/**
   Convert old style links of name->id to new style id->name
   @method convertObject
   @param object The object to switch around
   @return an output object of value:key pairs
   @deprecated
*/
ShellPrototype.convertObject = function(object){
    let keys = _.keys(object),
        values = _.values(object),
        newObject = {};
    _.zip(values,keys).forEach((d) => {
        newObject[d[0]] = d[1];
    });

    return newObject;
};


export { ShellPrototype as shellJson };

