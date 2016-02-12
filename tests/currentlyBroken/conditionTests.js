var ds = require('../src/Rete/ReteDataStructures');
var GraphNode = require('../src/Node/GraphNode');
var GSCtors = require('../src/Node/GraphStructureConstructors');

exports.conditionTests = {

    //If you can make a test, you can make a condition:
    ConditionSingleTestExample : function(test){
        //Create a condition of just one test,
        //wme['first'] === 5. no bindings, and not negative
        var aCondition = new ds.Condition(
            [['first','EQ',5]],
            [],
            false);
        test.ok(aCondition.isPositive === true);
        test.ok(aCondition.constantTests.length === 1);
        test.ok(aCondition.bindings.length === 0);
        var theTest = aCondition.constantTests[0];
        test.ok(theTest.field === "first");
        test.ok(theTest.operator === "EQ");
        test.ok(theTest.value === 5);
        test.done();
    },
    ConditionMultipleTestExample : function(test){
        //Create a condition of two tests:
        //wme['first'] === 5 && wme['second'] === "hello"
        var aCondition = new ds.Condition(
            [['first','EQ',5],['second','EQ','hello']],
            [],false);

        test.ok(aCondition.isPositive === true);
        test.ok(aCondition.constantTests.length === 2);
        test.ok(aCondition.bindings.length === 0);
        var test1 = aCondition.constantTests[0];
        var test2 = aCondition.constantTests[1];

        test.ok(test1.field === "first");
        test.ok(test1.operator === "EQ");
        test.ok(test1.value === 5);
        test.ok(test2.field === "second");
        test.ok(test2.operator === "EQ");
        test.ok(test2.value === "hello");

        test.done();
    },

    ConditionWithBindingExample : function(test){
        //Create a condition of no tests,
        //but with the binding: a <- wme['first']
        var aCondition = new ds.Condition(
            [],
            [['a','first']],false);

        test.ok(aCondition.constantTests.length === 0);
        test.ok(aCondition.bindings.length === 1);
        test.ok(aCondition.bindings[0][0] === 'a');
        test.ok(aCondition.bindings[0][1] === 'first');
        test.done();
    },

    ConditionWithSortedBindings : function(test){
        //Create a condition with multiple bindings,
        //and check they get sorted by boundVariableName
        var aCondition = new ds.Condition(
            [],
            [['z','first'],['a','second'],['b','third']],false
        );

        test.ok(aCondition.bindings.length === 3);
        test.ok(aCondition.bindings[0][0] === 'a');
        test.ok(aCondition.bindings[1][0] === 'b');
        test.ok(aCondition.bindings[2][0] === 'z');
        test.done();
    },
    
    NegativeConditionExample : function(test){
        //Create a Condition with a simple test,
        //but negate it, so check: !wme['first'] === 5
        var aCondition = new ds.Condition(
            [['first','EQ',5]],
            [],true);

        test.ok(aCondition.isNegative === true);
        test.done();
    },

    //With some confidence in conditions, lets make a simple
    //rule called 'simpleRule', that does:
    //if(wme['first'] === 5) THEN { say hello }
    simpleRuleExample : function(test){
        //Rules take arrays of tuples for conditions:
        var aRule = new ds.Rule("simpleRule",
                                [//conditions
                                    [//c1
                                        [//tests
                                            //test1
                                            ['first','EQ',5]
                                        ],//end of tests
                                        //bindings and neg?
                                        [],false
                                    ]//end of c1
                                ],//end of conditions
                                //the Action
                                function(){
                                    console.log("Hello");
                                });

        test.ok(aRule.name === "simpleRule")
        test.ok(aRule.conditions.length === 1);
        test.ok(aRule.conditions[0].constantTests.length === 1);
        test.ok(aRule.conditions[0].bindings.length === 0);
        test.ok(aRule.conditions[0].isPositive === true);
        test.ok(aRule.action !== undefined);
        test.done();
    },
    //Action node test:
    simpleActionNodeTest : function(test){
        var testValue = 0;
        var dummyParent = {
            id : "dummy",
            children : [],
        };
        var action = new ds.ActionNode(dummyParent,
                                       function(){
                                           testValue = 5;
                                       },"simpleAction");

        test.ok(action.isActionNode === true);
        test.ok(action.name === 'simpleAction');
        test.ok(action !== undefined);
        test.ok(action.parent.id === dummyParent.id);

        test.ok(testValue === 0);
        action.action();
        test.ok(testValue === 5);
        
        test.done();
    },

    //--------------------
    //Core stuff has now been constructed,
    //time to deal with negated conditions:
    //--------------------

    //negative condition
    //Same as the positive condition test, just negated
    negativeConditionTest : function(test){
        //Create a condition of just one test,
        //wme['first'] === 5. no bindings, but IS NEGATIVE
        var aCondition = new ds.Condition(
            [['first','EQ',5]],
            [],
            true);
        test.ok(aCondition.isNegative === true);
        test.ok(aCondition.constantTests.length === 1);
        test.ok(aCondition.bindings.length === 0);
        var theTest = aCondition.constantTests[0];
        test.ok(theTest.field === "first");
        test.ok(theTest.operator === "EQ");
        test.ok(theTest.value === 5);
        test.done();
    },
    //nccCondition
    //to construct a negated conjunctive condition,
    //just wrap what would be a condition in an array, with
    //a '!' as the first element
    nccConditionCtorTest : function(test){
        //Create a nccCondition of:
        //NOT (wme['first'] === 5
        var def = ['!',
                   [//conditions
                       [//c1
                           [//tests
                               //test1
                               ['first','EQ',5]
                           ],//end of tests
                           //bindings?, negated?
                           [],false
                       ]//end of c1
                   ]//end of conditions
                  ];
        var anNCCCondition = new ds.NCCCondition(def[1]);

        test.ok(anNCCCondition.isNCCCondition === true);
        test.ok(anNCCCondition.conditions.length === 1);
        test.ok(anNCCCondition.conditions[0].isPositive === true);
        test.ok(anNCCCondition.conditions[0].bindings.length === 0);
        test.ok(anNCCCondition.conditions[0].constantTests.length === 1);
        test.done();
    },

    //Rule Test with nccCondition
    ruleCreationWithAnNCCCondition : function(test){
        var aRule = new ds.Rule("simpleNCCRule",
                                [//conditions
                                    [//c1 - not ncc
                                        [//tests
                                            ['first','EQ',5]
                                        ],//end of tests
                                        //bindings and neg:
                                        [],false
                                    ],//end of c1
                                    ['!',//c2 - NCC
                                     [//NCC's conditions
                                         [//c1 of NCC
                                             [//tests
                                                 ['second','EQ','bill']
                                             ],//end of tests
                                             //bindings and neg:
                                             [],false
                                         ],//end of NCC-c1
                                     ]//end of NCC Conditions
                                    ]//end of NCC
                                ],//end of conditions
                                //the action:
                                function(){
                                    console.log("Hello");
                                });

        test.ok(aRule.name = "simpleNCCRule");
        test.ok(aRule.action !== undefined);
        test.ok(aRule.conditions.length === 2);
        //test the normal condition
        test.ok(aRule.conditions[0].isPositive === true);
        test.ok(aRule.conditions[0].constantTests.length === 1);
        test.ok(aRule.conditions[0].bindings.length === 0);

        //test the NCCcondition
        test.ok(aRule.conditions[1].isNCCCondition === true);
        test.ok(aRule.conditions[1].conditions.length === 1);
        test.ok(aRule.conditions[1].conditions[0].isPositive === true);
        test.ok(aRule.conditions[1].conditions[0].bindings.length === 0);
        test.ok(aRule.conditions[1].conditions[0].constantTests.length === 1);
        test.done();
    },


};
