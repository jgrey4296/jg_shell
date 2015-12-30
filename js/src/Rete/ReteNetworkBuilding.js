if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','./ReteUtilities','./ReteActivations'],function(RDS,ReteUtil,ReteActivations){

    /**
       @function buildOrShareNetworkForConditions
       @purpose to add all given conditions to the network
    */
    var buildOrShareNetworkForConditions = function(parent,conditions,rootAlpha,allNodes,reteNet){
        var currentNode = parent;
        var alphaMemory;
        //for each condition
        conditions.forEach(function(condition){
            if(condition.tags.type !== 'condition' && condition.tags.type !== 'negConjCondition'
               && condition.tags.type !== 'negCondition'){
                throw new Error("Inappropriate condition format");
            }
            var tests = _.pairs(condition.bindings);            
            if(condition.tags.isPositive){
                currentNode = buildOrShareBetaMemoryNode(currentNode,reteNet);
                alphaMemory = buildOrShareAlphaMemory(condition,rootAlpha,allNodes,reteNet);
                currentNode = buildOrShareJoinNode(currentNode,alphaMemory,tests,reteNet);
            }else if(condition.tags.isNegative){
                alphaMemory = buildOrShareAlphaMemory(condition,rootAlpha,allNodes,reteNet);
                currentNode = buildOrShareNegativeNode(currentNode,alphaMemory,tests,reteNet);
            }else if(condition.tags.isNCCCondition){
                currentNode = buildOrShareNCCNodes(currentNode,condition,rootAlpha,allNodes,reteNet);
            }else{
                console.error("Problematic Condition:",condition);
                throw new Error("Unrecognised condition type");
            }
        });
        //return current node
        var finalBetaMemory = buildOrShareBetaMemoryNode(currentNode,reteNet);
        return finalBetaMemory;
    };
    
    /**
       @function buildOrShareConstantTestNode
       @purpose Reuse, or create a new, constant test node, for the given test
     */
    var buildOrShareConstantTestNode = function(parent,constantTestSpec,reteNet){
        
        //Todo: write this as a functional select/find
        for(var i in parent.children){
            var node = parent.children[i];
            if(ReteUtil.compareConstantNodeToTest(node,constantTestSpec)){
                return node;
            }
        }
        var newAlphaNode = new RDS.AlphaNode(parent,constantTestSpec);

        reteNet.storeNode(newAlphaNode);

        return newAlphaNode;
    };
    

    /**
       @function buildOrShareAlphaMemory
       @purpose Create alpha network as necessary, stick an alpha memory on the end
       @reminder Rule{Conditions[]}, Condition{constantTests:[],bindings:[[]]}
    */
    var buildOrShareAlphaMemory = function(condition,root,allNodes,reteNet){
        var currentNode = root;
        var constantTests = _.keys(condition.constantTests).map(function(d){
            return this[d];
        },allNodes);
        
        currentNode = constantTests.reduce(function(m,v){
            return buildOrShareConstantTestNode(m,v,reteNet);
        },currentNode);
        
        //see if there is an existing memory for this condition.
        //if so, return existing alphamemory
        if(currentNode.outputMemory !== undefined){
            return currentNode.outputMemory;
        }
        //else: create the alpha memory
        //ctor will update the current node's outputMemory field
        var newAlphaMemory = new RDS.AlphaMemory(currentNode);
        //run wmes in working memory against the alpha network
        reteNet.storeNode(newAlphaMemory);
        return newAlphaMemory;
    };

    /**
       @function buildOrShareBetaMemoryNode
       @purpose given a node (ie: join), stick a betamemory on it as a child
     */
    var buildOrShareBetaMemoryNode = function(parent,reteNet){
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
        var newBetaMemory = new RDS.BetaMemory(parent);
        //update it with matches
        updateNewNodeWithMatchesFromAbove(newBetaMemory);

        reteNet.storeNode(newBetaMemory);
        
        //return new beta memory
        return newBetaMemory;
    };
    


    
    /**
       @function buildOrShareJonNode
       @purpose To reuse, or create a new, join node linking an alpha memory and betamemory
     */
    var buildOrShareJoinNode = function(parent,alphaMemory,tests,reteNet){
        //convert tests if necessary:
        if(!(tests instanceof Array)){
            tests = _.pairs(tests);
        }
        
        //see if theres a join node to use already
        var allChildren = parent.children.concat(parent.unlinkedChildren);
        for(var i in allChildren){
            var child = allChildren[i];
            if(child.isJoinNode && child.alphaMemory.id === alphaMemory.id && ReteUtil.compareJoinTests(child.tests,tests)){
                //return it
                return child;
            }
        }
        //else: create a new join node
        //increment alphamemories reference count in the constructor
        var newJoinNode = new RDS.JoinNode(parent,alphaMemory,tests);
        //set the nearest ancestor
        newJoinNode.nearestAncestor = ReteUtil.findNearestAncestorWithAlphaMemory(parent,alphaMemory);

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
        reteNet.storeNode(newJoinNode);
        
        return newJoinNode;
    };

    /**
       @function buildOrShareNegativeNode
       @purpose To reuse, or build a new, negative node
     */
    var buildOrShareNegativeNode = function(parent,alphaMemory,tests,reteNet){
        if(!(tests instanceof Array)) tests = _.pairs(tests);
        //see if theres an existing negative node to use
        for(var i in parent.children){
            var child = parent.children[i];
            if(child.isNegativeNode
               && child.alphaMemory.id === alphaMemory.id
               && ReteUtil.compareJoinTests(child.tests,tests)){
                return child;
            }
        }
        var newNegativeNode = new RDS.NegativeNode(parent,alphaMemory,tests);
        newNegativeNode.nearestAncestor = ReteUtil.findNearestAncestorWithAlphaMemory(parent,alphaMemory);
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

        reteNet.storeNode(newNegativeNode);
        return newNegativeNode;
    };

    /**
       @function buildOrShareNCCNodes
       @purpose construction of NCCConditions
    */
    var buildOrShareNCCNodes = function(parent,condition,rootAlpha,allNodes,reteNet){
        if(condition.tags.isNCCCondition === undefined){
            throw new Error("BuildOrShareNCCNodes only takes NCCCondition");
        }
        //build a network for the conditions
        var conditions = _.keys(condition.conditions).map(function(d){
            return this[d];
        },allNodes);
        var bottomOfSubNetwork = buildOrShareNetworkForConditions(parent,conditions,rootAlpha,allNodes,reteNet);
        //find an existing NCCNode with partner to use
        for(var i in parent.children){
            var child = parent.children[i];
            if(child.isAnNCCNode && child.partner.parent.id === bottomOfSubNetwork.id){
                return child;
            }
        }
        //else: build NCC and Partner nodes
        var newNCC = new RDS.NCCNode(parent);
        var newNCCPartner = new RDS.NCCPartnerNode(bottomOfSubNetwork,condition.conditions.length);
        newNCC.partner = newNCCPartner;
        newNCCPartner.nccNode = newNCC;
        //update NCC
        updateNewNodeWithMatchesFromAbove(newNCC);
        //update partner
        updateNewNodeWithMatchesFromAbove(newNCCPartner);

        reteNet.storeNode(newNCC);
        reteNet.storeNode(newNCCPartner);
        
        return newNCC;
    };


    /**
       @function updateNewNodeWithMatchesFromAbove
       @purpose pulls tokens down from parent upon new creation
     */
    //essentially a 4 state switch:
    //betaMemory, joinNode, negativeNode, NCC
    var updateNewNodeWithMatchesFromAbove = function(newNode){
        var i, token;
        var parent = newNode.parent;
        if(parent.isBetaMemory){
            for(i in parent.items){
                ReteActivations.leftActivate(newNode,parent.items[i]);
            }
        }else if(parent.isJoinNode){
            var savedChildren = parent.children;
            parent.children = [newNode];
            for(i in parent.alphaMemory.items){
                var item = parent.alphaMemory.items[i];
                ReteActivations.rightActivate(parent,item.wme);
            }
            parent.children = savedChildren;
        }else if(parent.isNegativeNode){
            for(i in parent.items){
                token = parent.items[i];
                if(token.negJoinResults.length === 0){
                    ReteActivations.leftActivate(newNode,token);
                }
            }
        }else if(parent.isAnNCCNode){
            for(i in parent.items){
                token = parent.items[i];
                if(token.nccResults.length === 0){
                    ReteActivations.leftActivate(newNode,token);
                }
            }
        }
    };


    
    var interface = {
        "buildOrShareNetworkForConditions" : buildOrShareNetworkForConditions,
    };
    return interface;
});
