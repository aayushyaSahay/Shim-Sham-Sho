"use client";

import React, { useState, useEffect } from 'react';
import { X, Circle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

// Type definitions for the player and board state
type Player = 'X' | 'O';
type BoardState = (Player | null)[][];

// Initialize AudioContext
const audioContext = new (window.AudioContext)();

const CustomTicTacToe = () => {
    // State management
    const [board, setBoard] = useState<BoardState>(Array(3).fill(null).map(() => Array(3).fill(null)));
    const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
    const [winner, setWinner] = useState<Player | null>(null);
    const [isDraw, setIsDraw] = useState(false);
    const [xMoves, setXMoves] = useState<[number, number][]>([]);
    const [oMoves, setOMoves] = useState<[number, number][]>([]);
    
    // Audio elements for sound effects
    const clickSound = new Audio('/sounds/click.wav');
    clickSound.volume = 0.3;
    const winSound = new Audio('/sounds/win.wav');
    winSound.volume = 0.3;
    const loseSound = new Audio('/sounds/lose.wav');
    loseSound.volume = 0.3;
    const resetSound = new Audio('/sounds/click.wav');
    resetSound.volume = 0.3;

    // Ensure the AudioContext is resumed after user interaction
    const resumeAudioContext = () => {
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    };

    // Play sound functions
    const playClickSound = () => {
        resumeAudioContext();
        clickSound.play().catch((error) => {
            console.error("Click sound playback failed:", error);
        });
    };

    const playWinSound = () => {
        resumeAudioContext();
        winSound.play().catch((error) => {
            console.error("Win sound playback failed:", error);
        });
    };

    const playLoseSound = () => {
        resumeAudioContext();
        loseSound.play().catch((error) => {
            console.error("Lose sound playback failed:", error);
        });
    };
    const playResetSound = () => {
        resumeAudioContext();
        resetSound.play().catch((error) => {
            console.error("Reset sound playback failed:", error);
        });
    };

    const checkWinner = (player: Player): boolean => {
        // Check rows, columns, and diagonals
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

        // Play the click sound
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <h1 className="text-4xl font-bold mb-8">Custom Tic-Tac-Toe</h1>
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {board.map((row, rowIndex) =>
                        row.map((cell, colIndex) => (
                            <button
                                key={`${rowIndex}-${colIndex}`}
                                className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-4xl focus:outline-none hover:bg-gray-300 transition-colors"
                                onClick={() => makeMove(rowIndex, colIndex)}
                                disabled={Boolean(cell) || Boolean(winner) || isDraw}
                            // disabled={cell !== null || winner || isDraw}
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
                    <p className="text-lg font-semibold">
                        Current Player: {currentPlayer === 'X' ? <X size={24} className="inline text-blue-500" /> : <Circle size={24} className="inline text-red-500" />}
                    </p>
                    <Button onClick={resetGame}>Reset Game</Button>
                </div>
            </div>
        </div>
    );
};

export default CustomTicTacToe;
