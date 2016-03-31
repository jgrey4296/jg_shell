/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){

    var ShellPrototype = {};

    ShellPrototype.addFSMComponent = function(typename,name,eventTarget,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd,
            parentFSMId = source.tags.type === 'fsm' ? source.id : source.parentFSM ? source.parentFSM : null,
            target = typename === 'event' ? 'events' : 'states';

        //update the parent FSM if its defined
        if(parentFSMId){
            //create the new node as part of the fsm
            let newComponent = this.addNode(name,target,typename,[],parentFSMId);
        }
    };

    ShellPrototype.addFSMLink = function(sourceStateId,eventId,sinkStateId){
        let source = this.getNode(sourceStateId),
            event = this.getNode(eventId),
            sink = this.getNode(sinkStateId);
        //link the source via event to result
        source.outEvents[eventId] = sinkStateId;
        //connect the event to the source and result
        event.statePairs[sourceStateId] = sinkStateId;
        //connect the result to its event
        sink.inEvents[eventId] = sourceStateId;        
    };
    

    ShellPrototype.rm = function(){
        //if in state or event, remove event/state from that node

        //if in fsm, remove state/event from all related nodes
    };

    return ShellPrototype;
});
