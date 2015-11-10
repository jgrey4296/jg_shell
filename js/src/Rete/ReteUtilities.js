if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures'],function(RDS){
    
    /**
       @function relinkToAlphaMemory
       @utility
       @purpose reconnects a joinnode with its alpha memory, once the beta memory is populated
     */
    //reconnect an unlinked join node to its alpha memory when there are
    //wmes in said alpha memory
    var relinkToAlphaMemory = function(node){
        if(node.isJoinNode === undefined && node.isNegativeNode === undefined){
            throw new Error("trying to relink alpha on something other than a join node or negative node");
        }
        
        var ancestor = node.nearestAncestor;
        var indices = node.alphaMemory.children.map(function(d){ return d.id; });

        //While the ancestor is a child of the alpha memory
        while(ancestor && indices.indexOf(ancestor.id) === -1){
            //go up an ancestor if it is unlinked to
            ancestor = findNearestAncestorWithAlphaMemory(ancestor,node.alphaMemory.id);
        }
        
        //When finished, if the ancestor exists:
        if(ancestor !== null){
            var index = node.alphaMemory.children.map(function(d){ return d.id; }).indexOf(ancestor.id);
            //add the node into the child list in front of the ancestor
            node.alphaMemory.children.splice(index,0,node);
        }else{
            //otherwise just add at the end
            node.alphaMemory.children.push(node);
        }

        //remove from the unlinkedChildren Field
        var nodeIndex = node.alphaMemory.unlinkedChildren.map(function(d){ return d.id;}).indexOf(node.id);
        node.alphaMemory.unlinkedChildren.splice(nodeIndex,1);
        
        
    };

    /**
       @function relinkToBetaMemory
       @utility
       @purpose reconnects a join node to its beta memory, once the alpha memory is populated
     */
    //relink an unlinked join node to its betamemory when there are tokens
    //in said memory
    var relinkToBetaMemory = function(node){
        //remove from the unlinked children list
        //and add it into the children
        var index = node.parent.unlinkedChildren.map(function(d){return d.id; }).indexOf(node.id);
        if(index > -1){
            node.parent.unlinkedChildren.splice(index,1);
            node.parent.children.unshift(node);
        }
    };


    /**
       @function unlinkAlphaMemory
       @purpose if an alpha memory becomes empty, displace all its children temporarily
     */
    var unlinkAlphaMemory = function(alphaMemory){
        //if the alphaMem has no items: UNLINK
        if(alphaMemory.items.length === 0){
            alphaMemory.children.forEach(function(amChild){
                if(amChild.isJoinNode){
                    var index = amChild.parent.children.map(function(parentChild){return parentChild.id;}).indexOf(amChild.id);
                    //splice out
                    var removed = amChild.parent.children.splice(index,1);
                    //and store
                    amChild.parent.unlinkedChildren.push(removed[0]);
                }
            });
        }
    };

    
    /**
       @function ifEmptyBetaMemoryUnlink
       @purpose if a beta memory becomes empty, displace all its children temporarily
     */
    //Now Essentially switch on: BetaMemory, NegativeNode,
    //NCCNode, and NCCPartnerNode
    var ifEmptyBetaMemoryUnlink = function(node){
        //BETAMEMORY
        if(node && node.isBetaMemory){
            //and that betaMemory has no other items
            if(node.items.length === 0){
                //for all the node's children
                node.children.forEach(function(jn){
                    if(jn.isJoinNode === undefined){return;}
                    var index = jn.alphaMemory.children.map(function(d){return d.id;}).indexOf(jn.id);
                    if(index !== -1){
                        var removed = jn.alphaMemory.children.splice(index,1);
                        //push it in the unlinked children list
                        jn.alphaMemory.unlinkedChildren.push(removed[0]);
                    }
                });
            }
            return true;
        }else{
            return false;
        }        
    };

    /**
       @function ifEmptyNegNodeUnlink
       @purpose if a negative node becomes empty, displace its alpha memory's children
     */
    var ifEmptyNegNodeUnlink = function(node){
        if(node && node.isNegativeNode){
            //with elements
            if(node.items.length === 0){
                //unlink alpha memory
                var index = node.alphaMemory.children.map(function(d){return d.id;}).indexOf(node.id);
                var removed = node.alphaMemory.children.splice(index,1);
                node.alphaMemory.unlinkedChildren.push(removed[0]);
            }
        }
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
                leftActivate(newNode,parent.items[i]);
            }
        }else if(parent.isJoinNode){
            var savedChildren = parent.children;
            parent.children = [newNode];
            for(i in parent.alphaMemory.items){
                var item = parent.alphaMemory.items[i];
                rightActivate(parent,item.wme);
            }
            parent.children = savedChildren;
        }else if(parent.isNegativeNode){
            for(i in parent.items){
                token = parent.items[i];
                if(token.negJoinResults.length === 0){
                    leftActivate(newNode,token);
                }
            }
        }else if(parent.isAnNCCNode){
            for(i in parent.items){
                token = parent.items[i];
                if(token.nccResults.length === 0){
                    leftActivate(newNode,token);
                }
            }
        }
    };

    /**
       @function compareConstantNodeToTest
       @purpose compare an existing constant test node to a constant test that wants to be built
     */
    //taking an alpha node and a ConstantTest
    var compareConstantNodeToTest = function(node,constantTest){
        if(!constantTest.isConstantTest){
            throw new Error("constantTest should be a ConstantTest Object");
        }
        if(!node.isConstantTestNode){
            throw new Error("Node should be an alpha/constant test node");
        }
        if(node.testField !== constantTest.field
           || node.testValue !== constantTest.value){
            return false;
        }
        if(node.operator !== constantTest.operator){
            return false;
        }
        return true;
    };

    /**
       @function compareJoinTests
       @purpose Compare specified join tests, to see if a join node is the same as one needed
    */
    var compareJoinTests = function(firstTestSet,secondTestSet){
        if(firstTestSet.length === 0 && secondTestSet.length === 0){
            return true;
        }
        var i = firstTestSet.length -1;
        var j = secondTestSet.length -1;
        while(i >= 0 && j >= 0){
            var ts1 = firstTestSet[i];
            var ts2 = secondTestSet[j];
            //console.log("comparing",i,j,"|||",firstTestSet[i][0],secondTestSet[j][0],"|||",firstTestSet[i][1],secondTestSet[j][1]);
            if(firstTestSet[i][0] === secondTestSet[j][0]){
                if(firstTestSet[i][1] === secondTestSet[j][1]){
                    i--; j--;
                }else{
                    return false;
                }
            }else if(firstTestSet[i][0] > secondTestSet[j][0]){
                i--;
            }else if(firstTestSet[i][0] < secondTestSet[j][0]){
                j--;
            }else{
                return false;
            }
        }
        if(i === j && i === -1){
            return true;
        }
        return false;
    };

    
    
    var interface = {};
    return interface;    
});
