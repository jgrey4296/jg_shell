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
        let pairs = _.pairs(this.cwd.linkedNodes);
        //go up to parent
        if(target === ".."){
            //console.log("cd : ..");
            let parent = _.find(pairs,d=>/_originalParent/.test(d[1])) || _.find(pairs,d=>/parent/.test(d[1])); 
            if(parent){
                this.cdNode(parent[0]);
                return;
            }
        }
        
        //id specified
        if(!isNaN(Number(target)) && this.allNodes[Number(target)]){
            this.cwd = this.allNodes[Number(target)];
            return;
        }
        
        //passed a name. convert it to an id
        //console.log("Cd-ing: ",target);
        let ids = _.keys(this.cwd.linkedNodes),
            names = ids.map(d=>this.getNode(d).name),
            nameIdPairs = _.zip(names,ids).reduce(function(m,v){
                m[v[0]] = v[1];
                return m;
            },{});
            
        //if you can find the target to move to:
        if(nameIdPairs[target] !== undefined){
            this.cd(nameIdPairs[target]);
        }else{
            //cant find the target, complain
            console.log("Name Id Pairs:",nameIdPairs);
            throw new Error("Unrecognised cd form: " + target);
        }
    };

    /**
       Add the cwd to the temporary stash for reference
       @method
     */
    ShellPrototype.stash = function(id){
        this._nodeStash.push(id || this.cwd);
    };

    /**
       Move to, and remove, the top element from the stash stack
       @method
    */
    ShellPrototype.unstash = function(id){
        if(id !== undefined){
            let index = this._nodeStash.indexOf(id),
                val = this._nodeStash[index];
            if(index > -1){
                this._nodeStash.splice(index,1);
                this.cd(val);
            }
        }else{
            if(this._nodeStash.length > 0){
                this.cd(this._nodeStash.pop().id);
            }
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
