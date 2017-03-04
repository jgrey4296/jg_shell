import _ from 'lodash';
import { GraphNode } from './GraphNode';

/**
   Defines a Bookmark node
   @module Node/Bookmark
   @see Node/Bookmark
*/

/**
   @constructor
   @alias Node/Bookmark
   @augments module:Node/GraphNode
*/
let Bookmark = function(name,parent,type,url,overRideId){
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

export { Bookmark };
