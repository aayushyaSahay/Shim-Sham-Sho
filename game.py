import tkinter as tk
from tkinter import messagebox
import pygame
import time

# Initialize pygame for sound effects
pygame.mixer.init()

# Load sound effects
click_sound = pygame.mixer.Sound("sounds/click.wav")
win_sound = pygame.mixer.Sound("sounds/win.wav")
draw_sound = pygame.mixer.Sound("sounds/win.wav")

# Define colors and fonts
PLAYER_X_COLOR = "#ADD8E6"  # Light blue
PLAYER_O_COLOR = "#FF6347"  # Tomato red
BG_COLOR = "#F0F0F0"  # Light gray
WIN_COLOR = "#32CD32"  # Lime green
FONT = ("Arial", 24, "bold")
STATUS_FONT = ("Arial", 16, "italic")

# Create the main window
root = tk.Tk()
root.title("Tic Tac Toe")
root.geometry("400x400")

# Create a canvas for gradient background
canvas = tk.Canvas(root, width=400, height=400)
canvas.pack(fill="both", expand=True)

# Function to create gradient background
def create_gradient(canvas, color1, color2):
    for i in range(400):
        color = f"#{int(color1[1:3], 16) + i:02x}{int(color1[3:5], 16) + i:02x}{int(color1[5:], 16) + i:02x}"
        canvas.create_line(0, i, 400, i, fill=color)

create_gradient(canvas, "#FFFFFF", "#ADD8E6")

# Create a frame for the game board
frame = tk.Frame(root, bg=BG_COLOR)
frame.place(relwidth=1, relheight=1)

# Initialize game variables
board = [[None for _ in range(3)] for _ in range(3)]
current_player = 'X'
buttons = []
X_moves = []
O_moves = []

# Function to update status label
def update_status():
    status_label.config(text=f"Player {current_player}'s turn", fg=PLAYER_X_COLOR if current_player == 'X' else PLAYER_O_COLOR)

# Function to make a move
def make_move(row, col):
    global current_player

    # Check if the cell is already occupied
    if board[row][col] is not None:
        return

    # Add the move to the player's list
    if current_player == 'X':
        X_moves.append((row, col))
        if len(X_moves) > 3:
            old_row, old_col = X_moves.pop(0)
            board[old_row][old_col] = None
            buttons[old_row][old_col].config(text='', state='normal')
    elif current_player == 'O':
        O_moves.append((row, col))
        if len(O_moves) > 3:
            old_row, old_col = O_moves.pop(0)
            board[old_row][old_col] = None
            buttons[old_row][old_col].config(text='', state='normal')

    # Place the player's mark on the board
    board[row][col] = current_player
    buttons[row][col].config(text=current_player, state='disabled', fg=PLAYER_X_COLOR if current_player == 'X' else PLAYER_O_COLOR)
    click_sound.play()

    # Check for a winner or draw
    if check_winner(current_player):
        win_sound.play()
        highlight_winning_cells()
        messagebox.showinfo("Game Over", f"Player {current_player} wins!")
        restart_game()
    elif all(all(cell is not None for cell in row) for row in board):
        draw_sound.play()
        messagebox.showinfo("Game Over", "It's a draw!")
        restart_game()
    else:
        # Switch players
        current_player = 'O' if current_player == 'X' else 'X'
        update_status()

# Function to check for a winner
def check_winner(player):
    for i in range(3):
        if board[i][0] == board[i][1] == board[i][2] == player:
            return True
        if board[0][i] == board[1][i] == board[2][i] == player:
            return True
    if board[0][0] == board[1][1] == board[2][2] == player:
        return True
    if board[0][2] == board[1][1] == board[2][0] == player:
        return True
    return False

# Function to highlight winning cells
def highlight_winning_cells():
    for i in range(3):
        if board[i][0] == board[i][1] == board[i][2] == current_player:
            for j in range(3):
                buttons[i][j].config(bg=WIN_COLOR)
    for i in range(3):
        if board[0][i] == board[1][i] == board[2][i] == current_player:
            for j in range(3):
                buttons[j][i].config(bg=WIN_COLOR)
    if board[0][0] == board[1][1] == board[2][2] == current_player:
        for i in range(3):
            buttons[i][i].config(bg=WIN_COLOR)
    if board[0][2] == board[1][1] == board[2][0] == current_player:
        for i in range(3):
            buttons[i][2-i].config(bg=WIN_COLOR)

# Function to restart the game
def restart_game():
    global board, current_player, X_moves, O_moves
    board = [[None for _ in range(3)] for _ in range(3)]
    current_player = 'X'
    X_moves = []
    O_moves = []
    for row in buttons:
        for button in row:
            button.config(text='', bg='lightgray', state='normal')
    update_status()

# Function to create the game board
def create_board():
    global buttons
    buttons = []
    for row in range(3):
        button_row = []
        for col in range(3):
            button = tk.Button(frame, text='', font=FONT, width=5, height=2, bg='lightgray', relief='raised',
                               command=lambda r=row, c=col: make_move(r, c))
            button.grid(row=row, column=col, padx=5, pady=5)
            button.bind("<Enter>", lambda e, b=button: b.config(bg='lightblue'))
            button.bind("<Leave>", lambda e, b=button: b.config(bg='lightgray'))
            button_row.append(button)
        buttons.append(button_row)

# Create status label
status_label = tk.Label(root, text=f"Player {current_player}'s turn", font=STATUS_FONT, bg=BG_COLOR)
status_label.pack(side="top", pady=10)

# Create restart button
restart_button = tk.Button(root, text="Restart", font=STATUS_FONT, command=restart_game)
restart_button.pack(side="bottom", pady=10)

# Initialize the game board
create_board()
update_status()

# Start the main loop
root.mainloop()