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

    //Find by id number?
    Shell.prototype.find = function(id){

    };
    //Make a child
    Shell.prototype.mkChild = null;
    //Make a parent of the current node
    Shell.prototype.mkParent = null;

    Shell.prototype.rm = function(values){
        var cwd = this.getCwd();
        for(var i in values){
            var deletedId = cwd.removeChild(values[i]);
            var deletedNode = this.getNodeById(deletedId);
            //TODO: cleanup parent
        }

    };

    
    /**Add Or change a value of a node
       @method setValue
     */
    Shell.prototype.setValue = function(values){
        while(values.length > 0){
            var name = values.shift();
            var theValue = values.shift();
            var cwd = this.getCwd();
            cwd.setValue(name,theValue);
        }        
    };

    Shell.prototype.loadJson = function(dataArray){
        var largestId = 0;
        for(var i in dataArray){
            var curr = dataArray[i];
            if(curr === null) continue;
            if(largestId < curr.id) largestId = curr.id;
            nextId = curr.id;
            console.log("Creating Node with values:",curr.values);
            var newNode = new Node(curr.name,
                                   curr.values,
                                   curr.parents);
            newNode.children = curr.children;
            this.nodes[newNode.id] = newNode;
        }
        console.log("Largest Id used:",largestId);
        nextId = largestId + 1;
        
    };

    
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
            var newNode = new Node(newNodeName,value,parent.id,parent.name);
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
    var Node = function(name,values,parent,parentName){
        //Members:
        this.id = nextId++;
        this.name = name;
        this.values = {};
        this.children = {};
        this.parents = [];
        //Init:
        if(parent !== undefined){
            if(parent instanceof Array){
                this.parents = parent;
            }else{
                this.parents.push(parent);
                console.log("SEtting parent to:",parent);
                this.children['..'] = parent;
            }
        }else{
            console.log("Node with No Parent");
        }
        //value init:
        if(values instanceof Array){
            while(values.length > 0){
                var name = values.shift();
                var theValue = values.shift();
                if(name && theValue){
                    this.values[name] = theValue;
                }
            }
        }else if(values instanceof Object){
            this.values = values;

        }
    };

    Node.prototype.addChild = function(name,id){
        this.children[name] = id;
    };

    Node.prototype.removeChild = function(name){
        var retid = this.children[name];
        delete this.children[name];
        return retid;
    };
    
    Node.prototype.setValue = function(name,value){
        this.values[name] = value;
    };
    
    Node.prototype.valueArray = function(){
        var outArray = [];
        for(var i in this.values){
            var value = this.values[i];
            outArray.push([i,value]);
        };
        return outArray;
    };

    
    return Shell;
});
