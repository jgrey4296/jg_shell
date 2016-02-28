/**
   Describes the top level Shell class, allowing authoring of a graph structure
   and integration with Rete based rule engine
   @module Shell
   
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['../libs/Rete.min','underscore','./Node/GraphNode','./Node/Constructors','./utils','./ShellModules/shell_prototype_main'],function(Rete,_,GraphNode,getCtor,util,shell_prototype){
    "use strict";

    /**
       Shell
       @constructor
       @purpose The Main Shell class, provides interfaces for interacting with nodes, rules, and rete
    */
    var Shell = function(){
        this.nextId = 0;
        this.tags = {};
        this.tags.type = 'Shell';
        //the root node
        this.root = new GraphNode('__root');
        
        //disconnected nodes:
        this.disconnected = {
            noParents : new GraphNode('disconnectedFromParents'),
            noChildren : new GraphNode('disconnectedFromChildren'),
        };
        //All Nodes:
        this.allNodes = {};
        this.allNodes[this.root.id] = this.root;
        //AllRules:
        this.allRules = [];
        this.allRulesByName = {};

        //current node/rule, as an ACTUAL OBJECT, NOT AN ID
        this.cwd = this.root;

        //stashed locations:
        this._nodeStash = [];
        this.previousLocation = 0;

        //last search results:
        this.lastSearchResults = [];

        //Integrated Rete Net:
        this.reteNet = new Rete();
    };
    
    //Use the aggrgated shell prototype:
    Shell.prototype = Object.create(shell_prototype);
    Shell.prototype.constructor = Shell;

    Shell.prototype.getCtor = getCtor;
    
    /**
       @interface The interface of the Shell file
       @exports Shell 
       @alias Shell for Shell
     */
    return Shell;
});
