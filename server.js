const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 8080;

// Serwowanie plików statycznych z folderu public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint główny – wysyła index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Uruchomienie serwera
const server = app.listen(PORT, () => {
  console.log(`Server działa na porcie ${PORT}`);
});

// WebSocket
const wss = new WebSocket.Server({ server });
let waitingUser = null;

wss.on('connection', (ws) => {
  ws.partner = null;

  if (!waitingUser) {
    waitingUser = ws;
    ws.send(JSON.stringify({ type: 'system', message: 'Czekanie na partnera...' }));
  } else {
    ws.partner = waitingUser;
    waitingUser.partner = ws;

    ws.send(JSON.stringify({ type: 'system', message: 'Połączono z partnerem!' }));
    waitingUser.send(JSON.stringify({ type: 'system', message: 'Połączono z partnerem!' }));

    waitingUser = null;
  }

  ws.on('message', (msg) => {
    let data;
    try { data = JSON.parse(msg); } catch (e) { return; }

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
