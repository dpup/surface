// Simple node-js static file server for serving content in the 'example' directory,
// since the examples require features that don't work great on the local filesystem.
//
// If you don't have Node installed, try Apache or IIS or some other local server.
//
// Usage:
// $ node static-file-server.js
//
// Taken from https://gist.github.com/701407

var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

http.createServer(function(request, response) {

  var uri = url.parse(request.url).pathname;
  var filename = path.join(path.join(__dirname, '../example/'), uri);
  
  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {'Content-Type': 'text/plain'});
      response.write('404 Not Found\n' + filename + '\n');
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, 'binary', function(err, file) {
      if(err) {        
        response.writeHead(500, {'Content-Type': 'text/plain'});
        response.write(err + '\n');
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, 'binary');
      response.end();
    });
  });
}).listen(parseInt(9800, 10));

console.log('Examples running at http://localhost:' + 9800 + '/\nCTRL+C to shutdown');
