/** A Shell simulation
   @module shell
*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){

    var Shell = function(){
        this.root = new Node("__root");
        this.cwd = this.root;        
    };

    Shell.prototype.mkdir = function(name,value){
        this.cwd.addChild(name,value);
    };

    Shell.prototype.changeDir = function(name){
        if(this.cwd.children[name] !== undefined){
            this.cwd = this.cwd.children[name];
        }
    }

    Shell.prototype.pwd = function(){
        console.log("Cwd:");
        console.log("Value: ",this.cwd.value);
        console.log("Children: ");
        for(var child in this.cwd.children){
            console.log(child);
        }
    };

    //--------------------
    var Node = function(value,parent){
        this.value = value;
        this.children = {};
        if(parent !== undefined){
            this.children['..'] = parent;
        }else{
            console.log("Node with No Parent");
        }
    };

    Node.prototype.addChild = function(name,value){
        this.children[name] = new Node(value,this);
    };
    

    return Shell;
});
