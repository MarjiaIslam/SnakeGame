#include <iostream>
#include <deque>
#include <cstdlib>
#include <ctime>
#include <termios.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/ioctl.h>

using namespace std;

// Game constants
const int WIDTH = 40;
const int HEIGHT = 20;

// Direction enum
enum Direction { UP, DOWN, LEFT, RIGHT };

// Position struct
struct Position {
    int x, y;
    bool operator==(const Position& other) const {
        return x == other.x && y == other.y;
    }
};

// Global variables
deque<Position> snake;
Position food;
Direction dir = RIGHT;
bool gameOver = false;
int score = 0;

// Terminal settings
struct termios orig_termios;

void disableRawMode() {
    tcsetattr(STDIN_FILENO, TCSAFLUSH, &orig_termios);
}

void enableRawMode() {
    tcgetattr(STDIN_FILENO, &orig_termios);
    atexit(disableRawMode);
    
    struct termios raw = orig_termios;
    raw.c_lflag &= ~(ECHO | ICANON);
    raw.c_cc[VMIN] = 0;
    raw.c_cc[VTIME] = 0;
    tcsetattr(STDIN_FILENO, TCSAFLUSH, &raw);
}

// Check if a key is pressed
int kbhit() {
    int bytesWaiting;
    ioctl(STDIN_FILENO, FIONREAD, &bytesWaiting);
    return bytesWaiting;
}

// Get character without blocking
char getKey() {
    char c = 0;
    if (kbhit()) {
        read(STDIN_FILENO, &c, 1);
        // Handle arrow keys (escape sequences)
        if (c == 27) {
            char seq[2];
            if (read(STDIN_FILENO, &seq[0], 1) == 1 && 
                read(STDIN_FILENO, &seq[1], 1) == 1) {
                if (seq[0] == '[') {
                    switch (seq[1]) {
                        case 'A': return 'w'; // Up arrow
                        case 'B': return 's'; // Down arrow
                        case 'C': return 'd'; // Right arrow
                        case 'D': return 'a'; // Left arrow
                    }
                }
            }
            return 27; // ESC key
        }
    }
    return c;
}

void clearScreen() {
    cout << "\033[2J\033[H";
}

void hideCursor() {
    cout << "\033[?25l";
}

void showCursor() {
    cout << "\033[?25h";
}

void generateFood() {
    bool valid;
    do {
        valid = true;
        food.x = rand() % (WIDTH - 2) + 1;
        food.y = rand() % (HEIGHT - 2) + 1;
        
        // Make sure food doesn't spawn on snake
        for (const auto& segment : snake) {
            if (segment == food) {
                valid = false;
                break;
            }
        }
    } while (!valid);
}

void setup() {
    srand(time(0));
    
    // Initialize snake in the middle
    Position head = {WIDTH / 2, HEIGHT / 2};
    snake.push_front(head);
    snake.push_front({head.x + 1, head.y});
    snake.push_front({head.x + 2, head.y});
    
    generateFood();
    enableRawMode();
    hideCursor();
}

void draw() {
    clearScreen();
    
    // Create the game board
    for (int y = 0; y < HEIGHT; y++) {
        for (int x = 0; x < WIDTH; x++) {
            bool isSnake = false;
            bool isHead = false;
            
            // Check if current position is part of snake
            for (size_t i = 0; i < snake.size(); i++) {
                if (snake[i].x == x && snake[i].y == y) {
                    isSnake = true;
                    if (i == 0) isHead = true;
                    break;
                }
            }
            
            if (y == 0 || y == HEIGHT - 1) {
                // Top and bottom walls
                cout << "\033[33m#\033[0m";
            } else if (x == 0 || x == WIDTH - 1) {
                // Side walls
                cout << "\033[33m#\033[0m";
            } else if (isHead) {
                // Snake head
                cout << "\033[92m@\033[0m";
            } else if (isSnake) {
                // Snake body
                cout << "\033[32mO\033[0m";
            } else if (x == food.x && y == food.y) {
                // Food
                cout << "\033[91m*\033[0m";
            } else {
                cout << " ";
            }
        }
        cout << endl;
    }
    
    // Display score and controls
    cout << "\n\033[1mScore: " << score << "\033[0m" << endl;
    cout << "\nControls: WASD or Arrow Keys to move, Q to quit" << endl;
}

void input() {
    char key = getKey();
    
    switch (key) {
        case 'w':
        case 'W':
            if (dir != DOWN) dir = UP;
            break;
        case 's':
        case 'S':
            if (dir != UP) dir = DOWN;
            break;
        case 'a':
        case 'A':
            if (dir != RIGHT) dir = LEFT;
            break;
        case 'd':
        case 'D':
            if (dir != LEFT) dir = RIGHT;
            break;
        case 'q':
        case 'Q':
        case 27: // ESC
            gameOver = true;
            break;
    }
}

void update() {
    // Calculate new head position
    Position newHead = snake.front();
    
    switch (dir) {
        case UP:    newHead.y--; break;
        case DOWN:  newHead.y++; break;
        case LEFT:  newHead.x--; break;
        case RIGHT: newHead.x++; break;
    }
    
    // Check wall collision
    if (newHead.x <= 0 || newHead.x >= WIDTH - 1 ||
        newHead.y <= 0 || newHead.y >= HEIGHT - 1) {
        gameOver = true;
        return;
    }
    
    // Check self collision
    for (const auto& segment : snake) {
        if (newHead == segment) {
            gameOver = true;
            return;
        }
    }
    
    // Add new head
    snake.push_front(newHead);
    
    // Check if food is eaten
    if (newHead == food) {
        score += 10;
        generateFood();
    } else {
        // Remove tail if no food eaten
        snake.pop_back();
    }
}

void gameOverScreen() {
    clearScreen();
    cout << "\n\n";
    cout << "  \033[1;31m╔═══════════════════════════════════╗\033[0m\n";
    cout << "  \033[1;31m║                                   ║\033[0m\n";
    cout << "  \033[1;31m║          GAME OVER!               ║\033[0m\n";
    cout << "  \033[1;31m║                                   ║\033[0m\n";
    cout << "  \033[1;31m║     Final Score: " << score;
    // Padding for alignment
    if (score < 10) cout << "                ";
    else if (score < 100) cout << "               ";
    else if (score < 1000) cout << "              ";
    else cout << "             ";
    cout << "║\033[0m\n";
    cout << "  \033[1;31m║                                   ║\033[0m\n";
    cout << "  \033[1;31m╚═══════════════════════════════════╝\033[0m\n";
    cout << "\n  Press any key to exit...\n";
    
    // Wait for key press
    while (!kbhit()) {
        usleep(100000);
    }
    getKey();
}

int main() {
    setup();
    
    // Game loop
    while (!gameOver) {
        draw();
        input();
        update();
        usleep(100000); // 100ms delay - controls game speed
    }
    
    showCursor();
    gameOverScreen();
    
    return 0;
}
