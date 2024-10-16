# Shim-Sham-Sho
Tic-Tac-Toe game with past moves getting vanished.

## Explanation:
- Board Initialization: Creates a 3x3 board represented as a list of lists. Each cell starts as None, representing an empty cell.
- Move Handling: The make_move function updates the player's move list (X_moves or O_moves) and handles the logic to keep only the last three moves visible. If the list exceeds three moves, the oldest one is removed and the corresponding cell on the board is cleared.
- Display Logic: display_board prints the board after each move, replacing None values with spaces for better readability.
- Winning Conditions: The check_winner function checks for standard win conditions in rows, columns, and diagonals.
- Game Loop: The start_game function handles player input, alternates turns, and checks for game end conditions (win or draw).
## How to Run:
- Call the start_game() function to begin the game.
Players take turns inputting their moves using the format row col (e.g., 0 1).
The board updates after each move, showing only the most recent three moves for each player.
The game ends when there’s a win or a draw.