/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['lodash'],function(_){
    "use strict";
    var ShellPrototype = {};

    /**
       Add FSM component(s) (link/state) to the current or specified fsm
       @param typename The component type to add. Ie: Event/State
       @param names The name(s) of the components to add
       @param sourceId for specification of non-cwd fsm for modification
     */
    ShellPrototype.addFSMComponent = function(typename,names,sourceId){
        let source = sourceId ? this.getNode(sourceId) : this.cwd,
            potentialParentFSMId = _.find(_.toPairs(source.linkedNodes),d=>/^fsm->/.test(d[1])),
            parentFSMId = source.tags.type === 'fsm' ? source.id : potentialParentFSMId[0],
            target = typename === 'event' ? 'event' : 'state';

        //update the parent FSM if its defined
        if(parentFSMId){
            //create the new node as part of the fsm
            names.forEach(d=>this.addNode(d,target,`fsm->${target}`,typename,[],parentFSMId));
        }
    };

    /**
       Specify an event path in the FSM. Ie: A Start State, an event that occurs,
       followed by the resulting state.
     */
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

    /**
       Remove the link chain, both in the fsm root,
       and the individual nodes
       @param sourceStateId
       @param eventId
       @param sinkStateId
     */
    ShellPrototype.removeFSMLink = function(sourceStateId,eventId,sinkStateId){
        let source = this.getNode(sourceStateId),
            event = this.getNode(eventId),
            sink = this.getNode(sinkStateId),
            linkHash = `${sourceStateId}->${eventId}->${sinkStateId}`;

        delete source.linkedNodes[linkHash];
        delete event.linkedNodes[linkHash];
        delete sink.linkedNodes[linkHash];        
    };

    /**
       Remove an fsm component entirely from the fsm root
       @param componentId
     */
    ShellPrototype.rmFSMComponent = function(componentId){
        let component = this.getNode(componentId),
            fsmId = _.find(_.toPairs(component.linkedNodes),d=>/^fsm->/.test(d[1])) || null,
            fsm = fsmId ?  this.getNode(fsmId[0]) : null;
        //in fsm: remove state, unlink all events from it
        if(fsm !== null){
            //remove the specified component
            if(fsm.linkedNodes[componentId] !== undefined){
                delete fsm.linkedNodes[componentId];
            }
        }
        //TODO: remove the event chains that are part of the fsm 
    };

    /**
       Get the states and events for the currentFSM
     */
    ShellPrototype.getComponentsForCurrentFSM = function(){
        let currentNode = this.cwd,
            currentFSM;
        if(currentNode.tags.type === 'fsm'){
            currentFSM = currentNode;
        }else{
            let fsmLink = _.find(_.toPairs(currentNode.linkedNodes),d=>/fsm->/.test(d[1]))[0];
            if(fsmLink !== undefined){
                currentFSM = this.getNode(fsmLink[0]);
            }
        }

        if(currentFSM === undefined){
            throw new Error("Can't find a parent fsm");
        }
        let linkedNodes = _.toPairs(currentFSM.linkedNodes),
            states = _.filter(linkedNodes,d=>/^state/.test(d[1])).map(d=>this.getNode(d[0])),
            events = _.filter(linkedNodes,d=>/^event/.test(d[1])).map(d=>this.getNode(d[0]).toString());

        return {
            states : states,
            events : events
        };
    };

    //--------------------
    //FSM Runtime Commands
    //--------------------

    /**
       Specify the state for an instance of the fsm. ie: jump to state
       @param individualId The identifying instance, typically the individual 'in' the fsm.
       @param stateId The State to move to
       @param stateToken Optional. The Token to describe the state's variables. unused.
       @param fsmId The fsm to modify
     */
    ShellPrototype.setFSMForInd = function(individualId,stateId,stateToken,fsmId){
        let fsm = this.getNode(fsmId),
            indiv = this.getNode(individualId),
            state = this.getNode(stateId);
        if(fsm.tags.type !== 'fsm'){
            throw new Error('Trying to init an FSM on a non-FSM');
        }
        if(state.tags.type !== 'state' || fsm.linkedNodes[stateId] !== 'state'){
            throw new Error("Trying to set a start state that isn't one");
        }
        if(indiv === undefined){
            throw new Error('indiv is not defined');
        }
        //linked the fsm to the individual
        //store fsm position as either just an id, or as a token
        fsm.instanceStates[individualId] = stateId || stateToken;
        fsm.linkedNodes[individualId] = "instanceFor";
        //link the individual to the fsm
        indiv.linkedNodes[fsmId] = "fsm->instance";

        console.log(`${individualId} :: ${fsm.instanceStates[individualId]}`);        
    };

    /**
       For an FSM instance, trigger an event, resulting in an updated state pairing.
       @param indId The fsm instance id
       @param eventId the event to try to trigger (if the current state allows it)
       @param fsmId The fsm to modify
     */
    ShellPrototype.triggerEvent = function(indId,eventId,fsmId){
        if(indId === undefined){
            throw new Error('no individual specified');
        }
        //get the event,
        let fsm = this.getNode(fsmId),
            //the current state
            stateId = fsm.instanceStates[indId],
            state = this.getNode(stateId),
            //events for the state
            stateEvents = _.toPairs(state.linkedNodes).map(d=>[d[0].split(/->/),d[1]]).filter(d=>d[0][0] === stateId),
            randEvent = _.sample(stateEvents),
            event = eventId !== undefined ? this.getNode(eventId) : this.getNode(randEvent[0][1]);
        //update the id to be used:
        eventId = event.id;
        if(event == undefined || fsm.linkedNodes[eventId] !== 'event'){
            throw new Error('Bad Event Specified');
        }
        if(stateId === undefined){
            throw new Error('no current state for the instance');
        }
        if(_.find(stateEvents,d=>parseInt(d[0][1]) === eventId) === undefined){
            throw new Error('Specified Event is not valid for the current state');
        }
        //enact any actions of the event
        console.log(`Enacting: ${event.name}`);        
        //get associated actions, and trigger them, using the state as a token?
        
        //set the fsm instance state for the ind to the resulting state
        let sequenceRegex = new RegExp(`^${stateId}->${eventId}`),
            potentialSequences = _.toPairs(event.linkedNodes).filter(d=>/^eventLink/.test(d[1]) && sequenceRegex.test(d[0])),
            selectedTargetState = _.sample(potentialSequences)[0].split('->')[2];

        fsm.instanceStates[indId] = selectedTargetState;
        let newState = this.getNode(fsm.instanceStates[indId]);
        console.log(`Resulting State: ${newState.name}`);
    };
    
    return ShellPrototype;
});
