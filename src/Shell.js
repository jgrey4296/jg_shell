import _ from 'lodash';
import { ReteNet } from '../libs/rete';
import { GraphNode } from './Node/GraphNode';
import { getCtor } from './Node/Constructors';
import { util } from './utils';
import { shellPrototype } from './ShellModules/shell_prototype_main';

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

        
        this._root = new GraphNode('_root');
        this._nodes = new Map();
        this.set(this._root);
        this._ruleIds = [];

        //State:
        this._cwd = this._root;
        this._nodeStash = [];
        this._previousLocation = this._root.id;

        //Search Results
        this._searchResults = [];

        //Rete:
        this._reteNet = new ReteNet(ReteActionsToRegister);
        this._reteNetBackupActions = ReteActionsToRegister;
        this._reteOutput = [];

        //Simulation
        this._simulation = null;
    }
}

/*** @borrows module:shellPrototype_main as shellPrototype */
Shell.prototype = Object.create(shellPrototype);
Shell.prototype.constructor = Shell;

/** Get A Node Constructor by name. @see Node/Constructors */
Shell.prototype.getCtor = getCtor;

Shell.prototype.length = function(){
    return _.keys(this.allNodes);
}



export { Shell };
