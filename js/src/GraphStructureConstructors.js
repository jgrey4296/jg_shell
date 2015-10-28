if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){

    //Define a variety of graph structures to use in the shell:
    //each ctor returns a flat array of all sub-nodes created
    var ctors = {};

    //THE INSTITUTION OBJECT
    ctors['institution'] = function(baseNode){
        //Object of child name + type + subchildren
        var children = {
            "Roles" : ['container',
                       ['incumbent','challenger','controlled','exempt']],
            "Activities":['container',
                          ['physical','symbolic','communicative','unbound']],
            "IGU"   : ['node',[]],
            "ExternalEffects": ['node',[]],//+externalEffectors in parent list
            "FactGrammar"    : ['container',
                                ['physical','symbolic','communicative','unbound']],
            "ValueHierarchy" : ['node',[]],
            "Norms"          : ['container',
                                ['EmpiricallyExpected','NormativelyExpected','Sanctionable']],
        };
        var parents = {
            "ExternalEffectors" : ["node",[]],
        };
        //TODO: externalEffectors added to parent

        
        var createdChildren = _.keys(children).map(function(d){
            //create a new object of: name,parentId,type
            var newObj = new GraphNode(d,baseNode.id,children[d][0]);
            //if the type is one specified in this module, construct that to
            var subChildren = [];
            if(ctors[children[d][0]]){
                subChildren = ctors[children[d][0]](newObj,children[d][1]);
            }
            return [newObj,subChildren];;
        });
        //add the created children's ids to the baseNode
        //but only the top level,not the children of the children.
        //hence d[0].id, ignoring d[1]... for the moment.
        createdChildren.forEach(function(d){
            baseNode.children[d[0].id] = true;
        });

        //do the same stuff for parents
        var createdParents = _.keys(parents).map(function(d){
            var newObj = new GraphNode(d,undefined);
            return newObj;
        });
        createdParents.forEach(function(d){
            baseNode.parents[d.id] = true;
            d.children[baseNode.id] = true;
        });

        var createdNodes = createdChildren.concat(createdParents);
        return createdNodes;
    };
    
    //------------------------------
    //THE GENERIC CONTAINER OBJECT
    //Assumes children are GraphNodes
    ctors['container'] = function(baseNode,list){
        var createdChildren = list.map(function(d){
            return new GraphNode(d,baseNode.id);
        });

        _.forEach(createdChildren,function(d){
            baseNode.children[d.id] = true;
        });
        return createdChildren;
    };

    //------------------------------
    //THE ACVITITY OBJECT
    ctors['activity'] = function(baseNode){
        var children = [
            "rules","community","divisionOfLabour","actions"
        ];
        var values = ['actor','object','outcome','tool'];

        values.forEach(function(d){
            baseNode.values[d] = null;
        });

        var createdChildren = children.map(function(d){
            return new GraphNode(d,baseNode.id);
        });

        createdChildren.forEach(function(d){
            baseNode.children[d.id] = true;
        });
        
        return createdChildren;
    };

    //------------------------------
    //THE ROLE OBJECT
    ctors['role'] = function(baseNode){
        var children = ["ConstitutiveRules","RegulativeRules"];
        var createdChildren = children.map(function(d){
            return new GraphNode(d,baseNode.id);
        });

        createdChildren.forEach(function(d){
            baseNode.children[d.id] = true;
        });
        return createdChildren;
    };


    //------------------------------
    //The Rule object:
    ctors['rule'] = function(baseNode){
        baseNode.conditions = [];
        baseNode.actions = [];
        return [];
    };

    //------------------------------
    //The action object:
    // ctors['action'] = function(baseNode){

    // };

    
    return ctors;
});
