//To be used with mocha --require babel-polyfill --compilers js:babel-register
//Import * as aModule from '../src/aModule';
import * as chai from 'chai';
import { GraphNode} from '../src/Node/GraphNode';
import { Edge } from '../src/Edge';

let should = chai.should(),
    expect = chai.expect;

describe ("General Node Tests :", function() {

    describe("GraphNode:", function(){
        it("Should be able to be constructed", function(){
            let node = new GraphNode();
            expect(node).to.exist;
            node.name().should.equal('anon');
            node.numOfEdges().should.equal(0);
        });

        it("Should be nameable", function(){
            let node = new GraphNode('test');
            node.name().should.equal('test');
        });

        it("Should be able to set edges", function(){
            let node = new GraphNode();
            node.setEdge(1,{ id: 1 }, {}, {id: null});
            node.numOfEdges().should.equal(1);
        });

        it("Should complain on lacking edge data", function(){
            let node = new GraphNode();
            expect(()=>{ node.setEdge(1); }).to.throw(Error);
        });

        it("Should be able to check a node has an edge", function(){
            let node = new GraphNode();
            node.setEdge(1,{id:1},{}, {id:null});
            node.hasEdgeWith(1).should.equal.true;
        });

        it("Should be able to check a node does not have an edge ", function(){
            let node = new GraphNode();
            node.hasEdgeWith(1).should.equal.false;
        });
        
        it("Should be able to check a node based on the node itself, not id", function(){
            let node1 = new GraphNode(),
                node2 = new GraphNode();
            node1.setEdge(node2.id,{id: node2.id}, {}, {id:null});
            node1.hasEdgeWith(node2).should.equal.true;
        });
        
        it("Should be able to get an edge out of a node", function(){
            let node = new GraphNode();
            node.setEdge(1,{id: 1}, {}, {id: null});
            node.numOfEdges().should.equal(1);
            let edge = node.getEdgeTo(1);
            expect(edge).to.exist;
            edge.should.be.an.instanceof(Edge);
        });

        it("Should complain if a retrieved edge doesn't exist", function(){
            let node = new GraphNode();
            expect(()=>{ node.getEdgeTo(1); }).to.throw(Error);
        });

        it("Should be able to get the edge based on node, not id",function(){
            let node1 = new GraphNode(),
                node2 = new GraphNode();
            node1.setEdge(node2.id,{id: node2.id}, {}, {id: null});
            let edge = node1.getEdgeTo(node2);
            expect(edge).to.exist;
            
        });
        
    });

    describe.skip("Action Note:", function(){

    });

    describe.skip("Bookmark Node:", function(){

    });

    describe.skip("Condition Node:", function(){

    });

    describe.skip("Event Node:", function(){

    });

    describe.skip("FSM Node:", function(){

    });

    describe.skip("Institution Node:", function(){

    });

    describe.skip("Rule Node:", function(){

    });

    describe.skip("State Node:", function(){

    });
    
});
