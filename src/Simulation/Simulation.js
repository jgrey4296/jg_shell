define(['underscore'],function(_){

    /**
       A Social Simulation, backed by a shell's data, and a retenet
       @constructor
       @param globalData
       @param maxTurns
     */
    var Simulation = function(globalData,maxTurns){
        this.shell = globalData.shell;
        this.reteNet = this.shell.reteNet;
        /** @type {Array.<GraphNode>} */
        this.characterPool = _.values(globalData.shell.allNodes.filter(d=>d.tags.character!==undefined));
        this.usedCharacterPool = [];
        this.turn = 0;
        this.maxTurns = maxTurns;
        
        //compile the reteNet using the rules in the institution
        this.shell.compileRete();
        //assert starting characters
        this.shell.assertWMEList(characterPool);
        //todo: assert other starting facts

        //todo: possible register output actions and have a simulation log?
        
    };

    /**
       Step forward in time for the simulation
       @returns {Boolean} True for finished, false for not finished
     */
    Simulation.prototype.step = function(){
        if(this.turn++ > this.maxTurns) { return true; }

        //Get a Character:
        var currentCharacter = this.getCharacter(),
            //get the actions for the character:
            availableActions = this.getActionsForCharacter(currentCharacter),
            //get one of those potential actions:
            chosenAction = this.chooseAction(actions,character);


        if(chosenAction === undefined) { return false; }
        
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
        this.characterPool = this.characterPool.reject(d=>d.id === charToUse.id);
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
