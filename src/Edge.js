/**
   The Edge definition object
   //sourceDetails -> edgeDetails -> destDetails
 */

class Edge {
    constructor(sourceDetails,edgeDetails,destDetails){
        //Each param is an object
        //only *requirement* is source and dest must have ids
        this.source = sourceDetails;
        this.edge   = edgeDetails;
        this.dest   = destDetails;

        if (!('id' in this.source) || !('id' in this.dest)){
            throw new Error(`Edges must have ids`);  
        }        
    }
}

Edge.fromJSON = function(obj){
    return new Edge(obj.source,obj.edge,obj.dest);
};

Edge.prototype.connectedTo = function(id){
    return this.source.id === id || this.dest.id === id;
};


export { Edge }
