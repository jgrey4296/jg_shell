
define(['underscore'],function(_){
    "use strict";
    var nextId = 1;
    /**
       Commands to be able to import a json file exported from firefox, into an initial graph form
       @exports Commands/BookMarkCommands
    */
    var CommandTemplate = {
        /** Draw Command 
            @param globalData
            @param values
         */
        "draw" : function(globalData,values){

        },
        /** Cleanup Command 
            @param globalData
            @param values
        */
        "cleanup" : function(globalData,values){

        },
        /** open a new window of the bookmark's url: 
            @param globalData
            @param values
         */
        "goto" : function(globalData,values){
            var bookmark = globalData.shell.cwd;
            if(values.length > 0){
                bookmark = globalData.shell.getNode(values[0]);
            }
            
            if(bookmark.tags.type === "bookmark" && bookmark.url !== undefined){
                if(bookmark.url instanceof Array){
                    window.open(bookmark.url[0],bookmark.name);
                }else{
                    window.open(bookmark.url,bookmark.name);
                }
            }
        },        
        /** Firefox Import 
            @param globalData
            @param values
        */
        "firefoxImport" : function(globalData,values){
            try{
                var stringMinusCommand = globalData.rawCurrentLine.replace(/^firefoxImport /,""),
                    reconJson = JSON.parse(stringMinusCommand),
                    extractedLinks = extractLinks(reconJson),
                    nodeSpecs = groupLinks(extractedLinks);

                globalData.shell.importJson(nodeSpecs);
                        
            }catch(err){
                console.log("Firefox import Error:",err);
            }            
        },
        /** Firefox Load 
            @param globalData
            @param values
        */
        "firefoxLoad" : function(globalData,values){
            var request = new XMLHttpRequest();
            request.onreadystatechange=function(){
                if(request.readyState===4){
                    try{
                        var receivedJson = JSON.parse(request.responseText),
                            extractedLinks = extractLinks(receivedJson),
                            nodeSpecs = groupLinks(extractedLinks);
                        console.log("Received JSON:",receivedJson);
                        globalData.shell.importJson(nodeSpecs);
                        globalData.lookupOrFallBack("draw",globalData)(globalData,[]);
                    }catch(err){
                        alert("Error loading data: \n" + err.message);
                        console.log("Error loading data:",err);
                    }
                }
            };
            request.open("GET","/data/"+values[0]+".json",true);
            request.send();
        },
        /**
           Help texts
        */
        "help" : function(globalData,values){
            return {
                "goto" : ["$nodeId","Open a new window using the nodes url"],
                "firefoxImport" : ["$rawJSON","Import a raw json string of exported bookmarks from firefox"],
                "firefoxLoad" : ["$fileName","Request and load a firefox bookmarks json from the server"]
            };
        }        
    };
    
    //----------------------------------------
    // Utilities:
    //----------------------------------------
    
    /**
       Turn bookmarks into objects
       @function extractLinks
     */
    var extractLinks = function(data){
        var childData = [];
        if(data.children !== undefined){
            childData = _.flatten(data.children.map(function(d){
                return extractLinks(d);
            }));
        }
        if(data.title !== undefined && data.uri !== undefined){
            childData.push({
                id: nextId++,
                name : data.title,//.slice(0,10),
                longName : [data.title],
                url : [data.uri],
                tags : {type : "bookmark"},
                children : {},
                parents : {},
            });
        }
        return childData;
    };

    /**
    dealing with an array of bookmarks
    get groups of 15 bookmarks, and then make nodes of each of those groups
    @function groupLinks
    */
    var groupLinks = function(data){
        var NUM_IN_GROUP = 9;
        //be able to lookup the data by id
        var lookupObject = data.reduce(function(m,v){
                if(m[v.id] === undefined){
                    m[v.id] = v;
                }
                return m;
        },{}),
            //group the ids
            ids = data.map(function(d){
                return d.id;
            }),
            //group in 15's
            groupedIds = ids.reduce(function(m,v){
                if(_.last(m).length > NUM_IN_GROUP){
                    m.push([]);
                }
                _.last(m).push(v);
                return m;
            },[[]]),
            //turn the groups into objects to slot in as child object specs ({id:name})
            groupObjects = groupedIds.map(function(d){
                return d.reduce(function(m,v){
                    if(m[v] === undefined){
                        m[v] = lookupObject[v].name;
                    }
                    return m;
                },{});
            }),
            //create the group nodes
            groupNodes = groupObjects.map(function(d,i){
                var newGroup = {
                    id : nextId++,
                    name : "Group_" + i,
                    tags : {type : "BookmarkGroup"},
                    children : d,
                    parents : { 0 : "Bookmark Root"},
                    _originalParent : 0
                };
                //update the children to have the correct parent
                _.keys(newGroup.children).forEach(function(d){
                    lookupObject[d]._originalParent = newGroup.id;
                    lookupObject[d].parents[newGroup.id] = newGroup.name;
                });
                return newGroup;
            }),
            groupChildrenObject = groupNodes.reduce(function(m,v){
                if(m[v.id] === undefined){
                    m[v.id] = v.name;
                }
                return m;
            },{});

        //create the end list:
        var endList = [];
        endList.push({
            id : 0,
            name : "Bookmark Root",
            tags : {type : "Group" },
            children : groupChildrenObject,
            parents : {},
        });
        endList = endList.concat(groupNodes,data).sort(function(a,b){
            return a.id - b.id;
        });

        return endList;

    };

    return CommandTemplate;
});
