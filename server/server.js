// STREET RUSH 2D - Master Multiplayer & Static Game Server

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const SERVER_CONFIG = require('./config');
const roomManager = require('./roomManager');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const PUBLIC_DIR = path.resolve(__dirname, '..');

// 1. Create HTTP Server for Game Assets
const server = http.createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health' || req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', game: 'STREET RUSH 2D', rooms: roomManager.rooms.size }));
    return;
  }

  // Normalize path & prevent directory traversal
  let safeUrl = req.url.split('?')[0];
  if (safeUrl === '/' || safeUrl === '') {
    safeUrl = '/index.html';
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, safeUrl));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// 2. Attach WebSocket Server
const wss = new WebSocketServer({ server });

// Helper: Broadcast to all clients in a specific room
function broadcastToRoom(roomId, messageObj, excludeWs = null) {
  const room = roomManager.getRoom(roomId);
  if (!room) return;

  const payload = JSON.stringify(messageObj);
  room.clients.forEach((clientWs, playerId) => {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(payload);
    }
  });
}

// 3. WebSocket Connection Handling
wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.playerId = null;
  ws.roomId = null;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw);
      handleClientMessage(ws, data);
    } catch (err) {
      console.warn('[Server] Error parsing incoming client JSON:', err.message);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.warn('[Server] WebSocket client error:', err.message);
  });
});

// 4. Message Dispatcher
function handleClientMessage(ws, msg) {
  const { type, payload } = msg;

  switch (type) {
    // --- CREATE ROOM ---
    case 'CREATE_ROOM': {
      const { playerName, carData } = payload || {};
      const { room, player } = roomManager.createRoom(ws, playerName, carData);

      ws.send(JSON.stringify({
        type: 'ROOM_CREATED',
        payload: {
          roomId: room.id,
          player: player,
          room: roomManager.getRoomSummary(room)
        }
      }));
      break;
    }

    // --- JOIN ROOM ---
    case 'JOIN_ROOM': {
      const { roomId, playerName, carData } = payload || {};
      const result = roomManager.joinRoom(roomId, ws, playerName, carData);

      if (result.error) {
        ws.send(JSON.stringify({
          type: 'ROOM_ERROR',
          payload: { error: result.error, message: result.message }
        }));
        return;
      }

      const { room, player } = result;

      // Notify joining player
      ws.send(JSON.stringify({
        type: 'ROOM_JOINED',
        payload: {
          roomId: room.id,
          player: player,
          room: roomManager.getRoomSummary(room)
        }
      }));

      // Broadcast room update to everyone in room
      broadcastToRoom(room.id, {
        type: 'ROOM_UPDATE',
        payload: {
          room: roomManager.getRoomSummary(room),
          event: `${player.name} joined the room`
        }
      }, ws);
      break;
    }

    // --- TOGGLE READY ---
    case 'TOGGLE_READY': {
      if (!ws.roomId || !ws.playerId) return;
      const res = roomManager.toggleReady(ws.roomId, ws.playerId);
      if (res) {
        broadcastToRoom(ws.roomId, {
          type: 'ROOM_UPDATE',
          payload: { room: roomManager.getRoomSummary(res.room) }
        });
      }
      break;
    }

    // --- START RACE (Host only) ---
    case 'START_RACE': {
      if (!ws.roomId || !ws.playerId) return;
      const check = roomManager.canStartRace(ws.roomId, ws.playerId);
      if (!check.canStart) {
        ws.send(JSON.stringify({
          type: 'ROOM_ERROR',
          payload: { error: 'CANNOT_START', message: check.reason }
        }));
        return;
      }

      const room = check.room;
      console.log(`[Server] Starting countdown for room ${room.id}`);

      // Broadcast countdown tick
      roomManager.startCountdown(
        room.id,
        (count) => {
          broadcastToRoom(room.id, {
            type: 'COUNTDOWN_TICK',
            payload: { count }
          });
        },
        () => {
          // Race officially started!
          console.log(`[Server] Race started for room ${room.id}`);
          broadcastToRoom(room.id, {
            type: 'RACE_START',
            payload: {
              raceDistance: SERVER_CONFIG.RACE_DISTANCE,
              startTime: room.raceStartTime,
              room: roomManager.getRoomSummary(room)
            }
          });
        }
      );
      break;
    }

    // --- PLAYER LIVE TELEMETRY UPDATE ---
    case 'PLAYER_UPDATE': {
      if (!ws.roomId || !ws.playerId) return;
      const updatedPlayer = roomManager.handlePlayerUpdate(ws.roomId, ws.playerId, payload);
      if (updatedPlayer) {
        // Broadcast updated state to room peers
        broadcastToRoom(ws.roomId, {
          type: 'PLAYER_UPDATE',
          payload: {
            id: updatedPlayer.id,
            x: updatedPlayer.x,
            y: updatedPlayer.y,
            vx: updatedPlayer.vx,
            speed: updatedPlayer.speed,
            nitro: updatedPlayer.nitro,
            health: updatedPlayer.health,
            distance: updatedPlayer.distance,
            isFinished: updatedPlayer.isFinished
          }
        }, ws);
      }
      break;
    }

    // --- PLAYER FINISHED RACE ---
    case 'PLAYER_FINISHED': {
      if (!ws.roomId || !ws.playerId) return;
      const res = roomManager.handlePlayerFinished(ws.roomId, ws.playerId, payload?.time);
      if (res) {
        // Broadcast individual finish
        broadcastToRoom(ws.roomId, {
          type: 'PLAYER_FINISHED',
          payload: {
            playerId: res.player.id,
            name: res.player.name,
            rank: res.player.finishRank,
            time: res.player.finishTime,
            finishOrder: res.finishOrder
          }
        });

        // If everyone finished, broadcast final results
        if (res.allFinished) {
          console.log(`[Server] All racers finished in room ${ws.roomId}. Finalizing results.`);
          broadcastToRoom(ws.roomId, {
            type: 'RACE_FINISHED',
            payload: {
              finishOrder: res.finishOrder
            }
          });
        }
      }
      break;
    }

    // --- REQUEST REMATCH / BACK TO LOBBY ---
    case 'REQUEST_REMATCH': {
      if (!ws.roomId) return;
      const room = roomManager.resetRoomForRematch(ws.roomId);
      if (room) {
        console.log(`[Server] Rematch lobby initiated in room ${ws.roomId}`);
        broadcastToRoom(ws.roomId, {
          type: 'REMATCH_LOBBY',
          payload: {
            room: roomManager.getRoomSummary(room)
          }
        });
      }
      break;
    }

    // --- LEAVE ROOM ---
    case 'LEAVE_ROOM': {
      handleDisconnect(ws);
      break;
    }

    default:
      console.log('[Server] Unrecognized message type:', type);
  }
}

// 5. Disconnect Cleanup
function handleDisconnect(ws) {
  const result = roomManager.leaveRoom(ws);
  if (!result) return;

  if (!result.roomDeleted) {
    // Notify room peers that player left
    broadcastToRoom(result.room.id, {
      type: 'PLAYER_LEFT',
      payload: {
        playerId: result.leftPlayerId,
        playerName: result.leftPlayerName,
        newHostId: result.newHostId,
        newHostName: result.newHostName,
        room: roomManager.getRoomSummary(result.room)
      }
    });

    // If countdown was cancelled due to player leaving
    if (result.countdownAborted) {
      broadcastToRoom(result.room.id, {
        type: 'COUNTDOWN_ABORTED',
        payload: {
          message: 'Countdown cancelled: racer disconnected',
          room: roomManager.getRoomSummary(result.room)
        }
      });
    }

    // If remaining active racers are now all finished
    if (result.allFinishedNow) {
      broadcastToRoom(result.room.id, {
        type: 'RACE_FINISHED',
        payload: {
          finishOrder: result.finishOrder
        }
      });
    }
  }
}

// 6. Keepalive Ping-Pong Heartbeat
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      console.log('[Server] Terminating dead client connection');
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, SERVER_CONFIG.PING_INTERVAL_MS);

// 7. Start Listening
const PORT = SERVER_CONFIG.PORT;
const HOST = SERVER_CONFIG.HOST;

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`🚀 STREET RUSH 2D — Multiplayer Server Online!`);
  console.log(`📡 Local Game URL:    http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Server:  ws://localhost:${PORT}`);
  console.log(`🏎️ Max Players/Room:  ${SERVER_CONFIG.MAX_PLAYERS_PER_ROOM}`);
  console.log('====================================================');
});
