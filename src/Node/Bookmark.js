define(['underscore','./GraphNode'],function(_,GraphNode){

    var Bookmark = function(name,parent,type,url,overRideId){
        GraphNode.call(this,name.slice(0,10),parent,"bookmark",{},overRideId);
        this.longName = name;
        this.url = [url];

    };

});
