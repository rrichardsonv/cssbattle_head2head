const socket = io();
const players = {};

socket.on('change', (payload) => {
  const { name, text } = JSON.parse(payload);

  if (players[name] === undefined) {
    players[name] = createPlayer(name, text);
  } else {
    players[name](text);
  }
});

function createPlayer (name, text) {
  const d = document.createElement('div');
  d.id = name.replace(/\s/, '-');
  d.classList.add('player');

  const t = document.createElement('h3');
  t.innerText = name;
  d.appendChild(t);

  const p = document.createElement('iframe');
  p.classList.add('preview');
  p.title = "Preview";
  p.style.background = "white";
  p.style.width = "400px";
  p.style.height = "300px";
  p.style.border = "0";
  p.style.outline = "0";

  const c = document.createElement('div');
  const code = document.createElement('code');
  const pre = document.createElement('pre');

  code.appendChild(pre);
  c.appendChild(code);
  d.appendChild(c);
  d.appendChild(p);

  document.body.appendChild(d);
  

  const update = (text) => {
    pre.innerText = text;
    p.contentDocument.write(text.replace(/^\s+/gm, '').replace(/\s+$/, ''));
    p.contentWindow.document.close();
  };

  update(text);
  return update;
};

