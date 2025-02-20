import http from "http"
import url from "url"
import path from "path"
import fs from "fs"

const port = process.argv[2] || 8888

const mime = {
  js: 'text/javascript',
  html: 'text/html'
}

const server = http.createServer((req, res) => {
  const uri = url.parse(req.url).pathname
  let filename = path.join(process.cwd(), uri)

  if(!fs.existsSync(filename)) return

  if (fs.statSync(filename).isDirectory()) filename += '/index.html'

  fs.readFile(filename, "binary", function(err, file) {
    const type = mime[filename.split('.').pop()]
    res.writeHead(200, {"Content-Type": type})
    res.write(file, "binary")
    res.end()
  })
})

server.listen(parseInt(port, 10))

console.log("running at http://localhost:" + port)
