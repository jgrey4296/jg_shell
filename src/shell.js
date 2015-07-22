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
        var path = name.split('/');
        var node = this.find(path,name[0] === "/");
        if(node !== undefined){
            this.cwd = node;
        }else{
            console.log("Node: ",name," does not exist");
        }
    }

    Shell.prototype.pwd = function(){
        var path = [];
        var curr = this.cwd;
        while(curr !== undefined){
            if(curr.name !== this.root.name){
                path.push(curr.name);
            }
            curr = curr.children['..'];
        };
        path.reverse();
        var pathString = "/" + path.join("/");
        return pathString;        
    };

    Shell.prototype.ls = function(path){
        var node = undefined;
        if(path.length === 0 || path === undefined){
            node = this.cwd;
        }else{
            node = this.find(path[0].split('/'),path[0] === "/");
        }

        var children = [];
        for(var name in node.children){
            children.push(name);
        }
        return children.join(",");

    };
    
    //--------------------
    /**
       @class Node
       @constructor
    */
    var nextId = 0;
    var Node = function(name,value,parent){
        this.id = nextId++;
        this.name = name;
        this.value = value;
        this.children = {};
        if(parent !== undefined){
            this.children['..'] = parent;
        }else{
            console.log("Node with No Parent");
        }
    };

    Node.prototype.addChild = function(name,value){
        this.children[name] = new Node(name,value,this);
    };
    

    return Shell;
});
