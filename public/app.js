class App {
  constructor () {
    // state
    this.players = {};
    this.lbp = {};
    this.main = document.querySelector('main');
    this.leaderBoard = document.querySelector('#leaderboard');

    // Network handlers
    this.socket = new Socket();
    this.socket.addListener(this.upsertPlayer.bind(this));
    this.socket.addListener(this.upsertLeaderboard.bind(this));
    this.socket.addListener(this.reorderLeaderboard.bind(this));
    this.socket.addListener(this.updateSplitScreen.bind(this));

    // UI events
    this.bindCopyButton();
  }

  toggleCode () {
    Object.keys(this.players).forEach(n => {
      this.players[n].toggleSyntax()
    })
  }

  upsertPlayer(p) {
    const { name } = p;
    this.players[name] ??= new PreviewPlayer(p, this.main);
    this.players[name].update(p);
    return p;
  }

  upsertLeaderboard(p) {
    const {name} = p;
    
    this.lbp[name] ??= new ScorePlayer(p, this.leaderBoard);
    this.lbp[name].update(p);
    return p;
  }

  reorderLeaderboard(unused) {
    const rankedPlayers =
      Object.keys(this.lbp).sort((a, b) =>
        (this.lbp[a].count > this.lbp[b].count) ? 1 : (this.lbp[a].count > this.lbp[b].count) ? -1 : 0
      ).map((k) => {
        this.lbp[k].prepare();
        return this.lbp[k];
      });
  
    this.leaderBoard.innerHTML = '';
    
    rankedPlayers.forEach(p => {
      p.rerender(this.leaderBoard);
    });

    return unused;
  }
  
  updateSplitScreen(unused) {
    if (Object.keys(this.players).length > 3) {
      this.main.classList.add('multi');
    }
    return unused;
  }

  bindCopyButton () {
    const copyButtons = document.querySelectorAll("[data-copy-to-clipboard]");
    if (copyButtons && copyButtons.length) {
      copyButtons.forEach((btn) =>
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          const copyText = document.getElementById(btn.dataset.target);

          document.execCommand("copy", false, copyText.select());
        }),
      );
    }
  }
}

class Socket {
  constructor () {
    this.socket = io();
    this.socket.on('change', this.handleChange.bind(this));
    this.listeners = [];
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

  parsePayload(payload) {
    return JSON.parse(payload)
  }

  cleanPayload({ name, text }) {
    return {
      name,
      id: name.replace(/\s/, '-'),
      text: text.replace(/^\s*1\n/, '').replace(/(\S)\n\d+\n/g, '$1\n')
    };
  }
}

class PreviewPlayer {
  constructor ({ name, id }, main) {
    const el = document.createElement('div');
    el.id = id;
    el.classList.add('player');
    el.innerHTML = `
      <h3>${name}</h3>
      <div id="syntax" class="hidden">
        <code>
          <pre class="syntax"></pre>
        </code>
      </div>
      <iframe
        title="Preview"
        width="400"
        height="300"
        class="preview"
        style=background:white;border:0;outline:0
      ></iframe>
    `;
    this.el = el;
    this.preview = el.querySelector('.preview');
    this.pre = el.querySelector('.syntax');

    main.appendChild(this.el);
  }

  update ({ text }) {
    this.pre.innerText = text;
    this.preview.contentDocument.write(text.replace(/^\s+/gm, '').replace(/\s+$/, ''))
    this.preview.contentWindow.document.close();
  }

  toggleSyntax () {
    this.el.getElementById('syntax').classList.toggle('hidden');
  }
}

class ScorePlayer {
  constructor ({ id, text }, leaderBoard) {
    const el = document.createElement('p');
    el.id = 'leaderboard-'+id;
    this.el = el;
    this.count = text.length;
    leaderBoard.appendChild(this.el);
  }
  prepare () {
    this.el = this.el.cloneNode(true);
  }
  rerender (leaderBoard) {
    leaderBoard.appendChild(this.el);
  }
  update ({ name, text }) {
    this.count = text.length;
    this.el.innerText = `${name} - ${text.length}`;
  }
}

function pipe (...fns) {
  return (...rest) => fns.reduce((args, fn) => [fn(...args)], rest)[0];
}

window.app = new App();