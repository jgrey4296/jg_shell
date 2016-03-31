if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','Rete'],function(_,Rete){
    "use strict";
    /**
       Define prototype methods relating to shell <-> rete interaction
       @exports ShellModules/shell_rete
     */
    var ShellPrototype = {};
    
    /**
       Completely reset the retenet, by building a new one
       @method
     */
    ShellPrototype.clearRete = function(){
        _.values(this.allNodes).forEach(d=>d.setValue(undefined,"wmeId",undefined));
        this.reteOutput = [];
        this.reteNet.cleanup();
        //this.reteNet = new Rete(this._reteNetBackupActions);
    };
    /**
       Retrieve all defined rules, add them to the rete net
       @method
       @param nodeIds
     */    
    ShellPrototype.compileRete = function(nodeIds){
        //take all defined rules from the provided list, or find all in the graph
        if(nodeIds === undefined) { nodeIds = _.keys(this.allNodes); }
        let nodes  = nodeIds.map(d=>this.getNode(d)),
            rules = nodes.filter(d=>d.tags.type==='rule');
        
        console.log("Compiling rules:",rules);
        //and add them to the rete net
        //returning the action nodes of the net
        this.allActionNodes = rules.map(function(d){
            console.log("Adding rule:",d);
            let actionNode = this.reteNet.addRule(d.id,this.allNodes);
            //TODO: store the returned node inside the shell's nodes?
            d.actionNodeId = actionNode.id;
            return {"rule": d, "actions" :actionNode};
        },this);

        console.log("All action nodes:",this.allActionNodes);
    };

    /**
       Assert all child nodes of the current node as facts using each nodes' values field
       @method
       @param nodeIds
       @TODO: be able to detect bindings and resolve them prior to assertion?
     */
    ShellPrototype.assertWMEs = function(nodeIds){
        //get all the wmes
        if(nodeIds === undefined || nodeIds.length === 0) { nodeIds = _.keys(this.allNodes); }
        var nodes = nodeIds.map(d=>this.getNode(d)),
            wmes = nodes.filter(d=>d.tags.fact !== undefined).filter(d=>d.wmeId === undefined);
        //assert them
        this.assertWMEList(wmes);
    };

    /**
       Retract wmes vias the retenet
       @method
       @param nodeIds
     */
    ShellPrototype.retractWMEs = function(nodeIds){
        if(nodeIds === undefined || nodeIds.length === 0) { nodeIds = _.keys(this.allNodes); }
        var shellRef = this,
            nodes = nodeIds.map(function(d){
                return shellRef.getNode(d);
            }).filter(d=>d.wmeId !== undefined);
        
        this.retractWMEList(nodes);
    };
    
    /**
       Taking a list of objects, add each as a wme to the retenet of the shell
       @method
       @param nodes
       @param array An Array of objects
     */
    ShellPrototype.assertWMEList = function(nodes){
        if(!(nodes instanceof Array)){
            throw new Error("Asserting should be in the form of an array");
        }
        //create wme objects out of them
        var newWMEs = nodes.map(function(data){
            //var wmeId = Rete.assertWME_Immediately(data,this.reteNet);
            var wmeId = this.reteNet.assertWME(data);
            data.wmeId = wmeId;
            return wmeId;
        },this);
        console.log("New WMES:",newWMEs);
        return newWMEs;
    };

    /**
       retractWMEList
       @method
       @param nodes
     */
    ShellPrototype.retractWMEList = function(nodes){
        if(!(nodes instanceof Array)){
            throw new Error("Retractions should be in an array");
        }
        nodes.forEach(function(node){
            this.reteNet.retractWME(node.wmeId);
            delete node.wmeId;
        },this);
    };

    /**
       Step Time
       @method
     */
    ShellPrototype.stepTime = function(){
        //Rete.incrementTime(this.reteNet);
        this.reteNet.stepTime();
        console.log("Potential Actions:",this.reteNet.proposedActions);
        return this.reteNet.proposedActions;
    };


    return ShellPrototype;
});
