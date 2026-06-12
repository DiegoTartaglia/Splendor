# Splendor Web Application

A digital version of the board game Splendor, built with React + Vite. It runs
as a web app, as a native Android app (via Capacitor) and as a macOS desktop
app (via Electron). You play against CPU opponents driven by a heuristic AI.

## Project Structure

```
splendor-web-app
├── src
│   ├── components
│   │   ├── Menu.jsx          # Start screen (players / CPU count)
│   │   ├── Game.jsx          # Game screen: turns, gem selection, AI loop
│   │   ├── Board.jsx         # Players side panel
│   │   ├── Player.jsx        # Single player summary card
│   │   ├── Cards.jsx         # Nobles, development cards, reserved cards
│   │   └── GemToken.jsx      # Reusable gem token chip
│   ├── services
│   │   ├── gameLogic.js      # Game state, rules, costs, nobles, token limit
│   │   └── aiLogic.js        # CPU strategy (buy / reserve / collect gems)
│   ├── types/game.js         # Shared constants
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css             # Theme and responsive layout
├── electron/main.cjs         # Electron entry point (macOS desktop app)
├── android/                  # Capacitor Android project
├── scripts/simulate.js       # AI-vs-AI smoke test
├── capacitor.config.json
├── vite.config.js
└── index.html
```

## Development

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run build      # production build in dist/
```

## macOS desktop app (Electron)

```bash
npm run electron   # build and launch the desktop app
npm run dist:mac   # package a .dmg/.zip into release/
```

## Android app (Capacitor)

Requires Android Studio (with the Android SDK) installed.

```bash
npm run android:open   # build, sync and open the project in Android Studio
```

From Android Studio you can run on an emulator/device or build an APK
(Build > Build Bundle(s) / APK(s)). To only refresh web assets:

```bash
npm run android:sync
```

## AI smoke test

Plays full AI-vs-AI games and checks that they terminate without violating
token rules:

```bash
npx esbuild scripts/simulate.js --bundle --format=cjs --outfile=/tmp/splendor-sim.cjs && node /tmp/splendor-sim.cjs
```

## Game rules implemented

- Take up to 3 gems of different colors, or 2 of one color when 4+ are
  available; 10-token hand limit.
- Buy cards with gems + gold jokers; card bonuses give permanent discounts.
- Reserve up to 3 cards (grants a gold token); buy them later.
- Nobles visit automatically when their bonus requirements are met (3 pts).
- First player to reach 15 prestige points wins.
