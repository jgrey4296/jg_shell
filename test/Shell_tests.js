//To be used with mocha --require babel-polyfill --compilers js:babel-register
//Import * as aModule from '../src/aModule';
import * as chai from 'chai';
import { Shell } from '../src/Shell';

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

        it("Should be empty on start");
        it("Should have an initial root node");
        it("Should have no rules")
        it("Should have a default retent");
        it("Should have a cwd of the root node");
        it("Should have nothing in the node stash");
        it("Should have a previous location of the root node");
        it("Should have no previous search results");
        it("Should have no rete output to start");        
    });

    describe.skip("Addition:", function(){

    });

    describe.skip("Deletion:", function(){

    });
    
    describe.skip("Modification:", function(){

    });

    describe.skip("State Change:", function(){

    });
    
    describe.skip("Node Searching:", function(){

    });

    describe.skip("FSM:", function(){

    });

    describe.skip("String Utilities:", function(){

    });

    describe.skip("Graph Search:", function(){

    });

    describe.skip("JSON:", function(){

        describe.skip("Import:", function(){

        });

        describe.skip("Export", function(){

        });
        
    });

    describe.skip("Rete:", function(){

    });

    describe.skip("Simulation", function(){

    });
    
    
});
