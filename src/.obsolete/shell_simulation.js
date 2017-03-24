import _ from 'lodash';
import { Simulation }  from '../Simulation/Simulation';

let ShellPrototype = {};

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
    if (this.simulation === null || this.simulation === undefined){
        throw new Error("Simulation needs to be initialised");
    }
    console.log("Simulation step:",this.simulation.turn);
    return this.simulation.step();
};
/**
   Run a simulation to end
*/
ShellPrototype.runSimulation = function(){
    let simFinished = false;
    while (!simFinished){
        simFinished = this.stepSimulation();
    }
};


export { ShellPrototype as shellSimulation };

