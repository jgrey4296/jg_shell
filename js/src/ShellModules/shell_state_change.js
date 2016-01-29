define(['underscore','../utils'],function(_,util){

    var ShellPrototype = {};

        /**
       @class CompleteShell
       @method cd
       @purpose to move the cwd of the shell to a new location
       @params target The id (global) or name (local) to move to
    */
    ShellPrototype.cd = function(target){
            this.cdNode(target);
    };

    /**
       @class CompleteShell
       @method cdNode
       @utility
       @purpose to move about normally, dealing with nodes
       @param target
     */
    ShellPrototype.cdNode = function(target){
        //update where you were previously
        this.previousLocation = this.cwd.id;
        //go up to parent
        if(target === ".."){
            console.log("cd : ..");
            if(this.cwd._originalParent){
                this.cdNode(this.cwd._originalParent);
            }else{
                //if no original parent defined
                var randomParentKey = util.randomChoice(_.keys(this.cwd.parents));
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
       @class CompleteShell
       @method stash
       @purpose add the cwd to the temporary stash for reference
     */
    ShellPrototype.stash = function(){
        this._nodeStash.push(this.cwd);
    };

    /**
       @class CompleteShell
       @method unstash
       @purpose move to, and remove, the top element from the stash stack
    */
    ShellPrototype.unstash = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash.pop().id);
        }
    };

    /**
       @class CompleteShell
       @method top
       @purpose To move to the top element of the stash stack, without removing it
     */
    ShellPrototype.top = function(){
        if(this._nodeStash.length > 0){
            this.cd(this._nodeStash[this._nodeStash.length - 1].id);
        }
    };
    

    return ShellPrototype;
});
