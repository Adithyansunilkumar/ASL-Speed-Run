const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const centerMessage = document.getElementById('center-message');
const targetDisplay = document.getElementById('target-display');
const targetLetterElement = document.getElementById('target-letter');
const nextLettersElement = document.getElementById('next-letters');
const feedbackElement = document.getElementById('feedback');

let score = 0;
let timeLeft = 60;
let gameInterval;
let restartTimeout;
let gameState = 'IDLE'; // IDLE, READY, PLAYING, GAMEOVER
let currentTarget = '';
let nextTargets = [];
let lastGesture = '';
let lastGestureTime = 0;

// Game Configuration
const GAME_DURATION = 30;
const GESTURES = ['A', 'B', 'L', 'V', 'Y'];

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Draw landmarks
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00f3ff', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#bc13fe', lineWidth: 2 });

        // Detect Gesture
        const gesture = detectGesture(landmarks);
        handleGameLogic(gesture);
    }
    canvasCtx.restore();
}

function detectGesture(landmarks) {
    const thumbOpen = isThumbOpen(landmarks);
    const indexOpen = isFingerOpen(landmarks, 8);
    const middleOpen = isFingerOpen(landmarks, 12);
    const ringOpen = isFingerOpen(landmarks, 16);
    const pinkyOpen = isFingerOpen(landmarks, 20);

    // Debug log (optional, remove in prod)
    // console.log(thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen);

    if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return '👍'; // Thumbs Up
    if (!thumbOpen && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return 'A'; // Fist (Approx)
    if (thumbOpen && indexOpen && middleOpen && ringOpen && pinkyOpen) return 'B'; // Open Palm
    if (thumbOpen && indexOpen && !middleOpen && !ringOpen && !pinkyOpen) return 'L';
    if (!thumbOpen && indexOpen && middleOpen && !ringOpen && !pinkyOpen) return 'V';
    if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && pinkyOpen) return 'Y';

    // A adjustment: Sometimes thumb is not fully "open" or "closed" in A. 
    // Usually A is all fingers curled.

    return '';
}

function isFingerOpen(landmarks, tipIdx) {
    // Check if tip is higher (smaller y) than pip (tipIdx - 2)
    // This works for upright hand. 
    // Better: Distance from wrist (0) to tip > Distance from wrist to pip
    const wrist = landmarks[0];
    const tip = landmarks[tipIdx];
    const pip = landmarks[tipIdx - 2];

    const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);

    return distTip > distPip;
}

function isThumbOpen(landmarks) {
    // Thumb is tricky. Let's check if tip is far from pinky MCP (17)
    const tip = landmarks[4];
    const pinkyMCP = landmarks[17];
    const indexMCP = landmarks[5];

    const dist = Math.hypot(tip.x - pinkyMCP.x, tip.y - pinkyMCP.y);
    const refDist = Math.hypot(indexMCP.x - pinkyMCP.x, indexMCP.y - pinkyMCP.y);

    // If thumb tip is further from pinky base than index base is, it's likely open/extended
    return dist > refDist * 1.5;
}

function handleGameLogic(gesture) {
    if (gameState === 'IDLE') {
        if (gesture === 'B') { // Show Palm (B) to Ready
            gameState = 'READY';
            centerMessage.innerHTML = `<h1>READY?</h1><p>Show <span class="highlight">👍</span> to Start</p>`;
        }
    } else if (gameState === 'READY') {
        if (gesture === '👍') {
            startGame();
        }
    } else if (gameState === 'PLAYING') {
        if (gesture === currentTarget) {
            // Debounce slightly to prevent double scoring if we wanted, 
            // but for speed run, instant is good. 
            // Let's add a tiny cooldown or just visual feedback.
            if (Date.now() - lastGestureTime > 500) {
                updateScore();
                lastGestureTime = Date.now();
                showFeedback('correct');
            }
        }
    }
}

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    timeLeft = GAME_DURATION;
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft.toFixed(2);
    centerMessage.style.display = 'none';
    targetDisplay.style.display = 'flex';

    generateTargets();
    updateTargetDisplay();

    gameInterval = setInterval(() => {
        timeLeft -= 0.1;
        timerElement.innerText = Math.max(0, timeLeft).toFixed(2);

        if (timeLeft <= 0) {
            endGame();
        }
    }, 100);
}

function endGame() {
    clearInterval(gameInterval);
    gameState = 'GAMEOVER';
    centerMessage.style.display = 'block';
    targetDisplay.style.display = 'none';
    centerMessage.innerHTML = `<h1>GAME OVER</h1><p>Final Score: <span class="highlight">${score}</span></p><p>Show <span class="highlight">✋</span> or Press <span class="highlight">R</span> to Restart</p>`;

    // Reset to IDLE logic (wait for B to restart)
    restartTimeout = setTimeout(() => {
        gameState = 'IDLE';
    }, 2000);
}

function updateScore() {
    score++;
    scoreElement.innerText = score;
    // Remove current, add new
    nextTargets.shift(); // Remove current (which was at 0)
    nextTargets.push(getRandomGesture());
    currentTarget = nextTargets[0];
    updateTargetDisplay();
}

function generateTargets() {
    nextTargets = [];
    for (let i = 0; i < 5; i++) {
        nextTargets.push(getRandomGesture());
    }
    currentTarget = nextTargets[0];
}

function getRandomGesture() {
    return GESTURES[Math.floor(Math.random() * GESTURES.length)];
}

function updateTargetDisplay() {
    targetLetterElement.innerText = currentTarget;
    // Show next 3
    nextLettersElement.innerText = nextTargets.slice(1, 4).join(' ');
}

function showFeedback(type) {
    feedbackElement.innerText = type === 'correct' ? 'MATCH!' : '';
    feedbackElement.className = `feedback ${type}`;
    feedbackElement.style.opacity = 1;
    setTimeout(() => {
        feedbackElement.style.opacity = 0;
    }, 300);
}

// MediaPipe Setup
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Custom Camera handling for better control
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,
                height: 720
            }
        });
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            requestAnimationFrame(processVideo);
        };
    } catch (err) {
        console.error('Error starting camera:', err);
        alert('Could not start camera: ' + err.name + ': ' + err.message);
    }
}

async function processVideo() {
    await hands.send({ image: videoElement });
    requestAnimationFrame(processVideo);
}

startCamera();

function restartGame() {
    clearInterval(gameInterval);
    clearTimeout(restartTimeout);
    gameState = 'IDLE';
    score = 0;
    timeLeft = GAME_DURATION;
    scoreElement.innerText = score;
    timerElement.innerText = timeLeft.toFixed(2);

    // Reset UI
    centerMessage.style.display = 'block';
    targetDisplay.style.display = 'none';
    centerMessage.innerHTML = `<h1>ASL SPEED RUN</h1><p>Show your <span class="highlight">Palm</span> to ready and<span class="highlight"> THUMBS UP</span> to Start</p>`;

    feedbackElement.style.opacity = 0;
    nextTargets = [];
    currentTarget = '';
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        restartGame();
    }
});
