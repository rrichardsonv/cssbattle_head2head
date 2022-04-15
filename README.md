# Css head2head

## Setup

1. Install dependencies
```sh
npm i
```

2. If you want to be able to play across the internet you'll need to download some way to do port forwarding (I use [ngrok](https://ngrok.com/download))


3. Start an ngrok server and point it at port 3000
```sh
ngrok http 3000
```

4. Copy the https url and paste it into the following command (URL defaults to http://localhost:3000)
```sh
URL="<paste ngrok url here>" npm start
```

5. Navigate to http://localhost:3000 in your browser and open the `Show join script` dropdown

6. Have you're players navigate to the the challenge you're doing ex: https://cssbattle.dev/play/105, run the join script in the dev console, and follow the prompts


## Details

`app.js` is the client script file
`server.js` has the server logic
