//To be used with mocha --require babel-polyfill --compilers js:babel-register
//Import * as aModule from '../src/aModule';
import * as chai from 'chai';
import _ from 'lodash';
import { GraphNode} from '../src/Node/GraphNode';

let should = chai.should(),
    expect = chai.expect;

describe ("GraphNode", function() {
    it("exists", function() {
        let aNode = new GraphNode();
        should.exist(aNode);
        aNode.should.have.property('id').equals(0);
    });

    it("Should be creatable from an overridden id",function(){
        let anotherNode = new GraphNode('blah',0,15),
            postNode = new GraphNode('bloo');
        anotherNode.id.should.equal(15);
        postNode.id.should.equal(16);            
    });
    
    it("should be convertable to json",function(){
        let aNode = new GraphNode('test'),
            converted = aNode.toJSONCompatibleObj();
        expect(converted).to.exist;
        converted.should.have.property('id');
        converted.should.have.property('parent');
        converted.id.should.equal(aNode.id);
    });

    it("Should be able to create edges",function(){
        let aNode = new GraphNode('test');
        aNode.setEdge(5,{ id: 5 }, {}, { id: null });
        aNode.hasEdgeWith(5).should.be.true;
    });

    it("Should be able to remove edges",function(){
        let aNode = new GraphNode('test');
        aNode.setEdge(5, {id : 5 }, {}, { id: null });
        aNode.hasEdgeWith(5).should.be.true;
        aNode.removeEdge(5);
        aNode.hasEdgeWith(5).should.be.false;
    });

    it("Should be able to set values",function(){
        let aNode = new GraphNode('test');
        aNode.setValue('blah',5);
        aNode.getValue('blah').should.equal(5);
        aNode.setValue('blah',10);
        aNode.getValue('blah').should.equal(10);
        aNode.setValue('bloo','something');
        let values = aNode.values();
        values.should.deep.equal([['name','test'],
                                  ['_parentId',aNode.id],
                                  ['blah',10],
                                  ['bloo','something']]);
                                  
        
    });

    it("Should be able to set tags",function(){
        let aNode = new GraphNode('test');
        aNode.hasTag('blah').should.be.false;
        aNode.tagToggle('blah');
        aNode.hasTag('blah').should.be.true;
        aNode.tagToggle('blah');
        aNode.hasTag('blah').should.be.false;
    });
    
    it("Should be retrievable from json",function(){
        let aNode = new GraphNode('test');
        aNode.tagToggle('blah').tagToggle('bloo');
        aNode.setValue('aTest',5).setValue('another',"awef");
        aNode.setEdge(5,{id: 5}, {}, {id: null});
        aNode.setEdge(10,{id: null}, {}, {id: 10});
        let objDesc = aNode.toJSONCompatibleObj(),
            objString = JSON.stringify(objDesc),
            convertedBack = GraphNode.fromJSON(JSON.parse(objString));
        expect(convertedBack).to.exist;
        convertedBack.should.be.an.instanceof(GraphNode);
        convertedBack.id.should.equal(aNode.id);
        convertedBack.name().should.equal(aNode.name());
        _.isEqual(convertedBack._edges,aNode._edges).should.be.true;
        _.isEqual(convertedBack._values,aNode._values).should.be.true;
        _.isEqual(convertedBack._tags,aNode._tags).should.be.true;
    });

    
});
