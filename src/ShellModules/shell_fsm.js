/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    var ShellPrototype = {};

    ShellPrototype.addFSMComponent = function(typename,names,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd,
            parentFSMId = source.tags.type === 'fsm' ? source.id : source.linkedNodes.parentFSM ? source.linkedNodes.parentFSM : null,
            target = typename === 'event' ? 'events' : 'states';

        //update the parent FSM if its defined
        if(parentFSMId){
            //create the new node as part of the fsm
            names.forEach(d=>this.addNode(d,target,typename,[],parentFSMId));
        }
    };

    ShellPrototype.addFSMLink = function(sourceStateId,eventId,sinkStateId){
        let source = this.getNode(sourceStateId),
            event = this.getNode(eventId),
            sink = this.getNode(sinkStateId),
        //simplisticly 'hash' the link (1->2->3) for key. allows multiple start,end, and/or event usage   
            linkHash = `${sourceStateId}->${eventId}->${sinkStateId}`;

        if(source.tags.type !== 'state' || event .tags.type !== 'event' || source.tags.type !== 'state'){
            throw new Error('Incorrect specification for link');
        }
        
        //link the source via event to result
        source.linkedNodes.outEvents[linkHash] = 1;
        //connect the event to the source and result
        event.linkedNodes.links[linkHash] = 1;
        //connect the result to its event
        sink.linkedNodes.inEvents[linkHash] = 1;
    };

    ShellPrototype.removeFSMLink = function(sourceStateId,eventId,sinkStateId){
        let source = this.getNode(sourceStateId),
            event = this.getNode(eventId),
            sink = this.getNode(sinkStateId),
            linkHash = `${sourceStateId}->${eventId}->${sinkStateId}`;

        delete source.outEvents[linkHash];
        delete event.links[linkHash];
        delete sink.inEvents[linkHash];        
    };

    ShellPrototype.rmFSMComponent = function(componentId){
        let component = this.getNode(componentId),
            fsm = component.linkedNodes.parentFSM ? this.getNode(component.linkedNodes.parentFSM) : null;
        //in fsm: remove state, unlink all events from it
        if(fsm !== null){
            //remove the specified component
            if(fsm.states[componentId] !== undefined){
                delete fsm.states[componentId];
            }else if(fsm.events[componentId] !== undefined){
                delete fsm.events[componentId];
            }
        }        
    };

    return ShellPrototype;
});
