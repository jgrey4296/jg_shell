/** A Shell simulation
    @module shell

    make nodes (of: Rules, objects, actions, concepts, institutions)
    

*/

if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore'],function(_){
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

        //temp nodes
        //accessed by name
        this.tempNodes = {};
        
        //Internal node ctor access:
        this.__Node = Node;
    };

    /**Find a node by its id number
       @method
       @param id The numeric id of the node to find       
       @return the node, or null
    */
    Shell.prototype.find = function(id){
        if(this.nodes[id]) return this.nodes[id];
        return null;
    };
    
    /**Remove a node
       @method
       @param values an array of numeric ids or words
       @return Shell
    */
    Shell.prototype.rm = function(values){
        var cwd = this.getCwd();
        if(!(values instanceof Array)){
            values = [values];
        }
        //for each value to be deleted
        for(var i in values){
            var value = values[i];
            console.log("rm: ",value);
            var deletedNode = null;
            if(isNaN(Number(value))){
                //console.log("original");
                var deletedId = cwd.removeChild(values[i]);
                deletedNode = this.getNodeById(deletedId);
            }else{
                //console.log("new",Number(value));
                deletedNode = this.getNodeById(Number(value));
            }
            if(deletedNode === null) continue;
            //delete the node from the cwd
            var theCwd = this.getCwd();
            theCwd.removeChild(values[i]);
            deletedNode.removeParent(theCwd.id);            

            //Delete the node from every parent,
            // var nodesParents = this.getNodesByIds(deletedNode.parents);
            // console.log("nodes parents",nodesParents);
            // nodesParents.map(function(a){
            //     console.log("Removing from parent:",a);
            //     a.removeChild(values[i]);
            //     deletedNode.removeParent(a.id);
            // });

        }
        return this;
    };

    
    /**Add, change or remove a value of a node
       @method setValue
       @param values an array of pairs
       @return shell
    */
    Shell.prototype.setValue = function(values){
        while(values.length > 0){
            var name = values.shift();
            var theValue = values.shift();
            var cwd = this.getCwd();
            cwd.setValue(name,theValue);
        }
        return this;
    };

    
    /**Add, change or remove a note of a node
       @method setNote
       @param notes an array of pairs
       @return shell
    */
    Shell.prototype.setNote = function(notes){
        var name = notes.shift();
        var theNote;
        if(notes.length > 0){
            theNote = notes.join(" ");
        }
        var cwd = this.getCwd();
        cwd.setNote(name,theNote);
        return this;
    };
    
    

    /**Get nodes from the shell by their numeric ids
       @method getNodesByIds
       @param theIds array of numeric ids to find
       @return array of (possibly empty) nodes
    */
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
            for(var j in theIds){
                if(foundIds.indexOf(theIds[j])){
                    outputNodes.push(this.getNodeById(theIds[j]));
                    foundIds.push(theIds[j]);
                }
            }
        }
        return outputNodes;
    };

    /**Rename a node, updating parents and children
       @method rename
       @param values the new name
       @return shell
    */
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
            delete parent.children[oldName];
            parent.children[cwdNode.name] = cwdNode.id;
        }

        //update the children:
        var childrens = this.getNodesByIds(cwdNode.children);
        for(var j in childrens){
            var child = childrens[j];
            delete child.parents[oldName];
            child.parents[cwdNode.name] = cwdNode.id;
        }
        
        return this;
    };
    
    /**Take in an object, and load it
       @method loadJson
       @param dataArray simple array to convert to nodes
       @return shell
    */
    Shell.prototype.loadJson = function(dataArray){
        var largestId = 0;
        for(var i in dataArray){
            var curr = dataArray[i];
            if(curr === null) continue;
            if(largestId < curr.id) largestId = curr.id;
            if(isNaN(Number(curr.id))){
                console.log("NaN:",curr);
            }else{
                nextId = Number(curr.id);
            }
            //console.log("Creating Node with values:",curr.values);
            var newNode = new Node(curr.name,
                                   curr.values,
                                   curr.parents);
            newNode.children = curr.children;
            newNode.notes = curr.notes;
            this.nodes[newNode.id] = newNode;
        }
        //console.log("Largest Id used:",largestId);
        this.cwd = largestId;
        nextId = largestId + 1;
        return this;
    };

    /**Get a single node by its numeric id
       @method getNodeById
       @param id the numeric id
       @return the node or null
    */
    Shell.prototype.getNodeById = function(id){
        if(this.nodes[id]){
            return this.nodes[id];
        }else{
            return null;
        }
    };

    /**Get the root node of the shell
       @method getRoot
       @return node
    */
    Shell.prototype.getRoot = function(){
        return this.getNodeById(this.root);
    };

    /**Get the current working directory of the shell
       @method getCwd
       @return node
    */
    Shell.prototype.getCwd = function(){
        return this.getNodeById(this.cwd);
    };
    
    /** Add a child to the given path
        @method addChild
        @param path creates all needed subdirs
        @param value
        @return Node or Undefined
    */
    Shell.prototype.addChild = function(path,value){
        if(path.length === 0) return this;
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

    /**Add a parent to the current node, with the assigned value
       @method addParent
       @param name The name of the new parent
       @param value the value of the new parent
       @return shell
    */
    Shell.prototype.addParent = function(name,value){
        var theCwd = this.getCwd();

        var newNode = new Node(name,value);
        theCwd.addParent(newNode.name,newNode.id);
        newNode.addChild(theCwd.name,theCwd.id);
        this.nodes[newNode.id] = newNode;
        return this;
    };

    /**Use an existing node as a child or parent of the cwd
       @method link
       @param direction as a Child or a Parent
       @param id The numeric ID of the node to link with
       @return shell instance
    */
    Shell.prototype.link = function(direction,id){
        //First, find the node:
        var node = this.find(id);
        //then add it to the correct object of cwd
        if(node){
            if(direction === "child"){
                this.getCwd().addChild(node.name,node.id);
            }
            if(direction === "parent"){
                this.getCwd().addParent(node.name,node.id);
            }
        }
        return this;
    };
    
    
    /**Utility method to add a node and move to that new node
       @method addMove
       @param path the path to create
       @param value the value of the node to create
       @return shell
    */
    Shell.prototype.addMove = function(path,value){
        this.addChild(path,value);
        this.moveTo(path);
        return this;
    };
    
    /**Move directly to a particular path
       @method moveTo
       @param path the path to move to
       @return shell
    */
    Shell.prototype.moveTo = function(path){
        if(path === undefined) throw new Error("path is undefined");
        var curr = path[0] === "/" ? this.getRoot(): this.getCwd();
        //console.log("path:",Number(path));
        if(!isNaN(Number(path))){
            //console.log("number");
            curr = this.getNodeById(Number(path));
        }else{
            //console.log("other option");
            path = path.split('/');
            if(path[0]=== "") path.shift();
            while(path.length > 0 && curr !== undefined && curr !== null){
                //console.log("Moving to: ",curr.name);
                var nextLoc = path.shift();
                if(nextLoc === "..") {
                    curr = this.getNodeById(curr._originalParent);
                    console.log(curr);
                }else if(curr.children[nextLoc]){
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
    };

    /**Utility method to move directly to the root
       @method moveToRoot
       @return shell
    */
    Shell.prototype.moveToRoot = function(){
        this.cwd = this.root;
        return this;
    };

    /**Get a string describing the current path
       @method pwd
       @return string describes the path
    */
    Shell.prototype.pwd = function(){
        var path = [];
        var curr = this.getCwd();
        while(curr !== null){
            //console.log("Curr:",curr.name);
            if(curr.name !== this.getRoot().name){
                path.push(curr.name);
            }
            curr = this.getNodeById(_.values(curr.parents)[0]);
        }
        path.reverse();
        var pathString = "/" + path.join("/");
        return pathString;        
    };

    /**List the children of the current node or path
       @method ls
       @param path
       @return string of children
    */
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

    /**Utility method to get a simple object that describes
       a node, its parents, and children, for visualisation
       @method getContext
       @return object{node,parents,children} of cwd
    */
    //return {node,parent,children}
    Shell.prototype.getContext = function(){
        var retObject = {
            node: this.getCwd(),
            parents: [],
            children: [],
        };

        retObject.parents = this.getNodesByIds(retObject.node.parents);
        retObject.children = this.getNodesByIds(retObject.node.children);
        
        return retObject;
    };

    /**Search for all nodes that match a pattern
       @method search
       @param pattern
       @return list of nodes
    */
    Shell.prototype.search = function(list,priorSearch){
        var returnList = [];
        var startingPoint = this.nodes;
        if(priorSearch) startingPoint = priorSearch;

        console.log("startingPoint",startingPoint);
        //Look for a field, a key, and a value
        var field = list.shift();
        console.log("Field",field);
        var key = list.shift();
        console.log("Key",key);
        var valueStringPattern = list.shift();
        console.log("RegExp2: ",valueStringPattern);

        //filter by field
        returnList = _.filter(startingPoint,function(d){
            if(d[field]) return true;
            return false;
        });
        console.log("FieldList:",returnList);
        if(key === undefined) return returnList;

        console.log("Key is:",key);
        if(field === "name" || field === "id"){
            console.log("Searching for a name or id");
            //for the singular valued fields
            //use key as a regex
            var keyPattern = new RegExp(key);
            returnList = _.filter(returnList,function(d){
                if(keyPattern.test(d[field])) return true;
                return false;
            });
            //Return what was found:
            return returnList;            
        }else{
            //filter opposite if looking for empty values
            if(key === "-"){
                console.log("Filtering by length");
                returnList = _.filter(returnList,function(d){
                    if(_.keys(d[field]).length === 0) return true;
                    return false;
                });
                return returnList;
            }
            if(valueStringPattern === "-"){
                returnList = _.filter(returnList,function(d){
                    if(d[field][key]) return false;
                    return true;
                });
                return returnList;
            }

            //for the dictionary fields
            //filter by key and value
            returnList = _.filter(returnList,function(d){
                if(d[field][key]) return true;
                return false;
            });
            console.log("Key List:",returnList);
            if(valueStringPattern === undefined) return returnList;
            var pattern = new RegExp(valueStringPattern);
            //filter by value regexp
            returnList = _.filter(returnList,function(d){
                return pattern.test(d[field][key]);
            });
            console.log("Value List:",returnList);
            
            return returnList;
        }
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
        //TODO: use this
        this.notes = {};
        this.children = {};
        this.parents = {};
        //Init:
        if(parent !== undefined){
            if(parent instanceof Array){
                while(parent.length > 0){
                    var pname = parent.shift();
                    var pnumber = parent.shift();
                    this.parents[pname] = pnumber;
                    this._originalParent = pnumber;
                }
            }else if(!isNaN(Number(parent)) && parentName){
                this._originalParent = parent;
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
                var vname = values.shift();
                var theValue = values.shift();
                if(theValue === undefined) theValue = null;
                this.values[vname] = theValue;
                
            }
        }else if(values && values instanceof Object){
            this.values = values;
        }
    };

    /**Add a child of NAME, with numeric ID to the node
       @method addChild
       @param name
       @param id the numeric id
       @return Node The current node, parent to the node just added
    */
    Node.prototype.addChild = function(name,id){
        if(isNaN(Number(id))){
            throw new Error("Children should be specified by number");
        }
        this.children[name] = id;
        return this;
    };

    /**Remove a node from a Node. 
       @method removeChild
       @param name the name of the node to remove
       @param lookup Remove from parents or children list
    */
    Node.prototype.removeChild = function(name){
        console.log("Removing Child:",name);
        var retid = null;
        var target = this.children;
        if(!isNaN(Number(name))){
            console.log("is a number");
            retid = Number(name);
            var index = _.invert(target)[retid];
            if(index !== undefined){
                delete this.children[index];
            }
        }else{
            retid = target[name];
            delete this.children[name];
        }
        return retid;
    };

    /**Add a node as a parent to this node
       @method addParent
       @param name
       @param id the numeric id
       @return Node The child of the node just added.
    */
    Node.prototype.addParent = function(name,id){
        if(isNaN(Number(id))){
            throw new Error("Parent should be specified by number");
        }
        this.parents[name] = id;
        return this;
    };

    /**Remove a parent from the node
       @method removeParent
       @param name
       @return ID the numeric id of the node removed
    */
    Node.prototype.removeParent = function(name){
        console.log("removing parent:",name);
        var retid = null;
        var target = this.parents;
        if(!isNaN(Number(name))){
            retid = Number(name);
            var nameIndex = _.invert(target)[retid];
            //console.log("removing:",nameIndex);
            if(nameIndex !== undefined){
                //console.log("now removing",nameIndex);
                delete this.parents[nameIndex];
                //console.log("removed:",nameIndex,this.parents[nameIndex],this);
            }
        }else{
            retid = target[name];
            delete this.parents[name];
        }
        return retid;
    };

    /**Set or clear a value from the internal values of a node
       @method setValue
       @param name the value name to modify
       @param value the value to set it to. if null or undefined, remove the value from the node
    */
    Node.prototype.setValue = function(name,value){
        if(value === undefined || value === null){
            delete this.values[name];
        }else{
            this.values[name] = value;
        }
    };

    /**Get an array of all the name:value tuples of the node
       @method valueArray
       @return Array of tuples;
    */
    Node.prototype.valueArray = function(){
        var outArray = [];
        for(var i in this.values){
            var value = this.values[i];
            outArray.push([i,value]);
        }
        return outArray;
    };

    /**Set a notation
       @method setNote
    */
    Node.prototype.setNote = function(name,value){
        if(value === undefined || value === null){
            delete this.notes[name];
        }else{
            this.notes[name] = value;
        }
    };

    /**Get an array of all note tuples
       @method noteArray
    */
    Node.prototype.noteArray = function(){
        var outArray = [];
        for(var i in this.notes){
            var note = this.notes[i];
            outArray.push([i,note]);
        }
        return outArray;
    };

    
    /**Utility method to compare two nodes
       @method equals
       @param aNode The other node to compare to
       @return Bool based on comparison of node id's
    */
    Node.prototype.equals = function(aNode){
        if(this.id === aNode.id) return true;
        return false;
    };
    
    
    return Shell;
});
