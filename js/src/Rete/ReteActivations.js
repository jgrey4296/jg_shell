if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','./ReteComparisonOperators','./ReteUtilities','./ReteTestExecution','./ReteActions','./ReteNegativeActions'],function(RDS,ConstantTestOperators,ReteUtil,ReteTestExecution,PossibleActions,ReteNegativeActions){

    /**
       @function alphaMemoryActivation
       @purpose stores a wme in an alpha memory
       Trigger an alpha memory with a new wme to store
     */
    var alphaMemoryActivation = function(alphaMem,wme){
        var newItem = new DataStructures.AlphaMemoryItem(wme,alphaMem);
        alphaMem.items.unshift(newItem);
        wme.alphaMemoryItems.unshift(newItem);

        for(var i in alphaMem.children){
            var child = alphaMem.children[i];
            rightActivate(child,wme);
        }
    };

    /**
       @function constantTestNodeActivation
       @purpose tests a wme against the test in the given node
     */
    //Trigger a constant test with a new wme
    var constantTestNodeActivation = function(alphaNode,wme){
        //test the wme using the constant test in the node
        var testResult = false;
        if(alphaNode.passThrough){
            testResult = true;
        }else{
            var wmeFieldValue = wme.data[alphaNode.testField];
            var value = alphaNode.testValue;
            var operator = alphaNode.operator;
            if(ConstantTestOperators[operator]){
                if(operator !== 'EQ' && operator !== 'NE'){
                    testResult = ConstantTestOperators[operator](Number(wmeFieldValue),Number(value));
                }else{
                    testResult = ConstantTestOperators[operator](wmeFieldValue,value);
                }
                
            }
        }
        if(testResult){
            for(var i in alphaNode.children){
                var child = alphaNode.children[i];
                alphaNodeActivation(child,wme);
            }
            if(alphaNode.outputMemory){
                alphaNodeActivation(alphaNode.outputMemory,wme);
            }
        }
        return testResult;
    };

    /**
       @function alphaNodeActivation
       @utility
       @purpose selects whether to store a wme, or test the wme
     */
    //Switchable activation function for alpha network stuff
    var alphaNodeActivation = function(alphaNode,wme){
        if(alphaNode.isAlphaMemory){
            alphaMemoryActivation(alphaNode,wme);
        }else if(alphaNode.isConstantTestNode){
            return constantTestNodeActivation(alphaNode,wme);
        }else{
            throw new Error("Unrecognised node:",alphaNode);
        }
    };

    /**
       @function betaMemoryActivation
       @purpose stores a token in the beta memory
     */
    //trigger a beta memory to store a new token
    //bindings are from the join node, holding results of the NEW binding tests
    //old bindings are still in the token, the constructor of Token will combine the two
    //sets of bindings
    var betaMemoryActivation = function(betaMemory,token){
        var newToken = token;
        betaMemory.items.unshift(newToken);
        for(var i in betaMemory.children){
            var child = betaMemory.children[i];
            leftActivate(child,newToken);
        }
    };

    
    /**
       @function joinNodeLeftActivation
       @purpose given a new token, compares it to all wmes in the related alpha memory
     */
    //Trigger a join node with a new token
    //will pull all wmes needed from the linked alphaMemory
    var joinNodeLeftActivation = function(node,token){
        //If necessary, relink or unlink the
        //parent betamemory or alphamemory
        if(node.parent.items && node.parent.items.length > 0){
            ReteUtil.relinkToAlphaMemory(node);
            if(node.alphaMemory.items.length === 0){
                //unlink beta memory if alphamemory is empty
                var index = node.parent.children.map(function(d){return d.id;}).indexOf(node.id);
                var unlinked = node.parent.children.splice(index,1);
                node.parent.unlinkedChildren.push(unlinked[0]);
            }
        }
        //for each wme in the alpha memory,
        //compare using join tests,
        //and pass on successful combinations
        //to beta memory /negative node children
        //to be combined into tokens
        for(var i in node.alphaMemory.items){
            var currWME = node.alphaMemory.items[i].wme;
            var joinTestResult = ReteTestExecution.performJoinTests(node,token,currWME);
            if(joinTestResult !== false){
                for(var j in node.children){
                    var currChild = node.children[i];
                    leftActivate(currChild,token,currWME,joinTestResult);
                }//end of loop activating all children
            }
        }//end of looping all wmes in alphamemory
    };

    /**
       @function joinNodeRightActivation
       @purpose given a new wme, compares it against all tokens in the related beta memory
     */
    //Trigger a join node with a new wme
    //pulling all necessary tokens from the parent as needed
    var joinNodeRightActivation = function(node,wme){
        //relink or unlink as necessary
        if(node.alphaMemory.items.length === 1){
            ReteUtil.relinkToBetaMemory(node);
            if(node.parent.items.length === 0){
                var index = node.alphaMemory.children.map(function(d){ return d.id; }).indexOf(node.id);
                var unlinked = node.alphaMemory.children.splice(index,1);
                node.alphaMemory.unlinkedChildren.push(unlinked[0]);
            }
        }

        //For all tokens, compare to the new wme,
        //pass on successful combinations to betamemory/negative node
        for(var i in node.parent.items){
            var currToken = node.parent.items[i];
            //console.log("--------\nComparing: ",currToken.bindings,"\n To: ",wme.data,"\n using: ",node.tests);
            var joinTestResult = ReteTestExecution.performJoinTests(node,currToken,wme);
            if(joinTestResult !== false){
                for(var j in node.children){
                    var currNode = node.children[j];
                    leftActivate(currNode,currToken,wme,joinTestResult);
                }
            }
        }
    };

    
    /**
       @function activateActionNode
       @purpose given a new token, activates any stored actions necessary
     */
    var activateActionNode = function(actionNode,token){
        //get the action it embodies:
        var action = actionNode.action;
        //get the type of function its going to call:
        if(PossibleActions[action.tags.actionType] === undefined){
            throw new Error("Unrecognised action type");
        }
        //bind the context of the action
        var func = _.bind(PossibleActions[action.tags.actionType],action);
        
        //call the action with the token
        var retValue = func(token,actionNode.reteNet);

        //deal with the result:
        
        //store the retValue in the reteNet.activatedRules
        actionNode.reteNet.lastActivatedRules.push(retValue);
    };

    
    /**
       @function leftActivate
       @utility
       @purpose selects what node to activate as appropriate, for a new token
     */
    //Utility leftActivation function to call
    //whichever specific type is needed
    var leftActivate = function(node,token,wme,joinTestResults){
        //Construct a new token if supplied the correct
        //parameters
        if(joinTestResults && wme){
            token = new RDS.Token(token,wme,node,joinTestResults);
            //owning node is the node going into, rather than coming out of
        }
        //Activate the node:
        //Essentially a switch of:
        //betaMemory, JoinNode, NegativeNode, NCC, PartnerNode,
        //and Action
        if(node.__isDummy){
            //pass on, because this is a test
        }else if(node.isBetaMemory){
            betaMemoryActivation(node,token);
        }else if(node.isJoinNode){
            joinNodeLeftActivation(node,token);
        }else if(node.isNegativeNode){
            ReteNegativeActions.negativeNodeLeftActivation(node,token);
        }else if(node.isAnNCCNode){
            ReteNegativeActions.nccNodeLeftActivation(node,token);
        }else if(node.isAnNCCPartnerNode){
            ReteNegativeActions.nccPartnerNodeLeftActivation(node,token);
        }else if(node.isActionNode){
            activateActionNode(node,token);
        }else{
            throw new Error("Unknown node type leftActivated");
        }
        return token;
    };

    /**
       @function rightActivate
       @purpose selects what node to activate, given a new wme
     */
    var rightActivate = function(node,wme){
        if(node.isJoinNode){
            joinNodeRightActivation(node,wme);
        }else if(node.isNegativeNode){
            ReteNegativeActions.negativeNodeRightActivation(node,wme);
        }else{
            throw new Error("Tried to rightActivate Unrecognised node");
        }
    };


    var interface = {
        "leftActivate" : leftActivate,
        "rightActivate" : rightActivate,
        "alphaNodeActivation" : alphaNodeActivation,
    };
    return interface;
});
