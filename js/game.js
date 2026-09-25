// STREET RUSH 2D - Core Game Engine & State Management (Single Player + Multiplayer)

class GameEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER, LEVEL_COMPLETE, MP_RACING, MP_RESULTS
    
    this.isMultiplayer = false;
    this.player = null;
    this.road = null;
    this.enemies = [];
    this.collectibles = [];
    
    this.score = 0;
    this.sessionCoins = 0;
    this.distance = 0;
    this.nearMisses = 0;
    this.currentLevelIndex = 0;
    this.currentLevelConfig = null;
    this.raceStartTime = 0;
    this.isPlayerFinished = false;
    
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.powerupTimer = 0;
    this.lastTime = 0;
    this.isNewHighScore = false;
    
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      nitro: false,
      space: false
    };
  }

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas element not found:', canvasId);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    this.road = road;
    this.player = new PlayerCar();

    this.setupEventListeners();
    this.startMenuLoop();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        if (!this.input.left && this.state === 'PLAYING') {
          this.player.moveLeft(this.road);
        }
        this.input.left = true;
        e.preventDefault();
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        if (!this.input.right && this.state === 'PLAYING') {
          this.player.moveRight(this.road);
        }
        this.input.right = true;
        e.preventDefault();
      }
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        this.input.up = true;
        e.preventDefault();
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        this.input.down = true;
        e.preventDefault();
      }
      if (e.code === 'Space') {
        this.input.space = true;
        e.preventDefault();
      }
      if (e.code === 'Escape') {
        if (this.state === 'PLAYING' && !this.isMultiplayer) {
          this.pauseGame();
        } else if (this.state === 'PAUSED' && !this.isMultiplayer) {
          this.resumeGame();
        }
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) this.input.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) this.input.right = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) this.input.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) this.input.down = false;
      if (e.code === 'Space') this.input.space = false;
    });
  }

  // --- SINGLE PLAYER RACE LAUNCH ---
  startRace(levelNum = null) {
    this.isMultiplayer = false;
    audio.ensureContext();
    audio.startEngine();
    audio.startBGM();

    const lvl = levelNum || storage.getCurrentLevel();
    this.currentLevelIndex = Math.max(0, Math.min(CONFIG.LEVELS.length - 1, lvl - 1));
    this.currentLevelConfig = CONFIG.LEVELS[this.currentLevelIndex];

    this.road.setEnvironment(this.currentLevelConfig.env);
    this.player.reset(this.road);
    
    this.enemies = [];
    this.collectibles = [];
    this.particles = particles;
    this.particles.reset();

    this.score = 0;
    this.sessionCoins = 0;
    this.distance = 0;
    this.nearMisses = 0;
    this.isNewHighScore = false;
    this.isPlayerFinished = false;
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.powerupTimer = 0;

    this.state = 'PLAYING';
    ui.showScreen('hud');
    ui.setMultiplayerHUDVisible(false);

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // --- MULTIPLAYER RACE LAUNCH ---
  startMultiplayerRace() {
    this.isMultiplayer = true;
    audio.ensureContext();
    audio.startEngine();
    audio.startBGM();

    // Use Night highway environment for multiplayer aesthetic
    this.currentLevelConfig = {
      level: 1,
      name: 'Multiplayer Speedway',
      targetDistance: multiplayer.raceDistance || CONFIG.MULTIPLAYER.RACE_DISTANCE,
      env: 'NIGHT',
      trafficDensity: 0.65,
      trafficSpeedMin: 5.0,
      trafficSpeedMax: 8.0,
      spawnInterval: 95,
      coinFrequency: 0.6,
      powerupFrequency: 0.35,
      aggressiveSpawnRate: 0.2
    };

    this.road.setEnvironment(this.currentLevelConfig.env);
    this.player.reset(this.road);

    // Apply player's assigned multiplayer color
    const myColorData = multiplayer.getMyPlayerColor();
    this.player.carData.color = myColorData.color;
    this.player.carData.accentColor = myColorData.accent;

    this.enemies = [];
    this.collectibles = [];
    this.particles = particles;
    this.particles.reset();

    this.score = 0;
    this.sessionCoins = 0;
    this.distance = 0;
    this.nearMisses = 0;
    this.isNewHighScore = false;
    this.isPlayerFinished = false;
    this.raceStartTime = performance.now();
    this.spawnTimer = 0;
    this.coinTimer = 0;
    this.powerupTimer = 0;

    this.state = 'PLAYING';
    ui.showScreen('hud');
    ui.setMultiplayerHUDVisible(true);

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  pauseGame() {
    if (this.state === 'PLAYING' && !this.isMultiplayer) {
      this.state = 'PAUSED';
      audio.stopEngine();
      ui.showPauseModal(true);
    }
  }

  resumeGame() {
    if (this.state === 'PAUSED' && !this.isMultiplayer) {
      this.state = 'PLAYING';
      audio.startEngine();
      ui.showPauseModal(false);
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  restartRace() {
    ui.showPauseModal(false);
    if (this.isMultiplayer) {
      multiplayer.requestRematch();
    } else {
      this.startRace(this.currentLevelIndex + 1);
    }
  }

  returnToMenu() {
    if (this.isMultiplayer) {
      multiplayer.leaveRoom();
      this.isMultiplayer = false;
    }
    this.state = 'MENU';
    audio.stopEngine();
    audio.stopBGM();
    ui.showPauseModal(false);
    ui.hideModals();
    ui.showScreen('main-menu');
  }

  // --- TRAFFIC & COLLECTIBLES SPAWNING ---

  spawnTraffic() {
    const lvl = this.currentLevelConfig;
    const occupiedLanes = this.enemies
      .filter(e => e.y < 120)
      .map(e => e.lane);

    const availableLanes = [0, 1, 2].filter(l => !occupiedLanes.includes(l));
    if (availableLanes.length === 0) return;

    const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];

    let typeKey = 'SEDAN';
    const rand = Math.random();

    if (rand < lvl.aggressiveSpawnRate) {
      typeKey = 'AGGRESSIVE';
    } else if (rand < 0.35) {
      typeKey = 'TRUCK';
    } else if (rand < 0.7) {
      typeKey = 'SPORT';
    } else {
      typeKey = 'SEDAN';
    }

    const spawnY = -100 - Math.random() * 50;
    const baseSpd = lvl.trafficSpeedMin + Math.random() * (lvl.trafficSpeedMax - lvl.trafficSpeedMin);
    
    this.enemies.push(new EnemyVehicle(typeKey, lane, spawnY, baseSpd, this.road));
  }

  spawnCoin() {
    const lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
    const x = this.road.getLaneX(lane) + (Math.random() * 20 - 10);
    const spawnY = -60;

    const r = Math.random();
    let type = 'coin';
    if (r > 0.88) type = 'gold_coin';
    else if (r > 0.65) type = 'rare_coin';

    this.collectibles.push(new CollectibleItem(type, x, spawnY));
  }

  spawnPowerup() {
    const lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
    const x = this.road.getLaneX(lane);
    const spawnY = -60;

    const types = ['shield', 'magnet', 'nitro', 'multiplier'];
    const selected = types[Math.floor(Math.random() * types.length)];

    this.collectibles.push(new CollectibleItem(selected, x, spawnY));
  }

  // --- COLLISION RESOLUTION ---

  checkCollisions() {
    const playerBox = this.player.getHitbox();

    // 1. Check Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      if (item.isCollected) continue;

      const dist = Math.hypot(this.player.x - item.x, this.player.y - item.y);
      if (dist < (this.player.width / 2 + item.radius)) {
        item.isCollected = true;

        if (item.type === 'coin') {
          this.sessionCoins += 10;
          this.score += 10;
          audio.playCoin();
          particles.emitCoinGlow(item.x, item.y, '#facc15');
          particles.emitTextPopup(item.x, item.y, '+10 🪙', '#facc15', 16);
        } else if (item.type === 'rare_coin') {
          this.sessionCoins += 25;
          this.score += 25;
          audio.playCoin();
          particles.emitCoinGlow(item.x, item.y, '#38bdf8');
          particles.emitTextPopup(item.x, item.y, '+25 💎', '#38bdf8', 18);
        } else if (item.type === 'gold_coin') {
          this.sessionCoins += 50;
          this.score += 50;
          audio.playCoin();
          particles.emitCoinGlow(item.x, item.y, '#f472b6');
          particles.emitTextPopup(item.x, item.y, '+50 👑', '#f472b6', 20);
        } else {
          this.player.activatePowerup(item.type);
        }

        this.collectibles.splice(i, 1);
      }
    }

    // 2. Check Enemy Collisions & Near Misses
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      const enemyBox = enemy.getHitbox();

      const isOverlap = (
        playerBox.x < enemyBox.x + enemyBox.width &&
        playerBox.x + playerBox.width > enemyBox.x &&
        playerBox.y < enemyBox.y + enemyBox.height &&
        playerBox.y + playerBox.height > enemyBox.y
      );

      if (isOverlap) {
        enemy.hasCollided = true;
        const tookDmg = this.player.applyDamage();
        if (tookDmg && this.player.health <= 0) {
          if (this.isMultiplayer) {
            // Respawn with temporary slowdown instead of instant game over
            this.player.health = 3;
            this.player.invulnerableTime = 2.5;
            particles.emitTextPopup(this.player.x, this.player.y - 30, 'RESPAWNING...', '#ef4444', 18);
          } else {
            this.triggerGameOver();
            return;
          }
        }
      } else {
        if (enemy.checkNearMiss(this.player)) {
          this.nearMisses += 1;
          const nearMissBonus = CONFIG.NEAR_MISS_SCORE * (this.player.hasActivePowerup('multiplier') ? 2 : 1);
          this.score += nearMissBonus;
          audio.playNearMiss();
          particles.emitTextPopup(this.player.x, this.player.y - 45, `NEAR MISS +${nearMissBonus}! 🔥`, '#f59e0b', 20);
        }
      }
    }

    // 3. Player vs Remote Players lightweight brush contact
    if (this.isMultiplayer) {
      multiplayer.remotePlayers.forEach(rp => {
        const dist = Math.hypot(this.player.x - rp.x, this.player.y - rp.y);
        if (dist < 42) {
          if (Math.random() < 0.25) {
            particles.emitSparks((this.player.x + rp.x) / 2, (this.player.y + rp.y) / 2, 4);
          }
        }
      });
    }
  }

  // --- SINGLE PLAYER END CONDITIONS ---

  triggerGameOver() {
    this.state = 'GAME_OVER';
    audio.stopEngine();
    audio.playGameOver();

    this.isNewHighScore = storage.setHighScore(this.score);
    storage.addCoins(this.sessionCoins);
    storage.recordRaceStats(this.distance, this.nearMisses);

    ui.showGameOverModal({
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      coins: this.sessionCoins,
      nearMisses: this.nearMisses,
      level: this.currentLevelIndex + 1,
      bestScore: storage.getHighScore(),
      isNewHigh: this.isNewHighScore
    });
  }

  triggerLevelComplete() {
    this.state = 'LEVEL_COMPLETE';
    audio.stopEngine();
    audio.playLevelComplete();

    const bonusCoins = 50 + this.currentLevelIndex * 25;
    const totalLevelCoins = this.sessionCoins + bonusCoins;

    this.isNewHighScore = storage.setHighScore(this.score);
    storage.addCoins(totalLevelCoins);
    storage.unlockNextLevel(this.currentLevelIndex + 1);
    storage.recordRaceStats(this.distance, this.nearMisses);

    ui.showLevelCompleteModal({
      level: this.currentLevelIndex + 1,
      levelName: this.currentLevelConfig.name,
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      collectedCoins: this.sessionCoins,
      bonusCoins: bonusCoins,
      totalCoins: totalLevelCoins,
      hasNextLevel: this.currentLevelIndex + 1 < CONFIG.LEVELS.length
    });
  }

  // --- MULTIPLAYER RACE OVER ---
  triggerMultiplayerRaceOver(finishOrder) {
    this.state = 'MP_RESULTS';
    audio.stopEngine();
    audio.playLevelComplete();

    // Reward coins based on finish position
    let earnedCoins = this.sessionCoins;
    const me = finishOrder.find(p => p.playerId === multiplayer.myPlayerId);
    if (me) {
      if (me.rank === 1) earnedCoins += 150;
      else if (me.rank === 2) earnedCoins += 100;
      else if (me.rank === 3) earnedCoins += 60;
      else earnedCoins += 40;
    }
    storage.addCoins(earnedCoins);
    storage.recordRaceStats(this.distance, this.nearMisses);

    ui.showMultiplayerResultsModal(finishOrder, earnedCoins);
  }

  // --- MAIN LOOP ---

  gameLoop(currentTime) {
    if (this.state !== 'PLAYING') return;

    const dt = Math.min(0.1, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    const lvl = this.currentLevelConfig;
    const isRaining = lvl.env === 'RAIN';

    // Calculate effective forward speed
    let currentSpeed = CONFIG.BASE_SPEED * this.player.statMultipliers.speed;
    if (this.input.up) currentSpeed += 3.5;
    if (this.input.down) currentSpeed -= 3.0;
    if (this.player.isNitroActive) currentSpeed += CONFIG.NITRO_SPEED_BOOST;

    const speedRatio = currentSpeed / CONFIG.BASE_SPEED;

    // Update Distance & Score
    const distanceDelta = currentSpeed * dt * 25;
    this.distance += distanceDelta;
    
    let scoreMultiplier = 1;
    if (this.player.hasActivePowerup('multiplier')) scoreMultiplier *= 2;
    if (this.player.isNitroActive) scoreMultiplier *= 1.5;

    this.score += distanceDelta * 0.4 * scoreMultiplier;

    // Update audio engine pitch
    audio.updateEnginePitch(speedRatio, this.player.isNitroActive);

    // Update road & player
    this.road.update(currentSpeed);
    this.player.update(dt, this.input, this.road, isRaining);

    // Multiplayer telemetry broadcast & remote players update
    if (this.isMultiplayer) {
      multiplayer.sendPlayerState(this.player, currentSpeed, this.distance);
      multiplayer.updateRemotePlayers(dt);

      // Check if player crossed finish line
      if (this.distance >= lvl.targetDistance && !this.isPlayerFinished) {
        this.isPlayerFinished = true;
        const elapsed = ((performance.now() - this.raceStartTime) / 1000).toFixed(2);
        multiplayer.sendFinished(elapsed);
        audio.playLevelComplete();
      }
    }

    // Update Traffic Spawning
    this.spawnTimer += dt * 60;
    if (this.spawnTimer >= lvl.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnTraffic();
    }

    // Update Coins Spawning
    this.coinTimer += dt;
    if (this.coinTimer >= 2.2 / lvl.coinFrequency) {
      this.coinTimer = 0;
      this.spawnCoin();
    }

    // Update Powerups Spawning
    this.powerupTimer += dt;
    if (this.powerupTimer >= 8.0 / lvl.powerupFrequency) {
      this.powerupTimer = 0;
      this.spawnPowerup();
    }

    // Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(dt, currentSpeed, this.road, this.enemies);

      if (enemy.y > CONFIG.CANVAS_HEIGHT + 160 || enemy.y < -300) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.update(dt, currentSpeed, this.player);

      if (item.y > CONFIG.CANVAS_HEIGHT + 80) {
        this.collectibles.splice(i, 1);
      }
    }

    // Update particles & weather
    particles.update(dt, speedRatio, isRaining, this.player.isNitroActive);

    // Resolve Collisions
    this.checkCollisions();

    // Check Single Player Level Complete Goal
    if (!this.isMultiplayer && this.distance >= lvl.targetDistance) {
      this.triggerLevelComplete();
      return;
    }

    // Calculate real-time race position in multiplayer
    let currentPosition = 1;
    let totalRacerCount = 1;
    let leaderboardList = [];

    if (this.isMultiplayer) {
      leaderboardList.push({ name: 'YOU', distance: Math.floor(this.distance), isMe: true });
      multiplayer.remotePlayers.forEach(rp => {
        leaderboardList.push({ name: rp.name, distance: Math.floor(rp.distance), isMe: false });
        if (rp.distance > this.distance) {
          currentPosition++;
        }
      });
      totalRacerCount = leaderboardList.length;
      leaderboardList.sort((a, b) => b.distance - a.distance);
    }

    // Update HUD
    ui.updateHUD({
      health: this.player.health,
      coins: this.sessionCoins,
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      targetDistance: lvl.targetDistance,
      nitro: this.player.nitro,
      level: this.currentLevelIndex + 1,
      activePowerups: this.player.activePowerups,
      isMultiplayer: this.isMultiplayer,
      position: currentPosition,
      totalPlayers: totalRacerCount,
      leaderboard: leaderboardList
    });
  }

  render() {
    this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    const shake = particles.getShakeOffset();
    this.ctx.save();
    this.ctx.translate(shake.x, shake.y);

    // 1. Draw Road & Scenery
    this.road.render(this.ctx);

    // 2. Draw Skid Marks
    particles.renderSkidMarks(this.ctx);

    // 3. Draw Collectibles
    this.collectibles.forEach(item => item.render(this.ctx));

    // 4. Draw Enemies
    this.enemies.forEach(enemy => enemy.render(this.ctx, this.road.currentEnv));

    // 5. Draw Remote Multiplayer Opponents (Interpolated)
    if (this.isMultiplayer) {
      multiplayer.renderRemotePlayers(this.ctx, this.road.currentEnv);
    }

    // 6. Draw Player Car
    this.player.render(this.ctx, this.road.currentEnv);

    // 7. Draw Particles (Nitro flames, sparks, popups)
    particles.renderParticles(this.ctx);

    // 8. Draw Weather (Rain / Speed Lines)
    if (this.road.currentEnv.rain) {
      particles.renderRain(this.ctx);
    }
    particles.renderSpeedLines(this.ctx);

    // 9. Draw Screen Flash
    particles.renderFlash(this.ctx);

    this.ctx.restore();
  }

  startMenuLoop() {
    const menuAnim = () => {
      if (this.state === 'MENU') {
        this.road.setEnvironment('NIGHT');
        this.road.update(4.0);
        this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        this.road.render(this.ctx);
        particles.update(0.016, 1.0, false, false);
        particles.renderParticles(this.ctx);
      }
      requestAnimationFrame(menuAnim);
    };
    requestAnimationFrame(menuAnim);
  }
}

const game = new GameEngine();
