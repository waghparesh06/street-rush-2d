// STREET RUSH 2D - Multiplayer Room Manager

const SERVER_CONFIG = require('./config');
const PlayerManager = require('./playerManager');

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like O, 0, 1, I
    let code = '';
    let attempts = 0;
    do {
      code = '';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;
    } while (this.rooms.has(code) && attempts < 100);
    return code;
  }

  createRoom(hostWs, hostName, carData) {
    const roomId = this.generateRoomCode();
    const playerId = `p_${Math.random().toString(36).substr(2, 9)}`;
    const hostPlayer = PlayerManager.createPlayer(playerId, hostName, carData, true, 0);

    const room = {
      id: roomId,
      hostId: playerId,
      status: 'LOBBY', // LOBBY, COUNTDOWN, RACING, FINISHED
      players: new Map([[playerId, hostPlayer]]),
      clients: new Map([[playerId, hostWs]]),
      createdAt: Date.now(),
      raceStartTime: null,
      finishedCount: 0,
      finishOrder: [],
      countdownTimer: null,
      tickTimer: null
    };

    hostWs.playerId = playerId;
    hostWs.roomId = roomId;

    this.rooms.set(roomId, room);
    console.log(`[RoomManager] Room created: ${roomId} by host ${hostPlayer.name} (${playerId})`);

    return { room, player: hostPlayer };
  }

  joinRoom(roomId, clientWs, playerName, carData) {
    const cleanCode = (roomId || '').trim().toUpperCase();
    const room = this.rooms.get(cleanCode);

    if (!room) {
      return { error: 'ROOM_NOT_FOUND', message: 'Room does not exist. Check your code.' };
    }

    if (room.status !== 'LOBBY') {
      return { error: 'RACE_IN_PROGRESS', message: 'Race already started in this room.' };
    }

    if (room.players.size >= SERVER_CONFIG.MAX_PLAYERS_PER_ROOM) {
      return { error: 'ROOM_FULL', message: 'Room is full (Maximum 4 players).' };
    }

    // Assign next unused color index (0, 1, 2, 3)
    const usedColors = Array.from(room.players.values()).map(p => p.colorIndex);
    let colorIndex = 0;
    for (let i = 0; i < SERVER_CONFIG.MAX_PLAYERS_PER_ROOM; i++) {
      if (!usedColors.includes(i)) {
        colorIndex = i;
        break;
      }
    }

    const playerId = `p_${Math.random().toString(36).substr(2, 9)}`;
    const newPlayer = PlayerManager.createPlayer(playerId, playerName, carData, false, colorIndex);

    room.players.set(playerId, newPlayer);
    room.clients.set(playerId, clientWs);

    clientWs.playerId = playerId;
    clientWs.roomId = cleanCode;

    console.log(`[RoomManager] Player ${newPlayer.name} (${playerId}) joined room ${cleanCode}. Players: ${room.players.size}`);

    return { room, player: newPlayer };
  }

  leaveRoom(clientWs) {
    const { roomId, playerId } = clientWs;
    if (!roomId || !playerId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.get(playerId);
    const playerName = player ? player.name : 'A racer';

    // Check if player had already finished before leaving
    const wasFinished = player ? player.isFinished : false;

    room.players.delete(playerId);
    room.clients.delete(playerId);
    clientWs.roomId = null;
    clientWs.playerId = null;

    console.log(`[RoomManager] Player ${playerName} (${playerId}) left room ${roomId}. Remaining: ${room.players.size}`);

    // If room is empty, destroy room
    if (room.players.size === 0) {
      this.destroyRoom(roomId);
      return { roomDeleted: true, roomId };
    }

    // If room was in COUNTDOWN and now has fewer than minimum players, abort countdown
    let countdownAborted = false;
    if (room.status === 'COUNTDOWN' && room.players.size < SERVER_CONFIG.MIN_PLAYERS_TO_START) {
      if (room.countdownTimer) {
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
      }
      room.status = 'LOBBY';
      countdownAborted = true;
      console.log(`[RoomManager] Countdown aborted for room ${roomId} - insufficient players`);
    }

    // If room was in RACING, check if remaining players are all finished
    let allFinishedNow = false;
    if (room.status === 'RACING') {
      const activeUnfinished = Array.from(room.players.values()).filter(p => !p.isFinished);
      if (activeUnfinished.length === 0 && room.players.size > 0) {
        room.status = 'FINISHED';
        allFinishedNow = true;
        console.log(`[RoomManager] All remaining players finished in room ${roomId}`);
      }
    }

    // If host left, migrate host to next available player
    let newHostId = null;
    let newHostName = null;
    if (room.hostId === playerId) {
      const nextPlayer = Array.from(room.players.values())[0];
      if (nextPlayer) {
        nextPlayer.isHost = true;
        nextPlayer.isReady = true;
        room.hostId = nextPlayer.id;
        newHostId = nextPlayer.id;
        newHostName = nextPlayer.name;
        console.log(`[RoomManager] Host transferred to ${nextPlayer.name} (${nextPlayer.id}) in room ${roomId}`);
      }
    }

    return {
      roomDeleted: false,
      room,
      leftPlayerId: playerId,
      leftPlayerName: playerName,
      newHostId,
      newHostName,
      countdownAborted,
      allFinishedNow,
      finishOrder: room.finishOrder
    };
  }

  toggleReady(roomId, playerId) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'LOBBY') return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    if (!player.isHost) {
      player.isReady = !player.isReady;
    }

    return { room, player };
  }

  canStartRace(roomId, requesterId) {
    const room = this.rooms.get(roomId);
    if (!room) return { canStart: false, reason: 'Room not found' };
    if (room.hostId !== requesterId) return { canStart: false, reason: 'Only the host can start the race' };
    if (room.players.size < SERVER_CONFIG.MIN_PLAYERS_TO_START) {
      return { canStart: false, reason: `Need at least ${SERVER_CONFIG.MIN_PLAYERS_TO_START} players to start` };
    }

    const allReady = Array.from(room.players.values()).every(p => p.isReady);
    if (!allReady) {
      return { canStart: false, reason: 'All players must be READY to start' };
    }

    return { canStart: true, room };
  }

  startCountdown(roomId, onTick, onStart) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.status = 'COUNTDOWN';
    room.finishOrder = [];
    room.finishedCount = 0;

    // Reset player race positions
    room.players.forEach(p => PlayerManager.resetForRace(p));

    let count = SERVER_CONFIG.COUNTDOWN_SECONDS;
    onTick(count);

    room.countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        onTick(count);
      } else {
        clearInterval(room.countdownTimer);
        room.countdownTimer = null;
        room.status = 'RACING';
        room.raceStartTime = Date.now();
        onStart();
      }
    }, 1000);
  }

  handlePlayerUpdate(roomId, playerId, incomingState) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'RACING') return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    PlayerManager.validateAndClampState(player, incomingState);
    return player;
  }

  handlePlayerFinished(roomId, playerId, reportedTime) {
    const room = this.rooms.get(roomId);
    if (!room || room.status !== 'RACING') return null;

    const player = room.players.get(playerId);
    if (!player || player.isFinished) return null;

    player.isFinished = true;
    room.finishedCount++;
    player.finishRank = room.finishedCount;

    const elapsed = reportedTime || (Date.now() - room.raceStartTime) / 1000;
    player.finishTime = elapsed.toFixed(2);

    room.finishOrder.push({
      rank: player.finishRank,
      playerId: player.id,
      name: player.name,
      carName: player.carName,
      time: player.finishTime,
      colorIndex: player.colorIndex
    });

    console.log(`[RoomManager] Player ${player.name} finished #${player.finishRank} in ${player.finishTime}s (Room ${roomId})`);

    const allFinished = room.finishedCount >= room.players.size;
    if (allFinished) {
      room.status = 'FINISHED';
    }

    return {
      player,
      finishOrder: room.finishOrder,
      allFinished
    };
  }

  resetRoomForRematch(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.status = 'LOBBY';
    room.raceStartTime = null;
    room.finishedCount = 0;
    room.finishOrder = [];

    if (room.countdownTimer) {
      clearInterval(room.countdownTimer);
      room.countdownTimer = null;
    }

    room.players.forEach(p => {
      PlayerManager.resetForRace(p);
    });

    return room;
  }

  destroyRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      if (room.countdownTimer) clearInterval(room.countdownTimer);
      if (room.tickTimer) clearInterval(room.tickTimer);
      this.rooms.delete(roomId);
      console.log(`[RoomManager] Room destroyed: ${roomId}`);
    }
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  getRoomSummary(room) {
    if (!room) return null;
    return {
      id: room.id,
      hostId: room.hostId,
      status: room.status,
      playerCount: room.players.size,
      maxPlayers: SERVER_CONFIG.MAX_PLAYERS_PER_ROOM,
      players: Array.from(room.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        carId: p.carId,
        carName: p.carName,
        colorIndex: p.colorIndex,
        isHost: p.isHost,
        isReady: p.isReady,
        distance: p.distance,
        isFinished: p.isFinished,
        finishRank: p.finishRank,
        finishTime: p.finishTime
      }))
    };
  }
}

module.exports = new RoomManager();
