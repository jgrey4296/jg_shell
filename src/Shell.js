import _ from 'lodash';
import { ReteNet } from '../libs/rete';
import { GraphNode } from './Node/GraphNode';
import { getCtor } from './Node/Constructors';
import { util } from './utils';
import { parser } from './PParse';
import * as CStructs from './Commands/CommandStructures';
//import { shellPrototype } from './ShellModules/shell_prototype_main';

/**
   The Main Shell Class. Provides interaction with the Graph, and the ReteNet.
   Methods are separated into modules at {@link module:ShellModules/shellPrototype_main shellPrototype_main}
   @exports Shell
   @constructor
   @param {Array} ReteActionsToRegister
*/
class Shell {
    constructor(ReteActionsToRegister){
        this._root = new GraphNode('_root');
        this._nodes = new Map();
        this.set(this._root);
        this._ruleIds = [];

        //State:
        this._cwd = this._root;
        this._nodeStash = [];
        this._previousLocation = [this._root.id];

        //Search Results
        this._searchResults = [];

        //Rete:
        this._reteNet = new ReteNet(ReteActionsToRegister);
        this._reteNetBackupActions = ReteActionsToRegister;
        this._reteOutput = [];

        //Simulation
        this._simulation = null;

        //The parser:
        this._parser = parser;
    }
}

//Parsing function:
Shell.prototype.parse = function(string){
    let result = this._parser.parse(string).value;
    switch(result.constructor){
        case CStructs.Cd:
            this.cd_by_string(result.id);
            break;
        case CStructs.Rm:
            result.ids.forEach((d)=>{
                this.rm(d);
            });
            break;
        case CStructs.Mk:
            result.names.forEach((name)=>{
                this.addNode(name);
            });
            break;
        case CStructs.Link:
            this.link(result.sourceId,'child','parent',result.destId);
            break;
        case CStructs.SetTag:
            this.cwd().tagToggle(result.tagName);
            break;
        case CStructs.SetValue:
            this.cwd().setValue(result.valName,result.value);
            break;
        case CStructs.Search:
            this.search(result.type,result.variable,result.value);
            break;
        case CStructs.Refine:
            this.refine(result.type,result.variable,result.value);
            break;
        case CStructs.Apply:
            throw new Error('Unimplemented: Apply');
            break;
        case CStructs.Unparameterised:
            return this.processUnparameterisedCommand(result);
            break;
        default:
            throw new Error('Unrecognised command parsed');
    }
};

//Deal with unparameterised commands
Shell.prototype.processUnparameterisedCommand = function(command){
    console.log(`Received command: ${command.name}`);
    switch(command.name){
        case 'export':
            return this.export();
            break;
        case 'stash':
            this.stash();
            break;
        case 'unstash':
            this.unstash();
            break;
        case 'root':
            this.cd_by_id(this._root.id);
            break;
        case 'cwd':
            return this.printState();
            break;
        case 'help':
            return this.help()
            break;
        case 'prior':
            this.cd_by_id(this.prior());
        default:
            throw new Error(`Unrecognised Unparameterised Command: ${command.name}`);
    }
    return null;
}


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
    for (let entry of this.get(id)._edges.keys()){
        this.get(entry).removeEdge(id);
    }
    this._nodes.delete(id);
}

Shell.prototype.root = function(){
    return this._root;
}

Shell.prototype.cwd = function(){
    return this._cwd;
}

Shell.prototype.prior = function(){
    return _.last(this._previousLocation);
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
    source.setEdge(nodeToLinkTo.id,
                   {
                       id: nodeToLinkTo.id,
                       relation: relationType
                   },
                   {},
                   {
                       id: source.id,
                       relation: reciprocalType
                   }
                  );
    nodeToLinkTo.setEdge(source.id,
                         {
                             id: source.id,
                             relation: reciprocalType
                         },
                         {},
                         {
                             id: nodeToLinkTo.id,
                             relation : relationType
                         }
                        );    
}


Shell.prototype.addNode = function(name,relType,recType,type,subRelations,sourceId){
    //get the node to link to
    let source = sourceId ? this.get(sourceId) : this.cwd();
    //Configure defaults if necessary:
    if (name === null || name === undefined || name === "") {
        name = type || "anon";
    }
    relType = relType || 'child';
    recType = recType || 'parent';
    type = type || "graphnode";
    
    //Get the constructor for the type of node
    let ctor = getCtor(type),
        newNode = new ctor(name,source.id);

    //Store the new node
    this.set(newNode);
    //add to cwd/target
    this.link(newNode.id, relType, recType ,source.id);
     return newNode.id;
};

Shell.prototype.deleteNode = function(id){
    this.rm(id);
};

Shell.prototype.cd_by_string = function(str){
    if(!Number.isNaN(Number(str))){
        this.cd_by_id(Number(str));
        return;
    }
    if(str.match(/\.\./) !== null){
        this.cd_by_id(this.cwd().parentId);
    }else{
        //Is a String. Find a local node of the correct name to move to
        throw new Error(`Unimplemented: ${str}`);
    }    
}


Shell.prototype.cd_by_id = function(id){
    if(typeof(id) !== 'number'){
        throw new Error(`Cd'ing needs an id, instead got ${typeof(id)}`);
    }
    if (!this.has(id)){
        throw new Error("Can't cd to a non-existent node");
    }
    this._previousLocation.push(this.cwd().id);
    this._cwd = this.get(id);    
}


Shell.prototype.stash = function(){
    this._nodeStash.push(this.cwd().id);
}

Shell.prototype.unstash = function(){
    return this._nodeStash.pop();
}



//TODO:
//exportJson
Shell.prototype.export = function(){
    let nodes = [];
    for (var node in this._nodes.values()){
        nodes.append(node.toJSONCompatibleObj());
    }
    return JSON.stringify({
        nodes: nodes,
        root : this._root.id
    });
};

//importJson
Shell.prototype.import = function(text){
    let loadedObj = JSON.parse(text);
    this._nodes = new Map();
    for (var nodeRep in loadedObj.nodes){
        let newNode = GraphNode.fromJSON(nodeRep);
        this.set(newNode);
    }
    this._root = this._nodes.get(loadedObj.root);
    this._cwd = this._root;
};

//Rete

//Sim

//Search
Shell.prototype.search = function(type,variable,value){
    //go through all nodes, filtering by the tag/varName/varName+varValue

    //store the results
    this._searchResults = [];
};

Shell.prototype.refine = function(type,variable,value){
    //same as search, but operating on _searchResults instead of all nodes

    
    this._searchResults = [];
};

//Graph search
Shell.prototype.dfs = function(){
    throw new Error('Unimplemented: DFS');
};

Shell.prototype.bfs = function(){
    throw new Error('Unimplemented: BFS');
};



//Help:
Shell.prototype.help = function(){
    throw new Error('Unimplemented: Help');
};


//Output:
Shell.prototype.printState = function(){
    let node = this.cwd(),
        inputs = [],
        outputs = [],
        prevSearches = this._searchResults;
    
    return {
        inputs: inputs,
        node : node,
        outputs : outputs,
        searchResults : prevSearches
    };
};

export { Shell };
