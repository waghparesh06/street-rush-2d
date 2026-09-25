// STREET RUSH 2D - Server Configuration

const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  
  MAX_PLAYERS_PER_ROOM: 4,
  MIN_PLAYERS_TO_START: 2,
  
  RACE_DISTANCE: 3000, // meters to finish
  COUNTDOWN_SECONDS: 3,
  
  NETWORK_TICK_RATE: 20, // 20 state broadcasts / sec (~50ms)
  ROOM_IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  PING_INTERVAL_MS: 25000, // WebSocket keepalive heartbeat
  
  PLAYER_COLORS: [
    { color: '#ef4444', accent: '#fca5a5', name: 'Crimson' },
    { color: '#06b6d4', accent: '#a5f3fc', name: 'Cyan' },
    { color: '#eab308', accent: '#fef08a', name: 'Gold' },
    { color: '#a855f7', accent: '#e9d5ff', name: 'Purple' }
  ]
};

module.exports = SERVER_CONFIG;
