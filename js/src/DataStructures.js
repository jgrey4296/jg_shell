if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}


define(['../libs/ReteDataStructures','underscore'],function(RDS,_){
    var nextId = 0;
    //Data Structures:

    //The main node type of the graph:
    var GraphNode = function(name,parent){
        //Id and name for identification
        this.id = nextId++;
        this.name = name;
        //parents and children for links
        //storing by ID
        this.parents = {};
        this._originalParent = parent;
        if(parent){
            this.parents[parent.id] = parent;
        }
        this.children = {};
        //values and tags and annotations for data
        this.values = {};
        this.tags = {};
        this.annotations = {};
        this.tags['type'] = 'GraphNode';
    };

    //Utility add function
    //DOES NOT UPDATE OTHER NODES
    GraphNode.prototype.addNodeTo = function(node,target){
        if(this[target]){
            this[target][node.id] = node;
        }
        return node;
    };

    GraphNode.prototype.toShortString = function(){
        return "(" + this.id + "): " + this.name + " (" + this.tags.type + ")";
    };

    GraphNode.prototype.toStringList = function(){
        return [];
    };
    

    //for pseudoprinting
    //Get simplified lists of the field names specified,
    //as key value pairs turned into strings
    GraphNode.prototype.getLists = function(fieldNameList){
        var theNode = this;
        var allArrays = fieldNameList.map(function(d){
            if(theNode[d] !== undefined){
                if(d !== "id" && d !== "name"){
                    return ["","| " + d + " |"].concat(theNode.getList(d));
                }else{
                    return d +  ": " + theNode[d];
                }
            }else{
                console.log("Could not find: ",d,theNode);
            }
        });
        //console.log("Prior to flattening:",allArrays);
        return _.flatten(allArrays);
    };
    
    GraphNode.prototype.getList = function(fieldName){
        //console.log("Getting list for:",fieldName,this[fieldName]);
        var obj = this;
        if(this[fieldName] === undefined) throw new Error("Unrecognised field");
        var retArray = [];
        Object.keys(obj[fieldName]).map(function(d){
                retArray.push(d + ": " + obj[fieldName][d]);
        });
        //console.log("Final list for:",fieldName,retArray);
        return retArray;
    };
    
    //----------
    //A generic container, creates a new child for each element in
    //subsections
    var Container = function(name,parent,subSections){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Container';
        subSections.forEach(function(d){
            this.addNodeTo(new GraphNode(d,this),'children');
        },this);
    };
    Container.prototype = Object.create(GraphNode.prototype);

    //A node to describe an individual role,
    //with sections for regulative and constitutive rules
    var Role = function(name,parent,description){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Role';
        this.description = description;
        this.addNodeTo(new RuleContainer('ConstitutiveRules',this),'children');
        this.addNodeTo(new RuleContainer('RegulativeRules',this),'children');
        
    };
    Role.prototype = Object.create(GraphNode.prototype);

    //a node to describe the varieties of possible norms
    var NormsNode = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'NormsNode';
        this.addNodeTo(new RuleContainer('EmpiricallyExpected',this),'children');
        this.addNodeTo(new RuleContainer('NormativelyExpected',this),'children');
        this.addNodeTo(new RuleContainer('Sanctionable',this),'children');
    };
    NormsNode.prototype = Object.create(GraphNode.prototype);

    //the super node: structures an entire institution
    var Institution = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Institution';
        //All of these are nodes themselves?
        this.addNodeTo(new Container('Roles',this,[
            'incumbent','challenger','controlled','exempt'
        ]),'children');
        this.addNodeTo(new Container('Activities',this,[
            'physical','symbolic','communicative'
        ]),'children');
        this.addNodeTo(new GraphNode('IGU',this),'children');
        this.addNodeTo(new GraphNode('ExternalEffects',this),'children');
        this.addNodeTo(new GraphNode('FactGrammar',this),'children');
        this.addNodeTo(new GraphNode('ValueHierarchy',this),'children');
        this.addNodeTo(new NormsNode('Norms',this),'children');
        //chain to update the parent's children as well:
        this.addNodeTo(new GraphNode('ExternalEffectors'),'parents').addNodeTo(this,'children');

        //All rules defined in this institution?
        this.allRules = {};
    };
    Institution.prototype = Object.create(GraphNode.prototype);

    //A Node to describe an activity    
    var Activity = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Activity';
        //actor type
        this.values['actor'] = null;
        this.values['object'] = null;
        this.values['outcome'] = null;
        this.values['tool'] = null;
        //rules for this activity
        this.addNodeTo(new GraphNode('Rules',this),'children');
        //potential interactions
        this.addNodeTo(new GraphNode('Community',this),'children');
        //how the community interacts with the outcome/object
        this.addNodeTo(new GraphNode('DivisionOfLabour',this),'children');
        //the performance possibilities?
        this.addNodeTo(new GraphNode('Actions',this),'children');
    };
    Activity.prototype = Object.create(GraphNode.prototype);

    //A Container for Rules
    var RuleContainer = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'RuleContainer';
        this.rules = [];
        this.rulesByName = {};

    };
    RuleContainer.prototype = Object.create(GraphNode.prototype);

    //A Single rule node, stores a ReteNet capable rule definition
    var RuleNode = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags.type = "RuleNode";
        this.rule = new RDS.Rule(name);
        this.rule.ruleNode = this;
    };
    RuleNode.prototype = Object.create(GraphNode.prototype);

    //TODO: convert this to a generic "get all information as string array" method
    RuleNode.prototype.toStringList = function(){
        if(!this.rule){
            throw new Error("Rule Node should always own a rule");
        }
        var outputStringArray = [];
        outputStringArray.push("ID: " + this.id);
        outputStringArray.push("Name: " + this.name);
        outputStringArray.push("| Tags |");
        outputStringArray = outputStringArray.concat(_.pairs(this.rule.tags).map(function(d){
            return d[0] +": " + d[1];
        }));
        console.log("Rule turned to strings:",outputStringArray);
        return outputStringArray;
    };
    

    //----------------------------------------
    //----------------------------------------
    var theInterface = {
        "GraphNode" : GraphNode,
        "graphnode" : GraphNode,
        "node"      : GraphNode,
        "role"      : Role,
        "institution":Institution,
        "ins"       : Institution,
        "Activity"  : Activity,
        "activity"  : Activity,
        "RuleContainer":RuleContainer,
        "rulecontainer":RuleContainer,
        "rulecon"   : RuleContainer,
        "Rule"      : RuleNode,
        "rule"      : RuleNode,
    };
    
    return theInterface;      
});
