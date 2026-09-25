# STREET RUSH 2D — Single Player & Real-Time Online Multiplayer Arcade Racing

A high-speed 2D pseudo-top-down arcade racing game featuring both a full Single-Player Career mode and a real-time Online Multiplayer mode (2–4 players) with private room codes, synchronized countdown, smooth network interpolation, live distance leaderboards, and podium results.

---

## 🌟 Game Modes

### 1. Solo Mode (Offline / Standalone)
- **10 Progressively Challenging Stages**: Daytime highways, coastal sunsets, cyber neon nights, and torrential monsoon rains.
- **Tuning Garage**: Upgrade Top Speed, Handling, Nitro Capacity, and Chassis Armor (Levels 1–5).
- **4 Unlockable Cars**: *Blaze GT* (Starter), *Viper R* (Sport), *Thunder V8* (Muscle), and *Phantom Hyper* (Super).
- **Traffic AI & Near Misses**: 4 enemy traffic types (Sedans, Sports cars, Semi-Trucks, and Aggressive lane-changers). Tight passes reward **NEAR MISS +50** bonus points!
- **Power-Ups**: Shield 🛡️, Coin Magnet 🧲, Nitro Refill ⚡, 2X Score Multiplier ⭐.
- **Web Audio API**: Procedural engine drone with throttle modulation, crash noises, coin chimes, and an 80s Synthwave BGM track.
- **Persistent Saves**: Local storage preserves high scores, total coins, car unlocks, upgrades, and settings.

### 2. Online Multiplayer Mode (2–4 Players)
- **Private Room Codes**: Host generates a unique 5-character room code (e.g. `X7K92`) to share with friends.
- **Interactive Lobby**: Live player list showing Host badge, Ready status, car name, and distinct player color indicator (Crimson, Cyan, Gold, Purple).
- **Synchronized Countdown**: Server-synchronized 3... 2... 1... GO! start sequence.
- **Smooth Real-Time Synchronization**: 20 Hz network tick rate with client-side linear interpolation (lerp) ensuring smooth opponent movement without teleporting.
- **Player Distinction**: Unique car color palettes and floating `[RACER NAME]` badges above every vehicle.
- **3000m Sprint Finish**: Real-time position tracking (1st, 2nd, 3rd, 4th), mini distance leaderboard, and synchronized podium results with finish times and coin rewards.
- **Rematch & Replay**: Host can initiate instant rematches returning all connected racers to the lobby.
- **Robust Disconnect & Host Migration**: If a player leaves, the race continues uninterrupted; if the host disconnects, host status automatically migrates to the next player.

---

## 🕹️ Controls

### Keyboard (Desktop / Laptop)
| Key | Action |
| --- | --- |
| **A / LEFT ARROW** | Steer Left |
| **D / RIGHT ARROW** | Steer Right |
| **W / UP ARROW** | Accelerate |
| **S / DOWN ARROW** | Brake / Slow Down |
| **SPACE** | Activate Nitro Boost |
| **ESC** | Pause (Solo mode only) |

### Mobile & Touch Screens
- **◀ / ▶ Buttons**: Steer Left & Right
- **🚀 Rocket Button**: Engage Nitro Boost
- **❚❚ Button**: Pause Race (Solo mode)

---

## 🚀 How to Run

### Option A: Play Solo (Completely Standalone / Offline)
1. Open the project folder: `C:\Users\Sarvadnya\Desktop\2D_Racing_Game`
2. Double-click or open **`index.html`** in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.
3. Click **PLAY SOLO** on the main menu.

*No Node.js or server required for Solo mode.*

---

### Option B: Play Online Multiplayer (Locally or via LAN)
1. Ensure [Node.js](https://nodejs.org/) (v16+) is installed.
2. Open a terminal / command prompt in `C:\Users\Sarvadnya\Desktop\2D_Racing_Game`.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the multiplayer server:
   ```bash
   npm start
   ```
5. Open **`http://localhost:3000`** in your browser.
6. Open a second browser tab or window (or an Incognito window) at `http://localhost:3000` to simulate Player 2.
7. Player 1: Click **MULTIPLAYER** ➔ **CREATE PRIVATE ROOM** (Note the 5-character Room Code).
8. Player 2: Click **MULTIPLAYER** ➔ **JOIN WITH ROOM CODE** (Enter the code and click **JOIN**).
9. Player 2 clicks **SET READY ✓**.
10. Player 1 (Host) clicks **START RACE** ➔ Enjoy synchronized real-time racing!

---

## 🌐 Public / Production Deployment

The server is built using standard Node.js and WebSockets (`ws`).

To host online publicly:
1. Deploy the folder to any Node.js hosting platform (e.g. Render, Railway, DigitalOcean, Heroku, AWS EC2, or Fly.io).
2. Set the environment variable `PORT` (defaults to `3000` if not set).
3. The frontend client automatically connects to the hosting domain using `wss://` or `ws://` via `window.location.host`.

---

## 📁 Project Structure

```
2D_Racing_Game/
├── index.html            # Main game layout, UI screens, HUD, modals
├── package.json          # Node.js dependencies & start scripts
├── README.md             # Project documentation & instructions
├── css/
│   └── style.css         # Cyberpunk/synthwave styling, lobby, & HUD
├── js/
│   ├── config.js         # Game constants, multiplayer config, cars, upgrades
│   ├── storage.js        # Safe localStorage manager & defaults
│   ├── audio.js          # Web Audio API sound synthesis & synthwave BGM
│   ├── particles.js      # Nitro flames, sparks, rain, skid marks, screen shake
│   ├── road.js           # 3-lane procedural scrolling highway & lighting
│   ├── powerups.js       # Collectible coins & powerup physics
│   ├── player.js         # Player steering, nitro, collision box & rendering
│   ├── enemy.js          # Enemy traffic AI, lane changing & near miss
│   ├── multiplayer.js    # WebSocket client, interpolation & remote player entity
│   ├── ui.js             # UI screen routing, lobby, showroom, HUD updates
│   ├── game.js           # Main game loop, state machine & collision resolver
│   └── main.js           # Bootstrapper & responsive canvas scaling
└── server/
    ├── config.js         # Server port, tick rates, and room constraints
    ├── playerManager.js  # Name sanitization & telemetry state clamping
    ├── roomManager.js    # Room lifecycle, host migration, countdown, & finish
    └── server.js         # Static HTTP file server & WebSocket router
```
