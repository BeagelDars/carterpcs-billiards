/**
 * Carter Billiards - Minimalist Light Web App
 */

// ============================================================================
// 1. Real Recorded Open-Source Pool Sounds (Web Audio API)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.buffers = {};
    this.loaded = false;
    this.audioPool = {};
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.loaded) {
      this.loadSounds();
    }
  }

  async loadSounds() {
    this.loaded = true;
    const soundList = [
      { key: 'ballHit', path: 'assets/sounds/ballHit.wav' },
      { key: 'cueHit', path: 'assets/sounds/cueHit.wav' },
      { key: 'cushionHit', path: 'assets/sounds/cushionHit.wav' },
      { key: 'pocketHit', path: 'assets/sounds/pocketHit.wav' },
      { key: 'cheer', path: 'assets/sounds/cheer.wav' }
    ];

    for (const item of soundList) {
      try {
        const res = await fetch(item.path);
        const arrayBuf = await res.arrayBuffer();
        if (this.ctx) {
          this.ctx.decodeAudioData(arrayBuf, (decoded) => {
            this.buffers[item.key] = decoded;
          });
        }
      } catch (e) {
        console.warn('Real sound fetch fallback:', item.key, e);
      }
    }
  }

  playSound(key, volume = 1, pitchVariance = 0.05) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.buffers[key]) {
      // Fallback to HTML Audio if buffer decoding not ready
      try {
        const audio = new Audio(`assets/sounds/${key}.wav`);
        audio.volume = Math.max(0.1, Math.min(1, volume));
        audio.play().catch(() => {});
      } catch (_) {}
      return;
    }

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[key];

      if (pitchVariance > 0) {
        source.playbackRate.value = 1 + (Math.random() - 0.5) * pitchVariance;
      }

      const gain = this.ctx.createGain();
      gain.gain.value = Math.max(0.05, Math.min(1.2, volume));

      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(0);
    } catch (e) {
      console.error(e);
    }
  }

  playCueHit(power = 1) {
    const vol = Math.min(1, 0.4 + power * 0.6);
    this.playSound('cueHit', vol, 0.04);
  }

  playBallHit(speed = 5) {
    const norm = Math.min(1, Math.max(0.15, speed / 11));
    this.playSound('ballHit', norm * 0.95, 0.08);
  }

  playCushionHit(speed = 4) {
    const norm = Math.min(1, Math.max(0.2, speed / 9));
    this.playSound('cushionHit', norm * 0.85, 0.05);
  }

  playPocketDrop() {
    this.playSound('pocketHit', 0.9, 0.02);
  }

  playWin() {
    this.playSound('cheer', 0.9, 0);
  }

  playFoul() {
    this.playSound('cushionHit', 0.8, 0.2);
  }
}

const sounds = new SoundEffects();

// ============================================================================
// 2. Crystal-Clear Carter Ball Textures (Face 100% Unobscured)
// ============================================================================
const BALL_COLORS = {
  0: '#ffffff', // Cue ball
  1: '#facc15', // Yellow
  2: '#2563eb', // Blue
  3: '#dc2626', // Red
  4: '#9333ea', // Purple
  5: '#ea580c', // Orange
  6: '#16a34a', // Green
  7: '#7f1d1d', // Maroon
  8: '#111827', // Black
  9: '#facc15', // Striped Yellow
  10: '#2563eb', // Striped Blue
  11: '#dc2626', // Striped Red
  12: '#9333ea', // Striped Purple
  13: '#ea580c', // Striped Orange
  14: '#16a34a', // Striped Green
  15: '#7f1d1d', // Striped Maroon
};

const ballTextures = {};

function generateCarterBallTextures(carterImage) {
  const size = 180;
  const radius = size / 2;

  // Face crop: Center directly on Carter's smiling face
  // Width: 415, Height: 739. Face from y=190 to 570
  const cropSize = 380;
  const cropX = Math.max(0, (carterImage.width - cropSize) / 2);
  const cropY = 190;

  for (let num = 0; num <= 15; num++) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 1. Circular Clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 2, 0, Math.PI * 2);
    ctx.clip();

    // 2. Draw Carter's Face - Crisp, Bright & High Contrast
    ctx.save();
    if (num === 8) {
      // 8-Ball: Cool high-contrast monochrome with bright smile
      ctx.filter = 'grayscale(100%) contrast(135%) brightness(105%)';
    } else {
      ctx.filter = 'contrast(108%) brightness(105%)';
    }
    ctx.drawImage(carterImage, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
    ctx.restore();

    // 3. Color Grading without obscuring the face!
    const isCue = num === 0;
    const isEight = num === 8;
    const isStripe = num >= 9 && num <= 15;
    const color = BALL_COLORS[num];

    if (isCue) {
      // Cue Ball: Clean cue white rim
      ctx.save();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    } else if (isEight) {
      // 8-Ball: Bold charcoal/black outer rim
      ctx.save();
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#111827';
      ctx.stroke();
      ctx.restore();
    } else if (isStripe) {
      // Striped Ball: Bold colored outer rim + striped ring accents
      ctx.save();
      ctx.lineWidth = 14;
      ctx.strokeStyle = color;
      ctx.stroke();

      // White stripe borders
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();
    } else {
      // Solid Ball (1-7): Vibrant colored border ring + subtle color warmth
      ctx.save();
      // Outer colored ring
      ctx.lineWidth = 14;
      ctx.strokeStyle = color;
      ctx.stroke();

      // Subtle translucent color overlay (face remains crystal clear!)
      ctx.globalAlpha = 0.2;
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();
    }

    // 4. Sleek Number Badge at Top Edge (DOES NOT COVER NOSE OR SMILE!)
    if (!isCue) {
      const badgeR = size * 0.13;
      const badgeX = radius;
      const badgeY = radius * 0.32; // Positioned cleanly at top of ball

      ctx.save();
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1f2937';
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = `800 ${Math.floor(size * 0.14)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), badgeX, badgeY + 1);

      if (num === 6 || num === 9) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(badgeX - badgeR * 0.45, badgeY + badgeR * 0.6);
        ctx.lineTo(badgeX + badgeR * 0.45, badgeY + badgeR * 0.6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 3D Glossy Sphere Specular Highlight (Top-Left)
    const specGrad = ctx.createRadialGradient(
      radius * 0.65, radius * 0.65, 2,
      radius * 0.65, radius * 0.65, radius * 0.5
    );
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    specGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Restore circular clip

    // Crisp Cartoon Outer Border
    ctx.beginPath();
    ctx.arc(radius, radius, radius - 1.5, 0, Math.PI * 2);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1f2937';
    ctx.stroke();

    ballTextures[num] = canvas;
  }
}

// ============================================================================
// 3. Table Physics & Geometry
// ============================================================================
const TABLE_VIRTUAL_W = 1000;
const TABLE_VIRTUAL_H = 500;

const PLAY_MIN_X = 64;
const PLAY_MAX_X = 936;
const PLAY_MIN_Y = 64;
const PLAY_MAX_Y = 436;

// Larger ball radius so Carter's face is clearly visible!
const BALL_RADIUS = 18.5;

const POCKETS = [
  { id: 'top-left',      x: 64,  y: 64,  r: 32 },
  { id: 'top-mid',       x: 500, y: 54,  r: 27 },
  { id: 'top-right',     x: 936, y: 64,  r: 32 },
  { id: 'bottom-left',   x: 64,  y: 436, r: 32 },
  { id: 'bottom-mid',    x: 500, y: 446, r: 27 },
  { id: 'bottom-right',  x: 936, y: 436, r: 32 }
];

const CUSHIONS = [
  { p1: { x: 106, y: 64 }, p2: { x: 468, y: 64 }, normal: { x: 0, y: 1 } },
  { p1: { x: 532, y: 64 }, p2: { x: 894, y: 64 }, normal: { x: 0, y: 1 } },
  { p1: { x: 106, y: 436 }, p2: { x: 468, y: 436 }, normal: { x: 0, y: -1 } },
  { p1: { x: 532, y: 436 }, p2: { x: 894, y: 436 }, normal: { x: 0, y: -1 } },
  { p1: { x: 64, y: 106 }, p2: { x: 64, y: 394 }, normal: { x: 1, y: 0 } },
  { p1: { x: 936, y: 106 }, p2: { x: 936, y: 394 }, normal: { x: -1, y: 0 } }
];

class Ball {
  constructor(num, x, y) {
    this.num = num;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = BALL_RADIUS;
    this.mass = 1;
    this.isPotted = false;
    this.isSinking = false;
    this.sinkScale = 1;
    this.sinkAlpha = 1;
    this.sinkTarget = null;
    this.angle = 0;
  }

  isStriped() {
    return this.num >= 9 && this.num <= 15;
  }

  isSolid() {
    return this.num >= 1 && this.num <= 7;
  }

  isCue() {
    return this.num === 0;
  }

  isEight() {
    return this.num === 8;
  }

  speed() {
    return Math.hypot(this.vx, this.vy);
  }
}

// ============================================================================
// 4. Game Manager (Minimalist, Turn-Based vs Bot)
// ============================================================================
class CarterBilliardsGame {
  constructor() {
    this.canvas = document.getElementById('pool-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Minimal UI Elements
    this.turnBadge = document.getElementById('turn-badge');
    this.playerStatus = document.getElementById('player-status');
    this.botStatus = document.getElementById('bot-status');
    this.playerGroupLabel = document.getElementById('player-group');
    this.botGroupLabel = document.getElementById('bot-group');
    this.playerTray = document.getElementById('player-tray');
    this.botTray = document.getElementById('bot-tray');
    this.powerWrap = document.getElementById('power-bar-wrap');
    this.powerFill = document.getElementById('power-bar-fill');
    this.ballInHandToast = document.getElementById('ball-in-hand');

    this.soundBtn = document.getElementById('sound-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.modal = document.getElementById('game-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalDesc = document.getElementById('modal-desc');
    this.modalRestart = document.getElementById('modal-restart');

    this.scale = 1;

    // Game state
    this.balls = [];
    this.cueBall = null;
    this.currentTurn = 'player';
    this.playerGroup = null;
    this.botGroup = null;
    this.isBallInHand = false;
    this.gameState = 'READY';

    // Controls
    this.mousePos = { x: 500, y: 250 };
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.shotPower = 0;
    this.cueAngle = 0;
    this.botPullback = 0;

    this.pottedThisShot = [];
    this.firstContactBall = null;

    this.initControls();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  initControls() {
    this.soundBtn.addEventListener('click', () => {
      sounds.enabled = !sounds.enabled;
      this.soundBtn.textContent = sounds.enabled ? '🔊' : '🔇';
    });

    this.restartBtn.addEventListener('click', () => this.startNewGame());
    this.modalRestart.addEventListener('click', () => {
      this.modal.classList.remove('open');
      this.startNewGame();
    });

    const getCanvasPos = (evt) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
      const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
      return {
        x: (clientX - rect.left) / this.scale,
        y: (clientY - rect.top) / this.scale
      };
    };

    const handleDown = (evt) => {
      if (this.gameState === 'GAME_OVER' || this.currentTurn !== 'player') return;
      const pos = getCanvasPos(evt);

      if (this.isBallInHand) {
        if (this.canPlaceCueBall(pos.x, pos.y)) {
          this.cueBall.x = pos.x;
          this.cueBall.y = pos.y;
          this.cueBall.vx = 0;
          this.cueBall.vy = 0;
          this.cueBall.isPotted = false;
          this.cueBall.isSinking = false;
          this.cueBall.sinkScale = 1;
          this.isBallInHand = false;
          this.ballInHandToast.classList.remove('show');
          sounds.playCueHit(0.3);
          this.updateTurnUI();
        }
        return;
      }

      if (this.gameState !== 'READY') return;

      this.isDragging = true;
      this.dragStart = pos;
      this.shotPower = 0;
      this.powerWrap.classList.add('active');
    };

    const handleMove = (evt) => {
      const pos = getCanvasPos(evt);
      this.mousePos = pos;

      if (!this.cueBall || this.currentTurn !== 'player') return;

      if (this.isDragging) {
        const dx = pos.x - this.dragStart.x;
        const dy = pos.y - this.dragStart.y;
        const dragDist = Math.hypot(dx, dy);

        const maxPull = 150;
        this.shotPower = Math.min(1, Math.max(0.05, dragDist / maxPull));

        if (dragDist > 8) {
          this.cueAngle = Math.atan2(this.dragStart.y - pos.y, this.dragStart.x - pos.x);
        }
        this.powerFill.style.width = `${Math.round(this.shotPower * 100)}%`;
      } else if (this.gameState === 'READY' && !this.isBallInHand) {
        const dx = pos.x - this.cueBall.x;
        const dy = pos.y - this.cueBall.y;
        this.cueAngle = Math.atan2(dy, dx);
      }
    };

    const handleUp = () => {
      if (this.isDragging && this.currentTurn === 'player' && this.gameState === 'READY') {
        this.isDragging = false;
        this.powerWrap.classList.remove('active');

        if (this.shotPower > 0.05) {
          this.executeShot(this.cueAngle, this.shotPower * 25);
        }
        this.shotPower = 0;
        this.powerFill.style.width = '0%';
      }
    };

    this.canvas.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleDown(e); }, { passive: false });
    window.addEventListener('touchmove', (e) => { handleMove(e); }, { passive: false });
    window.addEventListener('touchend', handleUp);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.gameState === 'READY' && this.currentTurn === 'player' && !this.isBallInHand) {
        e.preventDefault();
        this.executeShot(this.cueAngle, 19);
      }
    });
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const availableW = container.clientWidth - 24;
    const targetW = Math.min(availableW, 990);
    const targetH = targetW / 2;

    this.canvas.width = targetW * window.devicePixelRatio;
    this.canvas.height = targetH * window.devicePixelRatio;

    this.canvas.style.width = `${targetW}px`;
    this.canvas.style.height = `${targetH}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.scale = targetW / TABLE_VIRTUAL_W;
  }

  startNewGame() {
    this.balls = [];
    this.currentTurn = 'player';
    this.playerGroup = null;
    this.botGroup = null;
    this.isBallInHand = false;
    this.gameState = 'READY';
    this.botPullback = 0;
    this.ballInHandToast.classList.remove('show');
    this.modal.classList.remove('open');

    // 1. Cue Ball
    this.cueBall = new Ball(0, 260, TABLE_VIRTUAL_H / 2);
    this.balls.push(this.cueBall);

    // 2. Triangle Rack
    const rackStartX = 690;
    const rackStartY = TABLE_VIRTUAL_H / 2;
    const spacing = BALL_RADIUS * 2 + 0.6;
    const rowSpacing = Math.sqrt(3) * BALL_RADIUS + 0.5;

    const rackOrder = [
      1,
      9, 2,
      3, 8, 10,
      11, 4, 12, 5,
      6, 13, 7, 14, 15
    ];

    let idx = 0;
    for (let row = 0; row < 5; row++) {
      const rx = rackStartX + row * rowSpacing;
      const startY = rackStartY - (row * spacing) / 2;
      for (let col = 0; col <= row; col++) {
        const ry = startY + col * spacing;
        const ballNum = rackOrder[idx++];
        this.balls.push(new Ball(ballNum, rx, ry));
      }
    }

    this.updateScoreboard();
    this.updateTurnUI();
  }

  canPlaceCueBall(x, y) {
    if (x < PLAY_MIN_X + BALL_RADIUS || x > PLAY_MAX_X - BALL_RADIUS) return false;
    if (y < PLAY_MIN_Y + BALL_RADIUS || y > PLAY_MAX_Y - BALL_RADIUS) return false;

    for (const b of this.balls) {
      if (b.num !== 0 && !b.isPotted) {
        if (Math.hypot(b.x - x, b.y - y) < BALL_RADIUS * 2.2) return false;
      }
    }
    return true;
  }

  updateTurnUI() {
    if (this.currentTurn === 'player') {
      this.turnBadge.textContent = 'YOUR TURN';
      this.turnBadge.className = 'turn-pill';
      this.playerStatus.classList.add('active-player');
      this.botStatus.classList.remove('active-player');

      if (this.isBallInHand) {
        this.ballInHandToast.classList.add('show');
      } else {
        this.ballInHandToast.classList.remove('show');
      }
    } else {
      this.turnBadge.textContent = "BOT'S TURN";
      this.turnBadge.className = 'turn-pill bot-turn';
      this.playerStatus.classList.remove('active-player');
      this.botStatus.classList.add('active-player');
      this.ballInHandToast.classList.remove('show');
    }
  }

  updateScoreboard() {
    this.playerGroupLabel.textContent = this.playerGroup ? this.playerGroup : 'Open';
    this.botGroupLabel.textContent = this.botGroup ? this.botGroup : 'Open';

    const renderTray = (container, group) => {
      container.innerHTML = '';
      if (!group) return;

      const nums = group === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
      nums.forEach(n => {
        const ball = this.balls.find(b => b.num === n);
        const el = document.createElement('div');
        el.className = `tray-dot ${ball && ball.isPotted ? 'potted' : ''}`;
        el.style.backgroundColor = BALL_COLORS[n];
        el.textContent = n;
        container.appendChild(el);
      });
    };

    renderTray(this.playerTray, this.playerGroup);
    renderTray(this.botTray, this.botGroup);
  }

  executeShot(angle, power) {
    if (this.gameState === 'ROLLING') return;

    this.cueBall.vx = Math.cos(angle) * power;
    this.cueBall.vy = Math.sin(angle) * power;

    sounds.playCueHit(power / 25);

    this.gameState = 'ROLLING';
    this.pottedThisShot = [];
    this.firstContactBall = null;
  }

  // ============================================================================
  // Bot AI
  // ============================================================================
  runBotAI() {
    // If ball in hand, place cue ball
    if (this.isBallInHand) {
      let bestX = 240;
      let bestY = TABLE_VIRTUAL_H / 2;
      for (let attempt = 0; attempt < 25; attempt++) {
        const tryX = 140 + Math.random() * 200;
        const tryY = PLAY_MIN_Y + 40 + Math.random() * (PLAY_MAX_Y - PLAY_MIN_Y - 80);
        if (this.canPlaceCueBall(tryX, tryY)) {
          bestX = tryX;
          bestY = tryY;
          break;
        }
      }
      this.cueBall.x = bestX;
      this.cueBall.y = bestY;
      this.cueBall.vx = 0;
      this.cueBall.vy = 0;
      this.cueBall.isPotted = false;
      this.cueBall.isSinking = false;
      this.cueBall.sinkScale = 1;
      this.isBallInHand = false;
      sounds.playCueHit(0.3);
    }

    let legalBalls = [];
    if (!this.botGroup) {
      legalBalls = this.balls.filter(b => !b.isPotted && b.num !== 0 && b.num !== 8);
    } else {
      const isSolids = this.botGroup === 'solids';
      const myBalls = this.balls.filter(b => !b.isPotted && (isSolids ? b.isSolid() : b.isStriped()));
      if (myBalls.length > 0) {
        legalBalls = myBalls;
      } else {
        legalBalls = this.balls.filter(b => !b.isPotted && b.isEight());
      }
    }

    if (legalBalls.length === 0) {
      legalBalls = this.balls.filter(b => !b.isPotted && b.num !== 0);
    }

    let bestShot = null;
    let highestScore = -Infinity;

    for (const ball of legalBalls) {
      for (const pocket of POCKETS) {
        const bpx = pocket.x - ball.x;
        const bpy = pocket.y - ball.y;
        const distBallPocket = Math.hypot(bpx, bpy);
        if (distBallPocket < 1) continue;

        const dirToPocket = { x: bpx / distBallPocket, y: bpy / distBallPocket };
        const ghostX = ball.x - dirToPocket.x * (BALL_RADIUS * 2);
        const ghostY = ball.y - dirToPocket.y * (BALL_RADIUS * 2);

        const cgx = ghostX - this.cueBall.x;
        const cgy = ghostY - this.cueBall.y;
        const distCueGhost = Math.hypot(cgx, cgy);
        if (distCueGhost < 1) continue;

        const dirCueGhost = { x: cgx / distCueGhost, y: cgy / distCueGhost };
        const alignment = dirCueGhost.x * dirToPocket.x + dirCueGhost.y * dirToPocket.y;

        if (alignment > 0.15) {
          const ballPathClear = this.isPathClear(ball.x, ball.y, pocket.x, pocket.y, [ball.num, 0]);
          const cuePathClear = this.isPathClear(this.cueBall.x, this.cueBall.y, ghostX, ghostY, [0, ball.num]);

          if (ballPathClear && cuePathClear) {
            const score = alignment * 100 - (distBallPocket * 0.12) - (distCueGhost * 0.08);
            if (score > highestScore) {
              highestScore = score;
              bestShot = {
                angle: Math.atan2(cgy, cgx),
                power: Math.min(23, Math.max(12, (distCueGhost + distBallPocket) * 0.035)),
                targetBall: ball
              };
            }
          }
        }
      }
    }

    if (!bestShot && legalBalls.length > 0) {
      let closestBall = legalBalls[0];
      let minDist = Infinity;
      for (const b of legalBalls) {
        const d = Math.hypot(b.x - this.cueBall.x, b.y - this.cueBall.y);
        if (d < minDist) {
          minDist = d;
          closestBall = b;
        }
      }
      const angle = Math.atan2(closestBall.y - this.cueBall.y, closestBall.x - this.cueBall.x);
      bestShot = { angle: angle, power: 14, targetBall: closestBall };
    }

    const aimNoise = (Math.random() - 0.5) * 0.035;
    const finalAngle = bestShot.angle + aimNoise;
    const finalPower = bestShot.power;

    const startAngle = this.cueAngle;
    const startTime = performance.now();
    const aimDuration = 600;

    const animateAim = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / aimDuration);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.cueAngle = startAngle + (finalAngle - startAngle) * ease;

      if (progress < 1) {
        requestAnimationFrame(animateAim);
      } else {
        // Animate shot pullback
        const pullStart = performance.now();
        const pullDuration = 350;
        const animatePull = (t) => {
          const el = t - pullStart;
          const p = Math.min(1, el / pullDuration);
          this.botPullback = Math.sin(p * Math.PI) * (finalPower * 1.4);

          if (p < 1) {
            requestAnimationFrame(animatePull);
          } else {
            this.botPullback = 0;
            if (this.currentTurn === 'bot') {
              this.executeShot(finalAngle, finalPower);
            }
          }
        };
        requestAnimationFrame(animatePull);
      }
    };

    requestAnimationFrame(animateAim);
  }

  isPathClear(x1, y1, x2, y2, ignoreNums = []) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    if (len < 1) return true;

    const ux = dx / len;
    const uy = dy / len;

    for (const b of this.balls) {
      if (b.isPotted || ignoreNums.includes(b.num)) continue;

      const bx = b.x - x1;
      const by = b.y - y1;
      const t = bx * ux + by * uy;

      if (t > BALL_RADIUS && t < len - BALL_RADIUS) {
        const px = x1 + ux * t;
        const py = y1 + uy * t;
        const dist = Math.hypot(b.x - px, b.y - py);
        if (dist < BALL_RADIUS * 2) {
          return false;
        }
      }
    }
    return true;
  }

  // ============================================================================
  // Physics Simulation
  // ============================================================================
  updatePhysics(dt) {
    const activeBalls = this.balls.filter(b => !b.isPotted);
    const substeps = 8;
    const subDt = dt / substeps;

    for (let step = 0; step < substeps; step++) {
      for (const b of activeBalls) {
        if (b.isSinking) {
          if (b.sinkTarget) {
            b.x += (b.sinkTarget.x - b.x) * 0.18;
            b.y += (b.sinkTarget.y - b.y) * 0.18;
          }
          b.sinkScale -= 0.08;
          b.sinkAlpha -= 0.08;
          if (b.sinkScale <= 0.1) {
            b.isPotted = true;
            b.isSinking = false;
            b.vx = 0;
            b.vy = 0;
            this.pottedThisShot.push(b);
            sounds.playPocketDrop();
          }
          continue;
        }

        b.x += b.vx * subDt * 60;
        b.y += b.vy * subDt * 60;

        b.vx *= Math.pow(0.988, subDt * 60);
        b.vy *= Math.pow(0.988, subDt * 60);

        const spd = b.speed();
        if (spd > 0.05) {
          b.angle += (spd * 0.035);
        } else {
          b.vx = 0;
          b.vy = 0;
        }

        // Pockets check
        for (const p of POCKETS) {
          const distToPocket = Math.hypot(b.x - p.x, b.y - p.y);
          if (distToPocket < p.r * 1.05) {
            b.isSinking = true;
            b.sinkTarget = p;
            b.vx *= 0.2;
            b.vy *= 0.2;
            break;
          }
        }

        // Cushions check
        for (const c of CUSHIONS) {
          const segDist = this.pointToSegmentDist(b.x, b.y, c.p1, c.p2, c.normal);
          if (segDist.dist < BALL_RADIUS) {
            const overlap = BALL_RADIUS - segDist.dist;
            b.x += segDist.nx * overlap;
            b.y += segDist.ny * overlap;

            const dot = b.vx * segDist.nx + b.vy * segDist.ny;
            if (dot < 0) {
              b.vx -= 1.88 * dot * segDist.nx;
              b.vy -= 1.88 * dot * segDist.ny;
              sounds.playCushionHit(Math.abs(dot));
            }
          }
        }
      }

      // Ball to Ball
      for (let i = 0; i < activeBalls.length; i++) {
        const b1 = activeBalls[i];
        if (b1.isSinking) continue;

        for (let j = i + 1; j < activeBalls.length; j++) {
          const b2 = activeBalls[j];
          if (b2.isSinking) continue;

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const dist = Math.hypot(dx, dy);

          if (dist < BALL_RADIUS * 2 && dist > 0.001) {
            const overlap = (BALL_RADIUS * 2 - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

            if (p > 0) {
              const restitution = 0.95;
              b1.vx -= p * b2.mass * restitution * nx;
              b1.vy -= p * b2.mass * restitution * ny;
              b2.vx += p * b1.mass * restitution * nx;
              b2.vy += p * b1.mass * restitution * ny;

              if (b1.num === 0 && !this.firstContactBall) this.firstContactBall = b2;
              if (b2.num === 0 && !this.firstContactBall) this.firstContactBall = b1;

              sounds.playBallHit(p);
            }
          }
        }
      }
    }

    if (this.gameState === 'ROLLING') {
      const isAnyMoving = this.balls.some(b => !b.isPotted && (b.speed() > 0.08 || b.isSinking));
      if (!isAnyMoving) {
        for (const b of this.balls) {
          b.vx = 0;
          b.vy = 0;
        }
        this.evaluateShotOutcome();
      }
    }
  }

  pointToSegmentDist(px, py, p1, p2, defaultNormal) {
    const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
    if (l2 === 0) {
      const d = Math.hypot(px - p1.x, py - p1.y);
      return { dist: d, nx: (px - p1.x) / (d || 1), ny: (py - p1.y) / (d || 1) };
    }

    let t = ((px - p1.x) * (p2.x - p1.x) + (py - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = p1.x + t * (p2.x - p1.x);
    const projY = p1.y + t * (p2.y - p1.y);
    const d = Math.hypot(px - projX, py - projY);

    if (t === 0 || t === 1) {
      return { dist: d, nx: (px - projX) / (d || 1), ny: (py - projY) / (d || 1) };
    }
    return { dist: d, nx: defaultNormal.x, ny: defaultNormal.y };
  }

  evaluateShotOutcome() {
    const shooter = this.currentTurn;
    const opponent = shooter === 'player' ? 'bot' : 'player';

    const cueSunk = this.pottedThisShot.some(b => b.num === 0);
    const eightSunk = this.pottedThisShot.some(b => b.num === 8);
    const objectBallsSunk = this.pottedThisShot.filter(b => b.num !== 0 && b.num !== 8);

    let isFoul = false;
    let keepTurn = false;

    if (eightSunk) {
      const shooterGroup = shooter === 'player' ? this.playerGroup : this.botGroup;
      const groupCleared = shooterGroup && this.balls.filter(b => {
        if (b.isPotted || b.num === 0 || b.num === 8) return false;
        return shooterGroup === 'solids' ? b.isSolid() : b.isStriped();
      }).length === 0;

      if (groupCleared && !cueSunk) {
        this.endGame(shooter, `${shooter === 'player' ? 'You' : 'Bot'} potted the 8-Ball and won!`);
        return;
      } else {
        this.endGame(opponent, `${shooter === 'player' ? 'You' : 'Bot'} potted the 8-Ball incorrectly!`);
        return;
      }
    }

    if (cueSunk) {
      isFoul = true;
      sounds.playFoul();

      this.cueBall.x = 240;
      this.cueBall.y = TABLE_VIRTUAL_H / 2;
      this.cueBall.vx = 0;
      this.cueBall.vy = 0;
      this.cueBall.isPotted = false;
      this.cueBall.isSinking = false;
      this.cueBall.sinkScale = 1;
      this.isBallInHand = true;
    }

    if (!this.firstContactBall) {
      isFoul = true;
    } else {
      const shooterGroup = shooter === 'player' ? this.playerGroup : this.botGroup;
      if (shooterGroup) {
        const isShooterSolid = shooterGroup === 'solids';
        const hitOwnGroup = isShooterSolid ? this.firstContactBall.isSolid() : this.firstContactBall.isStriped();

        const groupCleared = this.balls.filter(b => {
          if (b.isPotted || b.num === 0 || b.num === 8) return false;
          return isShooterSolid ? b.isSolid() : b.isStriped();
        }).length === 0;

        if (groupCleared) {
          if (!this.firstContactBall.isEight()) isFoul = true;
        } else {
          if (!hitOwnGroup) isFoul = true;
        }
      }
    }

    if (!this.playerGroup && objectBallsSunk.length > 0 && !isFoul) {
      const firstSunk = objectBallsSunk[0];
      const sunkIsSolid = firstSunk.isSolid();

      if (shooter === 'player') {
        this.playerGroup = sunkIsSolid ? 'solids' : 'stripes';
        this.botGroup = sunkIsSolid ? 'stripes' : 'solids';
      } else {
        this.botGroup = sunkIsSolid ? 'solids' : 'stripes';
        this.playerGroup = sunkIsSolid ? 'stripes' : 'solids';
      }
    }

    if (!isFoul && objectBallsSunk.length > 0) {
      const shooterGroup = shooter === 'player' ? this.playerGroup : this.botGroup;
      const pottedOwnBall = objectBallsSunk.some(b => {
        return shooterGroup === 'solids' ? b.isSolid() : b.isStriped();
      });

      if (pottedOwnBall) {
        keepTurn = true;
      }
    }

    if (isFoul) {
      this.isBallInHand = true;
      keepTurn = false;
    }

    if (!keepTurn) {
      this.currentTurn = opponent;
    }

    this.updateScoreboard();
    this.updateTurnUI();
    this.gameState = 'READY';

    if (this.currentTurn === 'bot') {
      setTimeout(() => this.runBotAI(), 500);
    }
  }

  endGame(winner, message) {
    this.gameState = 'GAME_OVER';
    const isPlayerWin = winner === 'player';

    this.modalTitle.textContent = isPlayerWin ? 'VICTORY!' : 'GAME OVER';
    this.modalTitle.style.color = isPlayerWin ? '#10b981' : '#ef4444';
    this.modalDesc.textContent = message;

    if (isPlayerWin) {
      sounds.playWin();
    } else {
      sounds.playFoul();
    }

    setTimeout(() => {
      this.modal.classList.add('open');
    }, 500);
  }

  // ============================================================================
  // Rendering
  // ============================================================================
  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.scale, this.scale);

    this.drawTable(ctx);
    this.drawBalls(ctx);

    if (this.gameState === 'READY' && this.currentTurn === 'player' && !this.isBallInHand) {
      this.drawAimingGuide(ctx);
      this.drawCueStick(ctx, this.cueBall.x, this.cueBall.y, this.cueAngle, this.shotPower * 50);
    }

    if (this.gameState === 'READY' && this.currentTurn === 'bot' && !this.isBallInHand) {
      this.drawCueStick(ctx, this.cueBall.x, this.cueBall.y, this.cueAngle, this.botPullback);
    }

    ctx.restore();
  }

  drawTable(ctx) {
    // Outer wood frame
    ctx.fillStyle = '#572e15';
    ctx.fillRect(0, 0, TABLE_VIRTUAL_W, TABLE_VIRTUAL_H);

    // Subtle rail edge
    ctx.strokeStyle = '#381c0c';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, TABLE_VIRTUAL_W - 8, TABLE_VIRTUAL_H - 8);

    // Sights
    ctx.fillStyle = '#ffffff';
    [200, 350, 650, 800].forEach(x => {
      ctx.beginPath();
      ctx.arc(x, 32, 3, 0, Math.PI * 2);
      ctx.arc(x, TABLE_VIRTUAL_H - 32, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    [150, 250, 350].forEach(y => {
      ctx.beginPath();
      ctx.arc(32, y, 3, 0, Math.PI * 2);
      ctx.arc(TABLE_VIRTUAL_W - 32, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Felt
    ctx.fillStyle = '#0f8a59';
    ctx.fillRect(PLAY_MIN_X, PLAY_MIN_Y, PLAY_MAX_X - PLAY_MIN_X, PLAY_MAX_Y - PLAY_MIN_Y);

    // Cloth markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(260, PLAY_MIN_Y);
    ctx.lineTo(260, PLAY_MAX_Y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(690, TABLE_VIRTUAL_H / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // Cushions
    ctx.fillStyle = '#0b6c45';
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;

    for (const c of CUSHIONS) {
      ctx.beginPath();
      const thick = 14;
      const nx = c.normal.x;
      const ny = c.normal.y;

      ctx.moveTo(c.p1.x, c.p1.y);
      ctx.lineTo(c.p2.x, c.p2.y);
      ctx.lineTo(c.p2.x - nx * thick, c.p2.y - ny * thick);
      ctx.lineTo(c.p1.x - nx * thick, c.p1.y - ny * thick);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Pockets
    for (const p of POCKETS) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#374151';
      ctx.stroke();

      const pGrad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.r);
      pGrad.addColorStop(0, '#000000');
      pGrad.addColorStop(1, '#1f2937');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r - 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBalls(ctx) {
    for (const b of this.balls) {
      if (b.isPotted) continue;

      ctx.save();
      ctx.translate(b.x, b.y);

      if (b.isSinking) {
        ctx.scale(b.sinkScale, b.sinkScale);
        ctx.globalAlpha = Math.max(0, b.sinkAlpha);
      }

      // Ball shadow
      ctx.beginPath();
      ctx.ellipse(3, 3, b.r, b.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fill();

      // Ball texture
      const tex = ballTextures[b.num];
      if (tex) {
        ctx.rotate(b.angle);
        ctx.drawImage(tex, -b.r, -b.r, b.r * 2, b.r * 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, b.r, 0, Math.PI * 2);
        ctx.fillStyle = BALL_COLORS[b.num];
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawAimingGuide(ctx) {
    const cue = this.cueBall;
    const maxAimDist = 900;
    const ux = Math.cos(this.cueAngle);
    const uy = Math.sin(this.cueAngle);

    let closestDist = maxAimDist;
    let hitBall = null;

    for (const b of this.balls) {
      if (b.num === 0 || b.isPotted) continue;

      const dx = b.x - cue.x;
      const dy = b.y - cue.y;
      const proj = dx * ux + dy * uy;

      if (proj > 0 && proj < closestDist) {
        const perpDist = Math.abs(dx * (-uy) + dy * ux);
        if (perpDist < BALL_RADIUS * 2) {
          const d = proj - Math.sqrt((BALL_RADIUS * 2) ** 2 - perpDist ** 2);
          if (d > 0 && d < closestDist) {
            closestDist = d;
            hitBall = b;
          }
        }
      }
    }

    const hitX = cue.x + ux * closestDist;
    const hitY = cue.y + uy * closestDist;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(cue.x + ux * BALL_RADIUS, cue.y + uy * BALL_RADIUS);
    ctx.lineTo(hitX, hitY);
    ctx.stroke();

    if (hitBall) {
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(hitX, hitY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      const tdx = hitBall.x - hitX;
      const tdy = hitBall.y - hitY;
      const tLen = Math.hypot(tdx, tdy);
      if (tLen > 0) {
        const tux = tdx / tLen;
        const tuy = tdy / tLen;
        const guideLen = 80;

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(hitBall.x, hitBall.y);
        ctx.lineTo(hitBall.x + tux * guideLen, hitBall.y + tuy * guideLen);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawCueStick(ctx, ballX, ballY, angle, pullback = 0) {
    ctx.save();
    ctx.translate(ballX, ballY);
    ctx.rotate(angle);

    const stickLength = 260;
    const tipDist = BALL_RADIUS + 8 + pullback;

    // Shaft
    const shaftGrad = ctx.createLinearGradient(-tipDist, 0, -tipDist - stickLength, 0);
    shaftGrad.addColorStop(0, '#e8d5be');
    shaftGrad.addColorStop(0.65, '#cfad89');
    shaftGrad.addColorStop(1, '#1e222e');

    ctx.beginPath();
    ctx.moveTo(-tipDist, -2.5);
    ctx.lineTo(-tipDist - stickLength, -6);
    ctx.lineTo(-tipDist - stickLength, 6);
    ctx.lineTo(-tipDist, 2.5);
    ctx.closePath();
    ctx.fillStyle = shaftGrad;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#181a20';
    ctx.stroke();

    // Cue Tip
    ctx.beginPath();
    ctx.rect(-tipDist, -2.5, 4, 5);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  start() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      this.updatePhysics(dt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  // Preload and unlock real audio
  sounds.init();
  window.addEventListener('pointerdown', () => sounds.init(), { once: true });

  const carterImage = new Image();
  carterImage.src = 'assets/carter.png';

  carterImage.onload = () => {
    generateCarterBallTextures(carterImage);
    const game = new CarterBilliardsGame();
    game.startNewGame();
    game.start();
  };

  carterImage.onerror = () => {
    console.error('Could not load Carter image. Starting fallback.');
    const game = new CarterBilliardsGame();
    game.startNewGame();
    game.start();
  };
});
