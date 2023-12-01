class Socket {
  constructor () {
    this.socket = io();
    this.socket.on('change', this.handleChange.bind(this));
    this.socket.on('score', this.handleScore.bind(this))
    this.listeners = [];
    this.scoreListeners = [];
  }

  addListener (cb) {
    this.listeners.push(cb);
  }

  handleChange (payload) {
    pipe(
      this.parsePayload,
      this.cleanPayload,
      ...this.listeners
    )(payload);
  }

  handleScore (payload) {
    pipe(
      this.parsePayload,
      this.cleanScorePayload,
      ...this.scoreListeners,
    )(payload);
  }

  parsePayload(payload) {
    return JSON.parse(payload)
  }

  cleanScorePayload({name, score, percent}) {
    return {
      name,
      id: name.replace(/\s/, '-'),
      submittedScore: parseFloat(score),
      percent,
    }
  }

  cleanPayload({ name, text }) {
    return {
      name,
      id: name.replace(/\s/, '-'),
      text: text.replace(/^\s*1\n/, '').replace(/(\S)\n\d+\n/g, '$1\n')
    };
  }
}

class App {
  constructor () {
    this.connectedPlayers = new Set();
    this.usernameToConnect = new URLSearchParams(window.location.search).get("username");
    this.connectionStatus = 2;

    if (this.usernameToConnect) {
      this.connectionStatus = 0;
      this.socket = new Socket();
      this.socket.addListener(this.showConnected.bind(this));
    }

    this.bindCopyButton();
  }

  showConnected (p) {
    const { name } = p;
    const beforeSize = this.connectedPlayers.size;
    this.connectedPlayers.add(name);
    const afterSize = this.connectedPlayers.size;

    if (!this.connectionStatus && this.usernameToConnect === name) {
      this.connectionStatus = 1;
    }

    if (beforeSize !== afterSize) {
      this.updateDisplay()
    }
  }

  updateDisplay () {
    document.getElementById("player-count").innerText = this.connectedPlayers.size;
    if (this.connectionStatus === 1) {
      document.getElementById("message-one").classList.add("hidden");
      document.getElementById("message-two").classList.remove("hidden");
      this.connectionStatus = 4;
    }
  }

  bindCopyButton () {
    const copyButton = document.getElementById("copy-to-clipboard");
    if (copyButton) {
        copyButton.addEventListener("click", function (e) {
          e.preventDefault();
          const copyText = document.getElementById(copyButton.dataset.target);
          if (!navigator.clipboard){
              document.execCommand("copy", false, copyText.select());
          } else {
              navigator.clipboard.writeText(copyText.value).then(
                  function(){
                      console.log("successful copy!");
                  })
                .catch(
                  function(err) {
                      console.log("failed copy!", err);
                });
          }
        });
    }
  }
}

function pipe (...fns) {
  return (...rest) => fns.reduce((args, fn) => [fn(...args)], rest)[0];
}

window.app = new App();