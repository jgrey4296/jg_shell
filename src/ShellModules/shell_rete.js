/**
   @purpose Define prototype methods relating to shell <-> rete interaction
 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','../Rete/ReteInterface'],function(_,Rete){
    var ShellPrototype = {};
    
    /**
       @class CompleteShell
       @method clearRete
       @purpose Completely reset the retenet, by building a new one
     */
    ShellPrototype.clearRete = function(){
        this.reteNet = new Rete.ReteNet();
    };

    /**
       @class CompleteShell
       @method clearActivatedRules
       @purpose Clear the record of recently activated rules
     */
    ShellPrototype.clearPotentialActions = function(){
        Rete.clearPotentialActions(this.reteNet);
    };
    
    ShellPrototype.clearHistory = function(){
        Rete.clearHistory(this.reteNet);
    };
    
    /**
       @class CompleteShell
       @method compileRete
       @purpose Retrieve all defined rules, add them to the rete net
     */    
    ShellPrototype.compileRete = function(nodeIds){
        //take all defined rules from the provided list, or find all in the graph
        if(nodeIds === undefined) nodeIds = _.keys(this.allNodes);
        var shellRef = this,
            nodes  = nodeIds.map(function(d){
                return shellRef.getNode(d);
            }),
            rules = nodes.filter(function(d){
                return d.tags.type === 'rule';
            });
        
        console.log("Compiling rules:",rules);
        //and add them to the rete net
        //returning the action nodes of the net
        this.allActionNodes = rules.map(function(d){
            console.log("Adding rule:",d);
            var actionNode = Rete.addRule(d.id,this.reteNet,this.allNodes);
            //TODO: store the returned node inside the shell's nodes?
            d.actionNodeId = actionNode.id;
            return {"rule": d, "actions" :actionNode};
        },this);

        console.log("All action nodes:",this.allActionNodes);
    };

    /**
       @class CompleteShell
       @method assertChildren
       @purpose Assert all child nodes of the current node as facts
       using each nodes' values field
       @TODO: be able to detect bindings and resolve them prior to assertion?
     */
    ShellPrototype.assertWMEs = function(nodeIds){
        //get all the wmes
        if(nodeIds === undefined || nodeIds.length === 0) nodeIds = _.keys(this.allNodes);
        var shellRef = this,
            nodes = nodeIds.map(function(d){
                return shellRef.getNode(d);
            }),
            wmes = nodes.filter(function(node){
                return node.tags.fact !== undefined;
            }).filter(function(node){
                return node.wmeId === undefined;
            });

        //assert them
        this.assertWMEList(wmes);
    };

    ShellPrototype.retractWMEs = function(nodeIds){
        if(nodeIds === undefined || nodeIds.length === 0) nodeIds = _.keys(this.allNodes);
        var shellRef = this,
            nodes = nodeIds.map(function(d){
                return shellRef.getNode(d);
            }),
            wmes = nodes.filter(function(node){
                return node.tags.fact !== undefined;
            }).filter(function(node){
                return node.wmeId !== undefined;
            });

        this.retractWMEList(wmes);
    };
    
    /**
       @class CompleteShell
       @method assertWMEList
       @purpose Taking a list of objects, add each as a wme to the retenet of the shell
       @param array An Array of objects
     */
    ShellPrototype.assertWMEList = function(nodes){
        if(!(nodes instanceof Array)){
            throw new Error("Asserting should be in the form of an array");
        }
        //create wme objects out of them
        var newWMEs = nodes.map(function(data){
            var wmeId = Rete.assertWME_Immediately(data,this.reteNet);
            data.wmeId = wmeId;
            return wmeId;
        },this);
        console.log("New WMES:",newWMEs);
        return newWMEs;
    };

    ShellPrototype.retractWMEList = function(nodes){
        if(!(nodes instanceof Array)){
            throw new Error("Retractions should be in an array");
        }
        nodes.forEach(function(node){
            Rete.retractWME_Immediately(node,this.reteNet);
        },this);
    };
    
    ShellPrototype.stepTime = function(){
        Rete.incrementTime(this.reteNet);
        console.log("Potential Actions:",this.reteNet.potentialActions);
        return this.reteNet.potentialActions;
    };
    
    /**
       @class CompleteShell
       @method getNode
       @purpose get a node by its id, utility method
     */
    ShellPrototype.getNode = function(nodeId){
        nodeId = Number(nodeId);
        
        if(this.allNodes[nodeId]){
            return this.allNodes[nodeId];
        }else{
            throw new Error("Unknown node specified: " + nodeId);
        }        
    };


    return ShellPrototype;
});
