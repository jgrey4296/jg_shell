/** A Shell simulation
   @module shell

   make nodes (of: Rules, objects, actions, concepts, institutions)
   

*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){
    //Id for the nodes
    var nextId = 0;
    
    /**
       @class Shell
       @constructor
     */
    var Shell = function(){
        nextId = 0;
        var rootNode = new Node("__root");
        this.root = rootNode.id;
        this.cwd = rootNode.id;
        //Store nodes in an array by id number:
        this.nodes = [];
        this.nodes[rootNode.id] = rootNode;

        //Internal node ctor access:
        this.__Node = Node;
    };

    //Find by id number?
    Shell.prototype.find = function(id){
        if(this.nodes[id]) return this.nodes[id];
        return null;
    };

    Shell.prototype.rm = function(values){
        var cwd = this.getCwd();
        if(!(values instanceof Array)){
            values = [values];
        }
        for(var i in values){
            var deletedId = cwd.removeChild(values[i]);
            var deletedNode = this.getNodeById(deletedId);

            if(deletedNode === null) continue;
            var nodesParents = this.getNodesByIds(deletedNode.parents);
            nodesParents.map(function(a){
                a.removeChild(values[i]);
            });

            this.getNodesByIds(deletedNode.children).map(function(a){
                a.removeParent(values[i],true);
            });
            
        }
        return this;
    };

    
    /**Add, change or remove a value of a node
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

    Shell.prototype.getNodesByIds = function(theIds){
        var outputNodes = [];
        var foundIds = [];
        if((theIds instanceof Array)){
            for(var i in theIds){
                if(foundIds.indexOf(theIds[i]) < 0){
                    outputNodes.push(this.getNodeById(theIds[i]));
                    foundIds.push(theIds[i]);
                }
            }
        }else if( theIds instanceof Object){
            foundIds = [];
            for(var i in theIds){
                if(foundIds.indexOf(theIds[i])){
                    outputNodes.push(this.getNodeById(theIds[i]));
                    foundIds.push(theIds[i]);
                }
            }
        }
        return outputNodes;
    };
    
    Shell.prototype.rename = function(values){
        var cwdNode = this.getCwd();
        if(typeof values === 'string'){
            values = values.replace(/ /g,"_");
        }
        if(values instanceof Array){
            values = values.join("_");
        }
        var oldName = cwdNode.name;
        cwdNode.name = values;//values.join("_");
        
        //update the parents:
        var parents = this.getNodesByIds(cwdNode.parents);
        for(var i in parents){
            var parent = parents[i];
            delete parent.children[oldName]
            parent.children[cwdNode.name] = cwdNode.id;
        }

        //update the children:
        var childrens = this.getNodesByIds(cwdNode.children);
        for(var i in childrens){
            var child = childrens[i];
            delete child.parents[oldName]
            child.parents[cwdNode.name] = cwdNode.id;
        }
        
        return this;
    };

    Shell.prototype.goto = function(values){
        var node = this.getNodeById(values[0]);
        if(node !== null){
            this.cwd = node.id;
        }
    };
    
    Shell.prototype.loadJson = function(dataArray){
        var largestId = 0;
        for(var i in dataArray){
            var curr = dataArray[i];
            if(curr === null) continue;
            if(largestId < curr.id) largestId = curr.id;
            nextId = curr.id;
            //console.log("Creating Node with values:",curr.values);
            var newNode = new Node(curr.name,
                                   curr.values,
                                   curr.parents);
            newNode.children = curr.children;
            this.nodes[newNode.id] = newNode;
        }
        //console.log("Largest Id used:",largestId);
        this.cwd = largestId;
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

    
    Shell.prototype.addChild = function(path,value){
        //console.log("Making Dir: ",path,value);
        var parent = path[0] === "/" ? this.getRoot() : this.getCwd();
        path = path.split("/");
        if(path[0] === "") path.shift();

        while(path.length > 0){
            var newNode = null;
            var newName = path.shift();
            if(newName === "") break;
            newNode = new Node(newName,value,parent.id,parent.name);
            parent.addChild(newNode.name,newNode.id);
            this.nodes[newNode.id] = newNode;
            parent = newNode;
        }
        return this;
    };

    Shell.prototype.addParent = function(name,value){
        var theCwd = this.getCwd();

        var newNode = new Node(name,value);
        theCwd.addParent(newNode.name,newNode.id);
        newNode.addChild(theCwd.name,theCwd.id);
        this.nodes[newNode.id] = newNode;
        return this;
    };

    Shell.prototype.addMove = function(path,value){
        this.addChild(path,value);
        this.moveTo(path);
        return this;
    },
    
    //Move from the cwd to the node specified by the name:
    Shell.prototype.moveTo = function(path){
        //console.log("Moving to:",path);
        if(path === undefined) throw new Error("path is undefined");
        var curr = path[0] === "/" ? this.getRoot(): this.getCwd();
        if(typeof path === 'number'){
            curr = this.getNodeById(path);
            
        }else if(typeof path === 'string'){
            var path = path.split('/');
            if(path[0]=== "") path.shift();
            while(path.length > 0 && curr !== undefined && curr !== null){
                //console.log("Moving to: ",curr.name);
                var nextLoc = path.shift();
                if(curr.children[nextLoc]){
                    curr = this.getNodeById(curr.children[nextLoc]);
                }else{
                    curr = this.getNodeById(curr.parents[nextLoc]);
                }
            }
        }            
        if(curr !== null){
            //console.log("Moving to:",curr.name);
            this.cwd = curr.id;
        }else{
            console.log("Node: ",path," does not exist");
        }
        return this;
    }

    Shell.prototype.moveToRoot = function(){
        this.cwd = this.root;
        return this;
    },
    
    Shell.prototype.pwd = function(){
        var path = [];
        var curr = this.getCwd();
        while(curr !== null){
            //console.log("Curr:",curr.name);
            if(curr.name !== this.getRoot().name){
                path.push(curr.name);
            }
            curr = this.getNodeById(curr.parents['..']);
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
            node = this.findByPath(path[0].split('/'),path[0] === "/");
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

        retObject.parents = this.getNodesByIds(retObject.node.parents);
        retObject.children = this.getNodesByIds(retObject.node.children)
        
        return retObject;
    };
    
    //--------------------
    /**
       @class Node
       @constructor
    */

    var Node = function(name,values,parent,parentName){
        //Members:
        this.id = nextId++;
        this.name = name;
        this.values = {};
        this.children = {};
        this.parents = {};
        //Init:
        if(parent !== undefined){
            if(parent instanceof Array){
                while(parent.length > 0){
                    var name = parent.shift();
                    var number = parent.shift();
                    this.parents[name] = number;
                    this.parents['..'] = number;
                }
            }else if(typeof parent === 'number'
                    && parentName){
                this.parents['..'] = parent;
                this.parents[parentName] = parent;
            }else{
                this.parents = parent;
                //console.log("SEtting parent to:",parent);
            }
        }else{
            //console.log("Node with No Parent");
        }
        //value init:
        if(values && values instanceof Array){
            while(values.length > 0){
                var name = values.shift();
                var theValue = values.shift();
                if(theValue === undefined) theValue = null;
                this.values[name] = theValue;
                
            }
        }else if(values && values instanceof Object){
            this.values = values;
        }
    };

    Node.prototype.addChild = function(name,id){
        if(typeof id !== 'number'){
            throw new Error("Children should be specified by number");
        }
        this.children[name] = id;
    };
    
    Node.prototype.removeChild = function(name,lookup){
        var retid = null;
        var target = lookup ? this.parents : this.children;
        if(typeof name === 'number'){
            retid = name;
            var index = values(target).indexof(retid);
            if(index > 0){
                delete target[keys(target)[retid]];
            }
        }else{
            var retid = target[name];
            delete target[name];
        }
        return retid;
    };

    Node.prototype.addParent = function(name,id){
        if(typeof id !== 'number'){
            throw new Error("Parent should be specified by number");
        }
        this.parents[name] = id;
    };

    Node.prototype.removeParent = function(name){
        var retid = this.children[name];
        delete this.children[name];
        return retid;
    };
    
    Node.prototype.setValue = function(name,value){
        if(value === undefined || value === null){
            delete this.values[name];
        }else{
            this.values[name] = value;
        }
    };
    
    Node.prototype.valueArray = function(){
        var outArray = [];
        for(var i in this.values){
            var value = this.values[i];
            outArray.push([i,value]);
        };
        return outArray;
    };

    Node.prototype.equals = function(aNode){
        if(this.id === aNode.id) return true;
        return false;
    };
    
    
    return Shell;
});
