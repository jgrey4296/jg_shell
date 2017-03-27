import _ from 'lodash';
import GraphNode from './GraphNode';
/**
    Aggregates the constructors toget
    @module Node/Constructors
*/

const ctors = new Map([
    ["graphnode" , GraphNode]
]);

/**
   Get the Constructor specified
   @function
   @param name
*/
let getCtor = function(name){
    if (name !== undefined && ctors.has(name.toLowerCase())){
        return ctors.get(name.toLowerCase());
    }
    return ctors.get("graphnode");
};

export default getCtor;

