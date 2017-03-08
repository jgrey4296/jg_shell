//To be used with mocha --require babel-polyfill --compilers js:babel-register
//Import * as aModule from '../src/aModule';
import * as chai from 'chai';
import { GraphNode} from '../src/Node/GraphNode';

let should = chai.should();

describe ("GraphNode", function() {
    it("exists", function() {
        let aNode = new GraphNode();
        should.exist(aNode);
        aNode.should.have.property('id').equals(0);
        aNode.should.have.property('_name').equals('anon');
    });
    
});
