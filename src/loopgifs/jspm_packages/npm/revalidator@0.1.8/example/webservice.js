/* */ 
(function(Buffer, process) {
  var revalidator = require('../lib/revalidator'),
      http = require('http'),
      memoryStore = {},
      schema = {properties: {
          url: {
            description: 'the url the object should be stored at',
            type: 'string',
            pattern: '^/[^#%&*{}\\:<>?\/+]+$',
            required: true
          },
          challenge: {
            description: 'a means of protecting data (insufficient for production, used as example)',
            type: 'string',
            minLength: 5
          },
          body: {
            description: 'what to store at the url',
            type: 'any',
            default: null
          }
        }};
  var server = http.createServer(function validateRestRequest(req, res) {
    req.method = req.method.toUpperCase();
    console.log(req.method, req.url);
    var requestBody = [];
    req.on('data', function addDataToBody(data) {
      requestBody.push(data);
    });
    req.on('end', function dealWithRest() {
      requestBody = requestBody.join('');
      if ({
        POST: 1,
        PUT: 1
      }[req.method]) {
        try {
          requestBody = JSON.parse(requestBody);
        } catch (e) {
          res.writeHead(400);
          res.end(e);
          return;
        }
      } else {
        requestBody = {};
      }
      if (!requestBody.url) {
        requestBody.url = req.url;
      }
      if (requestBody.url === '/') {
        res.writeHead(400);
        res.end('Cannot override the API endpoint "/"');
        return;
      }
      if (req.url !== '/' && requestBody.url !== req.url) {
        res.writeHead(400);
        res.end('Requested url and actual url do not match');
        return;
      }
      var validation = revalidator.validate(requestBody, schema);
      if (!validation.valid) {
        res.writeHead(400);
        res.end(validation.errors.join('\n'));
        return;
      }
      var storedValue = memoryStore[requestBody.url];
      if (req.method === 'POST') {
        if (storedValue) {
          res.writeHead(400);
          res.end('ALREADY EXISTS');
          return;
        }
      } else if (!storedValue) {
        res.writeHead(404);
        res.end('DOES NOT EXIST');
        return;
      }
      if (storedValue && requestBody.challenge != storedValue.challenge) {
        res.writeHead(403);
        res.end('NOT AUTHORIZED');
        return;
      }
      if (requestBody.body === undefined) {
        requestBody.body = schema.properties.body.default;
      }
      switch (req.method) {
        case "GET":
          res.writeHead(200);
          var result = storedValue.body;
          res.end(JSON.stringify(result));
          return;
        case "POST":
          res.writeHead(201);
          res.end();
          memoryStore[requestBody.url] = requestBody;
          return;
        case "DELETE":
          delete memoryStore[requestBody.url];
          res.writeHead(200);
          res.end();
          return;
        case "PUT":
          memoryStore[requestBody.url] = requestBody;
          res.writeHead(200);
          res.end();
          return;
        default:
          res.writeHead(400);
          res.end('Invalid Http Verb');
          return;
      }
    });
  });
  server.listen(process.env.PORT || process.env.C9_PORT || 1337, function reportListening() {
    console.log('JSON REST Service listening on port', this.address().port);
    console.log('Requests can be sent via REST to "/" if they conform to the following schema:');
    console.log(JSON.stringify(schema, null, ' '));
  });
})(require('buffer').Buffer, require('process'));
