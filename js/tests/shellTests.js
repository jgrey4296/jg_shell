var Shell = require('../src/shell');

exports.Shelltests = {

    setUp : function(callback){
        this.shell = new Shell();
        callback();
    },

    
    //test basic ctor
    ctorCheck : function(test){
        test.ok(this.shell !== undefined);
        test.ok(this.shell instanceof Shell);
        test.ok(this.shell.root !== undefined);
        test.ok(this.shell.cwd !== undefined);
        test.ok(this.shell.root === this.shell.cwd);
        test.ok(this.shell.nodes instanceof Array);
        test.ok(this.shell.nodes.length === 1);
        test.ok(this.shell.nodes[0].id === 0);
        test.ok(this.shell.nodes[0] instanceof this.shell.__Node);
        test.done();
    },

    //check at start that the root and cwd are the same
    rootFindCheck : function(test){
        var root = this.shell.find(this.shell.root);
        var cwd = this.shell.find(this.shell.cwd);
        test.ok(root === cwd);
        test.done();
    },

    //check the helper functions getRoot and getCwd work
    getRootAndCwdTest : function(test){
        var root = this.shell.getRoot();
        var cwd = this.shell.getCwd();
        test.ok(root.id === cwd.id);
        test.done();
    },
    
    //be able to add a child to the cwd,
    //it should return the subchild without moving the cwd;
    rootMkChildTest : function(test){
        var retShell = this.shell.addChild('blah');
        test.ok(retShell instanceof Shell);
        test.ok(this.shell.getCwd().children.blah !== undefined);
        test.ok(this.shell.getRoot().children.blah !== undefined);
        test.done();
    },

    
    //be able to change the cwd to a new node
    moveCwdTest : function(test){
        this.shell.addChild('blah');
        var child = this.shell.moveTo('blah').getCwd();
        test.ok(this.shell.getCwd().id !== this.shell.getRoot().id);
        test.ok(this.shell.getCwd()._originalParent !== undefined,"The cwd's parent should not be undefined");
        test.ok(this.shell.getCwd().name === 'blah');
        test.ok(child.id === this.shell.getCwd().id);
        test.ok(child._originalParent === this.shell.getRoot().id);
        test.done();
    },

    //test the combination add and move method:
    addMoveTest : function(test){
        this.shell.addMove("blah/bob/bill");
        test.ok(this.shell.getCwd().name === "bill");        
        test.done();
    },
    
    moveCwdByNumber : function(test){
        var rootNode = this.shell.cwd;
        var rootName = this.shell.getCwd().name;
        this.shell.addChild('blah');
        this.shell.moveTo('blah');
        var afterAdd = this.shell.addChild('bloo');
        var afterMove = afterAdd.moveTo('bloo');
        var afterCWD = afterMove.getCwd();
        var blooNode = afterCWD.id;
        this.shell.addMove('bill');
        test.ok(this.shell.getCwd().name === 'bill');
        this.shell.moveTo(rootNode);
        test.ok(this.shell.getCwd().name === rootName);
        this.shell.moveTo(blooNode);
        test.ok(this.shell.getCwd().name === "bloo");
                
        test.done();
    },
    
    //when you move, you should get the shell back
    moveReturnShellTest : function(test){
        this.shell.addChild('blah');
        var shouldBeSameShell = this.shell.moveTo('blah');
        test.ok(shouldBeSameShell instanceof Shell);
        test.ok(shouldBeSameShell === this.shell);
        test.done();
    },

    //be able to move from anywhere, to the root;
    moveToRootTest : function(test){
        this.shell.addChild('blah');
        this.shell.moveTo('blah');
        test.ok(this.shell.getCwd().id !== this.shell.getRoot().id);
        var retValue = this.shell.moveToRoot();
        test.ok(this.shell.getCwd().id === this.shell.getRoot().id);
        test.ok(retValue instanceof Shell);
        test.done();
    },

    //be able to move by chaining
    movePathTest : function(test){
        this.shell.addChild('blah')
            .moveTo('blah').addChild('bloo')
            .moveTo('bloo').addChild('bill').moveTo('bill');
        test.ok(this.shell.getCwd().name === 'bill');
        test.done();
    },

    //Be able to move using a string path, instead of chaining
    pathMoveToTest : function(test){
        this.shell.addChild('blah').moveTo('blah')
            .addChild('bob').moveTo('bob')
            .addChild('bill');

        this.shell.moveToRoot();
        
        var returnedShell = this.shell.moveTo('blah/bob/bill');
        test.ok(this.shell.getCwd().name === 'bill');
        test.ok(returnedShell instanceof Shell);
        test.done();
    },

    //retrieve the node given by the id number, from
    //all of the currently existing nodes
    getNodeByIdTest : function(test){
        this.shell.addChild('blah');
        var childId = this.shell.getCwd().children.blah;
        var retrieved = this.shell.getNodeById(childId);
        test.ok(retrieved.id === childId);
        test.ok(retrieved.name === 'blah');
        test.done();
    },

    //pass in an object of node ids, get back an array
    //of the nodes
    getMultipleNodesByIdsTest : function(test){
        this.shell.addChild('blah');
        this.shell.addChild('bloo');
        this.shell.addChild('bill');
        var children = this.shell.getNodesByIds(this.shell.getCwd().children);
        test.ok(children[0].name === 'blah');
        test.ok(children[1].name === 'bloo');
        test.ok(children[2].name === 'bill');
        test.done();
    },
    
    //Be able to add a sequence:
    sequenceChildren : function(test){
        this.shell.addChild('blah/bob/bill');
        this.shell.moveTo('blah/bob/bill');
        test.ok(this.shell.getCwd().name === "bill");
        test.ok(this.shell.getCwd()._originalParent !== undefined);
        var bill = this.shell.getCwd();
        test.ok(this.shell.getNodeById(bill._originalParent)._originalParent !== undefined);
        test.ok(this.shell.getNodeById(bill._originalParent).children.bill !== undefined);
        test.done();
    },

    //add a node to the cwd, as its parent
    makeParentTest : function(test){
        this.shell.addParent('blah');
        test.ok(this.shell.getCwd().parents.blah !== undefined);
        var newNode = this.shell.getNodeById(this.shell.getCwd().parents.blah);
        test.ok(newNode.id === this.shell.getCwd().parents.blah);
        this.shell.addParent('bloo').addParent('bill');

        test.ok(this.shell.getCwd().parents.bloo !== undefined);
        test.ok(this.shell.getCwd().parents.bill !== undefined);
        
        test.done();
    },


    
    //from a location, print the path to it from / to the cwd
    //(for cases where the cwd is a descendent of the root
    pwdTest : function(test){
        this.shell.addMove("blah/bloo/bill");
        var pwdString = this.shell.pwd();
        test.ok(pwdString === "/blah/bloo/bill");
        test.done();
    },

    
    //test setting values of nodes
    setValuesTest : function(test){
        this.shell.setValue(["a",5]);
        test.ok(this.shell.getCwd().values.a === 5);
        this.shell.setValue(["b",10,"c",15]);
        test.ok(this.shell.getCwd().values.b === 10);
        test.ok(this.shell.getCwd().values.c === 15);
        this.shell.setValue(['d']);
        test.ok(this.shell.getCwd().values.d === undefined);
        this.shell.setValue(['a']);
        test.ok(this.shell.getCwd().values.a === undefined);
        test.done();
    },
    
    //rename a node, and make sure it propagates to all parents
    //and children
    renameNode : function(test){
        var parent = this.shell.getCwd().id;
        this.shell.addChild('bob');
        this.shell.moveTo('bob');
        var currentId = this.shell.getCwd().id;
        this.shell.addChild('theChild');
        this.shell.moveTo('theChild');
        var childId = this.shell.getCwd().id;
        this.shell.moveTo(currentId);
        //prior:
        test.ok(this.shell.getCwd().name === "bob");
        test.ok(this.shell.getNodeById(parent).children.bob === currentId);
        test.ok(this.shell.getNodeById(childId).parents['..'] = currentId);
        test.ok(this.shell.getNodeById(childId).parents.bob === currentId);
        //change 'bob' to 'bill'
        var retShell = this.shell.rename('bill');
        test.ok(retShell instanceof Shell);
        //post:
        test.ok(this.shell.getCwd().name === "bill");
        test.ok(this.shell.getNodeById(parent).children.bob === undefined);
        test.ok(this.shell.getNodeById(parent).children.bill === currentId);
        test.ok(this.shell.getNodeById(childId).parents['..'] === currentId);
        test.ok(this.shell.getNodeById(childId).parents.bill === currentId);
        test.ok(this.shell.getNodeById(childId).parents.bob === undefined);
        
                
        test.done();
    },

    //check that rename will convert to underscores
    renameUnderscoreTest : function(test){
        this.shell.rename("this is a test");
        test.ok(this.shell.getCwd().name === "this_is_a_test");
        test.done();
    },

    //test moveTo from an id... again?
    moveToIdTest : function(test){
        this.shell.addMove("blah").addMove("bloo").addMove("bill");
        var billId = this.shell.getCwd().id;
        this.shell.moveToRoot();
        this.shell.moveTo(billId);
        test.ok(this.shell.getCwd().name === "bill");
        test.ok(this.shell.getCwd().id === billId);
        test.done();
    },
    
    //Pass in a simple data example to test data loading on.
    loadJsonTest : function(test){
        var exampleJson = [
            {id:0,name:"newRoot","children":[1],"parents":[],_originalParent:undefined},
            {id:1,name:"aChild","children":[],"parents":0,_originalParent:0},
        ];
        this.shell.loadJson(exampleJson);
        test.ok(this.shell.getCwd().id === 1);
        test.ok(this.shell.getCwd().name === 'aChild');
        //console.log(this.shell.getCwd());//.parents['..']);
        test.ok(this.shell.getCwd()._originalParent === 0);
        test.done();
    },

    //get the context for the current node:
    //as an object of the actual nodes, not the ids
    contextTest : function(test){
        this.shell.addChild('blah').addChild('bill');
        this.shell.moveTo('blah');
        this.shell.addChild('bozo');
        var context = this.shell.getContext();
        //console.log(context.parents);
        //console.log(context.children);
        test.ok(context.parents[0].id === this.shell.getRoot().id);
        test.ok(context.children[0].id === this.shell.getCwd().children.bozo);
        test.ok(context.node.id === this.shell.getCwd().id);
        test.done();
    },

    //Remove child test:
    removeChildTest : function(test){
        this.shell.addMove('blah').addMove('bloo').addMove('blah');
        this.shell.moveTo('..');
        test.ok(this.shell.getCwd().children.blah !== undefined);
        test.ok(this.shell.getCwd().name === "bloo");
        this.shell.rm('blah');
        test.ok(this.shell.getCwd().children.blah === undefined);

        test.done();
    },

    //removePath test

    
    //Export To Json:
    

    //Todo:
    //Save node value structures

    //recreate /copy node value structures

    //save node parent/child structures

    //recreate/copy node parent/child structures


    //find/search test
    search_by_ID_Test : function(test){
        //setup a dummy shell

        //call find

        //check to see if all appropriate nodes were found
        
        test.done();
    },

    search_by_name_test: function(test){
        test.done();
    },

    search_by_value_test : function(test){
        test.done();
    },

    search_by_notation_test : function(test){
        test.done();

    },
    
};

