/** A Shell simulation
   @module shell

   make nodes (of: Rules, objects, actions, concepts, institutions)
   

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
        var rootNode = new Node("__root");
        this.root = rootNode.id;
        this.cwd = rootNode.id;
        //Store nodes in an array by id number:
        this.nodes = [];
        this.nodes[rootNode.id] = rootNode;
    };

    Shell.prototype.find = null;
    Shell.prototype.mkChild = null;
    Shell.prototype.mkParent = null;
    Shell.prototype.setValue = null;


    Shell.prototype.getNodeById = function(id){
        if(this.nodes[id]){
            return this.nodes[id];
        }else{
            return null;
        }
    };

    Shell.prototype.getRoot = function(){
        return this.getNodeById(this.root);
    };

    Shell.prototype.getCwd = function(){
        return this.getNodeById(this.cwd);
    };
    
    /** find a given node, of a/b, b, or /a/b
       @method find
       @return Node or Undefined
     */
    Shell.prototype.find = function(path,fromRoot){
        var foundNode = null;
        var curr = fromRoot ? this.getRoot() : this.getCwd();
        if(path[0] === ""){
            path.shift();
        }
        while(path.length > 0){
            if(curr === null) break;
            curr = this.getNodeById(curr.children[path.shift()]);
        }
        return curr;
    }
    
    Shell.prototype.mkdir = function(name,value){
        console.log("Making Dir: ",name,value);
        var path = name.split('/');
        var newNodeName = path.pop()
        var parent = this.find(path,name[0] === "/");
        if(parent !== null){
            var newNode = new Node(name,value,parent.id,parent.name);
            parent.addChild(newNode.name,newNode.id);
            this.nodes[newNode.id] = newNode;
        }
    };

    Shell.prototype.connectParent = function(name){
        //First find the parent

        //if it doesnt exist make it

        //add it to the parent list of the cwd

    };
    
    Shell.prototype.changeDir = function(name){
        var path = name.split('/');
        var node = this.find(path,name[0] === "/");
        if(node !== null){
            this.cwd = node.id;
        }else{
            console.log("Node: ",name," does not exist");
        }
    }

    Shell.prototype.pwd = function(){
        var path = [];
        var curr = this.getCwd();
        while(curr !== null){
            if(curr.name !== this.getRoot().name){
                path.push(curr.name);
            }
            curr = this.getNodeById(curr.children['..']);
        };
        path.reverse();
        var pathString = "/" + path.join("/");
        return pathString;        
    };

    Shell.prototype.ls = function(path){
        var node = null;
        if(path.length === 0 || path === undefined){
            node = this.getCwd();
        }else{
            node = this.find(path[0].split('/'),path[0] === "/");
        }
        if(node === null) return "null node";
        
        var children = [];
        for(var name in node.children){
            children.push(name);
        }
        return children.join(",");

    };

    //return {node,parent,children}
    Shell.prototype.getContext = function(){
        var retObject = {
            node: this.getCwd(),
            parents: [],
            children: [],
        };
        for(var i in retObject.node.children){
            if(i === ".."){
                var newChild = this.getNodeById(retObject.node.children[i]);
                retObject.parents.push(newChild);
            }else{
                var newChild = this.getNodeById(retObject.node.children[i]);
                retObject.children.push(newChild);
            }
        }
        
        return retObject;
    };
    
    //--------------------
    /**
       @class Node
       @constructor
    */
    var nextId = 0;
    var Node = function(name,value,parent,parentName){
        this.id = nextId++;
        this.name = name;
        this.value = value;
        this.children = {};
        this.parents = [];
        if(parent !== undefined){
            this.parents.push(parent);
            console.log("SEtting parent to:",parent);
            this.children['..'] = parent;
        }else{
            console.log("Node with No Parent");
        }
    };

    Node.prototype.addChild = function(name,id){
        this.children[name] = id;
    };
    

    return Shell;
});
