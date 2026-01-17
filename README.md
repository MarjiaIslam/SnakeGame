# Snake Game 🐍

A classic Snake game with **two implementations**: a modern web version and a terminal-based C++ version.

---

## 🎮 Web Version

### How to Run
1. Open `index.html` in your web browser
2. Select difficulty: Easy 🐢, Medium 🐇, or Hard 🚀
3. Use **Arrow keys** or **WASD** to control the snake
4. Press **P** to pause
5. Eat food to grow and increase your score
6. Avoid hitting the walls or yourself!

### Features
- Three difficulty levels with increasing speed
- High score tracking (saved in browser)
- Mobile touch/swipe controls
- Beautiful neon-themed graphics
- Pause functionality

---

## 💻 Terminal Version (C++)

### How to Run
```bash
g++ snake.cpp -o snake
./snake
```

### Controls
- **WASD** or **Arrow keys** to move
- **Q** or **ESC** to quit

---

## 📁 Project Structure

| File | Description |
|------|-------------|
| `index.html` | Web game structure - canvas, overlays, UI elements |
| `styles.css` | Web game styling - dark theme, neon colors, animations |
| `game.js` | Web game logic - snake movement, collisions, rendering |
| `snake.cpp` | Standalone terminal game in C++ |

### Web Version Architecture
```
index.html  ──loads──►  styles.css (styling)
     │
     └──────loads──►  game.js (game logic)
```
> **Note:** The web version runs entirely in the browser with no backend. High scores are stored in `localStorage`.

### How the Game Logic Works
1. **Snake** is stored as an array of `{x, y}` positions
2. **Movement** adds a new head position and removes the tail
3. **Eating food** skips removing the tail (snake grows)
4. **Collision detection** checks if head hits walls or body
5. **Speed increases** as you eat more food

