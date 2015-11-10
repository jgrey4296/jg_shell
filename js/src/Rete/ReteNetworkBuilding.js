if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures'],function(RDS){

    /**
       @function buildOrShareConstantTestNode
       @purpose Reuse, or create a new, constant test node, for the given test
     */
    var buildOrShareConstantTestNode = function(parent,constantTest){
        //Todo: write this as a functional select/find
        for(var i in parent.children){
            var node = parent.children[i];
            if(compareConstantNodeToTest(node,constantTest)){
                return node;
            }
        }
        var newAlphaNode = new DataStructures.AlphaNode(parent,constantTest);
        return newAlphaNode;
    };
    

    /**
       @function buildOrShareAlphaMemory
       @purpose Create alpha network as necessary, stick an alpha memory on the end
       @reminder Rule{Conditions[]}, Condition{constantTests:[],bindings:[[]]}
    */
    var buildOrShareAlphaMemory = function(condition,root){
        var currentNode = root;
        for(var i in condition.constantTests){
            var constantTest = condition.constantTests[i];
            currentNode = buildOrShareConstantTestNode(currentNode,constantTest);
        }
        //see if there is an existing memory for this condition.
        //if so, return existing alphamemory
        if(currentNode.outputMemory !== undefined){
            return currentNode.outputMemory;
        }
        //else: create the alpha memory
        //ctor will update the current node's outputMemory field
        var newAlphaMemory = new DataStructures.AlphaMemory(currentNode);
        //run wmes in working memory against the alpha network
        return newAlphaMemory;
    };

    /**
       @function buildOrShareBetaMemoryNode
       @purpose given a node (ie: join), stick a betamemory on it as a child
     */
    var buildOrShareBetaMemoryNode = function(parent){
        //if passed in the dummy top node, return it:
        if(parent.isBetaMemory === true){
            return parent;
        }
                
        //if theres an available beta memory to use,
        //return that
        for(var i in parent.children){
            var child = parent.children[i];
            if(child.isBetaMemory){
                return child;
            }
        }
        //else: create a new beta memory
        //ctor should update  parent's children
        var newBetaMemory = new DataStructures.BetaMemory(parent);
        //update it with matches
        updateNewNodeWithMatchesFromAbove(newBetaMemory);
        //return new beta memory
        return newBetaMemory;
    };
    

    /**
       @function findNearestAncestorWithAlphaMemory
       @recursive
       @purpose To go up the network, to find appropriate beta network elements linked to the alphamemory
    */
    var findNearestAncestorWithAlphaMemory = function(node,alphaMemory){
        //base conditions:
        if(node.dummy){ return null;}
        if(node.isJoinNode || node.isNegativeNode){
            if(node.alphaMemory.id === alphaMemory.id){
                return node;
            }
        }
        //switch recursion into the partner clause
        if(node.isAnNCCNode){
            return findNearestAncestorWithAlphaMemory(node.partner.parent,alphaMemory);
        }
        //recurse:
        return findNearestAncestorWithAlphaMemory(node.parent,alphaMemory);        
    };

    
    /**
       @function buildOrShareJonNode
       @purpose To reuse, or create a new, join node linking an alpha memory and betamemory
     */
    var buildOrShareJoinNode = function(parent,alphaMemory,tests){
        //see if theres a join node to use already
        var allChildren = parent.children.concat(parent.unlinkedChildren);
        for(var i in allChildren){
            var child = allChildren[i];
            if(child.isJoinNode && child.alphaMemory.id === alphaMemory.id && compareJoinTests(child.tests,tests)){
                //return it
                return child;
            }
        }
        //else: create a new join node
        //increment alphamemories reference count in the constructor
        var newJoinNode = new DataStructures.JoinNode(parent,alphaMemory,tests);
        //set the nearest ancestor
        newJoinNode.nearestAncestor = findNearestAncestorWithAlphaMemory(parent,alphaMemory);

        //if either parent memory is empty, unlink
        if(parent.items.length === 0){
            //BETA IS EMPTY: UNLINK RIGHT
            var index = alphaMemory.children.map(function(d){ return d.id; }).indexOf(newJoinNode.id);
            var removed = alphaMemory.children.splice(index,1);
            alphaMemory.unlinkedChildren.unshift(removed[0]);
        }else if(alphaMemory.items.length === 0){
            //ALPHA IS EMPTY: UNLINK LEFT
            var newNodeIndex = parent.children.map(function(d){
                return d.id;
            }).indexOf(newJoinNode.id);
            var removedNode = parent.children.splice(newNodeIndex,1);
            parent.unlinkedChildren.unshift(removedNode[0]);
        }
        //return new join node
        return newJoinNode;
    };

    /**
       @function buildOrShareNegativeNode
       @purpose To reuse, or build a new, negative node
     */
    var buildOrShareNegativeNode = function(parent,alphaMemory,tests){
        //see if theres an existing negative node to use
        for(var i in parent.children){
            var child = parent.children[i];
            if(child.isNegativeNode
               && child.alphaMemory.id === alphaMemory.id
               && compareJoinTests(child.tests,tests)){
                return child;
            }
        }
        var newNegativeNode = new DataStructures.NegativeNode(parent,alphaMemory,tests);
        newNegativeNode.nearestAncestor = findNearestAncestorWithAlphaMemory(parent,alphaMemory);
        //update with matches
        updateNewNodeWithMatchesFromAbove(newNegativeNode);
        //unlink if it has no tokens
        if(newNegativeNode.items.length === 0){
            var index = alphaMemory.children.map(function(d){
                return d.id;
            }).indexOf(newNegativeNode.id);
            var removed = alphaMemory.children.splice(index,1);
            alphaMemory.unlinkedChildren.push(removed[0]);
        }
        //return new negative node
        return newNegativeNode;
    };

    /**
       @function buildOrShareNCCNodes
       @purpose construction of NCCConditions
    */
    var buildOrShareNCCNodes = function(parent,condition,rootAlpha){
        if(condition.isNCCCondition === undefined){
            throw new Error("BuildOrShareNCCNodes only takes NCCCondition");
        }
        //build a network for the conditions
        var bottomOfSubNetwork = buildOrShareNetworkForConditions(parent,condition.conditions,rootAlpha);
        //find an existing NCCNode with partner to use
        for(var i in parent.children){
            var child = parent.children[i];
            if(child.isAnNCCNode && child.partner.parent.id === bottomOfSubNetwork.id){
                return child;
            }
        }
        //else: build NCC and Partner nodes
        var newNCC = new DataStructures.NCCNode(parent);
        var newNCCPartner = new DataStructures.NCCPartnerNode(bottomOfSubNetwork,condition.conditions.length);
        newNCC.partner = newNCCPartner;
        newNCCPartner.nccNode = newNCC;
        //update NCC
        updateNewNodeWithMatchesFromAbove(newNCC);
        //update partner
        updateNewNodeWithMatchesFromAbove(newNCCPartner);
        return newNCC;
    };

    /**
       @function buildOrShareNetworkForConditions
       @purpose to add all given conditions to the network
    */
    var buildOrShareNetworkForConditions = function(parent,conditions,rootAlpha){
        var currentNode = parent;
        var tests, alphaMemory;
        //for each condition
        for(var i in conditions){
            var condition = conditions[i];
            if(condition.isPositive){
                currentNode = buildOrShareBetaMemoryNode(currentNode);
                tests = condition.bindings;
                alphaMemory = buildOrShareAlphaMemory(condition,rootAlpha);
                currentNode = buildOrShareJoinNode(currentNode,alphaMemory,condition.bindings);
            }else if(condition.isNegative){
                tests = condition.bindings;
                alphaMemory = buildOrShareAlphaMemory(condition,rootAlpha);
                currentNode = buildOrShareNegativeNode(currentNode,alphaMemory,tests);
            }else if(condition.isNCCCondition){
                currentNode = buildOrShareNCCNodes(currentNode,condition,rootAlpha);
            }else{
                console.error("Problematic Condition:",condition);
                throw new Error("Unrecognised condition type");
            }
        }
        //return current node
        var finalBetaMemory = buildOrShareBetaMemoryNode(currentNode);
        return finalBetaMemory;
    };


    var interface = {};
    return interface;
});
