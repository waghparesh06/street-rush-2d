// STREET RUSH 2D - UI Manager & Screen Navigation (Single Player + Multiplayer)

class UIManager {
  constructor() {
    this.currentScreen = 'main-menu';
    this.playerName = localStorage.getItem('STREET_RUSH_PLAYER_NAME') || `Racer_${Math.floor(100 + Math.random() * 900)}`;
  }

  init() {
    this.bindEvents();
    this.refreshMenuStats();
    this.renderCarSelect();
    this.renderGarage();
    this.renderSettings();
  }

  showScreen(screenId) {
    audio.playClick();
    
    // Hide all screens
    const screens = document.querySelectorAll('.ui-screen');
    screens.forEach(s => s.classList.remove('active'));

    // Show target screen
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      this.currentScreen = screenId;
    }

    // Refresh context data when opening certain screens
    if (screenId === 'main-menu') {
      this.refreshMenuStats();
    } else if (screenId === 'cars-menu') {
      this.renderCarSelect();
    } else if (screenId === 'garage-menu') {
      this.renderGarage();
    } else if (screenId === 'settings-menu') {
      this.renderSettings();
    } else if (screenId === 'mp-menu') {
      const nameInput = document.getElementById('mp-player-name-input');
      if (nameInput) nameInput.value = this.playerName;
    }
  }

  refreshMenuStats() {
    const highScoreEl = document.getElementById('menu-best-score');
    const coinsEl = document.getElementById('menu-total-coins');
    const levelEl = document.getElementById('menu-current-level');

    if (highScoreEl) highScoreEl.innerText = storage.getHighScore().toLocaleString();
    if (coinsEl) coinsEl.innerText = storage.getCoins().toLocaleString();
    if (levelEl) levelEl.innerText = `LEVEL ${storage.getCurrentLevel()}`;
  }

  getPlayerCarData() {
    const selectedId = storage.getSelectedCar();
    return CONFIG.CARS.find(c => c.id === selectedId) || CONFIG.CARS[0];
  }

  bindEvents() {
    // --- Main Menu Buttons ---
    document.getElementById('btn-play-solo')?.addEventListener('click', () => {
      this.showScreen('level-select-menu');
      this.renderLevelSelect();
    });

    document.getElementById('btn-multiplayer')?.addEventListener('click', () => {
      this.showScreen('mp-menu');
    });

    document.getElementById('btn-garage')?.addEventListener('click', () => {
      this.showScreen('garage-menu');
    });

    document.getElementById('btn-cars')?.addEventListener('click', () => {
      this.showScreen('cars-menu');
    });

    document.getElementById('btn-how-to-play')?.addEventListener('click', () => {
      this.showScreen('how-to-play-menu');
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.showScreen('settings-menu');
    });

    // --- Back Buttons ---
    document.querySelectorAll('.btn-back').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.currentScreen === 'mp-lobby-menu') {
          multiplayer.leaveRoom();
        }
        this.showScreen('main-menu');
      });
    });

    // --- Multiplayer Mode Entry Menu ---
    const nameInput = document.getElementById('mp-player-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.playerName = e.target.value.trim().substring(0, 18);
        localStorage.setItem('STREET_RUSH_PLAYER_NAME', this.playerName);
      });
    }

    document.getElementById('btn-mp-create-room')?.addEventListener('click', () => {
      const carData = this.getPlayerCarData();
      multiplayer.createRoom(this.playerName, carData);
    });

    document.getElementById('btn-mp-join-room-screen')?.addEventListener('click', () => {
      this.showScreen('mp-join-menu');
    });

    // --- Join Room Menu ---
    document.getElementById('btn-mp-submit-join')?.addEventListener('click', () => {
      const codeInput = document.getElementById('mp-room-code-input');
      const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
      if (!code) {
        this.showToast('Please enter a room code', '#ef4444');
        return;
      }
      const carData = this.getPlayerCarData();
      multiplayer.joinRoom(code, this.playerName, carData);
    });

    // --- Lobby Buttons ---
    document.getElementById('btn-mp-copy-code')?.addEventListener('click', () => {
      if (multiplayer.roomId) {
        navigator.clipboard.writeText(multiplayer.roomId).then(() => {
          this.showToast(`Room code ${multiplayer.roomId} copied! 📋`, '#38bdf8');
        }).catch(() => {
          this.showToast(`Room code: ${multiplayer.roomId}`, '#38bdf8');
        });
      }
    });

    document.getElementById('btn-mp-toggle-ready')?.addEventListener('click', () => {
      multiplayer.toggleReady();
    });

    document.getElementById('btn-mp-start-race')?.addEventListener('click', () => {
      multiplayer.startRace();
    });

    document.getElementById('btn-mp-leave-room')?.addEventListener('click', () => {
      multiplayer.leaveRoom();
      this.showScreen('main-menu');
    });

    // --- Multiplayer Results Buttons ---
    document.getElementById('btn-mp-results-rematch')?.addEventListener('click', () => {
      multiplayer.requestRematch();
    });

    document.getElementById('btn-mp-results-menu')?.addEventListener('click', () => {
      game.returnToMenu();
    });

    // --- Pause Modal Buttons (Solo) ---
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      game.resumeGame();
    });
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
      game.restartRace();
    });
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      game.returnToMenu();
    });

    // --- Game Over Buttons (Solo) ---
    document.getElementById('btn-gameover-retry')?.addEventListener('click', () => {
      this.hideModals();
      game.restartRace();
    });
    document.getElementById('btn-gameover-garage')?.addEventListener('click', () => {
      this.hideModals();
      game.returnToMenu();
      this.showScreen('garage-menu');
    });
    document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
      this.hideModals();
      game.returnToMenu();
    });

    // --- Level Complete Buttons (Solo) ---
    document.getElementById('btn-levelcomplete-next')?.addEventListener('click', () => {
      this.hideModals();
      game.startRace(storage.getCurrentLevel());
    });
    document.getElementById('btn-levelcomplete-garage')?.addEventListener('click', () => {
      this.hideModals();
      game.returnToMenu();
      this.showScreen('garage-menu');
    });
    document.getElementById('btn-levelcomplete-menu')?.addEventListener('click', () => {
      this.hideModals();
      game.returnToMenu();
    });

    // --- Mobile Touch Controls ---
    const btnLeft = document.getElementById('mobile-btn-left');
    const btnRight = document.getElementById('mobile-btn-right');
    const btnNitro = document.getElementById('mobile-btn-nitro');

    if (btnLeft) {
      btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.input.left = true;
        if (game.state === 'PLAYING') game.player.moveLeft(game.road);
      });
      btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        game.input.left = false;
      });
      btnLeft.addEventListener('mousedown', () => {
        game.input.left = true;
        if (game.state === 'PLAYING') game.player.moveLeft(game.road);
      });
      btnLeft.addEventListener('mouseup', () => { game.input.left = false; });
    }

    if (btnRight) {
      btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.input.right = true;
        if (game.state === 'PLAYING') game.player.moveRight(game.road);
      });
      btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        game.input.right = false;
      });
      btnRight.addEventListener('mousedown', () => {
        game.input.right = true;
        if (game.state === 'PLAYING') game.player.moveRight(game.road);
      });
      btnRight.addEventListener('mouseup', () => { game.input.right = false; });
    }

    if (btnNitro) {
      btnNitro.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.input.nitro = true;
      });
      btnNitro.addEventListener('touchend', (e) => {
        e.preventDefault();
        game.input.nitro = false;
      });
      btnNitro.addEventListener('mousedown', () => { game.input.nitro = true; });
      btnNitro.addEventListener('mouseup', () => { game.input.nitro = false; });
    }

    // In-game Pause Button (Solo only)
    document.getElementById('hud-btn-pause')?.addEventListener('click', () => {
      if (!game.isMultiplayer) {
        game.pauseGame();
      }
    });
  }

  // --- MULTIPLAYER LOBBY RENDERING ---

  renderMultiplayerLobby(room, myPlayerId) {
    if (!room) return;

    // Room code badge
    const codeEl = document.getElementById('lobby-room-code-display');
    if (codeEl) codeEl.innerText = room.id;

    const countEl = document.getElementById('lobby-player-count');
    if (countEl) countEl.innerText = `${room.players.length} / ${room.maxPlayers}`;

    const listEl = document.getElementById('lobby-players-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const colors = CONFIG.MULTIPLAYER.PLAYER_COLORS;

    room.players.forEach(p => {
      const isMe = p.id === myPlayerId;
      const pColor = colors[p.colorIndex % colors.length];

      const row = document.createElement('div');
      row.className = `lobby-player-row ${isMe ? 'is-me' : ''}`;

      row.innerHTML = `
        <div class="lobby-player-left">
          <div class="player-color-dot" style="background: ${pColor.color}; box-shadow: 0 0 10px ${pColor.color}"></div>
          <div class="player-info-text">
            <span class="player-name">${p.name} ${isMe ? '<small>(YOU)</small>' : ''}</span>
            <span class="player-car-tag">${p.carName}</span>
          </div>
        </div>
        <div class="lobby-player-right">
          ${p.isHost ? '<span class="badge-host">👑 HOST</span>' : ''}
          <span class="badge-ready ${p.isReady ? 'ready' : 'not-ready'}">
            ${p.isReady ? 'READY ✓' : 'WAITING...'}
          </span>
        </div>
      `;

      listEl.appendChild(row);
    });

    // Control buttons based on role (Host vs Guest)
    const me = room.players.find(p => p.id === myPlayerId);
    const startBtn = document.getElementById('btn-mp-start-race');
    const readyBtn = document.getElementById('btn-mp-toggle-ready');
    const statusHint = document.getElementById('lobby-status-hint');

    const allReady = room.players.every(p => p.isReady);
    const enoughPlayers = room.players.length >= 2;

    if (me && me.isHost) {
      if (startBtn) {
        startBtn.style.display = 'block';
        startBtn.disabled = !(allReady && enoughPlayers);
      }
      if (readyBtn) readyBtn.style.display = 'none';

      if (statusHint) {
        if (!enoughPlayers) {
          statusHint.innerText = 'Waiting for at least 2 players to join...';
        } else if (!allReady) {
          statusHint.innerText = 'Waiting for all racers to become READY...';
        } else {
          statusHint.innerText = 'All racers ready! Click START RACE.';
        }
      }
    } else {
      if (startBtn) startBtn.style.display = 'none';
      if (readyBtn) {
        readyBtn.style.display = 'block';
        readyBtn.innerText = me && me.isReady ? 'SET NOT READY' : 'SET READY ✓';
        readyBtn.className = `btn ${me && me.isReady ? 'btn-gold' : 'btn-cyan'}`;
      }
      if (statusHint) {
        statusHint.innerText = 'Waiting for host to start race...';
      }
    }
  }

  // --- COUNTDOWN OVERLAY ---

  showCountdown(count) {
    const overlay = document.getElementById('countdown-overlay');
    const numEl = document.getElementById('countdown-number');
    if (!overlay || !numEl) return;

    overlay.classList.add('active');
    numEl.innerText = count > 0 ? count : 'GO!';
    numEl.style.animation = 'none';
    numEl.offsetHeight; // trigger reflow
    numEl.style.animation = 'countdownPulse 0.8s ease-out';
  }

  hideCountdown() {
    const overlay = document.getElementById('countdown-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  // --- MULTIPLAYER RESULTS MODAL ---

  showMultiplayerResultsModal(finishOrder, earnedCoins) {
    const modal = document.getElementById('modal-mp-results');
    if (!modal) return;

    const listEl = document.getElementById('mp-results-list');
    if (listEl) {
      listEl.innerHTML = '';
      const colors = CONFIG.MULTIPLAYER.PLAYER_COLORS;

      finishOrder.forEach((entry, idx) => {
        const isMe = entry.playerId === multiplayer.myPlayerId;
        const color = colors[entry.colorIndex % colors.length];

        const row = document.createElement('div');
        row.className = `mp-result-row rank-${entry.rank} ${isMe ? 'is-me' : ''}`;

        let medal = '🏁';
        if (entry.rank === 1) medal = '🥇';
        else if (entry.rank === 2) medal = '🥈';
        else if (entry.rank === 3) medal = '🥉';

        row.innerHTML = `
          <div class="result-rank">${medal} #${entry.rank}</div>
          <div class="result-name" style="color: ${color.color}">${entry.name} ${isMe ? '(YOU)' : ''}</div>
          <div class="result-time">${entry.time}s</div>
        `;
        listEl.appendChild(row);
      });
    }

    const coinsEl = document.getElementById('mp-results-coins');
    if (coinsEl) coinsEl.innerText = `+${earnedCoins} 🪙`;

    modal.classList.add('active');
  }

  setMultiplayerHUDVisible(isMultiplayer) {
    const soloPause = document.getElementById('hud-btn-pause');
    const mpLeaderboard = document.getElementById('hud-mp-leaderboard');
    const mpPosBadge = document.getElementById('hud-mp-position');

    if (soloPause) soloPause.style.display = isMultiplayer ? 'none' : 'flex';
    if (mpLeaderboard) mpLeaderboard.style.display = isMultiplayer ? 'flex' : 'none';
    if (mpPosBadge) mpPosBadge.style.display = isMultiplayer ? 'block' : 'none';
  }

  // --- CAR SHOWROOM & GARAGE RENDERING ---

  renderCarSelect() {
    const container = document.getElementById('cars-grid');
    const coinsHeader = document.getElementById('cars-header-coins');
    if (coinsHeader) coinsHeader.innerText = storage.getCoins().toLocaleString();
    if (!container) return;

    container.innerHTML = '';
    const selectedCarId = storage.getSelectedCar();

    CONFIG.CARS.forEach(car => {
      const isUnlocked = storage.isCarUnlocked(car.id);
      const isSelected = selectedCarId === car.id;

      const card = document.createElement('div');
      card.className = `car-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;

      card.innerHTML = `
        <div class="car-badge">${car.tag}</div>
        <div class="car-preview-box" style="border-color: ${car.color}">
          <div class="car-visual-silhouette" style="background: linear-gradient(180deg, ${car.color}, ${car.accentColor}); box-shadow: 0 0 15px ${car.glowColor}"></div>
        </div>
        <h3 class="car-name">${car.name}</h3>
        <p class="car-desc">${car.description}</p>
        
        <div class="car-stats-list">
          <div class="stat-row">
            <span>Speed</span>
            <div class="stat-bar"><div class="stat-fill" style="width: ${car.baseSpeed}%; background: #ef4444;"></div></div>
          </div>
          <div class="stat-row">
            <span>Handling</span>
            <div class="stat-bar"><div class="stat-fill" style="width: ${car.baseHandling}%; background: #06b6d4;"></div></div>
          </div>
          <div class="stat-row">
            <span>Nitro</span>
            <div class="stat-bar"><div class="stat-fill" style="width: ${car.baseNitro}%; background: #f59e0b;"></div></div>
          </div>
        </div>

        <div class="car-action-area">
          ${isSelected 
            ? `<button class="btn btn-selected" disabled>SELECTED ✓</button>` 
            : (isUnlocked 
                ? `<button class="btn btn-select" data-id="${car.id}">SELECT</button>`
                : `<button class="btn btn-buy" data-id="${car.id}" data-cost="${car.cost}">UNLOCK (${car.cost} 🪙)</button>`
              )
          }
        </div>
      `;

      card.querySelector('.btn-select')?.addEventListener('click', () => {
        audio.playClick();
        storage.setSelectedCar(car.id);
        this.renderCarSelect();
      });

      card.querySelector('.btn-buy')?.addEventListener('click', () => {
        if (storage.getCoins() >= car.cost) {
          audio.playPowerup();
          storage.unlockCar(car.id, car.cost);
          this.renderCarSelect();
        } else {
          audio.playCrash();
          this.showToast('NOT ENOUGH COINS!', '#ef4444');
        }
      });

      container.appendChild(card);
    });
  }

  renderGarage() {
    const container = document.getElementById('garage-upgrades-list');
    const coinsHeader = document.getElementById('garage-header-coins');
    const activeCarNameEl = document.getElementById('garage-car-name');
    const activeCarTagEl = document.getElementById('garage-car-tag');
    
    if (coinsHeader) coinsHeader.innerText = storage.getCoins().toLocaleString();
    if (!container) return;

    const selectedCarId = storage.getSelectedCar();
    const carData = CONFIG.CARS.find(c => c.id === selectedCarId) || CONFIG.CARS[0];

    if (activeCarNameEl) activeCarNameEl.innerText = carData.name;
    if (activeCarTagEl) {
      activeCarTagEl.innerText = carData.tag;
      activeCarTagEl.style.color = carData.color;
    }

    container.innerHTML = '';

    for (const statKey in CONFIG.UPGRADES) {
      const upgrade = CONFIG.UPGRADES[statKey];
      const currentLevel = storage.getUpgradeLevel(selectedCarId, statKey);
      const isMaxed = currentLevel >= 5;
      const nextUpgrade = !isMaxed ? upgrade.levels[currentLevel] : null;

      const row = document.createElement('div');
      row.className = 'upgrade-card';

      let pipHTML = '';
      for (let i = 1; i <= 5; i++) {
        pipHTML += `<div class="upgrade-pip ${i <= currentLevel ? 'filled' : ''}"></div>`;
      }

      row.innerHTML = `
        <div class="upgrade-info">
          <span class="upgrade-icon">${upgrade.icon}</span>
          <div class="upgrade-text">
            <h4>${upgrade.name}</h4>
            <div class="upgrade-pips">${pipHTML}</div>
          </div>
        </div>

        <div class="upgrade-action">
          ${isMaxed 
            ? `<button class="btn btn-maxed" disabled>MAX LEVEL</button>`
            : `<button class="btn btn-upgrade" data-stat="${statKey}" data-cost="${nextUpgrade.cost}">
                 UPGRADE (${nextUpgrade.cost} 🪙)
               </button>`
          }
        </div>
      `;

      row.querySelector('.btn-upgrade')?.addEventListener('click', () => {
        if (storage.getCoins() >= nextUpgrade.cost) {
          audio.playPowerup();
          storage.upgradeStat(selectedCarId, statKey, nextUpgrade.cost);
          this.renderGarage();
          this.showToast(`${upgrade.name.toUpperCase()} UPGRADED!`, '#10b981');
        } else {
          audio.playCrash();
          this.showToast('NOT ENOUGH COINS!', '#ef4444');
        }
      });

      container.appendChild(row);
    }
  }

  renderLevelSelect() {
    const grid = document.getElementById('level-select-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const maxUnlocked = storage.getMaxLevelUnlocked();

    CONFIG.LEVELS.forEach(lvl => {
      const isUnlocked = lvl.level <= maxUnlocked;
      const card = document.createElement('div');
      card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      card.innerHTML = `
        <div class="level-num">${lvl.level}</div>
        <div class="level-details">
          <h4>${lvl.name}</h4>
          <p>${lvl.description}</p>
          <div class="level-meta">
            <span>🎯 ${lvl.targetDistance}m</span>
            <span>🌤️ ${lvl.env}</span>
          </div>
        </div>
        <div class="level-lock-status">
          ${isUnlocked ? '▶' : '🔒'}
        </div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          storage.setCurrentLevel(lvl.level);
          game.startRace(lvl.level);
        });
      }

      grid.appendChild(card);
    });
  }

  renderSettings() {
    const settings = storage.getSettings();

    const chkSound = document.getElementById('setting-sound');
    const chkMusic = document.getElementById('setting-music');
    const chkShake = document.getElementById('setting-shake');
    const chkReduced = document.getElementById('setting-reduced-effects');

    if (chkSound) {
      chkSound.checked = settings.sound;
      chkSound.onchange = (e) => {
        storage.updateSettings('sound', e.target.checked);
        audio.setSoundEnabled(e.target.checked);
      };
    }
    if (chkMusic) {
      chkMusic.checked = settings.music;
      chkMusic.onchange = (e) => {
        storage.updateSettings('music', e.target.checked);
        audio.setMusicEnabled(e.target.checked);
      };
    }
    if (chkShake) {
      chkShake.checked = settings.screenShake;
      chkShake.onchange = (e) => {
        storage.updateSettings('screenShake', e.target.checked);
      };
    }
    if (chkReduced) {
      chkReduced.checked = settings.reducedEffects;
      chkReduced.onchange = (e) => {
        storage.updateSettings('reducedEffects', e.target.checked);
      };
    }

    document.getElementById('btn-reset-data')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress, high scores, coins, and upgrades?')) {
        storage.resetAll();
        audio.playCrash();
        this.renderSettings();
        this.refreshMenuStats();
        this.showToast('GAME DATA RESET COMPLETED', '#f59e0b');
      }
    });
  }

  // --- HUD UPDATES ---

  updateHUD(data) {
    const heartsEl = document.getElementById('hud-health');
    if (heartsEl) {
      let heartStr = '';
      for (let i = 0; i < 3; i++) {
        heartStr += i < data.health ? '❤️ ' : '💔 ';
      }
      heartsEl.innerText = heartStr.trim();
    }

    const scoreEl = document.getElementById('hud-score');
    const coinsEl = document.getElementById('hud-coins');
    if (scoreEl) scoreEl.innerText = data.score.toLocaleString();
    if (coinsEl) coinsEl.innerText = data.coins.toLocaleString();

    const distEl = document.getElementById('hud-distance');
    const progBar = document.getElementById('hud-progress-fill');
    if (distEl) distEl.innerText = `${data.distance}m / ${data.targetDistance}m`;
    if (progBar) {
      const pct = Math.min(100, (data.distance / data.targetDistance) * 100);
      progBar.style.width = `${pct}%`;
    }

    const nitroFill = document.getElementById('hud-nitro-fill');
    const nitroLabel = document.getElementById('hud-nitro-status');
    if (nitroFill) {
      nitroFill.style.width = `${data.nitro}%`;
    }
    if (nitroLabel) {
      if (data.nitro > 15) {
        nitroLabel.innerText = 'NITRO READY ⚡';
        nitroLabel.style.color = '#38bdf8';
      } else {
        nitroLabel.innerText = 'NITRO EMPTY';
        nitroLabel.style.color = '#94a3b8';
      }
    }

    const powerupsEl = document.getElementById('hud-powerups');
    if (powerupsEl) {
      let pHTML = '';
      for (const k in data.activePowerups) {
        const pConf = CONFIG.POWERUPS[k];
        if (pConf) {
          pHTML += `<div class="powerup-badge" style="border-color: ${pConf.color}">${pConf.icon} ${Math.ceil(data.activePowerups[k])}s</div>`;
        }
      }
      powerupsEl.innerHTML = pHTML;
    }

    // Multiplayer HUD Elements
    if (data.isMultiplayer) {
      const posVal = document.getElementById('hud-mp-position-val');
      if (posVal) posVal.innerText = `${data.position} / ${data.totalPlayers}`;

      const leadEl = document.getElementById('hud-mp-leaderboard-list');
      if (leadEl && data.leaderboard) {
        leadEl.innerHTML = data.leaderboard.map((item, idx) => `
          <div class="hud-lead-item ${item.isMe ? 'is-me' : ''}">
            <span>${idx + 1}. ${item.name}</span>
            <span>${item.distance}m</span>
          </div>
        `).join('');
      }
    }
  }

  // --- MODALS ---

  showPauseModal(show) {
    const modal = document.getElementById('modal-pause');
    if (modal) {
      modal.classList.toggle('active', show);
    }
  }

  showGameOverModal(data) {
    const modal = document.getElementById('modal-gameover');
    if (!modal) return;

    document.getElementById('go-final-score').innerText = data.score.toLocaleString();
    document.getElementById('go-distance').innerText = `${data.distance}m`;
    document.getElementById('go-coins').innerText = `+${data.coins}`;
    document.getElementById('go-near-misses').innerText = data.nearMisses;
    document.getElementById('go-best-score').innerText = data.bestScore.toLocaleString();

    const highTag = document.getElementById('go-new-high-tag');
    if (highTag) {
      highTag.style.display = data.isNewHigh ? 'block' : 'none';
    }

    modal.classList.add('active');
  }

  showLevelCompleteModal(data) {
    const modal = document.getElementById('modal-levelcomplete');
    if (!modal) return;

    document.getElementById('lc-title').innerText = `LEVEL ${data.level} COMPLETE!`;
    document.getElementById('lc-name').innerText = data.levelName;
    document.getElementById('lc-score').innerText = data.score.toLocaleString();
    document.getElementById('lc-coins').innerText = `+${data.collectedCoins}`;
    document.getElementById('lc-bonus').innerText = `+${data.bonusCoins} BONUS`;
    document.getElementById('lc-total-coins').innerText = `+${data.totalCoins} 🪙`;

    const nextBtn = document.getElementById('btn-levelcomplete-next');
    if (nextBtn) {
      nextBtn.style.display = data.hasNextLevel ? 'block' : 'none';
      if (!data.hasNextLevel) {
        document.getElementById('lc-title').innerText = '🎉 CHAMPION! ALL LEVELS CLEARED!';
      }
    }

    modal.classList.add('active');
  }

  hideModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  showToast(text, color = '#38bdf8') {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerText = text;
    toast.style.borderColor = color;
    toast.style.color = color;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
}

const ui = new UIManager();
