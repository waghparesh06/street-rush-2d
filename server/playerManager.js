// STREET RUSH 2D - Player Manager & State Validation

class PlayerManager {
  static sanitizeName(rawName) {
    if (!rawName || typeof rawName !== 'string') {
      return `Racer_${Math.floor(1000 + Math.random() * 9000)}`;
    }
    // Remove HTML tags, special symbols, clamp length
    let clean = rawName.replace(/<[^>]*>?/gm, '').replace(/[^\w\s\-_]/gi, '').trim();
    if (clean.length === 0) {
      return `Racer_${Math.floor(1000 + Math.random() * 9000)}`;
    }
    return clean.substring(0, 18);
  }

  static createPlayer(id, name, carData, isHost = false, colorIndex = 0) {
    return {
      id: id,
      name: this.sanitizeName(name),
      carId: carData?.id || 'starter',
      carName: carData?.name || 'BLAZE GT',
      colorIndex: colorIndex,
      isHost: isHost,
      isReady: isHost, // Host is ready by default
      
      // Live Race State
      x: 240,
      y: 590,
      vx: 0,
      speed: 8,
      nitro: 100,
      health: 3,
      distance: 0,
      isFinished: false,
      finishRank: null,
      finishTime: null,
      
      // Ping & Connection telemetry
      lastPing: Date.now()
    };
  }

  static validateAndClampState(player, incomingState) {
    if (!incomingState || typeof incomingState !== 'object') return;

    if (typeof incomingState.x === 'number') {
      // Clamp within screen boundaries
      player.x = Math.max(40, Math.min(440, incomingState.x));
    }
    if (typeof incomingState.y === 'number') {
      player.y = Math.max(50, Math.min(680, incomingState.y));
    }
    if (typeof incomingState.vx === 'number') {
      player.vx = Math.max(-25, Math.min(25, incomingState.vx));
    }
    if (typeof incomingState.speed === 'number') {
      player.speed = Math.max(0, Math.min(30, incomingState.speed));
    }
    if (typeof incomingState.nitro === 'number') {
      player.nitro = Math.max(0, Math.min(100, incomingState.nitro));
    }
    if (typeof incomingState.health === 'number') {
      player.health = Math.max(0, Math.min(3, incomingState.health));
    }
    if (typeof incomingState.distance === 'number') {
      // Prevent backwards negative distance or absurd jumps
      if (incomingState.distance >= player.distance - 5) {
        player.distance = Math.max(0, Math.min(100000, incomingState.distance));
      }
    }
  }

  static resetForRace(player) {
    player.x = 240;
    player.y = 590;
    player.vx = 0;
    player.speed = 8;
    player.nitro = 100;
    player.health = 3;
    player.distance = 0;
    player.isFinished = false;
    player.finishRank = null;
    player.finishTime = null;
    player.isReady = player.isHost;
  }
}

module.exports = PlayerManager;
