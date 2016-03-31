/* jshint esversion : 6 */
define(['underscore','d3','./DrawUtils'],function(_,d3,DrawUtils){
    "use strict";
    /**
       A Template drawing module
    */
    var FSMDrawInterface = {};

    /**
       Draw the Central FSM
     */
    FSMDrawInterface.drawFSM = function(globalData,fsmNode){
        let fsmData = fsmNode.getDescriptionObjects(),
            stateData = _.keys(fsmNode.states).map(d=>[globalData.shell.getNode(d).getShortDescription()]),
            eventData = _.keys(fsmNode.events).map(d=>[globalData.shell.getNode(d).getShortDescription()]),
            commonData = new DrawUtils.CommonData(globalData,fsmData,3);
        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;
        delete commonData.groupNodeTransform;
        
        //DOM elements:
        let mainContainer = DrawUtils.createOrShare('mainContainer'),
            fsmContainer = DrawUtils.createOrShare('focusNode',mainContainer)
            .attr('transform',`translate(${commonData.halfWidth},100)`),
            //
            stateContainer = DrawUtils.createOrShare('states',mainContainer)
            .attr('transform',`translate(${commonData.leftOffset},100)`),
            //
            eventContainer = DrawUtils.createOrShare('events',mainContainer)
            .attr('transform',`translate(${commonData.rightOffset},100)`);
        
        //draw the main fsm node
        DrawUtils.drawSingleNode(fsmContainer,fsmData,commonData);
            
        
        //draw the states
        stateData.unshift([{name: "States:"}]);
        commonData.data = stateData;
        DrawUtils.drawGroup(stateContainer,commonData);
        
        //draw the events
        eventData.unshift([{name:"Events:"}]);
        commonData.data = eventData;
        DrawUtils.drawGroup(eventContainer,commonData);
        
    };

    /**
       Draw an Event of the FSM, with incoming states and outgoing states
     */
    FSMDrawInterface.drawEvent = function(globalData,eventNode){
        //Draw the event
        let eventData = eventNode.getDescriptionObjects(),
            commonData = new DrawUtils.CommonData(globalData,eventData,3),
            sourceData = _.keys(eventNode.statePairs).map(d=>[globalData.shell.getNode(d).getShortDescription()]),
            sinkData = _.values(eventNode.statePairs).map(d=>[globalData.shell.getNode(d).getShortDescription()]);

        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;
        delete commonData.groupNodeTransform;
        
        //Draw the source states
        let mainContainer = DrawUtils.createOrShare('mainContainer'),
            eventContainer = DrawUtils.createOrShare('focusNode',mainContainer)
            .attr('transform',`translate(${commonData.halfWidth},100)`),
            //
            sources = DrawUtils.createOrShare('sources',mainContainer)
            .attr('transform',`translate(${commonData.leftOffset},100)`),
            //
            sinks = DrawUtils.createOrShare('sinks',mainContainer)
            .attr('transform',`translate(${commonData.rightOffset},100)`);
        
        //draw the elements:
        DrawUtils.drawSingleNode(eventContainer,eventData,commonData);

        //sources
        sourceData.unshift([{name:"Source States"}]);
        commonData.data = sourceData;
        DrawUtils.drawGroup(sources,commonData);
        //sinks
        sinkData.unshift([{name:"Sink States"}]);
        commonData.data = sinkData;
        DrawUtils.drawGroup(sinks,commonData);
    };

    /**
       Draw an FSM state, showing incoming states+events,
       and outoing states+events
     */
    FSMDrawInterface.drawState = function(globalData,stateNode){
        //Draw the event
        let stateData = stateNode.getDescriptionObjects(),
            commonData = new DrawUtils.CommonData(globalData,stateData,5),
            //source side data
            sourceEventData = _.keys(stateNode.inEvents).map(d=>[globalData.shell.getNode(d).getShortDescription()]),
            sourceStateData = _.values(stateNode.inEvents).map(d=>[globalData.shell.getNode(d).getShortDescription()]),
            //sink side data
            sinkEventData = _.keys(stateNode.outEvents).map(d=>[globalData.shell.getNode(d).getShortDescription()]),
            sinkStateData = _.values(stateNode.outEvents).map(d=>[globalData.shell.getNode(d).getShortDescription()]);

        commonData.nodeDataSeparator = 10;
        commonData.groupDataSeparator = 10;
        commonData.widthAddition = 10;
        delete commonData.groupNodeTransform;
        
        //Draw the source states
        let mainContainer = DrawUtils.createOrShare('mainContainer'),
            //central
            stateContainer = DrawUtils.createOrShare('focusNode',mainContainer)
            .attr('transform',`translate(${commonData.halfWidth},100)`),
            //Left containers
            sourceStates = DrawUtils.createOrShare('sourceStates',mainContainer)
            .attr('transform',`translate(${commonData.doubleLeftOffset},100)`),
            sourceEvents = DrawUtils.createOrShare('sourceEvents',mainContainer)
            .attr('transform',`translate(${commonData.leftOffset},100)`),
            //right containers
            sinkStates = DrawUtils.createOrShare('sinkStates',mainContainer)
            .attr('transform',`translate(${commonData.doubleRightOffset},100)`),
            sinkEvents = DrawUtils.createOrShare('sinkEvents',mainContainer)
            .attr('transform',`translate(${commonData.rightOffset},100)`);
        
        //draw the elements:
        DrawUtils.drawSingleNode(stateContainer,stateData,commonData);

        //source states
        sourceStateData.unshift([{name:"Source States"}]);
        commonData.data = sourceStateData;
        DrawUtils.drawGroup(sourceStates,commonData);

        //source events
        sourceEventData.unshift([{name:"Source Events"}]);
        commonData.data = sourceEventData;
        DrawUtils.drawGroup(sourceEvents,commonData);
        
        //sink states
        sinkStateData.unshift([{name:"Sink States"}]);
        commonData.data = sinkStateData;
        DrawUtils.drawGroup(sinkStates,commonData);

        //sink events
        sinkEventData.unshift([{name:"Sink Events"}]);
        commonData.data = sinkEventData;
        DrawUtils.drawGroup(sinkEvents,commonData);
    };

    /**
       Setup the cleanup method for this interface
     */
    FSMDrawInterface.cleanup = DrawUtils.cleanup.bind({},"#focusNode","#events","#states",'#sourceStates','#sinkStates','#sourceEvents','#sinkEvents','#sources','#sinks');
    
    return FSMDrawInterface;
});
