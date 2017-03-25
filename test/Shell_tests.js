//To be used with mocha --require babel-polyfill --compilers js:babel-register
//Import * as aModule from '../src/aModule';
import _ from 'lodash';
import * as chai from 'chai';
import Shell from '../src/Shell';
import GraphNode from '../src/Node/GraphNode';
import ReteNet from '../libs/rete';

let should = chai.should(),
    expect = chai.expect;

describe("Shell Interface:", function() {

    beforeEach(function(){
        this.shell = new Shell();
    });

    afterEach(function(){
        this.shell = null;
    });

    describe("Initialization:", function() {

        it("Should Exist", function() {
            expect(this.shell).to.exist;
            this.shell.should.be.an.instanceof(Shell);
            
        });

        it("Should have an initial root node",function(){
            this.shell.length().should.equal(1);
            this.shell.root().should.be.an.instanceof(GraphNode);
            this.shell.root().name().should.equal('_root');
            expect(() => { this.shell.get(this.shell.root().id) }).to.not.throw(Error);
            this.shell.get(this.shell.root().id).should.equal(this.shell.root());
        });
        
        it("Should have no rules",function(){
            this.shell.numRules().should.equal(0);
        });
 
        it("Should have a cwd of the root node",function(){
            this.shell.cwd().should.deep.equal(this.shell.root());
        });
        it("Should have nothing in the node stash",function(){
            this.shell._nodeStash.should.have.length(0);
        });
        it("Should have a previous location of the root node",function(){
            this.shell.prior().should.equal(this.shell.root().id);
        });
        it("Should have no previous search results",function(){
            this.shell.searchResults().should.have.length(0);
        });
        it("Should have no rete output to start",function(){
            this.shell.reteOutput().should.have.length(0);
        });        
    });

    describe("Addition:", function(){
        it('Should be able to add a child to the root',function(){
            this.shell.length().should.equal(1);
            this.shell.root().numOfEdges().should.equal(1);
            let newNodeId = this.shell.addNode('test','child');
            this.shell.length().should.equal(2);
            this.shell.root().numOfEdges().should.equal(2);
            this.shell.root().hasEdgeWith(newNodeId).should.be.true;
            this.shell.get(newNodeId).name().should.equal('test');
            expect(this.shell.root().getEdgeTo(newNodeId)).should.exist;
        });

        it("Should be able to add children to other nodes than the root", function(){
            let node1 = this.shell.addNode('test','child','parent','graphnode',[],this.shell.cwd().id),
                node2 = this.shell.addNode('second','child','paretn','graphnode',[],node1);
            this.shell.get(node1).hasEdgeWith(node2).should.be.true;
            this.shell.get(node2).hasEdgeWith(node1).should.be.true;
            this.shell.cwd().hasEdgeWith(node1).should.be.true;
            this.shell.cwd().hasEdgeWith(node2).should.be.false;
            this.shell.get(node2).hasEdgeWith(this.shell.cwd().id).should.be.false;

        });
        
        it('Should be able to add multiple children to the root',function(){
            this.shell.length().should.equal(1);
            this.shell.root().numOfEdges().should.equal(1);
            let newNodeId1 = this.shell.addNode('test','child'),
                newNodeId2 = this.shell.addNode('other_test','child');
            this.shell.length().should.equal(3);
            this.shell.root().numOfEdges().should.equal(3);
            this.shell.root().hasEdgeWith(newNodeId1).should.be.true;
            this.shell.root().hasEdgeWith(newNodeId2).should.be.true;
            
        });
        it('Should be able to add a parent to a node',function(){
            this.shell.length().should.equal(1);
            this.shell.root().numOfEdges().should.equal(1);
            let newNodeId = this.shell.addNode('test','parent');
            this.shell.length().should.equal(2);
            this.shell.root().hasEdgeWith(newNodeId).should.be.true;
            
        });

        it("Should make reciprocal edges",function(){
            let newNodeId = this.shell.addNode('test','child');
            this.shell.get(newNodeId).hasEdgeWith(this.shell.root().id).should.be.true;
            this.shell.root().hasEdgeWith(newNodeId).should.be.true;
        });
        
        it('Should be able to add multiple parents to a node',function(){
            let newParentId = this.shell.addNode('test1','parent'),
                newParentId2 = this.shell.addNode('test2','parent');
            this.shell.get(newParentId).hasEdgeWith(this.shell.root().id).should.be.true;
            this.shell.get(newParentId2).hasEdgeWith(this.shell.root().id).should.be.true;
            this.shell.root().hasEdgeWith(newParentId).should.be.true;
            this.shell.root().hasEdgeWith(newParentId2).should.be.true;
        });

        it('Should be able to add nodes of different types',function(){

            
        });
        it('Should be able to add nodes with sub structure');
        it('Should be able to add rules with substructure');
        
        it('Should be able to add an anonymous node',function(){
            let newNodeId = this.shell.addNode(),
                node = this.shell.get(newNodeId);
            node.name().should.equal('anon');
            
        });
        
        it('Should be able to create a node as a child of defined parent',function(){
            let newNodeId = this.shell.addNode('blah'),
                childNodeId = this.shell.addNode('test','child','parent',
                                                 'graphnode',undefined, newNodeId),
                parentNode = this.shell.get(newNodeId);
            parentNode.hasEdgeWith(childNodeId).should.be.true;
            
        });
        
        it('Should complain on non-existent parent target',function(){
            let newNodeId = this.shell.addNode('blah');
            expect(()=>{
                this.shell.addNode('test','child','parent','graphnode',undefined, newNodeId+5);
            }).to.throw(Error);
        });
    });

    describe("Deletion:", function(){
        it('Should be able to remove a node',function(){
            this.shell.cwd().numOfEdges().should.equal(1);
            let newNodeId = this.shell.addNode();
            
            this.shell.cwd().numOfEdges().should.equal(2);
            this.shell.cwd().hasEdgeWith(newNodeId);
            this.shell.get(newNodeId).hasEdgeWith(this.shell.cwd().id);
            this.shell.get(newNodeId).numOfEdges().should.equal(1);
            this.shell.length().should.equal(2);
            
            this.shell.deleteNode(newNodeId);
            
            this.shell.length().should.equal(1);
            this.shell.cwd().id.should.not.equal(newNodeId);
            this.shell.cwd().numOfEdges().should.equal(1);
        });

        //todo
        it('Should be able to clean up links of nodes that are connected');

        
        it('Should complain on trying to delete a non-existent node',function(){
            expect(()=>{ this.shell.deleteNode(5); }).to.throw(Error);
        });
        
        it('Should be able to remove a node by id',function(){
            let newNodeId = this.shell.addNode();
            this.shell.cdById(newNodeId);
            let anotherNodeId = this.shell.addNode();
            this.shell.cdById(this.shell.cwd().id);
            this.shell.deleteNode(anotherNodeId);
            let node = this.shell.get(newNodeId);
            node.hasEdgeWith(anotherNodeId).should.be.false;
        });
        
        it('Should be able to remove a specific edge of a circular relation')
        
        it("Should be able to have multiple categories of edge");
        it("Should be able to remove specify edge types"); 
    });
    
    describe("Modification:", function(){
        it('Should be able to change the name of a node',function(){
            let newNodeId = this.shell.addNode();
            this.shell.get(newNodeId).name().should.equal('anon');
            this.shell.get(newNodeId).setName('test');
            this.shell.get(newNodeId).name().should.equal('test');
        });
        it('Should be able to add values to the node',function(){
            this.shell.cwd().values().length.should.equal(2);
            this.shell.cwd().setValue('blah','test');
            this.shell.cwd().values().length.should.equal(3);
            this.shell.cwd().values().should.deep.equal([['name','_root'],
                                                         ['_parentId',this.shell.cwd().id],
                                                         ['blah','test']]);
            this.shell.cwd().getValue('blah').should.equal('test');
            
        });
        it('Should be able to change values of a node',function(){
            this.shell.cwd().setValue('blah','test');
            this.shell.cwd().getValue('blah').should.equal('test');
            this.shell.cwd().setValue('blah','other');
            this.shell.cwd().getValue('blah').should.equal('other');
        });
        it('Should be able to remove values from a node',function(){
            this.shell.cwd().values().length.should.equal(2);
            this.shell.cwd().setValue('blah','test');
            this.shell.cwd().values().length.should.equal(3);
            this.shell.cwd().getValue('blah').should.equal('test');
            this.shell.cwd().setValue('blah');
            this.shell.cwd().values().length.should.equal(2);
        });
        
        it('Should be able to add tags to a node',function(){
            let cwd = this.shell.cwd();
            cwd.tags().length.should.equal(1);
            cwd.hasTag('graphnode');
            cwd.tag('blah')
            cwd.hasTag('graphnode');
            cwd.hasTag('blah');
            cwd.tags().length.should.equal(2);
        });
        it('Should be able to remove tags to a node',function(){
            let cwd = this.shell.cwd();
            cwd.tags().length.should.equal(1);
            cwd.untag('graphnode');
            cwd.tags().length.should.equal(0);
        });
        it("Should be able to get a list of tags",function(){
            let cwd = this.shell.cwd();
            cwd.tag('blah').tag('bloo').tag('blee');
            _.isEqual(cwd.tags(),['graphnode','blah','bloo','blee']).should.be.true;
        });
        it("Should be able to check a node has a particular tag",function(){
            let cwd = this.shell.cwd();
            cwd.tag('blah').tag('bloo').tag('blee');
            cwd.hasTag('blah').should.be.true;
            cwd.hasTag('bloo').should.be.true;
            cwd.hasTag('blee').should.be.true;
            cwd.hasTag('awef').should.be.false;
        });
        
        it('Should be able to link two existing nodes together',function(){
            let newNodeId1 = this.shell.addNode('test1'),
                newNodeId2 = this.shell.addNode('test2'),
                node1 = this.shell.get(newNodeId1),
                node2 = this.shell.get(newNodeId2);
            node1.hasEdgeWith(newNodeId2).should.be.false;
            node2.hasEdgeWith(newNodeId1).should.be.false;
            this.shell.link(newNodeId1,'child','parent',newNodeId2);
            node1.hasEdgeWith(newNodeId2).should.be.true;
            node2.hasEdgeWith(newNodeId1).should.be.true;
        });
        
        it('Should complain on trying to link a node to a non-existent node',function(){
            let newNodeId1 = this.shell.addNode('test1');
            expect(()=>{
                this.shell.link(newNodeId1,'child','parent',newNodeId1+5);
            }).to.throw(Error);
        });
    });

    describe("State Change:", function(){
        it('Should be able to change the cwd by id',function(){
            let newNodeId = this.shell.addNode('test');
            this.shell.cwd().id.should.not.equal(newNodeId);
            this.shell.cdById(newNodeId);
            this.shell.cwd().id.should.equal(newNodeId);
        });
        
        it('Should be able to change the cwd to a non-child node',function(){
            let node1 = this.shell.addNode('test','child','parent','graphnode',[], this.shell.cwd().id),
                node2 = this.shell.addNode('second','child','parent','graphnode',[],node1);
            this.shell.cwd().id.should.not.equal(node1);
            this.shell.cwd().id.should.not.equal(node2);
            this.shell.cdById(node2);
            this.shell.cwd().id.should.equal(node2);
        });
        
        it('Should be able to change the cwd to a parent',function(){
            let node1Id = this.shell.addNode('test');
            this.shell.cdById(node1Id);
            this.shell.cwd().id.should.equal(node1Id);
            this.shell.cdByString('..');
            this.shell.cwd().id.should.equal(this.shell.root().id);
        });
        
        it('Should be able to go back to a previous node',function(){
            let newNode = this.shell.addNode('test');
            this.shell.cdById(newNode);
            this.shell.prior().should.equal(this.shell._root.id);

        });
        it('Should be able to add/remove nodes to the stack/stash',function(){
            this.shell._nodeStash.length.should.equal(0);
            this.shell.stash()
            this.shell._nodeStash.length.should.equal(1);
            this.shell._nodeStash[0].should.equal(this.shell.cwd().id);
            let anotherNode = this.shell.addNode('test');
            this.shell.cdById(anotherNode);
            this.shell.stash();
            this.shell._nodeStash.length.should.equal(2);
            this.shell._nodeStash[1].should.equal(this.shell.cwd().id);
            this.shell._nodeStash[0].should.not.equal(this.shell._nodeStash[1]);
        });

        it('Should be able to pop nodes off the stack',function(){
            this.shell._nodeStash.length.should.equal(0);
            this.shell.stash();
            this.shell._nodeStash.length.should.equal(1);
            let result = this.shell.unstash();
            result.should.equal(this.shell.cwd().id);
            this.shell._nodeStash.length.should.equal(0);
        });
        
    });
    
    describe("Node Searching:", function(){
        it('By Name,Regex,Null on trivial flat nodes ',function(){
            this.shell.addNode("blah");
            this.shell.addNode("bloo");
            this.shell.addNode("awef");
            this.shell.searchResults().should.be.empty;
            this.shell.search('name',/^bl/);
            this.shell.searchResults().length.should.equal(2);
        });

        it("By Name, Regex, Null with children", function(){
            let blah = this.shell.addNode('blah'),
                bloo = this.shell.addNode('bloo');
            this.shell.cdById(blah);
            this.shell.addNode('blab');
            this.shell.cdById(bloo);
            this.shell.addNode('blooob')
            this.shell.addNode('awef');
            this.shell.searchResults().should.be.empty;
            this.shell.search('name',/^bl/);
            this.shell.searchResults().length.should.equal(4);
        });
        it('By Tag, Regex, Null',function(){
            let blah = this.shell.addNode('blah'),
                bloo = this.shell.addNode('bloo');
            this.shell.get(blah).tag('qwop');
            this.shell.get(bloo).tag('awef');
            this.shell.searchResults().should.be.empty;
            this.shell.search('tag',/qw/);
            this.shell.searchResults().length.should.equal(1);
        });

        it("By Value, Regex, Null", function(){
            let blah = this.shell.addNode('blah'),
                bloo = this.shell.addNode('bloo');
            this.shell.get(blah).setValue('qwop',5);
            this.shell.get(bloo).setValue('qwap',5);
            this.shell.searchResults().should.be.empty;
            this.shell.search('value',/qwo/);
            this.shell.searchResults().length.should.equal(1);
        });
        
        it('By Value, String, ExactVal',function(){
            let blah = this.shell.addNode('blah'),
                bloo = this.shell.addNode('bloo');
            this.shell.get(blah).setValue('qwop',5);
            this.shell.get(bloo).setValue('qwop',10);
            this.shell.searchResults().should.be.empty;
            this.shell.search('value','qwop',5);
            this.shell.searchResults().length.should.equal(1);
        });

        it("By Value, regex, ExactVal");
        it("By Value, String, Null");
        it("By Value, String, EvalFunc");
        it("By Value, RegExp, EvalFun");
        it('By Tag, String, Null');
        
        it('Searching should be able to retrieve multiple matching nodes');
        it('Should be able to search by parent nodes');
        it('Should be able to search by child nodes');
        it("Should be able to search by other specific edge types");
        it('Should be able to search by edge regex');

        describe("Should be able to refine by all the search methods above",function(){
            
        });
        
    });

    describe("FSM:", function(){
        it('Should be able to create an FSM node');
        it('Should be able to add states to the FSM');
        it('Should be able to add transitions to the FSM');
        it('Should be able to run the FSM');
        it('Should be able to delete states from the FSM');
        it('Should be able to delete transitions from the FSM');
        
    });

    describe("String Utilities:", function(){
        it('Should be able to convert nodes to concise strings');
        it('Should be able to convert a subtree to a grammar');
    });

    describe("Graph Search:", function(){
        it('Should be able to do a dfs on a node');
        it('Should be able to do a bfs on a node');
        it('Should be able to detect strongly connected components');
        it('Should be able to detect islands');
    });

    describe("JSON:", function(){

        describe("Export and Import:", function(){
            it('Should be able to export a trivial shell instance as json data',function(){
                let root = this.shell.root();
                root.hasValue('aValue').should.be.false;
                root.setValue('aValue',"blah");
                root.hasValue('aValue').should.be.true;
                let exported = this.shell.export();
                let aNewShell = new Shell();
                aNewShell.root().hasValue('aValue').should.be.false;
                aNewShell.import(exported.text);
                aNewShell.root().hasValue('aValue').should.be.true;
            });

        });

    });

    describe("Rete:", function(){
        it('Should be able to define rules');
        it('Should be able to assert nodes as facts');
        it('Should be able to link a node with its retenet wme');
        it('Should be able to retract wmes by their node');
        it('Should be able to fire rules');
        it('Should be able to add nodes based on fired rules');
    });

    describe("Simulation", function(){
        it("Should be able to instantiate and run a sim");
    });
    
    describe("UI Interface methods",function(){

        it("Should be able to return parents in a simple DS");
        it("Should be able to return the current node in a simple DS");
        it("Should be able to return the children in a simple DS");
        it("Should be able to return FSM details");
        it("Should be able to return Rule details");
        it("Should be able to return a help object");
        
        
    });

    describe("Parsing",function(){
        //test all the commands, separately from the UI        
    });

    
});
