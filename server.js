// server.js
const WebSocket = require('ws');

// użyj portu przydzielonego przez hosting lub 8080 lokalnie
const port = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port });

console.log(`WebSocket server działa na porcie ${port}`);

let waitingUser = null;

wss.on('connection', (ws) => {
  ws.partner = null;

  // jeśli nie ma oczekującego użytkownika, ustaw bieżącego jako oczekującego
  if (waitingUser === null) {
    waitingUser = ws;
    ws.send(JSON.stringify({ type: 'system', message: 'Czekanie na partnera...' }));
  } else {
    // sparuj z oczekującym użytkownikiem
    ws.partner = waitingUser;
    waitingUser.partner = ws;

    ws.send(JSON.stringify({ type: 'system', message: 'Połączono z partnerem!' }));
    waitingUser.send(JSON.stringify({ type: 'system', message: 'Połączono z partnerem!' }));

    waitingUser = null;
  }

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch (e) { return; }

    // jeśli mamy partnera, przekaż wszystkie typy: offer, answer, ice, chat
    if (ws.partner && ['offer','answer','ice','chat'].includes(data.type)) {
      ws.partner.send(JSON.stringify(data));
    }
  });

  ws.on('close', () => {
    if (ws.partner) {
      ws.partner.send(JSON.stringify({ type: 'system', message: 'Partner rozłączył się' }));
      ws.partner.partner = null;
    }
    if (waitingUser === ws) waitingUser = null;
  });
});
