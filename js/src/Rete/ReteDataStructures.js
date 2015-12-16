/**
   @file ReteDataStructures
   @purpose to define the data structures required for rete
*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    var nextId = 0;

    /**
       @data ReteNet
       @purpose A Data structure to hold what you need to start a retenet.
     */
    var ReteNet = function(){
        this.dummyBetaMemory = new BetaMemory();
        this.rootAlpha = new AlphaNode();
        this.actions = [];
        this.allWMEs = [];
        this.allWMEs.__isAllWMEs = true;
        
        this.lastActivatedRules = [];

        this.previousActivations = [];
        
        //Automatic retraction capabilities:
        this.currentTime = 0;
        //Wmes asserted at currentTime,
        //retracted at currentTime + n;
        this.wmeLifeTimes = {
            assertions: [],
            retractions: [],
        };
    };

    /**
       @data WME
       @purpose to store facts in the rete net
     */
    var WME = function(data,assertTime,retractTime){
        this.data = data;
        //The lifetime of the wme. Asserted at time lifeTime[0],
        //retracted at time lifeTime[1]:
        if(assertTime === undefined) assertTime = 0;
        if(retractTime === undefined) retractTime = 0;
        this.lifeTime = [assertTime,retractTime];
        //Alpha memories the wme is part of
        this.alphaMemoryItems = [];
        //Tokens the wme is part of
        this.tokens = [];
        //Tokens this wme is blocking
        this.negJoinResults = [];
        this.id = nextId;
        nextId++;
    };

    /**
       @data Token
       @purpose To combine intermediate results in the beta network
     */
    //bindings are updated as the token progresses
    var Token = function(parentToken,wme,owningNode,bindings){
        this.isToken = true;
        this.parentToken = parentToken; //ie:owner
        this.wme = wme;
        this.owningNode = owningNode;
        this.children = []; //list of nodes
        this.negJoinResults = [];//list of NegativeJoinResults
        this.nccResults = []; //list of Token
        if(this.parentToken){
            this.parentToken.children.unshift(this);
        }
        if(this.wme && this.wme.tokens){
            this.wme.tokens.unshift(this);
        }

        //copy over bindings from parent,
        //then copy in new bindings
        this.bindings = {};

        //this may not be needed
        if(this.parentToken && this.parentToken.bindings){
            for(var i in this.parentToken.bindings){
                this.bindings[i] = this.parentToken.bindings[i];
            }            
        }
        
        for(var j in bindings){
            this.bindings[j] = bindings[j];
        }

        this.id = nextId;
        nextId++;        
    };

    /**
       @data ConstantTest
       @purpose Defines an alpha node test
       @param testWmeField
       @param operator
       @param testValue
     */
    //Test: (wme.)a = 5
    var ConstantTest = function(testWmeField,operator,testValue){
        this.tags = {};
        this.tags.type = "constantTest";
        this.isConstantTest = true;
        this.field = testWmeField;
        this.operator = operator;
        this.value = testValue;
        this.id = nextId;
        nextId++;
    };

     
    //------------------------------

    /**
       @data AlphaMemoryItem
       @purpose a Pairing of a wme with an alpha memory it resides in
     */
    //Utility storage of wme and its alphaMemory together
    //used in alphamemory and WME
    var AlphaMemoryItem = function(wme,alphaMem){
        this.wme = wme;
        this.alphaMemory = alphaMem;
        this.id = nextId;
        nextId++;
    };


    /**
       @data AlphaNode
       @purpose a node to perform constant tests on newly asserted WMEs
     */
    //A constant test node
    //constantTest = {field:"",value:"",operator:""};
    var AlphaNode = function(parent,constantTest){
        this.id = nextId;
        this.isConstantTestNode = true;
        this.parent = parent;
        if(this.parent && this.parent.children){
            this.parent.children.unshift(this);
        }
        this.children = [];
        this.outputMemory = undefined;
        if(constantTest){
            this.testField = constantTest.field;
            this.testValue = constantTest.value;
            this.operator = constantTest.operator;
        }else{
            this.passThrough = true;
        }
        nextId++;
    };

   /**
      @data AlphaMemory
      @purpose to store wmes that have passed through constant tests
    */
    //Alpha Memory node
    var AlphaMemory = function(parent){
        this.isAlphaMemory = true;
        this.items = [];
        this.parent = parent;
        //If adding to a node other than a test node,
        if(parent && parent.isConstantTestNode === undefined){
            //add to children
            this.parent.children.unshift(this);
        }else if(this.parent && this.parent.outputMemory === undefined){
            //if an alphanode, set the ouputmemory field
            this.parent.outputMemory = this;
        }else if(this.parent && this.parentOutputMemory !== undefined){
            throw new Error("trying to create an alpha memory for a node that already has one");
        }
        this.children = [];
        this.unlinkedChildren = [];
        this.referenceCount = 0;
        this.isMemoryNode = true;
        this.id = nextId;
        nextId++;
    };

    /**
       @data ReteNode
       @purpose provides a base definition of a node in the rete network
     */    
    //Base node for the beta network
    var ReteNode = function(parent){
        this.children = [];
        this.parent = parent;
        if(this.parent && this.parent.children){
            this.parent.children.unshift(this);
        }
        this.id = nextId;
        nextId++;
    };

    /**
       @data BetaMemory
       @inherits ReteNode
       @purpose A Node to store tokens in the rete network
     */
    //Beta Memory Stores tokens
    var BetaMemory = function(parent){
        ReteNode.call(this,parent);
        this.isBetaMemory = true;
        this.isMemoryNode = true;
        this.items = [];
        if(parent === undefined){
            this.dummy = true;
            this.items.push(new Token());
            this.items[0].owningNode = this;
        }
        this.children = [];
        this.unlinkedChildren = [];

    };

    /**
       @data JoinNode
       @inherits ReteNode
       @purpose To combine tokens and wmes, according to binding tests
     */
    //Join Node combines tokens with wmes
    //tests are the binding tuples from a condition
    var JoinNode = function(parent,alphaMemory,tests){
        ReteNode.call(this,parent);
        this.isJoinNode = true;
        this.alphaMemory = alphaMemory;
        if(tests){
            this.tests = tests;
        }else{
            this.tests = [];
        }
        if(this.alphaMemory && this.alphaMemory.children){
            this.alphaMemory.children.unshift(this);
            this.alphaMemory.referenceCount += 1;
        }
        this.nearestAncestor = null;
    };

    /**
       @data ActionNode
       @purpose A Node which, when activated, will cause the effects a rule describes
     */
    //Container object for a general graphnode action description    
    var ActionNode = function(parent,action,ruleName,reteNet){
        ReteNode.call(this,parent);
        this.isActionNode = true;
        this.name = name;
        this.action = action;

        //reference to retenet, to allow storage of results of firing:
        this.reteNet = reteNet;
        
    };


    /**
       @data NegativeJoinResult
       @purpose To Store the combination of a token and a wme that blocks it from progressing through the network
     */
    //Storage for a token blocked by a wme
    //Updates the owner token and wme as part of its construction
    var NegativeJoinResult = function(owner,wme){
        this.owner = owner;
        if(this.owner){
            this.owner.negJoinResults.unshift(this);
        }
        this.wme = wme;
        if(this.wme){
            this.wme.negJoinResults.unshift(this);
        }
        this.id = nextId;
        nextId++;
    };


    /**
       @data NegativeNode
       @purpose A Node that tests for the abscence of particular wmes
     */
    //Negative Node:The node that gates token progression
    var NegativeNode = function(parent,alphaMemory,tests){
        if(tests.length === 0){
            throw new Error("Negative Node can't handle no bindings");
        }
        ReteNode.call(this,parent);
        this.isNegativeNode = true;
        this.items = [];
        this.alphaMemory = alphaMemory;
        if(this.alphaMemory){
            this.alphaMemory.referenceCount++;
            this.alphaMemory.children.unshift(this);
        }
        this.tests = tests;
        this.nearestAncestor = null;
    };

    /**
       @data NCCNode
       @purpose The generalisation of the negative node to multiple conditions, forms the leaf of a subnetwork
     */
    //NCC : gates token progression based on a subnetwork
    //SEE ALSO: NCCCondition
    //old: NegatedConjunctiveConditionNode
    var NCCNode = function(parent){
        ReteNode.call(this,parent);
        this.isAnNCCNode = true;
        this.items = [];
        this.partner = null;
    };


    /**
       @data NCCPartnerNode
       @purpose to store potential partial matches in the subnetwork for a NCCNode
     */
    //The partner of the NCC, connects to the subnetwork
    //old NegConjuConPartnerNode
    //var NCCPartner
    var NCCPartnerNode = function(parent,num){
        ReteNode.call(this,parent);
        this.isAnNCCPartnerNode = true;
        this.nccNode = null;
        this.numberOfConjuncts = num;
        this.newResultBuffer = [];
        this.id = nextId;
    };
    

    
    //--------------------
    /**
       @interface ReteDataStructures
     */
    var DataStructures = {
        "WME"              : WME,
        "Token"            : Token,
        "AlphaMemory"      : AlphaMemory,
        "AlphaMemoryItem"  : AlphaMemoryItem,
        "AlphaNode"        : AlphaNode,
        "ReteNode"         : ReteNode,
        "BetaMemory"       : BetaMemory,
        "JoinNode"         : JoinNode,
        "NegativeJoinResult":NegativeJoinResult,
        "NegativeNode"     : NegativeNode,
        "NCCNode"          : NCCNode,
        "NCCPartnerNode"   : NCCPartnerNode ,
        "Test"             : ConstantTest,
        "ConstantTest"     : ConstantTest,
        "Condition"        : Condition,
        "NCCCondition"    : NCCCondition,
        "ActionNode"       : ActionNode,
        "ReteNet"          : ReteNet
    };
    
    return DataStructures;
});