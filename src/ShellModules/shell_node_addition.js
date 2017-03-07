import _ from 'lodash';
import { getCtor } from '../Node/Constructors';

/**
   Defines prototype methods for shell node creation
   @exports ShellModules/shell_node_addition
*/
let ShellPrototype = {};


/**
   Create a new node, and link it to the cwd of the shell
   @method
   @param name The name of the new node
   @param relType The relation from source->newnode
   @param recType the relation from newnode->source
   @param type The type of node the new node should be annotated as. See GraphStructureConstructors
   @param subRelations see {@module:Node/Institution} Array of relations to create
   @param sourceId The id to add to, otherwise cwd
   @return the newly created node
*/
//todo replace relType and recType with type name based on the node?
//based on general node lookup?
ShellPrototype.addNode = function(name,relType,recType,type,subRelations,sourceId){
    let source = sourceId ? this.getNode(sourceId) : this.cwd;
    if (name === null || name === undefined || name === "") {
        name = type || "anon";
        console.warn("making an anonymous node");
    }
    relType = relType || 'child';
    recType = recType || 'parent';
    type = type || "graphnode";
    
    //Get the constructor
    let ctor = getCtor(type),
        newNode = new ctor(name,source.id,type,subRelations);

    //Store in allNodes:
    if (this.allNodes[newNode.id] !== undefined){
        console.warn("Assigning to existing node:",newNode,this.allNodes[newNode.id]);
    }
    this.allNodes[newNode.id] = newNode;
    
    //add to cwd:
    //console.log("Linking new node:",newNode);
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
    return newNode;
};


export { ShellPrototype as shellAddition };

