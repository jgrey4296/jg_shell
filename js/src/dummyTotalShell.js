//an idea for a complete shell

define(['ReteDataStructures','GraphNode','underscore'],function(RDS,GraphNode,_){

    var GraphNode = function(){
        this.id;
        this.name;
        this.parents;
        this.children;
        this.values;
        this.tags;
        this.annotations;
    };

    var Role = function(){
        this.fact;
        this.rules = [];
    };
    
    var Institution = function(){
        //extend GraphNode
        this.roles = {};
        //object of activities
        this.activities = {};
        //an institution itself
        this.governance = undefined;
        //rules that can use the fact grammars of multiple different institutions
        this.externalRelations = {
            ingoing : [],
            outgoing : []
        };
        //tracery-like?
        this.factGrammar = {};
        //rules
        this.norms = {
            descriptive : [],
            normative : [],
            sanctionable : []
        };
        //aggregated rules for the institution
        this.allRules = {};
    };

    var Activity = function(){
        this.id;
        this.name;
        this.actor;
        this.object;
        this.tool;
        this.rules;
        this.community;
        this.divOfLabour;
    };
        
    var CompleteShell = function(){
        //the root
        this.root = undefined;
        //All Nodes:
        this.allNodes = [];

        //AllRules:
        this.allRules = [];
        this.allRulesByName = {};
        
    };
    


});
