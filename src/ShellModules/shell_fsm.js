/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    var ShellPrototype = {};

    ShellPrototype.addFSMComponent = function(typename,names,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd,
            potentialParentFSMId = _.find(_.pairs(source.linkedNodes),d=>/parentFSM/.test(d[1])),
            parentFSMId = source.tags.type === 'fsm' ? source.id : potentialParentFSMId,
            target = typename === 'event' ? 'event' : 'state';

        //update the parent FSM if its defined
        if(parentFSMId){
            //create the new node as part of the fsm
            names.forEach(d=>this.addNode(d,target,`fsm->${target}`,typename,[],parentFSMId));
        }
    };

    ShellPrototype.addFSMLink = function(sourceStateId,eventId,sinkStateId){
        let source = this.getNode(sourceStateId),
            event = this.getNode(eventId),
            sink = this.getNode(sinkStateId),
        //simplisticly 'hash' the link (1->2->3) for key. allows multiple start,end, and/or event usage   
            linkHash = `${sourceStateId}->${eventId}->${sinkStateId}`;

        if(source.tags.type !== 'state' || event.tags.type !== 'event' || source.tags.type !== 'state'){
            throw new Error('Incorrect specification for link');
        }
        
        //link the source via event to result
        source.linkedNodes[linkHash] = 'eventLink';
        //connect the event to the source and result
        event.linkedNodes[linkHash] = 'eventLink';
        //connect the result to its event
        sink.linkedNodes[linkHash] = 'eventLink';
    };

    ShellPrototype.removeFSMLink = function(sourceStateId,eventId,sinkStateId){
        let source = this.getNode(sourceStateId),
            event = this.getNode(eventId),
            sink = this.getNode(sinkStateId),
            linkHash = `${sourceStateId}->${eventId}->${sinkStateId}`;

        delete source.linkedNodes[linkHash];
        delete event.linkedNodes[linkHash];
        delete sink.linkedNodes[linkHash];        
    };

    ShellPrototype.rmFSMComponent = function(componentId){
        let component = this.getNode(componentId),
            fsmId = _.find(_.pairs(component.linkedNodes),d=>/parentFSM/.test(d[1])) || null,
            fsm = fsmId ?  this.getNode(fsmId) : null;
        //in fsm: remove state, unlink all events from it
        if(fsm !== null){
            //remove the specified component
            if(fsm.linkedNodes[componentId] !== undefined){
                delete fsm.linkedNodes[componentId];
            }
        }        
    };

    return ShellPrototype;
});
