/**
   @file ReteProcedures
   @purpose to define the procedures and functions necessary to run a rete net
*/
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['./ReteDataStructures','./ReteComparisonOperators','./ReteActions','underscore'],function(DataStructures,ConstantTestOperators,PossibleActions,_){

    /**
       @interface 
     */
    var interface = {
        //Main Public Procedures:
        "addRule"   : addRule,
        "removeRule": removeRule,
        "addWME"    : addWME,
        "removeWME" : removeWME,

        //removal helper functions:
        "removeAlphaMemoryItemsForWME":removeAlphaMemoryItemsForWME,
        "deleteAllTokensForWME":deleteAllTokensForWME,
        "deleteAllNegJoinResultsForWME":deleteAllNegJoinResultsForWME,

        "unlinkAlphaMemory":unlinkAlphaMemory,
        "activateIfNegatedJRIsUnblocked" : activateIfNegatedJRIsUnblocked,

        "removeTokenFromNode":removeTokenFromNode,
        "removeTokenFromWME":removeTokenFromWME,
        "removeTokenFromParentToken":removeTokenFromParentToken,
        "ifEmptyBetaMemoryUnlink":ifEmptyBetaMemoryUnlink,
        "ifEmptyNegNodeUnlink":ifEmptyNegNodeUnlink,
        "removeNegJoinResultsForToken":removeNegJoinResultsForToken,

        "cleanupNCCResultsInToken": cleanupNCCResultsInToken,
        "cleanupNCCPartnerOwnedToken":cleanupNCCPartnerOwnedToken,
        "ifNCCPartnerNodeActivateIfAppropriate":ifNCCPartnerNodeActivateIfAppropriate,        

        "deleteTokenAndDescendents":deleteTokenAndDescendents,
        "deleteDescendentsOfToken":deleteDescendentsOfToken,
        "deleteNodeAndAnyUnusedAncestors":deleteNodeAndAnyUnusedAncestors,
        
        //Comparisons:
        "compareConstantNodeToTest"     : compareConstantNodeToTest,
        "compareJoinTests"      : compareJoinTests,
        "performJoinTests"      : performJoinTests,
        //Activation functions::
        "constantTestNodeActivation" : constantTestNodeActivation,
        "alphaMemoryActivation" : alphaMemoryActivation,
        "alphaNodeActivation"   : alphaNodeActivation,
        "activateActionNode"    : activateActionNode,
        "betaMemoryActivation":betaMemoryActivation,
        "joinNodeLeftActivation":joinNodeLeftActivation,
        "joinNodeRightActivation":joinNodeRightActivation,
        "negativeNodeLeftActivation":negativeNodeLeftActivation,
        "negativeNodeRightActivation":negativeNodeRightActivation,
        "nccNodeLeftActivation" : nccNodeLeftActivation,
        "nccPartnerNodeLeftActivation" : nccPartnerNodeLeftActivation,
        "leftActivate"          : leftActivate,
        "rightActivate"         : rightActivate,
        //Build Functions::
        "buildOrShareConstantTestNode":buildOrShareConstantTestNode,
        "buildOrShareAlphaMemory" : buildOrShareAlphaMemory,
        "buildOrShareBetaMemoryNode"  : buildOrShareBetaMemoryNode,
        "buildOrShareJoinNode"        : buildOrShareJoinNode,
        "buildOrShareNegativeNode"    : buildOrShareNegativeNode,
        "buildOrShareNetworkForConditions": buildOrShareNetworkForConditions,
        "buildOrShareNCCNodes"        : buildOrShareNCCNodes,
        //Other:
        "updateNewNodeWithMatchesFromAbove" : updateNewNodeWithMatchesFromAbove,
        "findNearestAncestorWithAlphaMemory":findNearestAncestorWithAlphaMemory,
        "relinkToAlphaMemory" : relinkToAlphaMemory,
        "relinkToBetaMemory"  : relinkToBetaMemory,
    };

    return interface;
});
