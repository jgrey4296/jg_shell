//an idea for a complete shell
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['../libs/ReteDataStructures','underscore'],function(RDS,_){
    if(RDS === undefined) throw new Error("RDS Not Loaded");
    if(_ === undefined) throw new Error("Underscore not loaded");


    var randomChoice = function(array){
        var randIndex = Math.floor(Math.random() * array.length);
        return array[randIndex];
    };
    
    
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
        console.log("Prior to flattening:",allArrays);
        return _.flatten(allArrays);
    };
    
    GraphNode.prototype.getList = function(fieldName){
        console.log("Getting list for:",fieldName,this[fieldName]);
        var obj = this;
        if(this[fieldName] === undefined) throw new Error("Unrecognised field");
        var retArray = [];
        Object.keys(obj[fieldName]).map(function(d){
                retArray.push(d + ": " + obj[fieldName][d]);
        });
        console.log("Final list for:",fieldName,retArray);
        return retArray;
    };
    
    //----------
    var Role = function(name,parent,description){
        GraphNode.call(this,name,parent);
        this.tags['type'] = 'Role';
        this.description = description;
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
        this.children['OutgoingInterface'] = new GraphNode('OutwardRelations',this);
        this.children['facts'] = new GraphNode('Facts',this);
        this.children['norms'] = new GraphNode('Norms',this);
        this.parents['IncomingInterface'] = new GraphNode('InwardRelations',this);

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
        this.rulesByName = {};

    };
    RuleContainer.prototype = Object.create(GraphNode.prototype);

    
    var CompleteShell = function(){
        this.tags = {};
        this.tags['type'] = 'Shell';
        //the root
        this.root = new GraphNode('__root');
        //All Nodes:
        this.allNodes = {};
        this.allNodes[this.root.id] = this.root;
        //AllRules:
        this.allRules = [];
        this.allRulesByName = {};
        //current node/rule
        this.cwd = this.root;
    };

    //END OF DATA STRUCTURES
    //----------------------------------------

    /*Methods:
      
      @params target child,parent, or node specific
      @params type the type of node to add
      @params name the name of the node to add
    */
    CompleteShell.prototype.addNode = function(target,type,name){
        //create the new node of type
        if(type === 'Rule') throw new Error('Rule Construction has its own function');
        var constructor = interface[type];
        if(constructor === undefined) throw new Error("Unrecognised Node Type");
        if(this.cwd[target] === undefined) throw new Error("Unrecognised target");
        //call the ctor, adding to the target
        if(constructor && this.cwd[target]){
            var newNode;
            if(target === "parents"){
                newNode = new constructor(name);
                newNode.children[this.cwd.id] = this.cwd;
            }else{
                newNode = new constructor(name,this.cwd);
            }
            this.cwd[target][newNode.id] = newNode;
            if(this.allNodes[newNode.id]){
                throw new Error("Node Id is already used");
            }
            this.allNodes[newNode.id] = newNode;
            return newNode;
        }
        throw new Error("Add Node general error");
    };
    
    //Add a rule to the current node, should be a rule container
    CompleteShell.prototype.addRule = function(name){
        if(this.cwd.tags.type !== "RuleContainer") throw new Error("Rules should be added to a rule container");
        var rule = new RDS.Rule(name);
        this.cwd.rules.push(rule);
        this.cwd.rulesByName[rule.name] = rule;
        return rule;
    };
    
    /**
       @params target The id (global) or name (local) to move to
    */
    CompleteShell.prototype.cd = function(target){
        //TODO: cd into a rule
        //If a number:
        if(target === ".."){
            if(this.cwd._originalParent){
                this.cd(this.cwd._originalParent.id);
            }else{
                var randomParent = randomChoice(Object.keys(this.cwd.parents));
                this.cd(this.cwd.parents[randomParent]);
            }
            return;
        }
        
        if(!isNaN(Number(target))){
            this.cwd = this.allNodes[target];
            return;
        }
        //passed a name. convert it to an id
        var nameIdPairs = {};
        var children = this.cwd.children;
        Object.keys(children).map(function(d){
            this[children[d].name] = children[d].id;
        },nameIdPairs);
        var parents = this.cwd.parents;
        Object.keys(parents).map(function(d){
            this[parents[d].name] = parents[d].id;
        },nameIdPairs);
        if(nameIdPairs[target]){
            this.cd(nameIdPairs[target]);
        }else{
            //cant find the target, complain
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
        if(field !== 'values' && field !== 'tags' && field !== 'annotations'){
            throw new Error("Bad field");
        }
        if(value !== undefined){
            this.cwd[field][parameter] = value;
        }else{
            //if no value is specified, remove the entry
            delete this.cwd[field][parameter];
        }
    };
    
    
    //TODO: should this be mutual?
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
        "RuleContainer":RuleContainer,
        "Condition" : RDS.Condition,
        "Test"      : RDS.Test,
        "Action"    : RDS.ActionDescription,
    };
    return interface;
});
