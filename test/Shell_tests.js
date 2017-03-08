//To be used with mocha --require babel-polyfill --compilers js:babel-register
//Import * as aModule from '../src/aModule';
import _ from 'lodash';
import * as chai from 'chai';
import { Shell } from '../src/Shell';
import { GraphNode } from '../src/Node/GraphNode';
import { ReteNet } from '../libs/rete';

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
            this.shell.stash().should.have.length(0);
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
            this.shell.root().numOfEdges().should.equal(0);
            let newNodeId = this.shell.addNode('test','child');
            this.shell.length().should.equal(2);
            this.shell.root().numOfEdges().should.equal(1);
            this.shell.root().hasEdgeTo(newNodeId).should.be.true;
            this.shell.get(newNodeId).name().should.equal('test');
            this.shell.root().getEdgeTo(newNodeId).should.equal('child');
        });
        it('Should be able to add multiple children to the root',function(){
            this.shell.length().should.equal(1);
            this.shell.root().numOfEdges().should.equal(0);
            let newNodeId1 = this.shell.addNode('test','child'),
                newNodeId2 = this.shell.addNode('other_test','child');
            this.shell.length().should.equal(3);
            this.shell.root().numOfEdges().should.equal(2);
            this.shell.root().hasEdgeTo(newNodeId1).should.be.true;
            this.shell.root().hasEdgeTo(newNodeId2).should.be.true;
            
        });
        it('Should be able to add a parent to a node',function(){
            this.shell.length().should.equal(1);
            this.shell.root().numOfEdges().should.equal(0);
            let newNodeId = this.shell.addNode('test','parent');
            this.shell.length().should.equal(2);
            this.shell.root().hasEdgeTo(newNodeId).should.be.true;
            
        });

        it("Should make reciprocal edges",function(){
            let newNodeId = this.shell.addNode('test','child');
            this.shell.get(newNodeId).hasEdgeTo(this.shell.root().id).should.be.true;
            this.shell.root().hasEdgeTo(newNodeId).should.be.true;
        });
        
        it('Should be able to add multiple parents to a node',function(){
            let newParentId = this.shell.addNode('test1','parent'),
                newParentId2 = this.shell.addNode('test2','parent');
            this.shell.get(newParentId).hasEdgeTo(this.shell.root().id).should.be.true;
            this.shell.get(newParentId2).hasEdgeTo(this.shell.root().id).should.be.true;
            this.shell.root().hasEdgeTo(newParentId).should.be.true;
            this.shell.root().hasEdgeTo(newParentId2).should.be.true;
        });
        
        it('Should be able to add nodes of different types');
        it('Should be able to add nodes with sub structure');
        it('Should be able to add rules with substructure');
        
        it('Should be able to add an anonymous node',function(){
            let newNodeId = this.shell.addNode(),
                node = this.shell.get(newNodeId);
            node.name().should.equal('anon');
            
        });
        
        it('Should be able to create a node as a child of defined parent');
        it('Should complain on non-existent parent target');
        it('Should complain on trying to create an unconnected node'); 
        
    });

    describe("Deletion:", function(){
        it('Should be able to remove a node',function(){
            this.shell.cwd().numOfEdges().should.equal(0);
            let newNodeId = this.shell.addNode();
            
            this.shell.cwd().numOfEdges().should.equal(1);
            this.shell.cwd().hasEdgeTo(newNodeId);
            this.shell.get(newNodeId).hasEdgeTo(this.shell.cwd().id);
            this.shell.get(newNodeId).numOfEdges().should.equal(1);
            this.shell.length().should.equal(2);
            
            this.shell.deleteNode(newNodeId);
            
            this.shell.length().should.equal(1);
            this.shell.cwd().id.should.not.equal(newNodeId);
            this.shell.cwd().numOfEdges().should.equal(0);
        });
        it('Should be able to clean up links of nodes that are connected');
        it('Should complain on trying to delete a non-existent node',function(){
            expect(()=>{ this.shell.deleteNode(5); }).to.throw(Error);
        });
        xit('Should be able to remove a local node by name',function(){
            let newNodeId = this.shell.addNode('test');
            this.shell.length().should.equal(2);
            this.shell.deleteNode('test');
            this.shell.length().should.equal(1);
        });
        it('Should be able to remove a node by id');
        it('Should be able to remove a specific edge of a circular relation')
        
        
    });
    
    describe.skip("Modification:", function(){
        it('Should be able to change the name of a node');
        it('Should be able to add values to the node');
        it('Should be able to change values of a node');
        it('Should be able to remove values from a node');
        it('Should be able to add tags to a node');
        it('Should be able to remove tags to a node');
        it('Should be able to link two existing nodes together');
        it('Should complain on trying to link a node to a non-existent node');
    });

    describe.skip("State Change:", function(){
        it('Should be able to change the cwd by id');
        it('Should be able to change the cwd by name');
        it('Should be able to change the cwd to a non-child node');
        it('Should be able to change the cwd to a parent');
        it('Should be able to go back to a previous node');
        it('Should be able to add nodes to the stack');
        it('Should be able to pop nodes off the stack');
        it('Should be able to change the cwd to a renamed node');
    });
    
    describe.skip("Node Searching:", function(){
        it('Should be able to search for a node by id');
        it('Should be able to search for a node by name');
        it('Should be able to search for a node by regex');
        it('Should be able to search for a node by parameter name');
        it('Should be able to search for a node by parameter value');
        it('Should be able to search for a node by tag');
        it('Searching should be able to retrieve multiple matching nodes');
        it('Should be able to search by parent nodes');
        it('Should be able to search by child nodes');
        it('Should be able to search by generalised links');
        it('Should be able to refine search results');
                
    });

    describe.skip("FSM:", function(){
        it('Should be able to create an FSM node');
        it('Should be able to add states to the FSM');
        it('Should be able to add transitions to the FSM');
        it('Should be able to run the FSM');
        it('Should be able to delete states from the FSM');
        it('Should be able to delete transitions from the FSM');
        
    });

    describe.skip("String Utilities:", function(){
        it('Should be able to convert nodes to concise strings');
        it('Should be able to convert a subtree to a grammar');
    });

    describe.skip("Graph Search:", function(){
        it('Should be able to do a dfs on a node');
        it('Should be able to do a bfs on a node');
        it('Should be able to detect strongly connected components');
        it('Should be able to detect islands');
    });

    describe.skip("JSON:", function(){

        describe.skip("Import:", function(){
            it('Should be able to create a shell instance from saved json data');
        });

        describe.skip("Export", function(){
            it('Should be able to export a shell instance as json data');
            
        });
        
    });

    describe.skip("Rete:", function(){
        it('Should be able to define rules');
        it('Should be able to assert nodes as facts');
        it('Should be able to link a node with its retenet wme');
        it('Should be able to retract wmes by their node');
        it('Should be able to fire rules');
        it('Should be able to add nodes based on fired rules');
    });

    describe.skip("Simulation", function(){

    });
    
    
});
