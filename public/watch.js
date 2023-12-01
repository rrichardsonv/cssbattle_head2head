class EzElement extends HTMLElement {
  shadow = null;

  get stylez () {
    return `:host {display: block}`;
  }

  constructor () {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes () {
    return [];
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    this[name] = newValue;
    this.update();
  }

  connectedCallback () {
    this.update();
  }

  update () {
    const nextRender = this.render();
    if (nextRender) {
      this.shadow.innerHTML = nextRender;
    }
    const style = document.createElement('style');
    style.textContent = this.stylez;
    this.shadow.appendChild(style);
  }

  render () { return null; }
}

let id = 0;

class PreviewBox extends EzElement {
  frame;
  renderedDoc;

  get stylez () {
    return `
    :host {
      display: flex;
      justify-content: center;
      align-content: center;
      overflow: hidden;
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
      mix-blend-mode: normal;
      opacity: 1;
      transition: all 0.3s ease 0s;
    }

    :host .username,
    :host .avatar {
      position: absolute;
      z-index: 2;
    }

    :host .avatar {
      border-radius: 50%;
      box-shadow:0+0+0+3px#34363e;
      top: 0;
      left:calc(calc(50% - 24px) + 190px);
    }

    :host .username {
      top: 0;
      right: 60%;
      background: #060606;
      color: white;
      padding:2px 4px;
      opacity: 0.6;
    }
    `;
  }

  static get observedAttributes () {
    return ['doc', 'username', 'avatar'];
  }

  update () {
    super.update();

    if (!this.frame) {
      this.frame = document.createElement('iframe');
      this.frame.style = "background: white; width: 400px; height: 300px; border: 0px; outline: 0px; pointer-events: none;";
      this.frame.id = `preview-iframe-${++id}`;
      this.appendChild(this.frame);
    }


    if (this.doc !== this.renderedDoc) {
      this.renderedDoc = this.doc;
      this.frame.contentDocument.write(this.doc.replace(/^\s+/gm, '').replace(/\s+$/, ''));
      this.frame.contentWindow.document.close();
    }
  }
  
  render () {
    return `
    <span class="username">${this.username}</span>
    <img class="avatar" src="${this.avatar}" />
    <slot></slot>
    `;
  }
}

if (!customElements.get('preview-box')) {
  customElements.define('preview-box', PreviewBox);  
}


class ScoreLine extends EzElement {
  get stylez () {
    return `
    :host {
  height: 32px;
  font-size: 20px;
  display: flex;
  overflow: hidden;
  padding: 0 4px;
  font-family: monospace;
  color: lime;
  box-shadow: inset 0 0 0 1px lime;
}
:host .position {
  width: 30px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

:host .avatar {
  overflow: hidden;
  position: relative;
  margin: 2px 0;
  top: -1px;
  width: 48px;
  height: 30px;
  box-shadow: -2px 0 lime;
}

:host img {
  height: 48px;
  position: absolute;
  top: -8px;
}
:host .name {
  flex: 1;
  display: inline-flex;
  align-items: center;
}

:host .score {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}
    `;
  }
  
  static get observedAttributes () {
    return ['pos', 'username', 'avatar', 'score', 'submittedscore', 'percent'];
  }
  
  getScore () {
    return this.score ? parseInt(this.score) : -1;
  }

  renderScore () {
    if (this.submittedScore !== null) {
      return `<div class="score">${this.score}</div>`
    } else {
      return `<div class="score">${this.submittedScore}(${this.percent})</div>`
    }
  }
  
  render () {
    return `
        <div class="position">${this.pos}</div>
        <div class="avatar"><img src="${this.avatar}" /></div>
        <div class="name">${this.username}</div>
        ${this.renderScore()}
    `;
  }
}

if (!customElements.get('score-line')) {
  customElements.define('score-line', ScoreLine);  
}

class ScoreBoard extends EzElement {
  get stylez () {
    return `
    :host {
      width: 100%;
      height: calc(100% - 200px);
      display: inline-block;
    }
    `;
  }
  
  players = [];
  
  updateScore (player) {
    const { id: identity, score } = player;
    const [,el] = this.players.find(([i]) => i === identity) ?? [null, null];

    if (!el) {
      this.addPlayer(player);
    } else {
      el.score = score;
      el.submittedscore = player?.submittedScore ?? null;
      el.percent = player?.percent ?? null;
      this.updateLines();
    }
  }
  
  addPlayer ({ id, avatar, username, score }) {
    const el = document.createElement('score-line');
    el.avatar = avatar;
    el.username = username;
    el.score = score;
    el.pos = "-"
    this.appendChild(el);
    this.players.push([id, el]);
    this.updateLines();
  }
  
  updateLines () {
    let nextPlayers;
    if (this.players.length > 1) {
      nextPlayers = [...this.players].sort(([,a], [,b]) => {
        if (a.getScore() > b.getScore()) return 1;
        if (a.getScore() < b.getScore()) return -1;
        return 0;
      });
    } else {
      nextPlayers = this.players;
    }
    
    
    this.players = nextPlayers.map(([id, el], i) => {
      el.setAttribute("pos", `${i+1}`);
      return [id, el];
    });
  }

  render () {
    return `<slot></slot>`;
  }
}

if (!customElements.get('score-board')) {
  customElements.define('score-board', ScoreBoard);  
}

class RoundTimer extends EzElement {  
  get stylez () {
    return `
    :host {
      display: flex;
      width: 100%;
      height: 160px;
      font-family: monospace;
    }
    
    :host button {
      flex: 0 0 80px;
      font-size: 20px;
    }
    :host .time {
      flex: 1;
      display: inline-flex;
      justify-content: center;
      text-align:center;
      color: magenta;
      flex-direction: column;
      padding: 0 8px;
    }
    
    .mid {
      color: yellow;
    }

    .low {
      color: red;
    }

    :host .display {
     font-size: 48px;
    }
    
    `;
  }
  updateDisplay (v) {
    this.shadow.querySelector("#time-display").innerText= this.calcDisplayTime(v);
  }
  update () {
    super.update();
    const input = this.shadow.querySelector("#time");
    this.updateDisplay(parseInt(input.value));

    input.addEventListener("change", (ev) => {
      this.updateDisplay(parseInt(ev.target.value));
    });
    
    const button = this.shadow.querySelector("#go");
    button.addEventListener("click", (ev) => {
      ev.preventDefault();
      this.startTimer(button, input);
    })
  }
  
  calcDisplayTime (time) {
    const minutes = Math.floor(time / 60);
    const seconds = time - minutes * 60;
    return `${minutes}:${seconds > 9 ? seconds : "0"+seconds}`;
  }
  
  startTimer (button, input) {
    let count = parseInt(input.value);
    const midCount = count * 0.4;
    const lowCount = count * 0.2;
    button.setAttribute('disabled', "");
    input.setAttribute('disabled', "");
    input.classList.add('hidden');
    const timedisplay = this.shadow.querySelector("#time-display");
    let level = 0;
    
    this.timer = setInterval(() => {
      count--;
      if (count < 1) {
        clearInterval(this.timer);
        timedisplay.classList.remove("low");
        button.removeAttribute('disabled');
        input.removeAttribute('disabled');
        input.classList.toggle('hidden');
        this.shadow.querySelector("#time-display").innerText="DONE!";
      } else {
        this.updateDisplay(count);

        if (level === 1 && count < lowCount) {
          timedisplay.classList.remove('mid');
          timedisplay.classList.add('low');
          level++;
        } else if (level === 0 && count < midCount) {
          timedisplay.classList.add('mid');
          level++;
        }
      }
    }, 1000);
  }
  
  maybeUpdateStyles (count, mid, low) {
    if (count < low) {
      this.classList.add('low');
      return;
    }

    if (count < mid) {
      this.classList.add('mid');
      return;
    }

    return;
  }

  render () {
    return `
      <div class="time">
      <div id="time-display" class="display"></div>
      <input type="range" id="time" name="time" list="markers" min="0" max="1500" step="60" />
     </div>
      <button id="go">GO!</button>
    `;
  }
}

if (!customElements.get('round-timer')) {
  customElements.define('round-timer', RoundTimer);  
}

class PreviewPlayer {
  url;
  id;
  name;

  constructor ({ name, id }, main) {
    this.url = getAvatarUrl(name);
    this.id = id;
    this.name = name;
    this.el = document.createElement("preview-box");
    this.el.username = this.name;
    this.el.avatar = this.url;
    this.el.doc = "";
    this.el.id = id;
    main.appendChild(this.el);
  }

  update ({ text }) {
    this.el.setAttribute("doc", text);
  }
}

class ScorePlayer {
  url;
  id;
  name;
  score;
  main;
  submittedScore;
  percent;

  constructor ({ name, id }, main) {
    this.url = getAvatarUrl(name);
    this.id = id;
    this.name = name;
    this.main = main;
  }

  update (data) {
    if (!data?.submittedScore) {
      const { text } = data;
      this.score = text.length;
    } else {
      this.submittedScore = data?.submittedScore;
      this.percent = data?.percent;
    }

    this.main.updateScore(
      this.serialize()
    );
  }

  serialize () {
    return {
      id: this.id,
      username: this.name,
      avatar: this.url,
      score: this.score,
      submittedScore: this.submittedScore,
      percent: this.percent,
    }
  }
}



class App {
  constructor () {
    // state
    this.players = {};
    this.lbp = {};
    this.main = document.getElementById('preview-container');
    this.leaderBoard = document.getElementById('score-container');
    // this.leaderBoard = document.querySelector('#leaderboard');

    // Network handlers
    this.socket = new Socket();
    this.socket.addListener(this.upsertPlayer.bind(this));
    this.socket.addListener(this.upsertLeaderboard.bind(this));
    this.challengeId = new URLSearchParams(window.location.search).get("challenge");
    // this.socket.addListener(this.reorderLeaderboard.bind(this));
    // this.socket.addListener(this.updateSplitScreen.bind(this));

    // UI events
    // this.bindCopyButton();
  }

  upsertPlayer(p) {
    if (this.shouldAllow(p?.challengeId)) {
      const { name } = p;
      this.players[name] ??= new PreviewPlayer(p, this.main);
      this.players[name].update(p);
      return p;
    }
  }

  upsertLeaderboard(p) {
    if (this.shouldAllow(p?.challengeId)) {
      const {name} = p;
      
      this.lbp[name] ??= new ScorePlayer(p, this.leaderBoard);
      this.lbp[name].update(p);
      return p;
    }
  }

  shouldAllow (challengeId) {
    if (!this.challengeId || !challengeId) return true;

    return this.challengeId === challengeId;
  }
}

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

function pipe (...fns) {
  return (...rest) => fns.reduce((args, fn) => [fn(...args)], rest)[0];
}

function getAvatarUrl(uname) {
  const re = new RegExp(uname.replace(" ", ""), "i");
  const slackUsers = [{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U13FL3X2Q-d9835829f5aa-48","name":"AbdulQavi"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0RK5DTQR-cfb9dff6057c-48","name":"AdamKerasotes"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02NFH4FWJ0-34713581de80-48","name":"AdamUrteaga"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U6R3PS74Z-b595fc4604c2-48","name":"AddhyanPandey"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U032MJ1L6HH-99eaf294beb9-48","name":"AdithyaReddy"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0CPMGD2A-ddd9522d5df8-48","name":"AlBayer"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UBDEK56MR-530f39a2402b-48","name":"AleksandraBondzic"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02K0H6M1T2-fa2999d035f3-48","name":"AlessandroClivio"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U04D2A7CDDK-d878b4808e9f-48","name":"AlexMiyamura"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UK9N0TAUC-e4e99edb9945-48","name":"AlexanderGilfillan"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U1X3FM6TG-839c90bcfc6b-48","name":"AmandaParnell"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UR5T0CXC4-g95eda3c1253-48","name":"AmandaSestito"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U050V4A11PT-ceb71d33e367-48","name":"AmitRajoriya"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U271QS3QC-98a33aa55c56-48","name":"AmyCarrillo"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U05NEUL4QM6-042fa7d16ee4-48","name":"AmyKakalec"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02TMSNA212-de5545a102df-48","name":"AnaCaballero"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U05SLJ6L8QP-27ab54b92ecb-48","name":"AnatoliyAdamitskiy"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U5NSUP8H1-f0894d79685a-48","name":"AndyCao"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UN1169MGA-dc8984513c10-48","name":"AngelJose"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U9L24SQRG-g8ef1e416534-48","name":"AngeloLuna"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U05RP4YMR0E-7b8e121969e7-48","name":"Ann-MarieLilley"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02PDKZKP7H-d54addd4f674-48","name":"AnumSiddiqui"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01TNGVSN4R-ab51827f0782-48","name":"AshimaShrivastava"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U033Z8VDLSD-81a71862b4f5-48","name":"AustinBentley"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UA6EGCSD9-21879b46e957-48","name":"AustinKregel"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U039D65KNDR-f0f4cab46e08-48","name":"AvronManwah"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U21ECV475-baeb56928b72-48","name":"BradWalker"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0NETFD63-f29b1e92dd23-48","name":"BradleyBrown"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03FMT1KC-fe468dff3cf9-48","name":"BrentonBairhalter"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U04KAF70S-b67483ba3ca1-48","name":"BrettLee"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02GPFXF8NR-bbed8e9d00bd-48","name":"BrianSung"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02J96D1M-ccb859485283-48","name":"BruceZawadzki"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U5TK4H91R-7b57d199de99-48","name":"BryanMcTague"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02QUCXV43X-7ff82ea9b1cd-48","name":"BuddyLo"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U91418HJS-552a5bfb8b35-48","name":"CaioIngber"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UGFUP37SM-211024f50966-48","name":"CeliaWang"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0EUB4BEV-802c38f0cac1-48","name":"ChrisColburn"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01DLNCTMN1-44e2845fdcff-48","name":"ChrisHowie"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UMZ876P9T-6916bbd8935d-48","name":"ChristianKoch"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U2PG820DB-e36e59b68013-48","name":"ClintThurman"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UGLP5TLBU-8eed3c720d8c-48","name":"ColinCampbell"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UCAMK6LAZ-712c9e0b79d8-48","name":"CourtneySimpsen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U044W0HH9HD-392bed9eccde-48","name":"DaironMedinaCaro"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02NAAULAN9-8a1ad975cf8c-48","name":"DanaMorrow"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UBKEZHVU3-20e24fb5ecc6-48","name":"DanielMackey"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0412GZPX-742232f4bf78-48","name":"DanishJawa"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U04NCDU4T-3469742915f7-48","name":"DarnellHolmes"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0D79746L-gd10e15fcc4d-48","name":"DarrenCoombes"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-ULU54AJ6P-gd14463fb83a-48","name":"DavidChun"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U19MSP687-ec8807a2d47e-48","name":"DavidGreene"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UQP1E78JX-16def829e201-48","name":"DavidMosher"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03MM42F04D-6a4a9d9b033e-48","name":"DaytonNolan"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03T55L2R-93bde6b18e14-48","name":"DennisSherman"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UK5G8274K-3a7113d98b5f-48","name":"DennisSmall"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02C7GT9T6E-cff64bd82768-48","name":"DerrickFulkerson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02J7A0CVNU-0ccfa87a26eb-48","name":"DianaMasterson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U32UYBUPQ-bfee69f60342-48","name":"DougVonMoser"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02GMTJJDQV-d3bf2a0f4b79-48","name":"EdQuick"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U029D08RQ9K-d848154f338e-48","name":"ElayneJuten"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UPAFL9R9T-7bbb3af61c66-48","name":"ElizabethDixon"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01G7J950TC-09b8fc122bfc-48","name":"ElviraBarrientos"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U060Z7HNEN9-926315ff6d8d-48","name":"EmmaAnderson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U6Y4B5TGW-d96ac86dcd1c-48","name":"EphBaum"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03SJTS803C-bd3c06db2cc9-48","name":"EricIacutone"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0BNYGJ8K-4ac51539b8e1-48","name":"EricThiele"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U4FEM1ENL-ga869ed4c2a2-48","name":"ErinKennedy"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UGUJDB1P0-a34a785e3ab1-48","name":"EthanGunderson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03KZSKFG-46c3d6238564-48","name":"EzraOh"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03DY6SUQLE-6b009fa7c5a1-48","name":"FlorentBuisson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U3WGFLW7L-f2919e3f8376-48","name":"GabrielMascarenhas"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U014ZLYDFN1-0bcbbdb4389b-48","name":"GrayZhen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0NLFMUNN-23df1a2f4d05-48","name":"GregHeidorn"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01DQ1NDHS7-1b373cb2b383-48","name":"HarshithaSanikommu"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-ULYBD76MR-18dfe1d9630f-48","name":"HeatherPopek"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0TRMFABH-2bdece40891f-48","name":"HouaYang"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U033F789UFM-c3f7d0aab789-48","name":"JakeSellers"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U2DSZ8H60-680a3ed2ac30-48","name":"JamesSaxon"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U2W9GSNEP-949a2ca85151-48","name":"JaredHamby"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UKN215K8E-a12b5c6c9f8b-48","name":"JasonSisk"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03SJTRT002-3e82972e0ace-48","name":"JasonTavenner"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0505RUCX1P-gad5124bbe22-48","name":"JasonTezanos"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0JF0DN7L-1e824c47fb8d-48","name":"JayaVootukuru"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01EVKFAGJE-0b983e65d7e9-48","name":"JaydenSung"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U04A6RV1VPZ-3339b68aaa68-48","name":"JeffOlen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U94MC8UDR-5214e8e97ab7-48","name":"JeffPuckett"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U16H0MBRS-424667274d39-48","name":"JeremyJacocks"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UGJ4D0LMC-4815513f12a4-48","name":"JeremySearls"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0JCQGDJ5-268dbb1db689-48","name":"JeromePlouhar"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U010XFXS8HJ-a8161ed66a89-48","name":"JimKultgen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U058GGDLGG7-e0e6a9a2f044-48","name":"JiparaEsengulova"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U7Q5CBXQ9-g481e980a03b-48","name":"JoaoMoreira"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U045LVCCJBU-1ea76863d366-48","name":"JohnKao"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03SD6WUJ-1007b8fec77d-48","name":"JohnMatthews"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01QQQSBZ5J-8ae4f6b1c285-48","name":"JohnNenninger"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U9REP4BUL-e6fde52c2c04-48","name":"JonathanDelgado"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U040BM0JMLJ-g90d3d3c1817-48","name":"JonathanManahan"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0HBK17RN-gdb38658a50c-48","name":"JoseCanas"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0168NH9CP4-6e10904f8d0b-48","name":"JosephStevens"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U7ASG6BBQ-556b9d8b89f6-48","name":"JoshIllian"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U05EDGPCH4L-4e2abb55918b-48","name":"JoshThomas"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01REFRNC5C-5b4062b14cee-48","name":"JourdanBrocks"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03DAQC35FZ-f31bd2f7c17a-48","name":"KayeMcLean"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-ULXCGLKTK-02d5142dcadb-48","name":"KevinAltman"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U3V18HGAK-g4e51eef1512-48","name":"KevinDilts"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01U6HFP0R1-b6ecf856e464-48","name":"KevinZolkiewicz"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U6RHDF2SV-48b80eb75aba-48","name":"KiranVajja"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U06FT637H-c94c6284cfac-48","name":"KristenJohansen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UAJSXPBGW-eb96fdfa5516-48","name":"KyleDieruf"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03PEBUELCS-28cf3324b54d-48","name":"KyleHamwey"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UHGT6V9HD-f26385771cdf-48","name":"KyleJohnson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03K0ST0HMM-9c3e330636eb-48","name":"LaithNamou"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U9CH8QCS0-78d4287233f6-48","name":"LauraBrokans"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U8RN3KM36-499b2d03fb3e-48","name":"LauraCordoba"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U044UU7E6-3c9ad2dcac4c-48","name":"LaurentCanup"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03KL0WTN-f304053477f4-48","name":"LeeHyer"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0GJL2ME0-b02b36ec88ec-48","name":"LeePage"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UAZV77B5H-cb115fa5c24d-48","name":"LisaReinwald"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02MGU97E04-0cf9f3ce4431-48","name":"LorenBaca"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U014LCGR6MV-0d8d13fbda1e-48","name":"LuciaanQueen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0XTSU46A-06836b4ad2d9-48","name":"LunaRajbhandari"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03BRP4CRHA-7963deeeb19d-48","name":"MarioLo"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02L274EWLB-0b7533c8c6ee-48","name":"MatiasGutierrez"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U3DLL1VD5-7a541ad29206-48","name":"MattVersweyveld"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02U9RB61T8-ba214e5f27cc-48","name":"MatthewCrawford"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UGW1RLVFH-c0b0026cdcb4-48","name":"MatthewWilliams"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U04ECPQQR1U-a686c3da9469-48","name":"MeghanMueller-Cox"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U34N6UTU1-a4324fe24d41-48","name":"MicMagracia"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03MNM18G0G-0c0303970400-48","name":"MichaelDewey"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01RMHJ81QC-432d711eab44-48","name":"MichaelRock"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U132DE03D-5a819178bb67-48","name":"MichaelRyabushkin"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03JUV8B9-9978f0d23676-48","name":"MikeJoyce"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-ULGNN30KW-87d623f75666-48","name":"MindyJohnson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U90AV4R0D-49154196e633-48","name":"MionaLee"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02QQLCCFN2-7c2a84c49fea-48","name":"NamrataKumar"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U04F96FQB1N-5979539e7b97-48","name":"NicholasStalter"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0391SX2MGC-8f970a5ecfcd-48","name":"NickGriffith"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0YRQH4RK-g01e8aa0de42-48","name":"NikhilPatel"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0274PBAH45-gd12ddbfda7c-48","name":"OscarCastro"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U06120GJVMG-a6a905604619-48","name":"PatAndrade"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UCAH2AF8A-700667c13130-48","name":"PedroRebollar"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03N2ND7FDF-a0049ccf4232-48","name":"PeterHoang"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UBR1UFN3W-f861965a3135-48","name":"PuruHemnani"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U32HEEP5K-7834900dc66a-48","name":"PyroChanhnourack"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01JWBAJJBY-044820d2f3fd-48","name":"RangaSai"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UGNR1CC85-105b949608bb-48","name":"RichRichardson(you)"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U2G5LAZ7S-91ae3c04433d-48","name":"RichardBouchard"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0KJ3HWJG-1c616d60dc26-48","name":"RichardO'Connell"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U041YAQLJNL-cf2835ff0f58-48","name":"RobertGiles"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U7KNW6LM7-046d4cdbec03-48","name":"RobertSpidle"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0294HVKG86-283dce1cd6f9-48","name":"RodDennis"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U018J9X7UJ1-34b1cb25724c-48","name":"RohitKoliyatt"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UD35S2D34-5eb1f2d08585-48","name":"RomanKrichevsky"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03KU6W7KND-3183d19098eb-48","name":"RossGeesman"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UA0EE3339-846e7b56ca73-48","name":"RossYoung"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U037C8J5KB8-dc86f2c4f9bf-48","name":"RyanCasey"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03LHTECB2S-80a50331e78e-48","name":"RyanHansen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UF77U4SAZ-0eefc128c61e-48","name":"RyanOlson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U5DLV1CRY-2085e76ede49-48","name":"SanjayDasari"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0J31BBMW-e48a323ab383-48","name":"SarahStroh"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0X9XSESE-b49ff7d64e40-48","name":"ScottHolleman"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U9HLEA71Q-358d2fc5dcc8-48","name":"SeanBrown"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0TQCU9SP-8e264bebabb5-48","name":"ShareefYousef"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UK497UCFR-cc2ced8ade1d-48","name":"SharlaKoob"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0217NVFPEJ-d13d1917fbdf-48","name":"ShawnNguyen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U02452D0NSH-88aacd87d7ab-48","name":"SimonDircks"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U450DLAF7-8767c7e25b5e-48","name":"StellaCamacho"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UL9EFPRFH-1be370f09d48-48","name":"StephanieLane"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UL59X1B3M-ga91e087f585-48","name":"StephenNeweissman"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01BF07T18S-a72d170db7ae-48","name":"StephenNewkirk"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U06V4NRU0-gcdae23f71cb-48","name":"StephenWright"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01DH3GSGQN-ef0d9e60f633-48","name":"StetsonPierce"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U05R5QPQVU0-gb5e6dcad77e-48","name":"StoneChen"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U05MTTVBWV7-b18d72ce25ff-48","name":"SundiMyint"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U4A8WDK4H-d73111fa3701-48","name":"SusanJacob"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U93S5GSJX-46ec3fa405f6-48","name":"TimJordan"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U0B4P0FNV-gaffc11c3977-48","name":"TonySimone"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U9B9DA6AU-528949a6a29f-48","name":"TylerJohnson"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U6986TW6Q-76131b724bd9-48","name":"VijayYaraballi"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U03BPC36Z50-11fb831d9c56-48","name":"VladFilippov"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-URYAX6ZA5-9effe1d43929-48","name":"ZachPfeiffer"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-UQ270CR1R-879f33cf1e08-48","name":"ZacheryMoneypenny"},{"imgsrc":"https://ca.slack-edge.com/E02RD23EG10-U01CHM8P7RR-56fc23c6c038-48","name":"ZackKayser"}];
  return slackUsers.find(({name}) => re.test(name))?.imgsrc ?? `https://gravatar.com/avatar/${encodeURIComponent(uname)}?s=48&d=retro`;
}

window.app = new App();