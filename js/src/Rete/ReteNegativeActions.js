if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','./ReteUtilities','./ReteTestExecution','./ReteActivations','./ReteDeletion'],function(RDS,ReteUtil,ReteTestExecution,ReteActivations,ReteDeletion){
    
    /**
       @function negativeNodeLeftActivation
     */
    //Trigger a negative node from a new token
    //brings in bindings, creates a new token as necessary,
    //combining bindings to.
    var negativeNodeLeftActivation = function(node,token){
        if(node.items.length === 1){
            ReteUtil.relinkToAlphaMemory(node);
        }
        var newToken = token;
        node.items.unshift(newToken);

        for(var i in node.alphaMemory.items){
            var currWme = node.alphaMemory.items[i].wme;
            var joinTestResult = ReteTestExecution.performJoinTests(node,newToken,currWme);
            if(joinTestResult){
                //adds itself to the token and
                //wme as necessary to block the token
                var joinResult = new RDS.NegativeJoinResult(newToken,currWme);
            }
        }

        //if no wmes block the token, pass it on down the network
        if(newToken.negJoinResults.length === 0){
            for(var j in node.children){
                var currChild = node.children[j];
                ReteActivations.leftActivate(currChild,newToken);
            }
        }
        
    };

    /**
       @function negativeNodeRightActivation
     */
    //trigger a negative node from a new wme,
    //getting all tokens stored, comparing to the wme.
    //any that the wme blocks, gets an additional negative Join result
    //any that don't get blocked should already have been activated
    var negativeNodeRightActivation = function(node,wme){
        //todo: this could be a map
        
        for(var i in node.items){
            var currToken = node.items[i];
            var joinTestResult = ReteTestExecution.performJoinTests(node,currToken,wme);
            if(joinTestResult){
                if(currToken.negJoinResults.length === 0){
                    ReteDeletion.deleteDescendentsOfToken(currToken);
                }
                //Adds itself to the currToken and wme as
                //necessary
                var negJoinResult = new RDS.NegativeJoinResult(currToken,wme);
            }
        }
    };

    /**
       @function nccNodeLeftActivation
     */
    //from a new token, trigger the subnetwork?
    var nccNodeLeftActivation = function(nccNode,token){
        //Create and store the incoming token from prior join node
        if(nccNode.isAnNCCNode === undefined){
            throw new Error("nccNodeLeftActivation should be on an NCCNode");
        }
        if(token.isToken === undefined){
            throw new Error("nccNodeLeftActivation should be on a token");
        }
        var newToken = token;
        nccNode.items.unshift(newToken);

        //the partner's network MUST fire before the nccnode
        //hence this. all the new results' in the partners new result buffer,
        //are from the same origin as token
        //if there are new results to process:
        while(nccNode.partner && nccNode.partner.newResultBuffer.length > 0){
            var newResult = nccNode.partner.newResultBuffer.pop();
            //add the subnetworks result as a blocking token
            newToken.nccResults.unshift(newResult);
            //set the subnetwork result to have its parent as the new token
            newResult.parentToken = newToken;
        }

        //if the new token has no blocking tokens,
        //continue on
        if(newToken.nccResults.length === 0){
            for(var i in nccNode.children){
                var currChild = nccNode.children[i];
                ReteActivations.leftActivate(currChild,newToken);
            }
        }
    };

    /**
       @function nccPartnerNodeLeftActivation
     */
    //the nccPartnerNode is activated by a new token from the subnetwork
    //figure out who owns this new token from the main (positive) network
    var nccPartnerNodeLeftActivation = function(partner,token){
        //the partner's ncc
        var nccNode = partner.nccNode;
        //the token created in left activate, with partner as owner
        var newToken = token;

        //the prior token and wme
        var ownersToken = token.parentToken;
        var ownersWme = token.wme;
        for(var i = 1; i < partner.numberOfConjuncts; i++){
            //go up the owner chain
            ownersToken = ownersToken.parentToken;
            ownersWme = ownersWme.wme;
        }
        var possible_tokens = [];
        if(nccNode){
        possible_tokens = nccNode.items.map(function(d){
            if(d.parentToken.id === ownersToken.id && d.wme.id === ownersWme.id){
                return d;
            }}).filter(function(d){if(d) return true;});
        }
        if(possible_tokens.length > 0){
            //the necessary owner exists in the nccNode,
            //so update it:
            possible_tokens[0].nccResults.unshift(newToken);
            newToken.parent = possible_tokens[0];
            ReteDeletion.deleteDescendentsOfToken(possible_tokens[0]);
        }else{        
            //else no owner:
            partner.newResultBuffer.unshift(newToken);
        }
    };


    /**
       @function activateIfNegatedJRIsUnblocked
     */
    var activateIfNegatedJRIsUnblocked = function(nJR){
        var currJoinResult = nJR;
        //if the negation clears, activate it
        if(currJoinResult.owner.negJoinResults.length === 0){
            currJoinResult.owner.owningNode.children.forEach(function(child){
                //activate the token for all its owners children
                ReteActivations.leftActivate(child,currJoinResult.owner);
            });
        }
    };

    
    /**
       @function cleanupNCCResultsInToken
     */
    var cleanupNCCResultsInToken = function(token){
        //NCCNODE
        if(token && token.owningNode && token.owningNode.isAnNCCNode){
            //for all the nccResult tokens, delete them
            token.nccResults.forEach(function(nccR){
                //remove the nccR token from its linked wme
                if(nccR.wme){
                    var index = nccR.wme.tokens.map(function(d){return d.id;}).indexOf(nccR.id);
                    if(index !== -1){
                        nccR.wme.tokens.splice(index,1);
                    }
                }
                if(nccR.parent){
                    //remove the token from it's parent
                    var nccRindex = nccR.parent.children.map(function(t){return t.id;}).indexOf(nccR.id);
                    if(nccRindex !== -1);{
                        nccR.parent.children.splice(nccRindex,1);
                    }
                }
            });
            //clear the nccResults
            token.nccResults = [];
            return true;
        }else{
            return false;
        }
    };

    /**
       @function cleanupNCCPartnerOwnedToken
     */
    var cleanupNCCPartnerOwnedToken = function(token){
        //NCCPARTNERNODE
        if(token.owningNode
           && token.owningNode.isAnNCCPartnerNode
           && token.parentToken){
            //remove from owner.nccResults:
            var index = token.parentToken.nccResults.map(function(d){return d.id;}).indexOf(token.id);
            if(index !== -1){
                token.parentToken.nccResults.splice(index,1);
            }
            return true;
        }else{
            return false;
        }
    };

    /**
       @function ifNCCPartnerNodeActivateIfAppropriate
     */
    var ifNCCPartnerNodeActivateIfAppropriate = function(token){
        if(token && token.owningNode
           && token.owningNode.isAnNCCPartnerNode){
            if(token.parentToken.nccResults.length === 0){
                token.owningNode.nccNode.children.forEach(function(d){
                    ReteActivations.leftActivate(d,token.parentToken);
                });
                return true;
            }
        }
        return false;
    };
    
    var interface = {
        "activateIfNegatedJRIsUnblocked" : activateIfNegatedJRIsUnblocked,
        "cleanupNCCResultsInToken" : cleanupNCCResultsInToken,
        "cleanupNCCPartnerOwnedToken" : cleanupNCCPartnerOwnedToken,
        "ifNCCPartnerNodeActivateIfAppropriate" : ifNCCPartnerNodeActivateIfAppropriate,
        "negativeNodeLeftActivation" : negativeNodeLeftActivation,
        "nccNodeLeftActivation" : nccNodeLeftActivation,
        "nccPartnerNodeLeftActivation" : nccPartnerNodeLeftActivation
        "negativeNodeRightActivation" : negativeNodeRightActivation
    };
    return interface;
});
