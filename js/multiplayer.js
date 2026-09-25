// STREET RUSH 2D - Client-Side Multiplayer Networking System

class MultiplayerClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    
    this.roomId = null;
    this.myPlayerId = null;
    this.isHost = false;
    this.roomData = null; // Latest room summary from server
    
    this.remotePlayers = new Map(); // playerId -> RemotePlayer
    this.raceState = 'IDLE'; // IDLE, LOBBY, COUNTDOWN, RACING, FINISHED
    this.raceDistance = CONFIG.MULTIPLAYER.RACE_DISTANCE;
    this.finishOrder = [];
    
    this.lastSendTime = 0;
    this.sendInterval = 1000 / CONFIG.MULTIPLAYER.NETWORK_TICK_RATE; // ~50ms
  }

  connect(serverUrl = CONFIG.MULTIPLAYER.SERVER_URL) {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
        return resolve(this.ws);
      }

      this.isConnecting = true;
      let resolved = false;

      try {
        this.ws = new WebSocket(serverUrl);
      } catch (err) {
        this.isConnecting = false;
        return reject(err);
      }

      this.ws.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        resolved = true;
        console.log('[MultiplayerClient] Connected to server:', serverUrl);
        resolve(this.ws);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          console.warn('[MultiplayerClient] Error parsing message:', err);
        }
      };

      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.warn('[MultiplayerClient] Connection error:', err);
        if (!resolved) {
          reject(err);
        }
      };

      this.ws.onclose = () => {
        const wasConnected = this.isConnected;
        this.isConnected = false;
        this.isConnecting = false;
        console.log('[MultiplayerClient] Disconnected from server');
        
        if (wasConnected && game.isMultiplayer && (game.state === 'PLAYING' || game.state === 'LOBBY')) {
          ui.showToast('Connection lost to multiplayer server', '#ef4444');
          if (game.state === 'PLAYING') {
            game.returnToMenu();
          }
        }
      };
    });
  }

  send(type, payload = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[MultiplayerClient] Cannot send message - socket not open');
      return false;
    }
    this.ws.send(JSON.stringify({ type, payload }));
    return true;
  }

  // --- ACTIONS ---

  async createRoom(playerName, carData) {
    try {
      await this.connect();
      this.send('CREATE_ROOM', { playerName, carData });
    } catch (err) {
      ui.showToast('Multiplayer Server Offline. Run "npm start"', '#ef4444');
      console.error('Failed to connect to multiplayer server:', err);
    }
  }

  async joinRoom(roomId, playerName, carData) {
    try {
      await this.connect();
      this.send('JOIN_ROOM', { roomId, playerName, carData });
    } catch (err) {
      ui.showToast('Multiplayer Server Offline. Run "npm start"', '#ef4444');
      console.error('Failed to connect to multiplayer server:', err);
    }
  }

  toggleReady() {
    this.send('TOGGLE_READY');
  }

  startRace() {
    this.send('START_RACE');
  }

  sendPlayerState(player, roadSpeed, distance) {
    if (!this.isConnected || this.raceState !== 'RACING') return;

    const now = performance.now();
    if (now - this.lastSendTime < this.sendInterval) return;
    this.lastSendTime = now;

    this.send('PLAYER_UPDATE', {
      x: player.x,
      y: player.y,
      vx: player.vx,
      speed: roadSpeed,
      nitro: player.nitro,
      health: player.health,
      distance: distance,
      isFinished: player.isFinished
    });
  }

  sendFinished(time) {
    this.send('PLAYER_FINISHED', { time });
  }

  requestRematch() {
    this.send('REQUEST_REMATCH');
  }

  leaveRoom() {
    if (this.isConnected) {
      this.send('LEAVE_ROOM');
    }
    this.roomId = null;
    this.myPlayerId = null;
    this.isHost = false;
    this.roomData = null;
    this.remotePlayers.clear();
    this.raceState = 'IDLE';
  }

  // --- MESSAGE HANDLERS ---

  handleMessage(msg) {
    const { type, payload } = msg;

    switch (type) {
      case 'ROOM_CREATED':
      case 'ROOM_JOINED': {
        this.roomId = payload.roomId;
        this.myPlayerId = payload.player.id;
        this.isHost = payload.player.isHost;
        this.roomData = payload.room;
        this.raceState = 'LOBBY';
        
        this.syncRemotePlayers(payload.room.players);
        ui.showScreen('mp-lobby-menu');
        ui.renderMultiplayerLobby(payload.room, this.myPlayerId);
        break;
      }

      case 'ROOM_ERROR': {
        ui.showToast(payload.message || 'Room error occurred', '#ef4444');
        break;
      }

      case 'ROOM_UPDATE': {
        this.roomData = payload.room;
        // Check if host status transferred
        const me = payload.room.players.find(p => p.id === this.myPlayerId);
        if (me) {
          this.isHost = me.isHost;
        }

        this.syncRemotePlayers(payload.room.players);

        if (payload.event) {
          ui.showToast(payload.event, '#38bdf8');
        }

        if (ui.currentScreen === 'mp-lobby-menu') {
          ui.renderMultiplayerLobby(payload.room, this.myPlayerId);
        }
        break;
      }

      case 'COUNTDOWN_TICK': {
        this.raceState = 'COUNTDOWN';
        audio.playClick();
        ui.showCountdown(payload.count);
        break;
      }

      case 'COUNTDOWN_ABORTED': {
        this.raceState = 'LOBBY';
        ui.hideCountdown();
        ui.showToast(payload.message || 'Countdown cancelled', '#ef4444');
        if (payload.room) {
          this.roomData = payload.room;
          ui.renderMultiplayerLobby(payload.room, this.myPlayerId);
        }
        break;
      }

      case 'RACE_START': {
        this.raceState = 'RACING';
        this.raceDistance = payload.raceDistance || CONFIG.MULTIPLAYER.RACE_DISTANCE;
        this.roomData = payload.room;
        this.syncRemotePlayers(payload.room.players);
        
        ui.hideCountdown();
        game.startMultiplayerRace();
        break;
      }

      case 'PLAYER_UPDATE': {
        const rp = this.remotePlayers.get(payload.id);
        if (rp) {
          // Set target interpolation positions
          rp.targetX = payload.x;
          rp.targetY = payload.y;
          rp.vx = payload.vx || 0;
          rp.speed = payload.speed || 8;
          rp.nitro = payload.nitro || 0;
          rp.health = payload.health ?? 3;
          rp.distance = payload.distance || 0;
          rp.isFinished = payload.isFinished || false;
        }
        break;
      }

      case 'PLAYER_FINISHED': {
        const rp = this.remotePlayers.get(payload.playerId);
        if (rp) {
          rp.isFinished = true;
          rp.finishRank = payload.rank;
          rp.finishTime = payload.time;
        }

        if (payload.playerId === this.myPlayerId) {
          particles.emitTextPopup(game.player.x, game.player.y - 40, `FINISHED #${payload.rank}! 🏁`, '#f59e0b', 22);
        } else {
          ui.showToast(`${payload.name} finished #${payload.rank}!`, '#10b981');
        }
        break;
      }

      case 'RACE_FINISHED': {
        this.raceState = 'FINISHED';
        this.finishOrder = payload.finishOrder || [];
        game.triggerMultiplayerRaceOver(this.finishOrder);
        break;
      }

      case 'PLAYER_LEFT': {
        this.remotePlayers.delete(payload.playerId);
        ui.showToast(`${payload.playerName} disconnected`, '#f59e0b');

        if (payload.newHostId === this.myPlayerId) {
          this.isHost = true;
          ui.showToast('You are now the HOST! 👑', '#f59e0b');
        }

        if (payload.room) {
          this.roomData = payload.room;
          if (ui.currentScreen === 'mp-lobby-menu') {
            ui.renderMultiplayerLobby(payload.room, this.myPlayerId);
          }
        }
        break;
      }

      case 'REMATCH_LOBBY': {
        this.raceState = 'LOBBY';
        this.roomData = payload.room;
        this.syncRemotePlayers(payload.room.players);
        
        ui.hideModals();
        ui.showScreen('mp-lobby-menu');
        ui.renderMultiplayerLobby(payload.room, this.myPlayerId);
        break;
      }
    }
  }

  syncRemotePlayers(playerList) {
    if (!Array.isArray(playerList)) return;

    // Track active IDs to remove disconnected players
    const activeIds = new Set();

    playerList.forEach(pData => {
      if (pData.id === this.myPlayerId) return; // Ignore self in remote list

      activeIds.add(pData.id);
      if (!this.remotePlayers.has(pData.id)) {
        // Create new RemotePlayer instance
        const rp = new RemotePlayer(pData);
        this.remotePlayers.set(pData.id, rp);
      } else {
        // Update metadata
        const rp = this.remotePlayers.get(pData.id);
        rp.name = pData.name;
        rp.carName = pData.carName;
        rp.colorIndex = pData.colorIndex;
        rp.isReady = pData.isReady;
        rp.isHost = pData.isHost;
      }
    });

    // Remove any departed remote players
    this.remotePlayers.forEach((_, id) => {
      if (!activeIds.has(id)) {
        this.remotePlayers.delete(id);
      }
    });
  }

  updateRemotePlayers(dt) {
    const lerpFactor = Math.min(1.0, dt * CONFIG.MULTIPLAYER.INTERPOLATION_SPEED);
    this.remotePlayers.forEach(rp => {
      rp.update(dt, lerpFactor);
    });
  }

  renderRemotePlayers(ctx, env) {
    this.remotePlayers.forEach(rp => {
      rp.render(ctx, env);
    });
  }

  getMyPlayerColor() {
    if (!this.roomData) return CONFIG.MULTIPLAYER.PLAYER_COLORS[0];
    const me = this.roomData.players.find(p => p.id === this.myPlayerId);
    const cIdx = me ? (me.colorIndex % CONFIG.MULTIPLAYER.PLAYER_COLORS.length) : 0;
    return CONFIG.MULTIPLAYER.PLAYER_COLORS[cIdx];
  }
}

// Remote Player Entity for Interpolated Canvas Rendering
class RemotePlayer {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.carName = data.carName || 'BLAZE GT';
    this.colorIndex = data.colorIndex || 0;
    this.isHost = data.isHost || false;
    this.isReady = data.isReady || false;

    this.width = 44;
    this.height = 78;

    this.x = data.x || 240;
    this.y = data.y || 590;
    this.targetX = this.x;
    this.targetY = this.y;
    this.vx = 0;
    this.speed = 8;
    this.nitro = 100;
    this.health = 3;
    this.distance = 0;
    this.isFinished = false;

    const colors = CONFIG.MULTIPLAYER.PLAYER_COLORS;
    this.colorData = colors[this.colorIndex % colors.length];
  }

  update(dt, lerpFactor) {
    // Smooth linear interpolation towards target network positions
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    // Check if remote player is boosting nitro
    if (this.nitro > 20 && this.speed > 12) {
      particles.emitNitroFlames(this.x - 12, this.y + 36, false);
      particles.emitNitroFlames(this.x + 12, this.y + 36, false);
    }
  }

  render(ctx, env) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const hw = this.width / 2;
    const hh = this.height / 2;
    const color = this.colorData.color;
    const accent = this.colorData.accent;

    // 1. Underglow Neon
    const underglowGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 32);
    underglowGrad.addColorStop(0, color + 'aa');
    underglowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = underglowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 26, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Headlights on Road
    if (env.headlights) {
      const beamGrad = ctx.createLinearGradient(0, -hh, 0, -hh - 140);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-12, -hh);
      ctx.lineTo(-26, -hh - 140);
      ctx.lineTo(26, -hh - 140);
      ctx.lineTo(12, -hh);
      ctx.fill();
    }

    // 3. Wheels
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-hw - 1, -hh + 10, 5, 14);
    ctx.fillRect(hw - 4, -hh + 10, 5, 14);
    ctx.fillRect(-hw - 1, hh - 22, 5, 14);
    ctx.fillRect(hw - 4, hh - 22, 5, 14);

    // 4. Car Chassis Body
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-hw + 2, -hh + 4, this.width, this.height, 10);
    ctx.fill();

    const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
    bodyGrad.addColorStop(0, color);
    bodyGrad.addColorStop(0.3, accent);
    bodyGrad.addColorStop(0.7, color);
    bodyGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, this.width, this.height, 10);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-hw + 6, -hh + 24);
    ctx.lineTo(hw - 6, -hh + 24);
    ctx.lineTo(hw - 8, -hh + 40);
    ctx.lineTo(-hw + 8, -hh + 40);
    ctx.closePath();
    ctx.fill();

    // Roof & Rear Window
    ctx.fillStyle = color;
    ctx.fillRect(-hw + 7, -hh + 40, this.width - 14, 14);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-hw + 8, -hh + 54);
    ctx.lineTo(hw - 8, -hh + 54);
    ctx.lineTo(hw - 6, -hh + 64);
    ctx.lineTo(-hw + 6, -hh + 64);
    ctx.closePath();
    ctx.fill();

    // Spoiler
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-hw - 1, hh - 8, this.width + 2, 5);

    // Taillights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-hw + 3, hh - 3, 7, 3);
    ctx.fillRect(hw - 10, hh - 3, 7, 3);

    // 5. Floating Player Name Tag Above Vehicle
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    
    // Name pill background
    const nameWidth = ctx.measureText(this.name).width + 14;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-nameWidth / 2, -hh - 22, nameWidth, 16, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.name, 0, -hh - 10);

    ctx.restore();
  }
}

const multiplayer = new MultiplayerClient();
