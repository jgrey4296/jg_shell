import { EdgeData } from './Commands/CommandStructures';

/**
   The Edge definition object
   //sourceDetails -> edgeDetails -> destDetails
 */

export default class Edge {
    constructor(sourceDetails,edgeDetails=null,destDetails){
        if (!(sourceDetails instanceof EdgeData)){
            throw new Error('Source Details need to be EdgeData');
        }
        if (!(edgeDetails instanceof EdgeData) && edgeDetails !== null){
            throw new Error('Edge Details need to be edge data');
        }
        if (!(destDetails instanceof EdgeData)){
            throw new Error('Dest Details need to be edge data');
        }
        
        //Each param is an object
        //only *requirement* is source and dest must have ids
        this.source = sourceDetails;
        this.edge   = edgeDetails || new EdgeData();
        this.dest   = destDetails;

        if ( sourceDetails === undefined || destDetails === undefined){
            throw new Error('Edges must have details passed to them');
        }
        if (!('id' in this.source) || !('id' in this.dest)){
            throw new Error(`Edges must have ids`);
        }
        // if (!('type' in this.source) || !('id' in this.dest)){
        //     throw new Error('Edges must have types');
        // }
    }
}


Edge.prototype.connectedTo = function(id){
    return this.source.id === id || this.dest.id === id;
};

Edge.prototype.idMatches = function(id, type){
    if (/dest/.test(type)){
        return this.idMatchesDestination(id);
    } else if (/source/.test(type)){
        return this.idMatchesSource(id);
    }
    throw new Error(`IdMatches was passed an unexpected edge type: ${type}`);
};

Edge.prototype.idMatchesSource = function(id){
    return this.source.id === id;
};

Edge.prototype.idMatchesDestination = function(id){
    return this.dest.id === id;
};


//Saving and loading:
Edge.prototype.toJSONCompatibleObj = function(){
    let obj = {
        sourceData: {
            id: this.source.id,
            tags: Array.from(this.source.tags),
            vals: Array.from(this.source.vals)
        },
        edgeData: {
            id: this.edge.id,
            tags: Array.from(this.edge.tags),
            vals: Array.from(this.edge.vals)
        },
        destData : {
            id: this.dest.id,
            tags: Array.from(this.dest.tags),
            vals: Array.from(this.dest.vals)
        }
    };
    return obj;
};

Edge.fromJSON = function(obj){
    let sourceObj = new EdgeData(obj.sourceData.id, obj.sourceData),
        edgeObj = new EdgeData(obj.edgeData.id, obj.edgeData),
        destObj = new EdgeData(obj.destData.id, obj.destData);
    return [sourceObj, edgeObj, destObj];
};

