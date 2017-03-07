import _ from 'lodash';
import { ReteNet } from '../libs/rete';
import { GraphNode } from './Node/GraphNode';
import { getCtor } from './Node/Constructors';
import { util } from './utils';
import { shellPrototype } from './ShellModules/shell_prototype_main';

/**
   The Top level Shell Module
   @module
   @requires Rete
   @requires lodash
   @requires Node/GraphNode
   @requires Node/Constructors
   @requires utils
   @requires module:ShellModules/shellPrototype_main
   @see Shell
*/

/**
   The Main Shell Class. Provides interaction with the Graph, and the ReteNet.
   Methods are separated into modules at {@link module:ShellModules/shellPrototype_main shellPrototype_main}
   @exports Shell
   @constructor
   @param {Array} ReteActionsToRegister
*/
class Shell {
    constructor(ReteActionsToRegister){
        this.nextId = 0;
        this.tags = {};
        this.tags.type = 'Shell';
        /** The Root Node
            @type {Node/GraphNode}
            @instance
        */
        this.root = new GraphNode('__root');

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
        /**
           Type system:
        */
        this.typeNodes = {};

        
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
        this.reteNet = new ReteNet(ReteActionsToRegister);

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

    }
}

/*** @borrows module:shellPrototype_main as shellPrototype */
Shell.prototype = Object.create(shellPrototype);
Shell.prototype.constructor = Shell;

/** Get A Node Constructor by name. @see Node/Constructors */
Shell.prototype.getCtor = getCtor;

export { Shell };
