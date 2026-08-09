(() => {
  const canvas = document.getElementById('gameCanvas');
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const boostBtn = document.getElementById('boostBtn');
  const scoreText = document.getElementById('scoreText');
  const livesText = document.getElementById('livesText');
  const timeText = document.getElementById('timeText');
  const gameStatus = document.getElementById('gameStatus');
  if (!ctx || !startBtn || !resetBtn || !pauseBtn || !boostBtn || !scoreText || !livesText || !timeText || !gameStatus) return;

  const world = { width: 800, height: 500 };
  const random = (min, max) => Math.random() * (max - min) + min;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const state = {
    started: false,
    paused: false,
    over: false,
    won: false,
    score: 0,
    target: 12,
    lives: 3,
    time: 45,
    lastTime: 0,
    pointerActive: false,
    pointerTarget: null,
    buttons: { up: false, down: false, left: false, right: false, boost: false },
    keys: {},
    player: { x: 120, y: 250, r: 25, speed: 245, invincible: 0 },
    items: [],
    enemies: [],
    particles: [],
    stars: []
  };

  function safeSpot(radius = 30) {
    let point = { x: random(60, world.width - 60), y: random(70, world.height - 60), r: radius };
    let attempts = 0;
    while (distance(point, state.player) < 150 && attempts < 40) {
      point = { x: random(60, world.width - 60), y: random(70, world.height - 60), r: radius };
      attempts += 1;
    }
    return point;
  }

  function buildBackgroundStars() {
    state.stars = Array.from({ length: 48 }, () => ({
      x: random(20, world.width - 20),
      y: random(20, world.height - 20),
      r: random(1, 3)
    }));
  }

  function spawnItem() {
    const spot = safeSpot(24);
    const orange = Math.random() > 0.72;
    return { ...spot, kind: orange ? 'orange' : 'star', emoji: orange ? '🍊' : '⭐', points: orange ? 2 : 1, pulse: random(0, Math.PI * 2) };
  }

  function spawnEnemy(index) {
    const spot = safeSpot(26);
    const speed = 72 + index * 18;
    return { ...spot, emoji: '😠', vx: random(-speed, speed) || speed, vy: random(-speed, speed) || speed, r: 25, spin: random(-0.7, 0.7) };
  }

  function updateHud(message) {
    scoreText.textContent = `${state.score} / ${state.target}`;
    livesText.textContent = '❤️'.repeat(state.lives) || '💔';
    timeText.textContent = Math.max(0, Math.ceil(state.time)).toString();
    if (message) gameStatus.textContent = message;
  }

  function resetGame() {
    Object.assign(state, { started: false, paused: false, over: false, won: false, score: 0, lives: 3, time: 45, pointerActive: false, pointerTarget: null });
    Object.assign(state.player, { x: 120, y: 250, invincible: 0 });
    state.items = Array.from({ length: 8 }, spawnItem);
    state.enemies = Array.from({ length: 4 }, (_, index) => spawnEnemy(index));
    state.particles = [];
    buildBackgroundStars();
    updateHud('Press Start Game. Collect ⭐ and 🍊. Avoid 😠.');
    pauseBtn.textContent = 'Pause';
    startBtn.textContent = 'Start game';
  }

  function startGame() {
    resetGame();
    state.started = true;
    state.lastTime = performance.now();
    startBtn.textContent = 'Restart game';
    updateHud('Go! Drag, tap buttons, or use arrow keys to fly.');
  }

  function togglePause() {
    if (!state.started || state.over) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    updateHud(state.paused ? 'Paused. Press Resume when ready.' : 'Back in action!');
  }

  function addParticles(x, y, emoji, count = 12) {
    for (let i = 0; i < count; i += 1) {
      state.particles.push({ x, y, emoji, vx: random(-120, 120), vy: random(-150, 70), life: random(0.45, 0.9), maxLife: 0.9, size: random(14, 24) });
    }
  }

  function endGame(won) {
    Object.assign(state, { over: true, won, started: false, pointerActive: false });
    startBtn.textContent = 'Play again';
    if (won) {
      addParticles(state.player.x, state.player.y, '🎉', 30);
      updateHud('You won! Antonio’s rocket collected enough sparkle power.');
    } else {
      updateHud('Game over! Try again and dodge those grumpy faces.');
    }
  }

  function getInputVector() {
    let dx = 0;
    let dy = 0;
    if (state.keys.ArrowLeft || state.keys.a || state.buttons.left) dx -= 1;
    if (state.keys.ArrowRight || state.keys.d || state.buttons.right) dx += 1;
    if (state.keys.ArrowUp || state.keys.w || state.buttons.up) dy -= 1;
    if (state.keys.ArrowDown || state.keys.s || state.buttons.down) dy += 1;
    if (state.pointerActive && state.pointerTarget) {
      const pointerX = state.pointerTarget.x - state.player.x;
      const pointerY = state.pointerTarget.y - state.player.y;
      const pointerDistance = Math.hypot(pointerX, pointerY);
      if (pointerDistance > 12) {
        dx += pointerX / pointerDistance;
        dy += pointerY / pointerDistance;
      }
    }
    const length = Math.hypot(dx, dy);
    return length > 0 ? { dx: dx / length, dy: dy / length } : { dx: 0, dy: 0 };
  }

  function updateGame(dt) {
    if (!state.started || state.paused || state.over) return;
    state.time -= dt;
    state.player.invincible = Math.max(0, state.player.invincible - dt);
    const { dx, dy } = getInputVector();
    const speed = state.player.speed * ((state.keys[' '] || state.buttons.boost) ? 1.55 : 1);
    state.player.x = clamp(state.player.x + dx * speed * dt, state.player.r, world.width - state.player.r);
    state.player.y = clamp(state.player.y + dy * speed * dt, state.player.r, world.height - state.player.r);

    state.enemies.forEach((enemy) => {
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      if (enemy.x < enemy.r || enemy.x > world.width - enemy.r) enemy.vx *= -1;
      if (enemy.y < enemy.r || enemy.y > world.height - enemy.r) enemy.vy *= -1;
      enemy.x = clamp(enemy.x, enemy.r, world.width - enemy.r);
      enemy.y = clamp(enemy.y, enemy.r, world.height - enemy.r);
      if (distance(enemy, state.player) < enemy.r + state.player.r - 4 && state.player.invincible <= 0) {
        state.lives -= 1;
        state.player.invincible = 1.25;
        addParticles(state.player.x, state.player.y, '💥', 14);
        const awayX = state.player.x - enemy.x;
        const awayY = state.player.y - enemy.y;
        const awayLength = Math.hypot(awayX, awayY) || 1;
        state.player.x = clamp(state.player.x + (awayX / awayLength) * 55, state.player.r, world.width - state.player.r);
        state.player.y = clamp(state.player.y + (awayY / awayLength) * 55, state.player.r, world.height - state.player.r);
        if (state.lives <= 0) endGame(false);
        else updateHud('Ouch! A grumpy face bumped the rocket.');
      }
    });

    for (let i = state.items.length - 1; i >= 0; i -= 1) {
      const item = state.items[i];
      item.pulse += dt * 4;
      if (distance(item, state.player) < item.r + state.player.r) {
        state.score += item.points;
        addParticles(item.x, item.y, item.emoji, 10);
        state.items.splice(i, 1, spawnItem());
        updateHud(item.kind === 'orange' ? 'Orange boost! +2 points.' : 'Sparkle collected! +1 point.');
        if (state.score >= state.target) endGame(true);
      }
    }

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const particle = state.particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 220 * dt;
      if (particle.life <= 0) state.particles.splice(i, 1);
    }
    if (state.time <= 0 && !state.over) endGame(false);
    updateHud();
  }

  function drawEmoji(entity, size, alpha = 1, rotation = 0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(entity.x, entity.y);
    ctx.rotate(rotation);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.shadowColor = 'rgb(124 45 18 / 0.22)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 5;
    ctx.fillText(entity.emoji, 0, 0);
    ctx.restore();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, world.width, world.height);
    gradient.addColorStop(0, '#fff7ed');
    gradient.addColorStop(0.45, '#fed7aa');
    gradient.addColorStop(1, '#fb923c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.save();
    ctx.globalAlpha = 0.38;
    ctx.fillStyle = '#ffffff';
    state.stars.forEach((star) => { ctx.beginPath(); ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = '#9a3412';
    for (let x = 0; x < world.width; x += 42) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, world.height); ctx.stroke(); }
    for (let y = 0; y < world.height; y += 42) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(world.width, y); ctx.stroke(); }
    ctx.restore();
  }

  function drawPlayer() {
    const flicker = state.player.invincible > 0 && Math.floor(performance.now() / 90) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = flicker ? 0.45 : 1;
    ctx.fillStyle = 'rgb(255 255 255 / 0.52)';
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawEmoji({ ...state.player, emoji: '🚀' }, 42, flicker ? 0.45 : 1, -0.18);
  }

  function drawRoundedRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
  }

  function drawOverlay(title, body) {
    ctx.save();
    ctx.fillStyle = 'rgb(23 32 51 / 0.62)';
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.fillStyle = 'rgb(255 247 237 / 0.96)';
    drawRoundedRect(80, 105, world.width - 160, 260, 28);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#172033';
    ctx.font = '800 42px ui-rounded, system-ui, sans-serif';
    ctx.fillText(title, world.width / 2, 180);
    ctx.fillStyle = '#9a3412';
    ctx.font = '700 22px ui-rounded, system-ui, sans-serif';
    ctx.fillText(body, world.width / 2, 230);
    ctx.font = '52px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.fillText('🚀 ⭐ 🍊', world.width / 2, 300);
    ctx.restore();
  }

  function render() {
    drawBackground();
    state.items.forEach((item) => drawEmoji(item, (item.kind === 'orange' ? 34 : 32) * (1 + Math.sin(item.pulse) * 0.08)));
    state.enemies.forEach((enemy) => drawEmoji(enemy, 40, 1, Math.sin(performance.now() / 600) * enemy.spin));
    drawPlayer();
    state.particles.forEach((particle) => drawEmoji(particle, particle.size, clamp(particle.life / particle.maxLife, 0, 1)));
    if (!state.started && !state.over && state.score === 0) drawOverlay('Ready to launch?', 'Collect 12 points. Dodge the grumps.');
    if (state.paused) drawOverlay('Paused', 'Press Resume to keep flying.');
    if (state.over) drawOverlay(state.won ? 'You win!' : 'Try again!', state.won ? 'Sparkle power collected.' : 'The rocket needs another run.');
  }

  function loop(timestamp) {
    const dt = Math.min((timestamp - state.lastTime) / 1000 || 0, 0.033);
    state.lastTime = timestamp;
    updateGame(dt);
    render();
    requestAnimationFrame(loop);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * world.width, y: ((event.clientY - rect.top) / rect.height) * world.height };
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!state.started && !state.over) return;
    canvas.setPointerCapture(event.pointerId);
    state.pointerActive = true;
    state.pointerTarget = canvasPoint(event);
  });
  canvas.addEventListener('pointermove', (event) => { if (state.pointerActive) state.pointerTarget = canvasPoint(event); });
  ['pointerup', 'pointercancel'].forEach((name) => canvas.addEventListener(name, () => { state.pointerActive = false; state.pointerTarget = null; }));

  document.querySelectorAll('[data-dir]').forEach((button) => {
    const direction = button.dataset.dir;
    const press = (event) => { event.preventDefault(); state.buttons[direction] = true; };
    const release = (event) => { event.preventDefault(); state.buttons[direction] = false; };
    button.addEventListener('pointerdown', press);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => button.addEventListener(name, release));
  });
  boostBtn.addEventListener('pointerdown', (event) => { event.preventDefault(); state.buttons.boost = true; });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((name) => boostBtn.addEventListener(name, () => { state.buttons.boost = false; }));

  window.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    state.keys[key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
    if (key === 'p') togglePause();
  });
  window.addEventListener('keyup', (event) => { state.keys[event.key.length === 1 ? event.key.toLowerCase() : event.key] = false; });
  startBtn.addEventListener('click', startGame);
  resetBtn.addEventListener('click', resetGame);
  pauseBtn.addEventListener('click', togglePause);
  resetGame();
  requestAnimationFrame(loop);
})();
