import _ from 'lodash';
import { GraphNode } from './GraphNode';
import { Rule } from './Rule';
import { Condition } from './Condition';
import { Action } from './Action';
import { Institution } from './Institution';
import { Bookmark } from './Bookmark';
import { State } from './State';
import { FSM } from './FSM';
import { Event } from './Event';

/**
    Aggregates the constructors toget
    @module Node/Constructors
*/

const ctors = new Map([
    ["graphnode" , GraphNode],
    ["rule"      , Rule],
    ["condition" , Condition],
    ["action"    , Action],
    ["institution" , Institution],
    ["bookmark" , Bookmark],
    ["state" , State],
    ["event" , Event],
    ["fsm" , FSM]
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

export { getCtor };

