"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, Circle, Sun, Moon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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

    const checkWinner = (board: BoardState, player: Player): boolean => {
        for (let i = 0; i < 3; i++) {
            if (
                board[i][0] === player && board[i][1] === player && board[i][2] === player ||
                board[ 0][i] === player && board[1][i] === player && board[2][i] === player
            ) {
                return true;
            }
        }
        if (
            board[0][0] === player && board[1][1] === player && board[2][2] === player ||
            board[0][2] === player && board[1][1] === player && board[2][0] === player
        ) {
            return true;
        }
        return false;
    };

    const makeMove = (row: number, col: number) => {
        if (board[row][col] !== null || winner || isDraw) return;

        playClickSound();
        const newBoard = [...board];
        newBoard[row][col] = currentPlayer;

        if (difficultyLevel !== 1) {
            if (currentPlayer === 'X') {
                const newXMoves = [...xMoves, [row, col] as [number, number]];
                if (newXMoves.length > 3) {
                    const [oldRow, oldCol] = newXMoves.shift()!;
                    newBoard[oldRow][oldCol] = null;
                }
                setXMoves(newXMoves);
            } else {
                const newOMoves = [...oMoves, [row, col] as [number, number]];
                if (newOMoves.length > 3) {
                    const [oldRow, oldCol] = newOMoves.shift()!;
                    newBoard[oldRow][oldCol] = null;
                }
                setOMoves(newOMoves);
            }
        }

        setBoard(newBoard);

        if (checkWinner(newBoard, currentPlayer)) {
            setWinner(currentPlayer);
        } else if (newBoard.every(row => row.every(cell => cell !== null))) {
            setIsDraw(true);
        } else {
            setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
        }
    };

    const resetGame = () => {
        playResetSound();
        setBoard(Array(3).fill(null).map(() => Array(3).fill(null)));
        setCurrentPlayer('X');
        setWinner(null);
        setIsDraw(false);
        setXMoves([]);
        setOMoves([]);
    };

    const handleDifficultyChange = (newDifficulty: string) => {
        setDifficultyLevel(parseInt(newDifficulty) as DifficultyLevel);
        resetGame();
    };

    const getVisibleBoard = (): BoardState => {
        if (difficultyLevel === 1 || winner) {
            return board;
        } else if (difficultyLevel === 2) {
            return board.map(row => [...row]);
        } else {
            const visibleBoard: BoardState = Array(3).fill(null).map(() => Array(3).fill(null));
            if (xMoves.length > 0) {
                const [xRow, xCol] = xMoves[xMoves.length - 1];
                visibleBoard[xRow][xCol] = 'X';
            }
            if (oMoves.length > 0) {
                const [oRow, oCol] = oMoves[oMoves.length - 1];
                visibleBoard[oRow][oCol] = 'O';
            }
            return visibleBoard;
        }
    };

    useEffect(() => {
        if (winner) {
            playWinSound();
        } else if (isDraw) {
            playLoseSound();
        }
    }, [winner, isDraw]);

    const connectWebSocket = useCallback(() => {
        const socket = new WebSocket('ws://localhost:8080');
        setWs(socket);

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'LOBBY_CREATED':
                    setLobbyId(data.lobbyId);
                    setMessage(`Lobby created! Share this code with your friend: ${data.lobbyId}`);
                    break;
                case 'GAME_START':
                    setPlayer(data.player);
                    setGameStatus('playing');
                    setMessage(`Game started! You are player ${data.player}`);
                    break;
                case 'UPDATE_BOARD':
                    setBoard(data.board);
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

 return (
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} flex flex-col items-center justify-center min-h-screen p-4`}>
            <div className="w-full max-w-md">
                <h1 className="text-2xl sm:text-4xl font-bold mb-6">Online Tic-Tac-Toe</h1>
                
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
                            {getVisibleBoard().map((row, rowIndex) =>
                                row.map((cell, colIndex) => (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`w-full aspect-square ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex items-center justify-center text-2xl sm:text-4xl focus:outline-none transition-colors`}
                                        onClick={() => makeMove(rowIndex, colIndex)}
                                        disabled={cell !== null || player !== (getVisibleBoard().flat().filter(Boolean).length % 2 === 0 ? 'X' : 'O')}
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
                    </div>
                )}

                <p className="mt-4 text-center">
                    {gameStatus === 'waiting' ? 'Waiting for opponent...' : `Game in progress. Lobby Code: ${lobbyId}`}
                </p>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-4xl font-bold">Difficulty Level</h1>
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

                <Select onValueChange={handleDifficultyChange} value={difficultyLevel.toString()}>
                    <SelectTrigger className={`w-full ${isDarkMode ? 'bg-gray-600':'bg-white'}`}>
                        <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Easy</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">Hard</SelectItem>
                    </SelectContent>
                </Select>

                <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">
                    Reset Game
                </Button>
            </div>
        </div>
    );
};

export default OnlineTicTacToe;