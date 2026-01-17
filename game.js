// Game Configuration
const CONFIG = {
    gridSize: 20,
    cellSize: 25,
    difficulty: {
        easy: { initialSpeed: 200, speedIncrease: 1, minSpeed: 120 },
        medium: { initialSpeed: 150, speedIncrease: 2, minSpeed: 80 },
        hard: { initialSpeed: 80, speedIncrease: 3, minSpeed: 40 }
    }
};

// Current difficulty
let currentDifficulty = 'easy';

// Game State
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = JSON.parse(localStorage.getItem('snakeHighScores') || '{"easy":0,"medium":0,"hard":0}');
let gameLoop = null;
let gameSpeed = CONFIG.difficulty.easy.initialSpeed;
let isGameOver = false;
let isPaused = false;

// DOM Elements
let scoreElement, highScoreElement, overlay, overlayTitle, overlayMessage, startBtn, difficultySelector, difficultyBtns;

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = CONFIG.gridSize * CONFIG.cellSize;
    canvas.height = CONFIG.gridSize * CONFIG.cellSize;
    
    // Get DOM elements
    scoreElement = document.getElementById('score');
    highScoreElement = document.getElementById('highScore');
    overlay = document.getElementById('overlay');
    overlayTitle = document.getElementById('overlayTitle');
    overlayMessage = document.getElementById('overlayMessage');
    startBtn = document.getElementById('startBtn');
    difficultySelector = document.getElementById('difficultySelector');
    difficultyBtns = document.querySelectorAll('.diff-btn');
    
    // Set high score for current difficulty
    updateHighScoreDisplay();
    
    // Event listeners
    startBtn.addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeydown);
    
    // Difficulty button listeners
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.difficulty;
            updateHighScoreDisplay();
        });
    });
    
    // Draw initial state
    drawGrid();
}

function updateHighScoreDisplay() {
    highScoreElement.textContent = highScore[currentDifficulty] || 0;
}

function startGame() {
    // Get difficulty settings
    const diffSettings = CONFIG.difficulty[currentDifficulty];
    
    // Reset game state
    snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    gameSpeed = diffSettings.initialSpeed;
    isGameOver = false;
    isPaused = false;
    
    scoreElement.textContent = score;
    
    // Generate first food
    generateFood();
    
    // Hide overlay and difficulty selector
    overlay.classList.add('hidden');
    overlay.classList.remove('game-over', 'paused');
    
    // Start game loop
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(gameUpdate, gameSpeed);
}

function generateFood() {
    do {
        food = {
            x: Math.floor(Math.random() * CONFIG.gridSize),
            y: Math.floor(Math.random() * CONFIG.gridSize)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function gameUpdate() {
    if (isPaused || isGameOver) return;
    
    // Update direction
    direction = nextDirection;
    
    // Calculate new head position
    const head = { ...snake[0] };
    
    switch (direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check wall collision
    if (head.x < 0 || head.x >= CONFIG.gridSize || 
        head.y < 0 || head.y >= CONFIG.gridSize) {
        gameOver();
        return;
    }
    
    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    // Add new head
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
        
        // Increase speed based on difficulty
        const diffSettings = CONFIG.difficulty[currentDifficulty];
        if (gameSpeed > diffSettings.minSpeed) {
            gameSpeed -= diffSettings.speedIncrease;
            clearInterval(gameLoop);
            gameLoop = setInterval(gameUpdate, gameSpeed);
        }
    } else {
        snake.pop();
    }
    
    // Draw
    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw food with glow effect
    drawFood();
    
    // Draw snake
    drawSnake();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(78, 204, 163, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= CONFIG.gridSize; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CONFIG.cellSize, 0);
        ctx.lineTo(i * CONFIG.cellSize, canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CONFIG.cellSize);
        ctx.lineTo(canvas.width, i * CONFIG.cellSize);
        ctx.stroke();
    }
}

function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * CONFIG.cellSize;
        const y = segment.y * CONFIG.cellSize;
        const size = CONFIG.cellSize - 2;
        
        // Create gradient for snake
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        
        if (index === 0) {
            // Head - brighter
            gradient.addColorStop(0, '#5fffb8');
            gradient.addColorStop(1, '#4ecca3');
            
            // Glow effect for head
            ctx.shadowColor = '#4ecca3';
            ctx.shadowBlur = 15;
        } else {
            // Body - gradient based on position
            const intensity = 1 - (index / snake.length) * 0.5;
            gradient.addColorStop(0, `rgba(78, 204, 163, ${intensity})`);
            gradient.addColorStop(1, `rgba(56, 178, 138, ${intensity})`);
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
        
        ctx.fillStyle = gradient;
        
        // Draw rounded rectangle
        const radius = index === 0 ? 8 : 5;
        roundRect(x + 1, y + 1, size, size, radius);
        
        // Draw eyes on head
        if (index === 0) {
            ctx.shadowBlur = 0;
            drawEyes(x, y, size);
        }
    });
    
    ctx.shadowBlur = 0;
}

function drawEyes(x, y, size) {
    const eyeSize = 4;
    const pupilSize = 2;
    
    // Eye positions based on direction
    let leftEye, rightEye;
    const offset = size / 4;
    
    switch (direction) {
        case 'up':
            leftEye = { x: x + offset, y: y + offset };
            rightEye = { x: x + size - offset, y: y + offset };
            break;
        case 'down':
            leftEye = { x: x + offset, y: y + size - offset };
            rightEye = { x: x + size - offset, y: y + size - offset };
            break;
        case 'left':
            leftEye = { x: x + offset, y: y + offset };
            rightEye = { x: x + offset, y: y + size - offset };
            break;
        case 'right':
            leftEye = { x: x + size - offset, y: y + offset };
            rightEye = { x: x + size - offset, y: y + size - offset };
            break;
    }
    
    // Draw eyes
    [leftEye, rightEye].forEach(eye => {
        // White of eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupil
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, pupilSize, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawFood() {
    const x = food.x * CONFIG.cellSize + CONFIG.cellSize / 2;
    const y = food.y * CONFIG.cellSize + CONFIG.cellSize / 2;
    const radius = CONFIG.cellSize / 2 - 3;
    
    // Glow effect
    ctx.shadowColor = '#e94560';
    ctx.shadowBlur = 20;
    
    // Draw apple body
    const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.7, '#e94560');
    gradient.addColorStop(1, '#c73e54');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Draw stem
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - radius + 2);
    ctx.lineTo(x + 2, y - radius - 4);
    ctx.stroke();
    
    // Draw leaf
    ctx.fillStyle = '#4ecca3';
    ctx.beginPath();
    ctx.ellipse(x + 5, y - radius - 2, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Shine effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, radius / 3, 0, Math.PI * 2);
    ctx.fill();
}

function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    
    // Check high score for current difficulty
    const currentHighScore = highScore[currentDifficulty] || 0;
    const isNewHighScore = score > currentHighScore;
    if (isNewHighScore) {
        highScore[currentDifficulty] = score;
        localStorage.setItem('snakeHighScores', JSON.stringify(highScore));
        highScoreElement.textContent = highScore[currentDifficulty];
    }
    
    // Get difficulty display name
    const difficultyNames = { easy: '🐢 Easy', medium: '🐇 Medium', hard: '🚀 Hard' };
    
    // Show overlay
    overlay.classList.remove('hidden', 'paused');
    overlay.classList.add('game-over');
    overlayTitle.textContent = '💀 Game Over!';
    overlayMessage.innerHTML = `
        <p style="color: #888; margin-bottom: 10px;">Mode: ${difficultyNames[currentDifficulty]}</p>
        <p class="final-score ${isNewHighScore ? 'new-high-score' : ''}">
            Score: ${score}
        </p>
        ${isNewHighScore ? '<p class="new-high-score">🎉 New High Score! 🎉</p>' : ''}
    `;
    startBtn.textContent = 'Play Again';
    
    // Show difficulty selector again
    difficultySelector.style.display = 'block';
}

function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        overlay.classList.remove('hidden', 'game-over');
        overlay.classList.add('paused');
        overlayTitle.textContent = '⏸️ Paused';
        overlayMessage.textContent = 'Press P to resume';
        startBtn.textContent = 'Resume';
    } else {
        overlay.classList.add('hidden');
    }
}

function handleKeydown(e) {
    // Prevent default for arrow keys to stop page scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    // Pause toggle
    if (e.key === 'p' || e.key === 'P') {
        if (!isGameOver && snake.length > 0) {
            togglePause();
        }
        return;
    }
    
    // If paused or game over, ignore movement keys
    if (isPaused || isGameOver) return;
    
    // Direction controls
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
}

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (isPaused || isGameOver) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // Minimum swipe distance
    const minSwipe = 30;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > minSwipe && direction !== 'left') {
            nextDirection = 'right';
        } else if (dx < -minSwipe && direction !== 'right') {
            nextDirection = 'left';
        }
    } else {
        // Vertical swipe
        if (dy > minSwipe && direction !== 'up') {
            nextDirection = 'down';
        } else if (dy < -minSwipe && direction !== 'down') {
            nextDirection = 'up';
        }
    }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
