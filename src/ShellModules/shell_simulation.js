if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['lodash','../Simulation'],function(_,Simulation){

    var ShellPrototype = {};

    /**
       Create a simulation
       @param maxTurns
       @method
     */
    ShellPrototype.setupSimulation = function(maxTurns){
        console.groupCollapsed();
        this.simulation = new Simulation(this,maxTurns);
        console.groupEnd();
    };

    /**
       Step a simulation
       @method
       @returns {Boolean} true if sim finished, false otherwise
    */
    ShellPrototype.stepSimulation = function(){
        if(this.simulation === null || this.simulation === undefined){
            throw new Error("Simulation needs to be initialised");
        }
        console.log("Simulation step:",this.simulation.turn);
        return this.simulation.step();
    };
    /**
       Run a simulation to end
     */
    ShellPrototype.runSimulation = function(){
        var simFinished = false;
        while(!simFinished){
            simFinished = this.stepSimulation();
        }
    };


    return ShellPrototype;
});
