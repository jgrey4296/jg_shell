//an idea for a complete shell
if(typeof define !== 'define'){
    var define = require('amdefine')(module);
}

define(['../libs/ReteDataStructures','underscore'],function(RDS,_){
    var nextId = 0;
    //Data Structures:
    
    //The main node of the graph
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

    GraphNode.prototype.getList = function(fieldName){
        if(this[fieldName] === undefined) throw new Error("Unrecognised field");
        var retArray = [];
        Object.keys(this[fieldName]).map(function(d){
            retArray.push(d + ": " + this[fieldName][d]);
        });
        return retArray;
    };
    
    //----------
    var Role = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Role';
        this.description = undefined;
        this.children['Rules'] = new GraphNode('Rules',this);
                      
    };
    Role.prototype = Object.create(GraphNode.prototype);
    
    var Institution = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Institution';
        //All of these are nodes themselves?
        this.children['Roles'] = new GraphNode('Roles',this);
        this.children['Activities'] = new GraphNode('Activities',this);
        this.children['Governance'] = new GraphNode('Governance',this);
        this.children['OutwardRelations'] = new GraphNode('OutwardRelations',this);
        this.children['facts'] = new GraphNode('Facts',this);
        this.children['norms'] = new GraphNode('Norms',this);
        this.parents['InwardRelations'] = new GraphNode('InwardRelations',this);

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
        this.children['Rules'] = new GraphNode('Rules',this);
        //potential interactions
        this.children['Community'] = new GraphNode('Community',this);
        //how the community interacts with the outcome/object
        this.children['DivisionOfLabour'] = new GraphNode('DivisionOfLabour',this);
    };
    Activity.prototype = Object.create(GraphNode.prototype);


    var RuleContainer = function(name,parent){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'RuleContainer';
        this.rules = [];

    };
    RuleContainer.prototype = Object.create(GraphNode.prototype);

    
    var CompleteShell = function(){
        this.tags = {};
        this.tags['type'] = 'Shell';
        //the root
        this.root = new GraphNode('__root');;
        //All Nodes:
        this.allNodes = [];
        this.allNodes[this.root.id] = this.root;
        //AllRules:
        this.allRules = [];
        this.allRulesByName = {};
        //current node/rule
        this.cwd = this.root;
    };

    //END OF DATA STRUCTURES
    //----------------------------------------

    //Methods:
    /**
       @params target child,parent, or node specific
       @params type the type of node to add
       @params name the name of the node to add
     */
    CompleteShell.prototype.addNode = function(target,type,name){
        //create the new node of type
        var constructor = interface[type];
        if(constructor && this.cwd[target]){
            var newNode = new constructor(name,this.cwd);
            this.cwd[target][newNode.id] = newNode;
            this.allNodes[newNode.id] = newNode;
            return newNode;
        }
    };

    /**
       @params target The id (global) or name (local) to move to
     */
    CompleteShell.prototype.cd = function(target){
        //If a number:
        if(!isNaN(Number(target))){
            this.cwd = this.allNodes[target];
        }else{
            //TODO: name based movement not just id based
            throw new Error("Unrecognised cd form");
        }
    };

    CompleteShell.prototype.getNodeListByIds = function(idList){
        var tempShell = this;
        var retList = [];
        idList.map(function(d){
            if(tempShell.allNodes[d]){
                retList.push(tempShell.allNodes[d]);
            }            
        });
        return retList;
    };

    CompleteShell.prototype.setParameter = function(field,parameter,value){
        if(!this.cwd[field]) throw new Error("Unrecognised field");
        if(field !== 'values' | field !== 'tags' | field !== 'annotations'){
            throw new Error("Bad field");
        }
        if(value !== undefined){
            this.cwd[field][parameter] = value;
        }else{
            //if no value is specified, remove the entry
            delete this.cwd[field][parameter];
        }
    };


    CompleteShell.prototype.link = function(target,id){
        if(this.allNodes[id] === undefined){
            throw new Error("Node for id " + id + " does not exist");
        }
        if(!this.cwd[target]) throw new Error("Unrecognised target");
        this.cwd[target][id] = this.allNodes[id];        
    };

    //Remove a node from the parent/child lists
    CompleteShell.prototype.rm = function(id){
        //is an id
        if(!isNaN(Number(id))){
            if(this.cwd.parents[id]){
                delete this.cwd.parents[id];
            }else if(this.cwd.children[id]){
                delete this.cwd.children[id];
            }else{
                throw new Error("Unrecognised id");
            }
        }else{
            //is a name
            throw new Error("TODO");
        }
    };

    CompleteShell.prototype.rename = function(name){
        this.cwd.name = name;
    };


    //ie: toVar  <- wme.fromVar
    //a <- wme.first
    CompleteShell.prototype.addBinding = function(conditionNum,toVar,FromVar){
        //chekc that you are in a rule
        //add or change the binding
        
    };
    
    
    //conversion to simple arrays for visualisation
    //export/import json
    
    var interface =  {
        "CompleteShell":CompleteShell,
        "GraphNode" : GraphNode,
        "Role"      : Role,
        "Institution":Institution,
        "Activity"  : Activity,
        "Rule"      : RDS.Rule,
        "Condition" : RDS.Condition,
        "Test"      : RDS.Test,
        "Action"    : RDS.ActionDescription,
    };
    return interface;
});
