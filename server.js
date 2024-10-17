const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running');
});

const wss = new WebSocket.Server({ server });

const lobbies = new Map();

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log('Received message:', data); // Add this line for debugging

        switch (data.type) {
            case 'CREATE_LOBBY':
                const lobbyId = uuidv4().substr(0, 6).toUpperCase();
                lobbies.set(lobbyId, {
                    host: ws,
                    visitor: null,
                    board: Array(3).fill(null).map(() => Array(3).fill(null)),
                    currentPlayer: 'X',
                    difficulty: 2
                });
                ws.send(JSON.stringify({ type: 'LOBBY_CREATED', lobbyId }));
                break;

            case 'JOIN_LOBBY':
                const lobby = lobbies.get(data.lobbyId);
                if (lobby) {
                    if (!lobby.visitor) {
                        lobby.visitor = ws;
                        lobby.host.send(JSON.stringify({ type: 'GAME_START', player: 'X' }));
                        lobby.visitor.send(JSON.stringify({ type: 'GAME_START', player: 'O' }));
                        broadcastGameState(lobby);
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
                    gameLobby.currentPlayer = gameLobby.currentPlayer === 'X' ? 'O' : 'X';
                    broadcastGameState(gameLobby);
                    checkGameOver(gameLobby);
                }
                break;

            case 'RESET_GAME':
                const resetLobby = lobbies.get(data.lobbyId);
                if (resetLobby && ws === resetLobby.host) {
                    resetLobby.board = Array(3).fill(null).map(() => Array(3).fill(null));
                    resetLobby.currentPlayer = 'X';
                    broadcastGameState(resetLobby);
                    broadcastToLobby(resetLobby, { type: 'RESET_GAME' });
                }
                break;

            case 'SET_DIFFICULTY':
                const difficultyLobby = lobbies.get(data.lobbyId);
                if (difficultyLobby && ws === difficultyLobby.host) {
                    difficultyLobby.difficulty = data.difficulty;
                    broadcastToLobby(difficultyLobby, { type: 'SET_DIFFICULTY', difficulty: data.difficulty });
                }
                break;

            case 'CHOOSE_PLAYER':
                const playerLobby = lobbies.get(data.lobbyId);
                if (playerLobby && ws === playerLobby.host) {
                    playerLobby.host.send(JSON.stringify({ type: 'GAME_START', player: data.player }));
                    playerLobby.visitor.send(JSON.stringify({ type: 'GAME_START', player: data.player === 'X' ? 'O' : 'X' }));
                    broadcastGameState(playerLobby);
                }
                break;
        }
    });

    ws.on('close', () => {
        for (const [lobbyId, lobby] of lobbies.entries()) {
            if (lobby.host === ws || lobby.visitor === ws) {
                if (lobby.host === ws) {
                    if (lobby.visitor) {
                        lobby.visitor.send(JSON.stringify({ type: 'OPPONENT_LEFT' }));
                    }
                    lobbies.delete(lobbyId);
                } else {
                    lobby.visitor = null;
                    lobby.host.send(JSON.stringify({ type: 'OPPONENT_LEFT' }));
                }
                break;
            }
        }
    });
});

function broadcastGameState(lobby) {
    const gameState = {
        type: 'UPDATE_BOARD',
        board: lobby.board,
        currentPlayer: lobby.currentPlayer
    };
    broadcastToLobby(lobby, gameState);
}

function broadcastToLobby(lobby, message) {
    lobby.host.send(JSON.stringify(message));
    if (lobby.visitor) {
        lobby.visitor.send(JSON.stringify(message));
    }
}

function checkGameOver(lobby) {
    const winner = getWinner(lobby.board);
    if (winner) {
        broadcastToLobby(lobby, { type: 'GAME_OVER', winner });
    } else if (isBoardFull(lobby.board)) {
        broadcastToLobby(lobby, { type: 'GAME_OVER', isDraw: true });
    }
}

function getWinner(board) {
    const lines = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]]
    ];

    for (let line of lines) {
        const [a, b, c] = line;
        if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            return board[a[0]][a[1]];
        }
    }
    return null;
}

function isBoardFull(board) {
    return board.every(row => row.every(cell => cell !== null));
}

server.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});