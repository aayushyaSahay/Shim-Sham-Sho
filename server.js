const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });

const lobbies = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'CREATE_LOBBY':
        const lobbyId = uuidv4().substr(0, 6).toUpperCase();
        lobbies.set(lobbyId, { players: [ws], board: Array(3).fill(null).map(() => Array(3).fill(null)) });
        ws.send(JSON.stringify({ type: 'LOBBY_CREATED', lobbyId }));
        break;

      case 'JOIN_LOBBY':
        const lobby = lobbies.get(data.lobbyId);
        if (lobby) {
          if (lobby.players.length < 2) {
            lobby.players.push(ws);
            lobby.players.forEach((player, index) => {
              player.send(JSON.stringify({ type: 'GAME_START', player: index === 0 ? 'X' : 'O' }));
            });
          } else {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Lobby is full' }));
          }
        } else {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Lobby not found' }));
        }
        break;

      case 'MAKE_MOVE':
        const gameLobby = lobbies.get(data.lobbyId);
        if (gameLobby) {
          gameLobby.board[data.row][data.col] = data.player;
          gameLobby.players.forEach((player) => {
            player.send(JSON.stringify({ type: 'UPDATE_BOARD', board: gameLobby.board }));
          });
        }
        break;

      case 'GAME_OVER':
        lobbies.delete(data.lobbyId);
        break;
    }
  });

  ws.on('close', () => {
    for (const [lobbyId, lobby] of lobbies.entries()) {
      const index = lobby.players.indexOf(ws);
      if (index !== -1) {
        lobby.players.splice(index, 1);
        if (lobby.players.length === 0) {
          lobbies.delete(lobbyId);
        } else {
          lobby.players[0].send(JSON.stringify({ type: 'OPPONENT_LEFT' }));
        }
        break;
      }
    }
  });
});