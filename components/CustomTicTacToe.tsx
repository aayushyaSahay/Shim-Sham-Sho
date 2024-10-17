"use client";

import React, { useState, useEffect } from 'react';
import { X, Circle, Sun, Moon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Type definitions
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

const CustomTicTacToe = () => {
    const [board, setBoard] = useState<BoardState>(Array(3).fill(null).map(() => Array(3).fill(null)));
    const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
    const [winner, setWinner] = useState<Player | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [xMoves, setXMoves] = useState<[number, number][]>([]);
    const [oMoves, setOMoves] = useState<[number, number][]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>(2);

    const resumeAudioContext = () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    };

    // Play sound functions
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

    const checkWinner = (player: Player): boolean => {
        for (let i = 0; i < 3; i++) {
            if (
                board[i][0] === player && board[i][1] === player && board[i][2] === player ||
                board[0][i] === player && board[1][i] === player && board[2][i] === player
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

        if (checkWinner(currentPlayer)) {
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

    const visibleBoard = getVisibleBoard();

    return (
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} flex flex-col items-center justify-center min-h-screen p-4`}>
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-4xl font-bold">Custom Tic-Tac-Toe</h1>
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
                <div className={`${isDarkMode ? 'bg-white' : 'bg-gray-700'} p-4 sm:p-8 rounded-lg shadow-lg`}>
                    <div className="mb-4">
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
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
                        {visibleBoard.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                                <button
                                    key={`${rowIndex}-${colIndex}`}
                                    className={`w-full aspect-square ${isDarkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-lg flex items-center justify-center text-2xl sm:text-4xl focus:outline-none transition-colors`}
                                    onClick={() => makeMove(rowIndex, colIndex)}
                                    disabled={Boolean(cell) || Boolean(winner) || isDraw}
                                >
                                    {cell === 'X' && <X size={50} className="text-blue-500" />}
                                    {cell === 'O' && <Circle size={50} className="text-red-500" />}
                                </button>
                            ))
                        )}
                    </div>
                    {(winner || isDraw) && (
                        <Alert className="mb-4">
                            <AlertTitle>{winner ? 'Game Over' : 'Draw'}</AlertTitle>
                            <AlertDescription>
                                {winner ? `Player ${winner} wins!` : "It's a draw!"}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                        <p className={`text-lg font-semibold mb-2 sm:mb-0 ${isDarkMode ? 'text-gray-800' : 'text-gray-200'}`}>
                            Current Player: {currentPlayer === 'X' ? <X size={24} className="inline text-blue-500" /> : <Circle size={24} className="inline text-red-500" />}
                        </p>
                        <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto">
                            Reset Game
                        </Button>
                    </div>
                </div>
                <p className="mt-4 text-center text-sm">
                    {difficultyLevel === 1
                        ? "Classic Tic-Tac-Toe: All moves visible"
                        : difficultyLevel === 2
                        ? "Medium: Only the last three moves of each player are considered."
                        : "Hard: Only the last three moves of each player are considered and only the last move of each player is visible."}
                </p>
                <footer className="mt-8 text-center text-xs">
                    <p>Contact: <a href="mailto:cs1230543@iitd.ac.in" className="underline">cs1230543@iitd.ac.in</a></p>
                    <p>Version 2.0</p>
                </footer>
            </div>
        </div>
    );
};

export default CustomTicTacToe;