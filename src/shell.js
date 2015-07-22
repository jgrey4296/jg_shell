/** A Shell simulation
   @module shell
*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){

    /**
       @class Shell
       @constructor
     */
    var Shell = function(){
        this.root = new Node("__root");
        this.cwd = this.root;        
    };

    /** find a given node, of a/b, b, or /a/b
       @method find
       @return Node or Undefined
     */
    Shell.prototype.find = function(path,fromRoot){
        var foundNode = null;
        var curr = fromRoot ? this.root : this.cwd;
        while(path[0] === ""){
            path.shift();
        }
        while(path.length > 0){
            if(curr === undefined) break;
            curr = curr.children[path.shift()];
        }
        return curr;
    }
    
    Shell.prototype.mkdir = function(name,value){
        console.log("Making Dir: ",name,value);
        var path = name.split('/');
        var newNodeName = path.pop()
        var parent = this.find(path,name[0] === "/");
        if(parent !== undefined){
            parent.addChild(newNodeName,value);
        }
    };

    Shell.prototype.changeDir = function(name){
        console.log("Change Dir: ", name);
        var path = name.split('/');
        var node = this.find(path,name[0] === "/");
        if(node !== undefined){
            this.cwd = node;
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

    Shell.prototype.ls = function(path){
        var node = undefined;
        if(path.length === 0 || path === undefined){
            node = this.cwd;
        }else{
            console.log(path);
            node = this.find(path[0].split('/'),path[0] === "/");
        }
        for(var child in node.children){
            console.log(child);
        }
        
    };
    
    //--------------------
    /**
       @class Node
       @constructor
     */
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
