"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { X, Circle, Sun, Moon, Home } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Player = 'X' | 'O';
type BoardState = (Player | null)[][];
type DifficultyLevel = 1 | 2 | 3;

let audioContext: AudioContext | null = null;
let clickSound: HTMLAudioElement | null = null;
let winSound: HTMLAudioElement | null = null;
let loseSound: HTMLAudioElement | null = null;
let resetSound: HTMLAudioElement | null = null;

if (typeof window !== 'undefined' && window.AudioContext) {
    audioContext = new (window.AudioContext)();
    clickSound = new Audio('/sounds/click.wav');
    clickSound.volume = 0.2;
    winSound = new Audio('/sounds/win.wav');
    winSound.volume = 0.3;
    loseSound = new Audio('/sounds/lose.wav');
    loseSound.volume = 0.3;
    resetSound = new Audio('/sounds/click.wav');
    resetSound.volume = 0.2;
}

const OnlineTicTacToe = () => {
    const [board, setBoard] = useState<BoardState>(Array(3).fill(null).map(() => Array(3).fill(null)));
    const [player, setPlayer] = useState<Player | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
    const [winner, setWinner] = useState<Player | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [xMoves, setXMoves] = useState<[number, number][]>([]);
    const [oMoves, setOMoves] = useState<[number, number][]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(2);
    const [lobbyId, setLobbyId] = useState('');
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [gameStatus, setGameStatus] = useState('waiting');
    const [message, setMessage] = useState('');
    const [isHost, setIsHost] = useState(false);

    const resumeAudioContext = () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    };

    const playClickSound = () => {
        resumeAudioContext();
        clickSound?.play().catch((error) => {
            console.error("Click sound playback failed:", error);
        });
    };

    const playWinSound = () => {
        resumeAudioContext();
        winSound?.play().catch((error) => {
            console.error("Win sound playback failed:", error);
        });
    };

    const playLoseSound = () => {
        resumeAudioContext();
        loseSound?.play().catch((error) => {
            console.error("Lose sound playback failed:", error);
        });
    };

    const playResetSound = () => {
        resumeAudioContext();
        resetSound?.play().catch((error) => {
            console.error("Reset sound playback failed:", error);
        });
    };

    const makeMove = (row: number, col: number) => {
        if (board[row][col] !== null || winner || isDraw || currentPlayer !== player) return;
        playClickSound();
        ws?.send(JSON.stringify({ type: 'MAKE_MOVE', lobbyId, row, col, player }));
    };

    const resetGame = () => {
        if (!isHost) return;
        playResetSound();
        ws?.send(JSON.stringify({ type: 'RESET_GAME', lobbyId }));
    };

    const handleDifficultyChange = (newDifficulty: string) => {
        if (!isHost) return;
        const difficulty = parseInt(newDifficulty) as DifficultyLevel;
        setDifficultyLevel(difficulty);
        ws?.send(JSON.stringify({ type: 'SET_DIFFICULTY', lobbyId, difficulty }));
    };
    const handlePlayerChoice = (chosenPlayer: Player) => {
        if (!isHost) return;
        ws?.send(JSON.stringify({ type: 'CHOOSE_PLAYER', lobbyId, player: chosenPlayer }));
    };

    const connectWebSocket = useCallback(() => {
        const serverIP = 'https://tictactoebackend-4dk1.onrender.com'; // Change this to your server's IP if needed
        const socket = new WebSocket(`wss://${serverIP}:8080`);
        setWs(socket);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received message:', data); // Add this line for debugging
            switch (data.type) {
                case 'LOBBY_CREATED':
                    setLobbyId(data.lobbyId);
                    setIsHost(true);
                    setMessage(`Lobby created! Share this code with your friend: ${data.lobbyId}`);
                    break;
                case 'GAME_START':
                    setPlayer(data.player);
                    setGameStatus('playing');
                    setMessage(`Game started! You are player ${data.player}`);
                    break;
                case 'UPDATE_BOARD':
                    setBoard(data.board);
                    setCurrentPlayer(data.currentPlayer);
                    setXMoves(data.xMoves);
                    setOMoves(data.oMoves);
                    break;
                case 'GAME_OVER':
                    setWinner(data.winner);
                    setIsDraw(data.isDraw);
                    if (data.winner === player) {
                        playWinSound();
                        setMessage("The game has ended, reset the board to play again!");
                    } else if (data.winner) {
                        playLoseSound();
                        setMessage("The game has ended, reset the board to play again!");
                    } else if (data.isDraw) {
                        setMessage("The game has ended, reset the board to play again!");
                    }
                    console.log(xMoves);
                    console.log(oMoves);
                    break;
                case 'RESET_GAME':
                    setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
                    setCurrentPlayer('X');
                    setWinner(null);
                    setIsDraw(false);
                    setXMoves([]);
                    setOMoves([]);
                    setMessage("Game has been reset. Good luck!");
                    break;
                case 'SET_DIFFICULTY':
                    setDifficultyLevel(data.difficulty);
                    break;
                case 'ERROR':
                    setMessage(data.message);
                    break;
                case 'OPPONENT_LEFT':
                    setGameStatus('waiting');
                    setMessage('Your opponent left the game. Waiting for a new player...');
                    break;
            }
        };

        socket.onclose = () => {
            setMessage('Connection to server lost. Please refresh the page.');
        };
    }, []);

    useEffect(() => {
        connectWebSocket();
        return () => {
            if (ws) ws.close();
        };
    }, [connectWebSocket]);

    const createLobby = () => {
        ws?.send(JSON.stringify({ type: 'CREATE_LOBBY' }));
    };

    const joinLobby = () => {
        ws?.send(JSON.stringify({ type: 'JOIN_LOBBY', lobbyId }));
    };

    const goToHomePage = () => {
        // Reset all state and close the WebSocket connection
        setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
        setPlayer(null);
        setCurrentPlayer('X');
        setWinner(null);
        setIsDraw(false);
        setXMoves([]);
        setOMoves([]);
        setLobbyId('');
        setGameStatus('waiting');
        setMessage('');
        setIsHost(false);
        if (ws) ws.close();
        connectWebSocket();
    };

    return (
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} flex flex-col items-center justify-center min-h-screen p-4`}>
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-4xl font-bold">Online Tic-Tac-Toe</h1>
                    <Button onClick={goToHomePage} className="bg-gray-500 hover:bg-gray-600">
                        <Home size={24} />
                    </Button>
                </div>

                {message && (
                    <Alert className="mb-4">
                        <AlertDescription>{message}</AlertDescription>
                    </Alert>
                )}

                {gameStatus === 'waiting' && (
                    <div className="mb-4">
                        <Button onClick={createLobby} className="w-full mb-2">Create Lobby</Button>
                        <div className="flex">
                            <Input
                                value={lobbyId}
                                onChange={(e) => setLobbyId(e.target.value)}
                                placeholder="Enter Lobby Code"
                                className="flex-grow mr-2"
                            />
                            <Button onClick={joinLobby}>Join Lobby</Button>
                        </div>
                    </div>
                )}

                {gameStatus === 'playing' && (
                    <div className={`${isDarkMode ? 'bg-white' : 'bg-gray-700'} p-4 sm:p-8 rounded-lg shadow-lg`}>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
                            {board.map((row, rowIndex) =>
                                row.map((cell, colIndex) => (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`w-full aspect-square ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex items-center justify-center text-2xl sm:text-4xl focus:outline-none transition-colors`}
                                        onClick={() => makeMove(rowIndex, colIndex)}
                                        disabled={cell !== null || currentPlayer !== player || winner !== null || isDraw}
                                    >
                                        {cell === 'X' && <X size={50} className="text-blue-500" />}
                                        {cell === 'O' && <Circle size={50} className="text-red-500" />}
                                    </button>
                                ))
                            )}
                        </div>
                        <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-800' : 'text-gray-200'}`}>
                            You are: {player === 'X' ? <X size={24} className="inline text-blue-500" /> : <Circle size={24} className="inline text-red-500" />}
                        </p>
                        <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-800' : 'text-gray-200'}`}>
                            Current turn: {currentPlayer === 'X' ? <X size={24} className="inline text-blue-500" /> : <Circle size={24} className="inline text-red-500" />}
                        </p>
                        {difficultyLevel === 3 && (winner || isDraw) && (
                            <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-800' : 'text-gray-200'}`}>
                                Showing last 3 moves of both players.
                            </p>
                        )}
                        {(winner || isDraw) && (
                            <p className={`text-xl font-bold mt-4 ${isDarkMode ? 'text-gray-800' : 'text-gray-200'}`}>
                                {winner ? `Player ${winner} wins!` : 'It\'s a draw!'}
                            </p>
                        )}
                    </div>
                )}

                <p className="mt-4 text-center">
                    {gameStatus === 'waiting' ? 'Waiting for opponent...' : `Game in progress. Lobby Code: ${lobbyId}`}
                </p>

                {isHost && (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Difficulty Level</h2>
                            <Select onValueChange={handleDifficultyChange} value={difficultyLevel.toString()}>
                                <SelectTrigger className={`w-40 ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Easy (Normal)</SelectItem>
                                    <SelectItem value="2">Medium (Last 3 moves)</SelectItem>
                                    <SelectItem value="3">Hard (Last move only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Choose Player</h2>
                            <div>
                                <Button onClick={() => handlePlayerChoice('X')} className="mr-2">Play as X</Button>
                                <Button onClick={() => handlePlayerChoice('O')}>Play as O</Button>
                            </div>
                        </div>

                        <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto mb-4">
                            Reset Game
                        </Button>
                    </>
                )}

                <div className="flex justify-end">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={isDarkMode}
                            onChange={() => setIsDarkMode(!isDarkMode)}
                        />
                        <div className={`relative w-12 h-6 sm:w-16 sm:h-8 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'} transition duration-200 ease-linear`}>
                            <div className={`absolute top-0.5 left-0.5 flex items-center justify-center transition-transform duration-200 ease-linear ${isDarkMode ? 'transform translate-x-6 sm:translate-x-8' : ''} rounded-full bg-white w-5 h-5 sm:w-7 sm:h-7`}>
                                {isDarkMode ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-blue-500" />}
                            </div>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default OnlineTicTacToe;