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
    var Role = function(name,parent,description){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Role';
        this.description = description;
        var temp = new RuleContainer('Rules',this);
        this.children[temp.id] = temp;
        
    };
    Role.prototype = Object.create(GraphNode.prototype);
    
    var Institution = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Institution';
        //All of these are nodes themselves?
        this.addNodeTo(new GraphNode('Roles',this),'children');
        this.addNodeTo(new GraphNode('Activities',this),'children');
        this.addNodeTo(new GraphNode('Governance',this),'children');
        this.addNodeTo(new GraphNode('OutwardRelations',this),'children');
        this.addNodeTo(new GraphNode('Facts',this),'children');
        this.addNodeTo(new GraphNode('Norms',this),'children');
        //chain to update the parent's children as well:
        this.addNodeTo(new GraphNode('InwardRelations'),'parents').addNodeTo(this,'children');

        //All rules defined in this institution?
        this.allRules = {};
    };
    Institution.prototype = Object.create(GraphNode.prototype);
    
    var Activity = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Activity';
        //actor type
        this.values['actor'] = null;
        this.values['object'] = null;
        this.values['tool'] = null;
        //rules for this activity
        this.addNodeTo(new GraphNode('Rules',this),'children');
        //potential interactions
        this.addNodeTo(new GraphNode('Community',this),'children');
        //how the community interacts with the outcome/object
        this.addNodeTo(new GraphNode('DivisionOfLabour',this),'children');
    };
    Activity.prototype = Object.create(GraphNode.prototype);


    var RuleContainer = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'RuleContainer';
        this.rules = [];
        this.rulesByName = {};

    };
    RuleContainer.prototype = Object.create(GraphNode.prototype);

    RuleContainer.prototype.addRule = function(name){

    };


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
    };
    
    return theInterface;      
});
