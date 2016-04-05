/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    var ShellPrototype = {};

    ShellPrototype.addFSMComponent = function(typename,names,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd,
            potentialParentFSMId = _.find(_.pairs(source.linkedNodes),d=>/^fsm->/.test(d[1])),
            parentFSMId = source.tags.type === 'fsm' ? source.id : potentialParentFSMId,
            target = typename === 'event' ? 'event' : 'state';

        //update the parent FSM if its defined
        if(parentFSMId){
            //create the new node as part of the fsm
            names.forEach(d=>this.addNode(d,target,`fsm->${target}`,typename,[],parentFSMId));
        }
    };

    ShellPrototype.addFSMLink = function(sourceStateId,eventId,sinkStateId){
        let source,event,sink,linkHash;
        //if only 2 args, use cwd where appropriate
        if(sinkStateId === undefined && this.cwd.tags.type === 'state'){
            source = this.cwd;
            event = this.getNode(sourceStateId);
            sink = this.getNode(eventId);
        }else if(sinkStateId === undefined && this.cwd.tags.type === 'event'){
            source = this.getNode(sourceStateId);
            event = this.cwd;
            sink = this.getNode(eventId);
        }else if(sinkStateId !== undefined){
            source = this.getNode(sourceStateId);
            event = this.getNode(eventId);
            sink = this.getNode(sinkStateId);
        }else{
            throw new Error("FSM Link error");
        }
        //simplisticly 'hash' the link (1->2->3) for key. allows multiple start,end, and/or event usage   
        linkHash = `${source.id}->${event.id}->${sink.id}`;

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
            fsmId = _.find(_.pairs(component.linkedNodes),d=>/^fsm->/.test(d[1])) || null,
            fsm = fsmId ?  this.getNode(fsmId) : null;
        //in fsm: remove state, unlink all events from it
        if(fsm !== null){
            //remove the specified component
            if(fsm.linkedNodes[componentId] !== undefined){
                delete fsm.linkedNodes[componentId];
            }
        }        
    };

    ShellPrototype.getComponentsForCurrentFSM = function(){
        let currentNode = this.cwd,
            currentFSM;
        if(currentNode.tags.type === 'fsm'){
            currentFSM = currentNode;
        }else{
            let fsmLink = _.find(_.pairs(currentNode.linkedNodes),d=>/fsm->/.test(d[1]));
            if(fsmLink !== undefined){
                currentFSM = this.getNode(fsmLink[0]);
            }
        }

        if(currentFSM === undefined){
            throw new Error("Can't find a parent fsm");
        }
        let linkedNodes = _.pairs(currentFSM.linkedNodes),
            states = _.filter(linkedNodes,d=>/^state/.test(d[1])).map(d=>this.getNode(d[0])),
            events = _.filter(linkedNodes,d=>/^event/.test(d[1])).map(d=>this.getNode(d[0]).toString());

        return {
            states : states,
            events : events
        };
    };
    
    return ShellPrototype;
});
