if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
    "use strict";
    
    var NormModel = function(){
        this.listOfNorms = [];
    };

    NormModel.prototype.addNorm = function(name){
        this.listOfNorms.push({
            "name" : name,
            "effects" : [],
            "strength" : 0, 
            //contingency rules:
            "conditions" : [],
            //Preferences:
            "populationCount" : 0,
            "populationConformity" : [],//empirical expectations
            "populationExpectation" : [],//normative expectations
            "sanctionInfluences" : [],//norm expectations with sanctions
        });
        
    };

    NormModel.prototype.updateNorm = function(i,conformBool,expectationBool,sanctionBool){
        this.listOfNorms[i].populationCount++;
        this.listOfNorms[i].populationConformity.push(conformBool);
        this.listOfNorms[i].populationExpectation.push(expectationBool);
        this.listOfNorms[i].population.sanctionInfluences.push(sanctionBool);
    };

    NormModel.prototype.calculateNorm = function(i){
        var norm = this.listOfNorms[i];
        if(this.runConditions(norm)){
            //todo: figure out the bayesian form of this
            return this.popConformity(norm) * this.popExpectation(norm) * this.sanctionExpectation(norm);
        }else{
            return 0.0;
        }
    };

    NormModel.prototype.popConformity = function(norm){
        //reduce norm.populationConformity to proportion of positives vs population
    };

    NormModel.prototype.popExpectation = function(norm){
        //reduce norm.populationExpectation to proportion of positives vs population
    };

    NormModel.prototype.sanctionExpectation = function(norm){
        //reduce norm.sanctionExpection to proportion of ... what?
        //todo: figure out whether you should calculate if you'll be sanctioned for doing the behaviour, or NOT doing the behaviour
    };
    
    return NormModel;
});
