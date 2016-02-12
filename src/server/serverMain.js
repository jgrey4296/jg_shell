//adapted from:
//http://blog.kevinchisholm.com/javascript/node-js/making-a-simple-http-server-with-node-js-part-iv/

//Imports
var http = require('http'),
    fs = require('fs'),
    shell = fs.readFileSync('index.html'),
    path = require('path');

//Supported File extensions -> mimetype
var extensions = {
    ".html" : "text/html",
    ".css" : "text/css",
    ".js" : "application/javascript",
    ".png" : "image/png",
    ".gif" : "image/gif",
    ".jpg" : "image/jpeg",
    ".json": "application/json",
};

/**Process a get request
   @function dealWithGet
   @param request the recieved request object.
   @param response the response object to write to
 */
var dealWithGet = function(request,response){
    //Default to shell.html if nothing else is requested
    var fileName = path.basename(request.url) || 'index.html',
        dirName = path.dirname(request.url),
        ext = path.extname(fileName),
        filePath = path.join(".",dirName,fileName);
    
    console.log("Getting:",filePath);
    
    //Unsupported file
    if(!extensions[ext]){
        response.writeHead(404,{"Content-Type":"text/html"});
        response.end("&lt;html&gt;&lt;head&gt;&lt;/head&gt;&lt;body&gt;The requested file type is not supported&lt;/body&gt;&lt;/html&gt;");
        return;
    }

    //Otherwise get the requested file:
    console.log("Opening: ", filePath);
    fs.exists(filePath,function(exists){
        if(exists){
            fs.readFile(filePath,function(err,contents){
                if(!err){
                    response.writeHead(200,{
                        "Content-type":extensions[ext],
                        "Content-Length":contents.length
                    });
                    response.end(contents);
                }else{
                    console.log(err);
                }

            });
        }else{
            response.writeHead(404,{'Content-Type':'text/html'});
            response.end("The requested file was not found: " + filePath);
        }
    });    
};

/**Process a POST request, mainly saving a file
   @function dealWithPost
   @param request the recieved request data
   @param response the outgoing response object to write to
 */
var dealWithPost = function(request,response){
    console.log("RECIEVED POST:",request.url);
    var values = request.url.split("=");

    //Instruction to save data:
    //using url for save instruction and filename.
    if(values[0].slice(1) === "saveData"){
        console.log("Saving to File:",values[1]+".json");
        //aggregate recieved post data
        var allData = "";
        request.on('data',function(chunk){
            allData += chunk;
        });

        //when aggregated, save it to file
        request.on('end',function(){
            //console.log("Entire Message received:",allData);

            //Copy the file, and then call the function to
            //write the new version of the file
            copyFile("./data/",values[1]+".json",function(copyErr){
                console.log("Writing new File");
                fs.writeFile("./data/"+values[1]+".json",allData,function(err){
                    if(err || copyErr){
                        console.log("Error:",err);
                        response.writeHead(404);
                        response.end();
                    }else{
                        //Respond with something
                        response.writeHead(200,{'Content-Type':'text/plain'});
                        response.end("");
                    }
                });
            });                
        });
    }
};


/**Backup a file prior to writing new data to it
   @function copyFile
   @param sourcePath the directory containing the file
   @param fileName the file itself
   @param cb the callback to call once the file is copied
 */
function copyFile(sourcePath,fileName,cb){
    console.log("Copying File");
    var cbCalled = false;
    var rd = fs.createReadStream(sourcePath+fileName);
    rd.on("error",function(err){
        done(err);
    });
    var dateString = new Date().toISOString();
    var wr = fs.createWriteStream(sourcePath+"backup_"+dateString+fileName);
    wr.on("error",function(err){
        done(err);
    });
    wr.on("close",function(ex){
        done();
    });
    rd.pipe(wr);
    function done(err){
        console.log("Copying Done");
        if(!cbCalled){
            cb(err);
            cbCalled = true;
        }
    }
}


//----------------------------------------
/**The server object, with a custom listen function
   @object server
 */
var server = http.createServer(function(request,response){
    if(request.method === "GET"){
        dealWithGet(request,response);
    }else{
        dealWithPost(request,response);
    }
});
server.listen(8888);//Run the server on port 8888
console.log("Simple Shell Server is listening");
