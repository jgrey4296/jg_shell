import _ from 'lodash';
import ReteNet from '../libs/rete';
import GraphNode from './Node/GraphNode';
import getCtor from './Node/Constructors';
import util from './utils';
import parser from './PParse';
import * as CStructs from './Commands/CommandStructures';

/**
   The Main Shell Class. Provides interaction with the Graph, and the ReteNet.
   Methods are separated into modules at {@link module:ShellModules/shellPrototype_main shellPrototype_main}
   @exports Shell
   @constructor
   @param {Array} ReteActionsToRegister
*/
export default class Shell {
    constructor(ReteActionsToRegister){
        this._root = new GraphNode('_root', -1);
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

//Parsing function: returns nullable
Shell.prototype.parse = function(string){
    let result = this._parser.parse(string);
    if (result.status === false){
        console.log('Bad Parse:',result);
        return null;
    }
    result = result.value;
    return this.actOnParse(result);
};

Shell.prototype.actOnParse = function(action){
    switch (action.constructor){
        case CStructs.Cd:
            this.cdByString(action.id);
            break;
        case CStructs.Rm:
            action.ids.forEach((d)=>{
                this.rm(d);
            });
            break;
        case CStructs.Mk:
            action.names.forEach((name)=>{
                this.addNode(name);
            });
            break;
        case CStructs.Link:
            this.link(action.sourceData,action.edgeData,action.destData);
            break;
        case CStructs.SetTag:
            action.tagNames.forEach((t)=>this.cwd().tagToggle(t));
            break;
        case CStructs.SetValue:
            this.cwd().setValue(action.valName,action.value);
            break;
        case CStructs.Search:
            this.search(action.type,action.variable,action.value);
            break;
        case CStructs.Refine:
            this.refine(action.type,action.variable,action.value);
            break;
        case CStructs.Apply:
            this.actOnSearchResults(action);
            break;
        case CStructs.Import:
            this.import(action.text);
            break;
        case CStructs.Unparameterised:
            return this.processUnparameterisedCommand(action);
            //break;
        default:
            throw new Error('Unrecognised command parsed');
    }
    return null;
};

Shell.prototype.actOnSearchResults = function(action){
    let searchResults = this.searchResults(),
        cwdRecall = this.cwd().id;
    if (!(action instanceof CStructs.Apply)){
        throw new Error('Instructed to apply, without passing a CStructs.Apply');
    }
    
    if ( searchResults.length === 0){
        throw new Error('Instructed to act on empty search results');
    }
    searchResults.forEach((d)=>{
        this.cdById(d);
        this.actOnParse(action.command);
    });
    this.cdById(cwdRecall);
};


//Deal with unparameterised commands
Shell.prototype.processUnparameterisedCommand = function(command){
    switch (command.name){
        case 'export':
            return this.export();
            //break;
        case 'stash':
            this.stash();
            break;
        case 'unstash':
            this.unstash();
            break;
        case 'root':
            this.cdById(this._root.id);
            break;
        case 'cwd':
            return this.printState();
            //break;
        case 'help':
            return this.help();
            //break;
        case 'prior':
            this.cdById(this.prior());
            break;
        case 'clear':
            this._searchResults = [];
            break;
        case 'select':
            this._searchResults.push(this.cwd().id);
            break;
        default:
            throw new Error(`Unrecognised Unparameterised Command: ${command.name}`);
    }
    return null;
};


/** Get A Node Constructor by name. @see Node/Constructors */
Shell.prototype.getCtor = getCtor;

//Utilities
Shell.prototype.length = function(){
    return this._nodes.size;
};

Shell.prototype.numRules = function(){
    return this._ruleIds.length;
};

Shell.prototype.has = function(id){
    if ( id instanceof GraphNode ){
        id = id.id;
    }
    return this._nodes.has(id);
};

Shell.prototype.get = function(id){
    if ( this.has(Number(id)) ){
        return this._nodes.get(Number(id));
    }
    throw new Error(`Node ${id} does not exist`);
};

Shell.prototype.set = function(node){
    if (! (node instanceof GraphNode)){
        throw new Error('Cannot add a non-GraphNode');
    }
    if (this.has(node.id)){
        console.log(this._nodes);
        throw new Error(`Cannot replace already existing nodes: ${node.id}`);
    }
    this._nodes.set(node.id,node);
};

Shell.prototype.rm = function(id){
    if (id instanceof GraphNode){
        id = id.id;
    }
    if (! this.has(id)){
        throw new Error("Can't remove a node that doesn't exist");
    }
    for (let entry of this.get(id)._edges.keys()){
        this.get(entry).removeEdge(id);
    }
    this._nodes.delete(id);
};

Shell.prototype.root = function(){
    return this._root;
};

Shell.prototype.cwd = function(){
    return this._cwd;
};

Shell.prototype.prior = function(){
    return _.last(this._previousLocation);
};

Shell.prototype.searchResults = function(){
    return Array.from(this._searchResults);
};

Shell.prototype.reteOutput = function(){
    return Array.from(this._reteOutput);
};

Shell.prototype.link = function(sourceData, edgeData, destData){
    let source = this.get(sourceData.id),
        dest = this.get(destData.id),
        edge = edgeData.id ? this.get(edgeData.id) : null;

    source.setEdge(destData.id,sourceData,edgeData,destData);
    dest.setEdge(sourceData.id,sourceData,edgeData,destData);
};


Shell.prototype.addNode = function(name,destType,sourceType,nodeType,subRelations,sourceId=undefined){
    //get the node to link to
    let source = sourceId ? this.get(sourceId) : this.cwd();
    //Configure defaults if necessary:
    if (name === null || name === undefined || name === "") {
        name = sourceType || "anon";
    }
    sourceType = sourceType || 'parent';
    destType = destType || 'child';
    nodeType = nodeType || "graphnode";

    //Get the constructor for the type of node
    let ctor = getCtor(nodeType),
        newNode = new ctor(name,source.id);

    //Store the new node
    this.set(newNode);
    //add to cwd/target
    this.link(new CStructs.EdgeData(source.id, {tags: [sourceType], vals: []}),
              new CStructs.EdgeData(null, {tags: [], vals: [] }),
              new CStructs.EdgeData(newNode.id, { tags: [destType], vals: []}));
     return newNode.id;
};

Shell.prototype.deleteNode = function(id){
    this.rm(id);
};

Shell.prototype.cdByString = function(str){
    if (!Number.isNaN(Number(str))){
        this.cdById(Number(str));
        return;
    }
    if (str.match(/\.\./) !== null){
        this.cdById(this.cwd().getValue('_parentId'));
    } else {
        //Is a String. Find a local node of the correct name to move to
        throw new Error(`Unimplemented: ${str}`);
    }
};


Shell.prototype.cdById = function(id){
    if (typeof(id) !== 'number'){
        throw new Error(`Cd'ing needs an id, instead got ${typeof(id)}`);
    }
    if (!this.has(id)){
        throw new Error("Can't cd to a non-existent node");
    }
    this._previousLocation.push(this.cwd().id);
    this._cwd = this.get(id);
};


Shell.prototype.stash = function(){
    this._nodeStash.push(this.cwd().id);
};

Shell.prototype.unstash = function(){
    return this._nodeStash.pop();
};

Shell.prototype.getStash = function(){
    return _.clone(this._nodeStash);
};


//TODO:
//exportJson
Shell.prototype.export = function(){
    let nodes = [];
    for (let node of this._nodes.values()){
        nodes.push(node.toJSONCompatibleObj());
    }
    let jsonString = JSON.stringify({
        nodes: nodes,
        root : this._root.id
    });

    return {
        description: 'json',
        text : jsonString
    };
};

//importJson
Shell.prototype.import = function(text){
    let loadedObj = JSON.parse(text);
    console.log('Loading data:',loadedObj);
    this._nodes.clear();
    for (let nodeRep of loadedObj.nodes){
        let newNode = GraphNode.fromJSON(nodeRep);
        this.set(newNode);
    }
    this._root = this._nodes.get(loadedObj.root);
    this._cwd = this._root;
};

//Include without overwriting
Shell.prototype.extend = function(text){
    //parse json,
    //create nodes, without overriding the id,
    //create a map of oldId => newId
    //go through and modify all edges
    //link root of new data to root()
};

//Rete

//Sim

//Search, value is nullable, returns nothing, side effect: this._searchResults
Shell.prototype.search = function(type,variable,value=null,refine=false){
    let searchBase = [];
    if (!refine){
        searchBase = Array.from(this._nodes.values());
    } else {
        searchBase = this._searchResults.map((d)=>this.get(d));
    }
    //go through all nodes, filtering by the tag/varName/varName+varValue
    switch (type) {
        case 'name': { //'name', regex, null
            if (value !== null || !(variable instanceof RegExp) ){
                throw new Error('Incorrect Name Search');
            }
            let nodes = searchBase.filter((d)=>variable.test(d.name()));
            this._searchResults = nodes.map((d)=>d.id);
        }
            break;
        case 'tag': { //'tag', regex, null
            if (value !== null || !(variable instanceof RegExp)){
                throw new Error('Incorrect Tag Search');
            }
            let nodeTagPairs = searchBase.map((d)=>[d.id,d.tags()]),
                filteredPairs = nodeTagPairs.filter(([id,tags])=>_.some(tags,(x)=>variable.test(x))),
                finalIds = filteredPairs.map(([id,tags])=>id);
            this._searchResults = finalIds;
        }
            break;
        case 'value': { //'value', regex, regex
            if (variable instanceof RegExp && value !== null && value instanceof RegExp){
                //get all nodes with passing value names
                let variableMatches = searchBase.filter((d)=>{
                    return _.some(d.values(),([vi,va])=>variable.test(vi) && value.test(va));
                });
                this._searchResults = variableMatches.map((d)=>d.id);
            } else if ( variable instanceof RegExp && value === null){
                let variableMatches = searchBase.filter((d)=>{
                    return _.some(d.values(),([k,v])=>variable.test(k));
                });
                this._searchResults = variableMatches.map((d)=>d.id);
                //TODO: add logic for value being an EXPRESSION
            } else if (! (variable instanceof RegExp) && value === null){
                let hasVariable = searchBase.filter((d)=>d.hasValue(variable));
                this._searchResults = hasVariable.map((d)=>d.id);
            } else if (! (variable instanceof RegExp) && value !== null && ! (value instanceof RegExp)){
                let hasExactVariable = searchBase.filter((d)=>d.hasValue(variable) && d.getValue(variable) === value);
                this._searchResults = hasExactVariable.map((d)=>d.id);
            } else {
                throw new Error("Unrecognised search attempt");
            }
        }
            break;
        case 'edge': { //'edge', 'dest'/'source', id
            //TODO: enable more edge types
            if (value === null || !(/dest|source/.test(variable))){
                throw new Error('Incorrect Edge Search');
            }
            //filter all nodes by their edges, with the id in the dest/source slot
            let linkedNodes = searchBase.filter((d)=>d.hasEdgeWith(value) && d.getEdgeTo(value).idMatches(value,variable));
            this._searchResults = linkedNodes.map((d)=>d.id);
        }
            break;
        default:
            throw new Error('Incorrect Search Specified');
    }

};

Shell.prototype.refine = function(type,variable,value){
    return this.search(type,variable,value,true);
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
    let data = {
        description: "help"
    };
    
    throw new Error('Unimplemented: Help');
};

Shell.prototype.getPath = function(){
    let path : Array<[string, number]> = [],
        current = this.cwd();
    while (current.id !== this._root.id && current.getValue('_parentId') !== current.id){
        path.unshift([current.name(), current.id]);
        current = this.get(current.getValue('_parentId'));
    }
    path.unshift([this._root.name(), this._root.id]);
    return path;
};

//Output:
Shell.prototype.printState = function(){
    let node = this.cwd(),
        inputs = node.getParents(),
        outputs = node.getChildren(),
        prevSearches = this.searchResults(),
        currPath = this.getPath(),
        stash = this.getStash();
        
    return {
        description: 'stateDescription',
        inputs: inputs,
        node : node,
        outputs : outputs,
        searchResults : prevSearches,
        currentPath : currPath,
        stash : stash
    };
};

