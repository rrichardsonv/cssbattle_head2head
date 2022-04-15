const path = require("path");
const http = require("http");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // set this to true for detailed logging:
  logger: false
});


// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

fastify.register(require('fastify-socket.io'), {
  // put your options here
})

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

// Our main GET home page route, pulls from src/pages/index.hbs
fastify.get("/", function(request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = {
    server_url: process.env.URL || "http://localhost:3000"
  };
  // request.query.paramName <-- a querystring example
  reply.view("/src/pages/index.hbs", params);
});

fastify.post("/event", function (request, reply) {
  fastify.io.emit('change', request.body);

  reply.send();
});



// A POST route to handle form submissions
fastify.post("/", function(request, reply) {
  let params = {
    greeting: "Hello Form!"
  };
  // request.body.paramName <-- a form post example
  reply.view("/src/pages/index.hbs", params);
});

fastify.ready(err => {
  if (err) throw err

  fastify.io.on('connection', (socket) => {
    console.log('a user connected');
  
    socket.on('msg', (msg) => {
      console.log('message: ' + msg);
    });
  
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });
});

// Run the server and report out to the logs
fastify.listen(3000, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
