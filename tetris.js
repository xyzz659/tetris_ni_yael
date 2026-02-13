const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const nextPieceElement = document.getElementById('next-piece');
const homescreen = document.getElementById('homescreen');
const gameContainer = document.getElementById('game-container');
const startButton = document.getElementById('start-game');
const easyButton = document.getElementById('easy');
const mediumButton = document.getElementById('medium');
const hardButton = document.getElementById('hard');
const homeButton = document.getElementById('home-button');
const helpButton = document.getElementById('help-button');
const description = document.getElementById('description');

// Mobile control buttons
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const rotateBtn = document.getElementById('rotate-btn');
const softDropBtn = document.getElementById('soft-drop-btn');
const hardDropBtn = document.getElementById('hard-drop-btn');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const COLORS = ['#000', '#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#fff'];

let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
let score = 0;
let currentPiece = null;
let nextPiece = null;
let dropTime = 0;
let dropInterval = 1000; // Default medium
let gameRunning = false;

// Touch variables for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
let lastTap = 0;

// Tetromino shapes
const TETROMINOES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[0, 1, 0], [1, 1, 1]], // T
    [[1, 0, 0], [1, 1, 1]], // J
    [[0, 0, 1], [1, 1, 1]], // L
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

function createPiece(type) {
    return {
        shape: TETROMINOES[type],
        color: type + 1,
        x: Math.floor(COLS / 2) - 1,
        y: 0
    };
}

function drawBlock(x, y, color) {
    ctx.fillStyle = COLORS[color];
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
}

function drawPiece(piece) {
    piece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                drawBlock(piece.x + dx, piece.y + dy, piece.color);
            }
        });
    });
}

function drawNextPiece() {
    const nextCanvas = document.createElement('canvas');
    nextCanvas.width = 120;
    nextCanvas.height = 120;
    const nextCtx = nextCanvas.getContext('2d');
    nextCtx.clearRect(0, 0, 120, 120);
    nextPiece.shape.forEach((row, dy) => {
        row.forEach((value, dx) => {
            if (value) {
                nextCtx.fillStyle = COLORS[nextPiece.color];
                nextCtx.fillRect(dx * 30 + 30, dy * 30 + 30, 30, 30);
                nextCtx.strokeStyle = '#000';
                nextCtx.strokeRect(dx * 30 + 30, dy * 30 + 30, 30, 30);
            }
        });
    });
    nextPieceElement.innerHTML = 'Next:<br>';
    nextPieceElement.appendChild(nextCanvas);
}

function collide(piece, board, dx = 0, dy = 0) {
    return piece.shape.some((row, y) =>
        row.some((value, x) =>
            value && (board[piece.y + y + dy] && board[piece.y + y + dy][piece.x + x + dx]) !== 0
        )
    );
}

function rotate(piece, direction = 1) {  // 1 for clockwise, -1 for counter-clockwise
    let rotated;
    if (direction === 1) {
        // Clockwise: transpose and reverse each row
        rotated = piece.shape[0].map((_, index) =>
            piece.shape.map(row => row[index]).reverse()
        );
    } else {
        // Counter-clockwise: reverse each row and transpose
        rotated = piece.shape.map(row => row.slice().reverse());
        rotated = rotated[0].map((_, index) =>
            rotated.map(row => row[index])
        );
    }
    const rotatedPiece = { ...piece, shape: rotated };
    if (!collide(rotatedPiece, board)) {
        piece.shape = rotated;
    }
}

function placePiece(piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value) {
                board[piece.y + y][piece.x + x] = piece.color;
            }
        });
    });
}

function clearLines() {
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            board.splice(y, 1);
            board.unshift(Array(COLS).fill(0));
            score += 100;
            scoreElement.textContent = `Score: ${score}`;
            y++; // Check the same row again
        }
    }
}

function gameLoop(time = 0) {
    if (!gameRunning) return;
    const deltaTime = time - dropTime;
    if (deltaTime > dropInterval) {
        if (!collide(currentPiece, board, 0, 1)) {
            currentPiece.y++;
        } else {
            placePiece(currentPiece);
            clearLines();
            currentPiece = nextPiece;
            nextPiece = createPiece(Math.floor(Math.random() * TETROMINOES.length));
            drawNextPiece();
            if (collide(currentPiece, board)) {
                alert('Game Over! Score: ' + score);
                resetGame();
            }
        }
        dropTime = time;
    }
    drawBoard();
    drawPiece(currentPiece);
    requestAnimationFrame(gameLoop);
}

function movePiece(dx) {
    if (!collide(currentPiece, board, dx, 0)) {
        currentPiece.x += dx;
    }
}

function dropPiece() {
    while (!collide(currentPiece, board, 0, 1)) {
        currentPiece.y++;
    }
}

function resetGame() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    gameRunning = false;
    homescreen.style.display = 'block';
    gameContainer.style.display = 'none';
}

function startGame(difficulty) {
    switch (difficulty) {
        case 'easy':
            dropInterval = 1500;  // Slower for easy
            break;
        case 'medium':
            dropInterval = 1000;  // Standard speed
            break;
        case 'hard':
            dropInterval = 500;  // Faster for hard
            break;
    }
    currentPiece = createPiece(Math.floor(Math.random() * TETROMINOES.length));
    nextPiece = createPiece(Math.floor(Math.random() * TETROMINOES.length));
    drawNextPiece();
    gameRunning = true;
    homescreen.style.display = 'none';
    gameContainer.style.display = 'block';
    gameLoop();
}

// Keyboard event listeners for PC/Laptop
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            movePiece(-1);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            movePiece(1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (!collide(currentPiece, board, 0, 1)) currentPiece.y++;
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            rotate(currentPiece, 1);  // Clockwise
            break;
        case 'z':
        case 'Z':
            rotate(currentPiece, -1);  // Counter-clockwise
            break;
        case ' ':
            e.preventDefault();
            dropPiece();
            break;
    }
});

// Touch event handlers for mobile
canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;

    // Double-tap detection for hard drop
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
        dropPiece();
        lastTap = 0;
    } else {
        lastTap = currentTime;
    }
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;
});

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine touch area on canvas
    const rect = canvas.getBoundingClientRect();
    const touchX = touchStartX - rect.left;

    if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 50) {
            movePiece(1); // Swipe right: move right
        } else if (deltaX < -50) {
            movePiece(-1); // Swipe left: move left
        }
    } else {
        // Vertical swipe or tap
        if (deltaY > 50) {
            if (!collide(currentPiece, board, 0, 1)) currentPiece.y++; // Swipe down: soft drop
        } else if (absDeltaX < 10 && absDeltaY < 10) {
            // Tap: rotate if in center, move if on sides
            if (touchX < canvas.width / 3) {
                movePiece(-1); // Tap left third: move left
            } else if (touchX > (canvas.width * 2) / 3) {
                movePiece(1); // Tap right third: move right
            } else {
                rotate(currentPiece, 1); // Tap center: rotate clockwise
            }
        }
    }
});

// Event listeners for mobile control buttons
leftBtn.addEventListener('click', () => {
    if (gameRunning) movePiece(-1);
});

rightBtn.addEventListener('click', () => {
    if (gameRunning) movePiece(1);
});

rotateBtn.addEventListener('click', () => {
    if (gameRunning) rotate(currentPiece, 1);
});

softDropBtn.addEventListener('click', () => {
    if (gameRunning && !collide(currentPiece, board, 0, 1)) currentPiece.y++;
});

hardDropBtn.addEventListener('click', () => {
    if (gameRunning) dropPiece();
});

// Event listeners for homescreen
easyButton.addEventListener('click', () => startGame('easy'));
mediumButton.addEventListener('click', () => startGame('medium'));
hardButton.addEventListener('click', () => startGame('hard'));

// Event listener for home button
homeButton.addEventListener('click', resetGame);

// Event listener for help button
helpButton.addEventListener('click', () => {
    description.style.display = description.style.display === 'none' ? 'block' : 'none';
});
