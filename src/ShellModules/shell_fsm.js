if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var ShellPrototype = {};

    ShellPrototype.addState = function(){
        //if in the fsm, add to states

        //if in event, add to state and related fsm
    };

    ShellPrototype.addEvent = function(){
        //if in the fsm, add to events

        //if in a state, add to events, and related fsm
    };

    ShellPrototype.rm = function(){
        //if in state or event, remove event/state from that node

        //if in fsm, remove state/event from all related nodes
    };

    return ShellPrototype;
});
