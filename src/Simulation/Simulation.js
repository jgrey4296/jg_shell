if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['lodash'],function(_){

    /**
       A Social Simulation, backed by a shell's data, and a retenet
       @constructor
       @param globalData
       @param maxTurns
     */
    var Simulation = function(shell,maxTurns){
        this.shell = shell;
        //Reset the retenet
        this.shell.clearRete();
        //shortcut to the retenet
        this.reteNet = this.shell.reteNet;
        /** @type {Array.<GraphNode>} */
        this.characterPool = _.values(this.shell.allNodes).filter(d=>d.tags.character!==undefined);
        this.usedCharacterPool = [];
        this.turn = 0;
        this.maxTurns = maxTurns || 10;
        
        //compile the reteNet using the rules in the graph (todo: just the institution)
        this.shell.compileRete();
        //assert starting characters
        this.shell.assertWMEList(this.characterPool);
        //assert other starting facts
        var startingFacts = _.values(this.shell.allNodes).filter(d=>d.tags.fact!==undefined);
        this.shell.assertWMEList(startingFacts);

        /**
           Store instantiatedFSMs
           key:character
           an fsm is instantiated from a token containing appropriate bindings,
           passed into an fsm constructor, along with node references
           value: the fsm
        */
        this.instantiatedFSMs = new Map();
        
    };

    /**
       Step forward in time for the simulation
       @returns {Boolean} True for finished, false for not finished
     */
    Simulation.prototype.step = function(){
        if(this.turn++ >= this.maxTurns) { this.turn--; return true; }

        //Get a Character:
        var currentCharacter = this.getCharacter(),
            //get the actions for the character:
            availableActions = this.getActionsForCharacter(currentCharacter),
            //get one of those potential actions:
            chosenAction = this.chooseAction(availableActions,currentCharacter);

        
        console.log(`Character: ${currentCharacter.name}`);
        if(chosenAction === undefined) { return false; }
        console.log("Chosen Action:",chosenAction);
        
        this.reteNet.scheduleAction(chosenAction);
        this.reteNet.stepTime();
        return false;
    };


    /**
       Return all characters to the available pool.
     */
    Simulation.prototype.resetCharacterPool = function(){
        this.characterPool = this.characterPool.concat(this.usedCharacterPool);
        this.usedCharacterPool = [];
    };

    /**
       Get a character from the character pool
       @returns {GraphNode}
     */
    Simulation.prototype.getCharacter = function(){
        if(this.characterPool.length === 0){
            this.resetCharacterPool();
        }
        var charToUse = _.sample(this.characterPool);
        //remove from the character pool:
        this.usedCharacterPool.push(charToUse);
        this.characterPool = _.reject(this.characterPool,d=>d.id === charToUse.id);
        return charToUse;
    };

    /**
       Get the actions in the retenet's proposed actions with 
       the specified character as an actor
       @param {GraphNode} character
       @returns {Array.<ProposedAction>} proposedActions
     */
    Simulation.prototype.getActionsForCharacter = function(character){
        var actions = _.filter(this.reteNet.proposedActions,function(d){
            try {
                return d.payload.actor === character.id;
            }catch(e){
                return false;
            }
        });
        return actions;
    };

    /**
       Select an action to perform from the input array,
       possibly using any information from the character
       ... maybe include value hierarchy of a relevant institution to?
       @param {Array.<ProposedAction>} actions
       @param {GraphNode} character
       @return {ProposedAction}
     */
    Simulation.prototype.chooseAction = function(actions,character){
        //rank by value preferences?
        return _.sample(actions);
    };
    
    return Simulation;    
});


