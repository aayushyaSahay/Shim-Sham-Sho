"use client";

import React, { useState, useEffect } from 'react';
import { X, Circle, Sun, Moon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Type definitions for the player and board state
type Player = 'X' | 'O';
type BoardState = (Player | null)[][];

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
    // State management
    const [board, setBoard] = useState<BoardState>(Array(3).fill(null).map(() => Array(3).fill(null)));
    const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
    const [winner, setWinner] = useState<Player | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [xMoves, setXMoves] = useState<[number, number][]>([]);
    const [oMoves, setOMoves] = useState<[number, number][]>([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

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

    useEffect(() => {
        if (winner) {
            playWinSound();
        } else if (isDraw) {
            playLoseSound();
        }
    }, [winner, isDraw]);

    return (
        <div className={`${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'} flex flex-col items-center justify-center min-h-screen`}>
            <h1 className="text-4xl font-bold mb-8">Custom Tic-Tac-Toe</h1>
            <div className="flex justify-end w-full max-w-md mb-4">
                <label className="flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={isDarkMode}
                        onChange={() => setIsDarkMode(!isDarkMode)}
                    />
                    <div className={`relative w-20 h-10 rounded-full bg-gray-300 ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'} transition duration-200 ease-linear`}>
                        <div className={`absolute top-1 left-2 flex items-center justify-center transition-transform duration-200 ease-linear ${isDarkMode ? 'transform translate-x-8' : ''} rounded-full bg-white w-8 h-8`}>
                            {isDarkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-blue-500" />}
                        </div>
                    </div>
                </label>
            </div>
            <div className={`${isDarkMode ? 'bg-gray-200' : 'bg-gray-600'} bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg`}>
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <button
                                key={`${rowIndex}-${colIndex}`}
                                className={`w-20 h-20 ${isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-200'} rounded-lg flex items-center justify-center text-4xl focus:outline-none hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors`}
                                onClick={() => makeMove(rowIndex, colIndex)}
                                disabled={Boolean(cell) || Boolean(winner) || isDraw}
                            >
                                {cell === 'X' && <X size={40} className="text-blue-500" />}
                                {cell === 'O' && <Circle size={40} className="text-red-500" />}
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
                <div className="flex justify-between items-center">
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-gray-800' : 'text-gray-300'}`}>
                        Current Player: {currentPlayer === 'X' ? <X size={24} className="inline text-blue-500" /> : <Circle size={24} className="inline text-red-500" />}
                    </p>
                    <Button onClick={resetGame} className="bg-blue-500 hover:bg-blue-600 text-white">
                        Reset Game
                    </Button>
                </div>
            </div>
            <p className="mt-4 text-center text-sm">
                {`Only the last three moves of each player are visible. Focus on strategy!`}
            </p>
            <footer className="mt-8 text-center text-xs">
                <p>Contact: <a href="mailto:cs1230543@iitd.ac.in" className="underline">cs1230543@iitd.ac.in</a></p>
                <p>Version 1.0</p>
            </footer>
        </div>
    );
};

export default CustomTicTacToe;
