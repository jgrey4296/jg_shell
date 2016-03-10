if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['Rete','underscore','./Node/GraphNode','./Node/Constructors','./utils','./ShellModules/shell_prototype_main'],function(Rete,_,GraphNode,getCtor,util,shell_prototype){
    "use strict";

    /**
       The Top level Shell Module
       @module
       @requires Rete
       @requires underscore
       @requires Node/GraphNode
       @requires Node/Constructors
       @requires utils
       @requires module:ShellModules/shell_prototype_main
       @see Shell
    */

    /**
       The Main Shell Class. Provides interaction with the Graph, and the ReteNet.
       Methods are separated into modules at {@link module:ShellModules/shell_prototype_main shell_prototype_main}
       @exports Shell
       @constructor
       @param {Array} ReteActionsToRegister
     */
    var Shell = function(ReteActionsToRegister){
        this.nextId = 0;
        this.tags = {};
        this.tags.type = 'Shell';
        /** The Root Node 
            @type {Node/GraphNode}
            @instance
        */
        this.root = new GraphNode('__root');
        
        /** Disconnected Nodes
            @deprecated
        */
        this.disconnected = {
            noParents : new GraphNode('disconnectedFromParents'),
            noChildren : new GraphNode('disconnectedFromChildren'),
        };
        /** 
            All Nodes
            @type {Object.<String,Node/GraphNode>}
            @instance
        */
        this.allNodes = {};
        this.allNodes[this.root.id] = this.root;
        /** All Rules
            @type  {Array.<Node/Rule>}
            @instance
        */
        this.allRules = [];
        /** All Rules By Name 
            @type {Object.<String,Node/Rule>}
            @instance
        */
        this.allRulesByName = {};

        /** The Current Working Node Object 
            @type {Node/GraphNode}
            @instance
        */
        this.cwd = this.root;

        /** Stashed Node Objects 
            @type {Array.<Node/GraphNode>}
            @instance
        */
        this._nodeStash = [];
        /** The previous node id 
            @type {int}
            @instance
        */
        this.previousLocation = 0;

        /** Search Results 
            @type {Array.<Node/GraphNode>}
            @instance
        */
        this.lastSearchResults = [];

        /** Internal Rete Net
            @type {ReteNet}
            @instance
        */
        this.reteNet = new Rete(ReteActionsToRegister);

        /**
           Backup of rete actions, for when resetting the retenet
           @type {Array}
        */
        this._reteNetBackupActions = ReteActionsToRegister;

        /**
           The current simulation:
           @type { Simulation }
        */
        this.simulation = null;

        /**
           Rete Logged output
           @type {Array.<String>}
        */
        this.reteOutput = [];
        
    };
    
    /*** @borrows module:shell_prototype_main as shell_prototype */
    Shell.prototype = Object.create(shell_prototype);
    Shell.prototype.constructor = Shell;

    /** Get A Node Constructor by name. @see Node/Constructors */
    Shell.prototype.getCtor = getCtor;

    return Shell;
});
