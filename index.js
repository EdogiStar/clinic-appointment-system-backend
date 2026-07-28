var http = require('http');
var server = http.createServer( (request, response) => {
  response.end('Versions: ' + JSON.stringify(process.versions));
});
server.listen(3000, () => {
  console.log(`Server running at http://localhost:3000/`);
});