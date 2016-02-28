/**
   Describes the top level Shell class, allowing authoring of a graph structure
   and integration with Rete based rule engine
   @module Shell
   @requires Rete
   @requires underscore
   @requires Node/GraphNode
   @requires Node/Constructors
   @requires utils
   @requires ShellModules/shell_prototype_main
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['../libs/Rete.min','underscore','./Node/GraphNode','./Node/Constructors','./utils','./ShellModules/shell_prototype_main'],function(Rete,_,GraphNode,getCtor,util,shell_prototype){
    "use strict";

    /**
       The Main Shell class, provides interfaces for interacting with nodes, rules, and rete
       @constructor
       @alias module:Shell       
    */
    var Shell = function(){
        this.nextId = 0;
        this.tags = {};
        this.tags.type = 'Shell';
        /** The Root Node */
        this.root = new GraphNode('__root');
        
        /** Disconnected Nodes
            @deprecated
        */
        this.disconnected = {
            noParents : new GraphNode('disconnectedFromParents'),
            noChildren : new GraphNode('disconnectedFromChildren'),
        };
        /** All Nodes */
        this.allNodes = {};
        this.allNodes[this.root.id] = this.root;
        /** All Rules */
        this.allRules = [];
        /** All Rules By Name */
        this.allRulesByName = {};

        /** The Current Working Node Object */
        this.cwd = this.root;

        /** Stashed Node Objects */
        this._nodeStash = [];
        /** The previous node id */
        this.previousLocation = 0;

        /** Search Results */
        this.lastSearchResults = [];

        /** Internal Rete Net */
        this.reteNet = new Rete();
    };
    
    /** @borrows module:shell_prototype_main as shell_prototype */
    Shell.prototype = Object.create(shell_prototype);
    Shell.prototype.constructor = Shell;

    Shell.prototype.getCtor = getCtor;
    
    return Shell;
});
