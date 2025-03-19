document.addEventListener('DOMContentLoaded', () => {
    // Dark mode functionality
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Check for saved theme preference or use preferred color scheme
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-theme');
    }
    
    // Toggle dark mode
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
    
    // Game state variables
    let board = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = false;
    let humanPlayer = '';
    let aiPlayer = '';
    let scores = {
        human: 0,
        ai: 0,
        tie: 0
    };

    // DOM elements
    const cells = document.querySelectorAll('.cell');
    const statusDisplay = document.getElementById('status');
    const playAsXButton = document.getElementById('play-as-x');
    const playAsOButton = document.getElementById('play-as-o');
    const resetGameButton = document.getElementById('reset-game');
    const resetScoreButton = document.getElementById('reset-score');
    const humanScoreDisplay = document.getElementById('human-score');
    const aiScoreDisplay = document.getElementById('ai-score');
    const tieScoreDisplay = document.getElementById('tie-score');

    // Event listeners
    playAsXButton.addEventListener('click', () => startGame('X'));
    playAsOButton.addEventListener('click', () => startGame('O'));
    resetGameButton.addEventListener('click', resetGame);
    resetScoreButton.addEventListener('click', resetScore);
    cells.forEach(cell => cell.addEventListener('click', () => handleCellClick(cell)));

    // Initialize the game
    function startGame(playerChoice) {
        humanPlayer = playerChoice;
        aiPlayer = humanPlayer === 'X' ? 'O' : 'X';
        board = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        
        // Reset the board UI
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o', 'highlight');
        });
        
        statusDisplay.textContent = `You are playing as ${humanPlayer}. Your turn!`;
        
        // If AI goes first, make its move
        if (aiPlayer === 'X') {
            setTimeout(makeAiMove, 500);
        }
    }

    // Handle player's move
    function handleCellClick(cell) {
        const index = parseInt(cell.getAttribute('data-index'));
        
        // Check if the cell is empty and the game is active
        if (board[index] !== '' || !gameActive || currentPlayer !== humanPlayer) {
            return;
        }
        
        // Make the player's move
        makeMove(index, humanPlayer);
        
        // Check for game over conditions
        if (gameActive) {
            // AI's turn
            setTimeout(makeAiMove, 500);
        }
    }

    // Make a move (for both player and AI)
    function makeMove(index, player) {
        board[index] = player;
        cells[index].textContent = player;
        cells[index].classList.add(player.toLowerCase());
        
        // Check for win or draw
        if (checkWin(player)) {
            endGame(player === humanPlayer ? 'You win!' : 'AI wins!');
            highlightWinningCombination();
            updateScore(player === humanPlayer ? 'human' : 'ai');
            return;
        }
        
        if (!board.includes('')) {
            endGame("It's a tie!");
            updateScore('tie');
            return;
        }
        
        // Switch player
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (currentPlayer === humanPlayer) {
            statusDisplay.textContent = 'Your turn!';
        } else {
            statusDisplay.textContent = 'AI is thinking...';
        }
    }

    // AI move using minimax algorithm
    function makeAiMove() {
        if (!gameActive) return;
        
        const bestMove = findBestMove();
        makeMove(bestMove, aiPlayer);
    }

    // Minimax algorithm implementation
    function minimax(board, depth, isMaximizing) {
        // Check terminal states
        if (checkWin(aiPlayer)) return 10 - depth;
        if (checkWin(humanPlayer)) return depth - 10;
        if (!board.includes('')) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = aiPlayer;
                    let score = minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = humanPlayer;
                    let score = minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    // Find the best move for AI
    function findBestMove() {
        let bestScore = -Infinity;
        let bestMove = -1;
        
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = aiPlayer;
                let score = minimax(board, 0, false);
                board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }

    // Check for win
    function checkWin(player) {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        return winPatterns.some(pattern => {
            return pattern.every(index => board[index] === player);
        });
    }

    // Highlight the winning combination
    function highlightWinningCombination() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        
        for (const pattern of winPatterns) {
            if (board[pattern[0]] !== '' && 
                board[pattern[0]] === board[pattern[1]] && 
                board[pattern[1]] === board[pattern[2]]) {
                pattern.forEach(index => {
                    cells[index].classList.add('highlight');
                });
                break;
            }
        }
    }

    // End the game
    function endGame(message) {
        gameActive = false;
        statusDisplay.textContent = message;
    }

    // Update score
    function updateScore(winner) {
        scores[winner]++;
        humanScoreDisplay.textContent = scores.human;
        aiScoreDisplay.textContent = scores.ai;
        tieScoreDisplay.textContent = scores.tie;
    }

    // Reset the game
    function resetGame() {
        if (!humanPlayer) {
            statusDisplay.textContent = 'Choose who goes first!';
            return;
        }
        
        startGame(humanPlayer);
    }

    // Reset the score
    function resetScore() {
        scores.human = 0;
        scores.ai = 0;
        scores.tie = 0;
        humanScoreDisplay.textContent = '0';
        aiScoreDisplay.textContent = '0';
        tieScoreDisplay.textContent = '0';
    }
});