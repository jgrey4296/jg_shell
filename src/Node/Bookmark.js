if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['underscore','./GraphNode'],function(_,GraphNode){
    "use strict";
    var Bookmark = function(name,parent,type,url,overRideId){
        GraphNode.call(this,name.slice(0,10),parent,"bookmark",{},overRideId);
        this.longName = name;
        this.url = [url];
    };
    Bookmark.prototype = Object.create(GraphNode.prototype);
    Bookmark.constructor = Bookmark;

    return Bookmark;
});
