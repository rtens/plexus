import http from "http"
import url from "url"
import path from "path"
import fs from "fs"

const port = process.argv[2] || 8888;

http.createServer(function(request, response) {

  const uri = url.parse(request.url).pathname
  let filename = path.join(process.cwd(), uri);

  if(!fs.existsSync(filename)) {
    response.writeHead(404, {"Content-Type": "text/plain"});
    response.write("404 Not Found\n");
    response.end();
    return;
  }

  if (fs.statSync(filename).isDirectory()) filename += '/index.html';

  fs.readFile(filename, "binary", function(err, file) {
    const type = filename.endsWith('.js') ? 'text/javascript' : 'text/html'
    response.writeHead(200, {"Content-Type": type});
    response.write(file, "binary");
    response.end();
  });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
