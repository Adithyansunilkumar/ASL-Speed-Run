# ASL Speed Run - Project Explanation

## Overview
**ASL Speed Run** is a real-time, browser-based game that uses computer vision to teach and test American Sign Language (ASL) finger spelling. It leverages **Google's MediaPipe** library for high-performance hand tracking directly in the browser, requiring no backend processing.

The objective is simple: Perform the ASL hand signs displayed on the screen as accurately and quickly as possible within the time limit.

## Tech Stack
- **Framework**: Vanilla JavaScript with [Vite](https://vitejs.dev/) for tooling and dev server.
- **Computer Vision**: [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker) (loaded via CDN) for real-time skeletal hand tracking.
- **Styling**: Vanilla CSS with a futuristic/cyberpunk aesthetic (Orbitron & Roboto Mono fonts).
- **Video Input**: Standard HTML5 `getUserMedia` API.

## Project Structure
```
/
├── index.html       # Main entry point. Defines the UI and loads MediaPipe scripts.
├── script.js        # Core game logic, gesture recognition, and camera handling.
├── style.css        # Styles for the futuristic HUD logic.
├── package.json     # Project metadata and scripts (dev, build).
├── vite.config.js   # Vite configuration.
└── README.md        # Brief execution instructions.
```

## How It Works

### 1. Hand Tracking (`script.js`)
The app initializes a `Hands` instance from MediaPipe. It streams video from `navigator.mediaDevices.getUserMedia` into the MediaPipe processing graph.
- **`onResults(results)`**: Called every frame with tracking data. It clears the canvas, draws the camera feed, draws hand landmarks (if any), and calls `detectGesture()`.

### 2. Gesture Recognition
Gesture detection is "heuristic-based" rather than ML-classifier based, meaning it checks the geometry of fingers (extended vs curled) to determine the sign.
- **`detectGesture(landmarks)`**: Analyzes the hand landmarks to identify the gesture.
- **Helpers**:
    - `isFingerOpen()`: Checks if a finger tip is further from the wrist than its knuckle.
    - `isThumbOpen()`: Checks finger geometry relative to the palm.
- **Supported Gestures**:
    - **A**: Fist (roughly).
    - **B**: Open Palm (also used to "Ready" the game).
    - **L**: Thumb and Index extended.
    - **V**: Peace sign (Index and Middle extended).
    - **Y**: Thumb and Pinky extended ("Hang loose").
    - **👍**: Thumbs Up (used to "Start" the game).

### 3. Game Loop & States
The game is state-machine driven:
- **`IDLE`**: Waiting for the user. Shows instruction to "Show Palm to Ready".
- **`READY`**: User has shown a Palm. Waits for "Thumbs Up" to start.
- **`PLAYING`**: Timer counts down (30s). User must match the `currentTarget` gesture.
    - Matching the gesture increments the score and rotates to a new random target.
- **`GAMEOVER`**: Time is up. Shows final score. User can restart with 'R' key or gesture.

## Setup & Running
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Run Dev Server**:
   ```bash
   npm run dev
   ```
3. **Build for Production**:
   ```bash
   npm run build
   ```

## Key Files Breakdown
- **`index.html`**: Contains the `<video>` element (hidden input) and `<canvas>` (output overlay). It also defines the HUD (Heads-Up Display) elements like Score, Time, and Target Letter.
- **`style.css`**: Uses absolute positioning to overlay the HUD on top of the canvas. Implements a "neon" color scheme.
- **`script.js`**: Contains the "brain" of the application. Loops the camera feed, processes frames, and manages the game state.

## Future Improvements (Ideas)
- **More Gestures**: Add C, D, E, F, etc.
- **Machine Learning**: Train a dedicated TFJS model for better accuracy than simple geometric heuristics.
- **Sound Effects**: Add audio feedback for correct matches or game over.
