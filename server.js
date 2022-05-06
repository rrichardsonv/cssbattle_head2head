const path = require('path');
const http = require('http');

// Require the fastify framework and instantiate it
const fastify = require('fastify')({
  // set this to true for detailed logging:
  logger: false
});


// Setup our static files
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/' // optional: default '/'
});

fastify.register(require('fastify-socket.io'), {
  // put your options here
})

// fastify-formbody lets us parse incoming forms
fastify.register(require('fastify-formbody'));

// point-of-view is a templating manager for fastify
fastify.register(require('point-of-view'), {
  engine: {
    handlebars: require('handlebars')
  }
});

// Our main GET home page route, pulls from src/pages/index.hbs
fastify.get('/', function(request, reply) {
  // params is an object we'll pass to our handlebars template
  const joinScript = buildJoinScript(process.env.URL || 'http://localhost:3000');
  let params = {
    joinScript,
    joinScriptMin: joinScript.replace(/\n\s+/g, ' ')
  };
  // request.query.paramName <-- a querystring example
  reply.view('/src/pages/index.hbs', params);
});

fastify.post('/event', function (request, reply) {
  fastify.io.emit('change', request.body);

  reply.send();
});



// A POST route to handle form submissions
fastify.post('/', function(request, reply) {
  let params = {
    greeting: 'Hello Form!'
  };
  // request.body.paramName <-- a form post example
  reply.view('/src/pages/index.hbs', params);
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


function buildJoinScript (serverUrl) {
  return `(() => {
    function quickH (obj) {
      return ((str, hash = 5381, i = null) => {
        while (i ??= str.length) {
          hash = (hash * 33) ^ str.charCodeAt(--i);
        };
        return hash >>> 0;
      })(JSON.stringify(obj));
    }

    let
      lastHash = -1,
      debug = false;

    const
      name = prompt('Enter your name to connect'),
      editor = document.querySelector('.react-codemirror2');
    
    function req (payload) {
      return {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(payload)
      };
    }

    function fireAndForget (payload) {
      const disH = quickH(payload);
      if (disH === lastHash) return;
      lastHash = disH;

      if (debug) {
        console.log(' 🤖  Sending change event with payload:', { payload, req });
      }

      return fetch(
        '${serverUrl}/event',
        req(payload)
      ).then(
        resp => {
          if (debug) {
            console.log(' 🤖  recieved success:', { resp });
          }
          return resp;
        },
        err => {
          if (debug) {
            console.log(' 🤖  recieved error:', { err });
          }
          return err;
        }
      );
    }
    
    const timer = setInterval(() => {
      fireAndForget({
        name,
        text: editor.innerText
      });
    }, 1000);
    
    window.cssancelConn = () => {
      const log = debug ? console.log : () => undefined;

      if (!timer) {
        log(' 🤖  No timer found to cancel.');
      } else {
        clearInterval(timer);
        log(' 🤖  Timer canceled. Goodbye.');
      }
    };
    window.csstoggleDebug = () => {
      debug = !debug;
      console.log(' 🤖  Set debug to:', debug);
    };

    console.group(' 👥  Welcome to css_head2head');
    console.log('Some commands you might enjoy knowing...');
    console.log(' 🤖  cssancleConn()', '- will end the connection to the server.');
    console.log(' 🤖  csstoggleDebug()', '- will print messages for each action this little client takes.');
    console.log(' ⚔️ Happy battling. ');
    console.groupEnd();
  })()
  `;
}