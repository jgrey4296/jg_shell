if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','../utils'],function(_,util){
    "use strict";
    /**
     @exports ShellModules/shell_state_change
     */
    var ShellPrototype = {};

    /**
       To move the cwd of the shell to a new location
       @method
       @params target The id (global) or name (local) to move to
    */
    ShellPrototype.cd = function(target){
            this.cdNode(target);
    };

    /**
       To move about normally, dealing with nodes
       @method
       @param target
     */
    ShellPrototype.cdNode = function(target){
        //update where you were previously
        this.previousLocation = this.cwd.id;
        //go up to parent
        if(target === ".."){
            //console.log("cd : ..");
            if(this.cwd._originalParent){
                this.cdNode(this.cwd._originalParent);
            }else{
                //if no original parent defined
                var randomParentKey = _.sample(_.keys(this.cwd.parents));
                if(randomParentKey !== undefined){
                    this.cdNode(randomParentKey);
                }
            }
            return;
        }
        
        //id specified
        if(!isNaN(Number(target)) && this.allNodes[Number(target)]){
            //console.log("cd : ", Number(target));
            this.cwd = this.allNodes[Number(target)];
            return;
        }
        
        //passed a name. convert it to an id
        //console.log("Cd-ing: ",target);
        var nameIdPairs = {};
        var children = this.cwd.children;

        _.keys(children).map(function(d){
            return this.allNodes[d];
        },this).forEach(function(d){
            this[d.name] = d.id;
        },nameIdPairs);//pay attention to the state arg
        
        var parents = this.cwd.parents;
        _.keys(parents).map(function(d){
            return this.allNodes[d];
        },this).forEach(function(d){
            this[d.name] = d.id;
        },nameIdPairs);//state arg

        //console.log("Available keys:",_.keys(nameIdPairs));
        //if you can find the target to move to:
        if(nameIdPairs[target]){
            this.cd(nameIdPairs[target]);
        }else{
            //cant find the target, complain
            throw new Error("Unrecognised cd form");
        }
    };

    /**
       Add the cwd to the temporary stash for reference
       @method
     */
    ShellPrototype.stash = function(){
        this._nodeStash.push(this.cwd);
    };

    /**
       Move to, and remove, the top element from the stash stack
       @method
    */
    ShellPrototype.unstash = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash.pop().id);
        }
    };

    /**
       To move to the top element of the stash stack, without removing it
        @method
     */
    ShellPrototype.top = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash[this._nodeStash.length - 1].id);
        }
    };
    

    return ShellPrototype;
});
