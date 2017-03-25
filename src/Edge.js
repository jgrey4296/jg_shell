/**
   The Edge definition object
   //sourceDetails -> edgeDetails -> destDetails
 */

export default class Edge {
    constructor(sourceDetails,edgeDetails=null,destDetails){
        //Each param is an object
        //only *requirement* is source and dest must have ids
        this.source = sourceDetails;
        this.edge   = edgeDetails;
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

Edge.fromJSON = function(obj){
    return new Edge(obj.source,obj.edge,obj.dest);
};

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

