const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://super-global-bet.vercel.app",
    methods: ["GET", "POST"]
  }
});

let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log('🟢 Usuario conectado:', socket.id);

  socket.on('join_game', ({ bet, choice }) => {
    if (!waitingPlayer) {
      waitingPlayer = { socket, bet, choice };
      socket.emit('waiting', { message: 'Esperando oponente...' });
    } else {
      const player1 = waitingPlayer;
      const player2 = { socket, bet, choice };

      const flip = Math.random() < 0.5 ? 'heads' : 'tails';
      const winner =
        flip === player1.choice ? player1.socket : player2.choice === flip ? player2.socket : null;

      const resultPayload = {
        flip,
        winner: winner?.id || null
      };

      player1.socket.emit('coin_flip_result', resultPayload);
      player2.socket.emit('coin_flip_result', resultPayload);

      waitingPlayer = null;
    }
  });

  socket.on('disconnect', () => {
    if (waitingPlayer?.socket.id === socket.id) {
      waitingPlayer = null;
    }
    console.log('🔴 Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎲 Servidor escuchando en puerto ${PORT}`);
});
