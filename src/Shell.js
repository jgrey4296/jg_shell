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

//Utilities
Shell.prototype.length = function(){
    return this._nodes.size;
}

Shell.prototype.numRules = function(){
    return this._ruleIds.length;
}

Shell.prototype.has = function(id){
    if ( id instanceof GraphNode ){
        id = id.id;
    }
    return this._nodes.has(id);
}

Shell.prototype.get = function(id){
    if ( this.has(Number(id)) ){
        return this._nodes.get(Number(id));
    }
    throw new Error(`Node ${id} does not exist`);
}

Shell.prototype.set = function(node){
    if (! (node instanceof GraphNode)){
        throw new Error('Cannot add a non-GraphNode'); 
    }
    if( this.has(node.id)){
        throw new Error('Cannot replace already existing nodes');
    }
    this._nodes.set(node.id,node);
}

Shell.prototype.rm = function(id){
    if(id instanceof GraphNode){
        id = id.id;
    }
    if (! this.has(id)){
        throw new Error("Can't remove a node that doesn't exist");
    }
    for (let entry of this.get(id)._edges){
        this.get(entry[0]).removeEdge(id);
    }
    this._nodes.delete(id);
}

Shell.prototype.root = function(){
    return this._root;
}

Shell.prototype.cwd = function(){
    return this._cwd;
}

Shell.prototype.stash = function(){
    return Array.from(this._nodeStash);
}

Shell.prototype.prior = function(){
    return this._previousLocation;
}

Shell.prototype.searchResults = function(){
    return Array.from(this._searchResults);
}

Shell.prototype.reteOutput = function(){
    return Array.from(this._reteOutput);
}

Shell.prototype.link = function(id, relationType, reciprocalType, sourceId){
    let source = sourceId ? this.get(sourceId) : this.cwd(),
        nodeToLinkTo = this.get(id);
    source.setEdge(nodeToLinkTo,relationType);
    nodeToLinkTo.setEdge(source,reciprocalType);    
}


Shell.prototype.addNode = function(name,relType,recType,type,subRelations,sourceId){
    //get the node to link to
    let source = sourceId ? this.get(sourceId) : this.cwd();
    //Configure defaults if necessary:
    if (name === null || name === undefined || name === "") {
        name = type || "anon";
        console.warn("making an anonymous node");
    }
    relType = relType || 'child';
    recType = recType || 'parent';
    type = type || "graphnode";
    
    //Get the constructor for the type of node
    let ctor = getCtor(type),
        newNode = new ctor(name,source.id,type,subRelations);

    //Store the new node
    this.set(newNode);
    //add to cwd/target
    this.link(newNode.id, relType, recType ,source.id);
    //get all subrelation objects:
    let relationDescriptions = newNode.pullRelationObjects();
    relationDescriptions.forEach(function(rel){
        let subNodeName = rel.name,
            subNodeType = rel.type || 'node',
            subNodeRelType = rel.relType || 'child',
            subNodeRecType = rel.recType || 'parent',
            subNodeSubRelations = rel.subRelations || [];
        this.addNode(subNodeName,subNodeRelType,subNodeRecType,subNodeType,subNodeSubRelations,newNode.id);
    },this);
    return newNode.id;
};

Shell.prototype.deleteNode = function(id){
    this.rm(id);
};


export { Shell };
