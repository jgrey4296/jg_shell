if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

/**
   Defines a Bookmark node
   @module Node/Bookmark
   @see Node/Bookmark
 */
define(['lodash','./GraphNode'],function(_,GraphNode){
    "use strict";
    /**
       @constructor
       @alias Node/Bookmark
       @augments module:Node/GraphNode
     */
    var Bookmark = function(name,parent,type,url,overRideId){
        GraphNode.call(this,name,parent,"bookmark",{},overRideId);
        this.longName = name;
        this.url = [url];
    };
    Bookmark.prototype = Object.create(GraphNode.prototype);
    Bookmark.constructor = Bookmark;

    Bookmark.prototype.getDescriptionObjects = function(){
        let DO = this.getDescriptionObjectsBase();
        DO.push({
            name : "URL",
            values : this.url,
            background : 'link'
        });
    };
    
    return Bookmark;
});
