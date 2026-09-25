// STREET RUSH 2D - Game Configuration & Constants

const CONFIG = {
  CANVAS_WIDTH: 480,
  CANVAS_HEIGHT: 720,
  LANE_COUNT: 3,
  ROAD_WIDTH: 360,
  
  BASE_SPEED: 8,
  MAX_PLAYER_SPEED: 18,
  NITRO_SPEED_BOOST: 6,
  NITRO_MAX: 100,
  NITRO_DRAIN_RATE: 35, // per second
  NITRO_REGEN_RATE: 12, // per second
  
  NEAR_MISS_DISTANCE: 26, // pixel threshold for near miss detection
  NEAR_MISS_SCORE: 50,
  COIN_SCORE: 10,
  RARE_COIN_SCORE: 25,
  GOLD_COIN_SCORE: 50,
  
  // Multiplayer Configuration
  MULTIPLAYER: {
    // Dynamically resolves to current host or defaults to localhost:3000
    SERVER_URL: (typeof window !== 'undefined' && window.location && window.location.host)
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
      : 'ws://localhost:3000',
    FALLBACK_URL: 'ws://localhost:3000',
    MAX_PLAYERS: 4,
    MIN_PLAYERS_TO_START: 2,
    RACE_DISTANCE: 3000,
    NETWORK_TICK_RATE: 20, // 20 updates per second
    INTERPOLATION_SPEED: 14,
    PLAYER_COLORS: [
      { color: '#ef4444', accent: '#fca5a5', name: 'Crimson' },
      { color: '#06b6d4', accent: '#a5f3fc', name: 'Cyan' },
      { color: '#eab308', accent: '#fef08a', name: 'Gold' },
      { color: '#a855f7', accent: '#e9d5ff', name: 'Purple' }
    ]
  },
  
  ENVIRONMENTS: {
    DAY: {
      name: 'DAY',
      skyColor: '#60a5fa',
      grassColor: '#2d6a4f',
      grassAccent: '#1b4332',
      roadColor: '#334155',
      roadEdge: '#e2e8f0',
      ambientLight: 1.0,
      headlights: false,
      rain: false
    },
    SUNSET: {
      name: 'SUNSET',
      skyColor: '#fb923c',
      grassColor: '#78350f',
      grassAccent: '#451a03',
      roadColor: '#292524',
      roadEdge: '#fed7aa',
      ambientLight: 0.8,
      headlights: true,
      rain: false
    },
    NIGHT: {
      name: 'NIGHT',
      skyColor: '#090d16',
      grassColor: '#0a192f',
      grassAccent: '#020c1b',
      roadColor: '#0f172a',
      roadEdge: '#38bdf8',
      ambientLight: 0.35,
      headlights: true,
      rain: false
    },
    RAIN: {
      name: 'RAIN',
      skyColor: '#334155',
      grassColor: '#1e293b',
      grassAccent: '#0f172a',
      roadColor: '#1e293b',
      roadEdge: '#94a3b8',
      ambientLight: 0.5,
      headlights: true,
      rain: true,
      slickFactor: 0.85
    }
  },
  
  CARS: [
    {
      id: 'starter',
      name: 'BLAZE GT',
      tag: 'STARTER',
      color: '#ef4444',
      accentColor: '#fca5a5',
      glowColor: '#ef444488',
      baseSpeed: 60,
      baseHandling: 70,
      baseNitro: 50,
      baseArmor: 60,
      cost: 0,
      unlocked: true,
      description: 'Reliable entry-level street tuner with balanced performance.'
    },
    {
      id: 'sport',
      name: 'VIPER R',
      tag: 'SPORT',
      color: '#06b6d4',
      accentColor: '#a5f3fc',
      glowColor: '#06b6d488',
      baseSpeed: 75,
      baseHandling: 65,
      baseNitro: 70,
      baseArmor: 65,
      cost: 500,
      unlocked: false,
      description: 'Aerodynamic speedster built for high-velocity highway cutting.'
    },
    {
      id: 'muscle',
      name: 'THUNDER V8',
      tag: 'MUSCLE',
      color: '#eab308',
      accentColor: '#fef08a',
      glowColor: '#eab30888',
      baseSpeed: 85,
      baseHandling: 55,
      baseNitro: 80,
      baseArmor: 85,
      cost: 1000,
      unlocked: false,
      description: 'Raw heavyweight American muscle with unmatched straight-line torque.'
    },
    {
      id: 'super',
      name: 'PHANTOM HYPER',
      tag: 'SUPER',
      color: '#a855f7',
      accentColor: '#e9d5ff',
      glowColor: '#a855f788',
      baseSpeed: 95,
      baseHandling: 80,
      baseNitro: 95,
      baseArmor: 90,
      cost: 2000,
      unlocked: false,
      description: 'Carbon-fiber hypercar engineered for ultimate street supremacy.'
    }
  ],
  
  UPGRADES: {
    speed: {
      name: 'Top Speed',
      icon: '⚡',
      levels: [
        { level: 1, cost: 100, boost: 1.05 },
        { level: 2, cost: 200, boost: 1.10 },
        { level: 3, cost: 350, boost: 1.16 },
        { level: 4, cost: 500, boost: 1.22 },
        { level: 5, cost: 750, boost: 1.30 }
      ]
    },
    handling: {
      name: 'Handling',
      icon: '🎯',
      levels: [
        { level: 1, cost: 100, boost: 1.08 },
        { level: 2, cost: 200, boost: 1.16 },
        { level: 3, cost: 350, boost: 1.25 },
        { level: 4, cost: 500, boost: 1.35 },
        { level: 5, cost: 750, boost: 1.50 }
      ]
    },
    nitro: {
      name: 'Nitro System',
      icon: '🔥',
      levels: [
        { level: 1, cost: 100, boost: 1.10 },
        { level: 2, cost: 200, boost: 1.20 },
        { level: 3, cost: 350, boost: 1.32 },
        { level: 4, cost: 500, boost: 1.45 },
        { level: 5, cost: 750, boost: 1.60 }
      ]
    },
    armor: {
      name: 'Chassis Armor',
      icon: '🛡️',
      levels: [
        { level: 1, cost: 100, boost: 0.90 }, // damage multiplier
        { level: 2, cost: 200, boost: 0.80 },
        { level: 3, cost: 350, boost: 0.70 },
        { level: 4, cost: 500, boost: 0.60 },
        { level: 5, cost: 750, boost: 0.50 }
      ]
    }
  },
  
  LEVELS: [
    {
      level: 1,
      name: 'Suburban Cruise',
      targetDistance: 1500,
      env: 'DAY',
      trafficDensity: 0.45,
      trafficSpeedMin: 3.5,
      trafficSpeedMax: 5.5,
      spawnInterval: 140,
      coinFrequency: 0.5,
      powerupFrequency: 0.25,
      aggressiveSpawnRate: 0.0,
      description: 'Clear daytime highway. Get used to your car.'
    },
    {
      level: 2,
      name: 'Coastal Sunset',
      targetDistance: 2000,
      env: 'SUNSET',
      trafficDensity: 0.55,
      trafficSpeedMin: 4.0,
      trafficSpeedMax: 6.5,
      spawnInterval: 125,
      coinFrequency: 0.5,
      powerupFrequency: 0.25,
      aggressiveSpawnRate: 0.1,
      description: 'Faster traffic moving towards the coast under golden skies.'
    },
    {
      level: 3,
      name: 'Downtown Traffic',
      targetDistance: 2500,
      env: 'DAY',
      trafficDensity: 0.65,
      trafficSpeedMin: 4.5,
      trafficSpeedMax: 7.0,
      spawnInterval: 110,
      coinFrequency: 0.55,
      powerupFrequency: 0.3,
      aggressiveSpawnRate: 0.15,
      description: 'Dense metro traffic. Watch for sudden slowdowns.'
    },
    {
      level: 4,
      name: 'Expressway Rush',
      targetDistance: 3000,
      env: 'SUNSET',
      trafficDensity: 0.70,
      trafficSpeedMin: 5.0,
      trafficSpeedMax: 8.0,
      spawnInterval: 95,
      coinFrequency: 0.6,
      powerupFrequency: 0.3,
      aggressiveSpawnRate: 0.2,
      description: 'High-speed interstate lanes with heavy commercial trucks.'
    },
    {
      level: 5,
      name: 'Midnight Highway',
      targetDistance: 3500,
      env: 'NIGHT',
      trafficDensity: 0.75,
      trafficSpeedMin: 5.5,
      trafficSpeedMax: 8.5,
      spawnInterval: 90,
      coinFrequency: 0.65,
      powerupFrequency: 0.35,
      aggressiveSpawnRate: 0.3,
      description: 'Night racing under streetlights with aggressive drivers.'
    },
    {
      level: 6,
      name: 'Neon Metropolis',
      targetDistance: 4000,
      env: 'NIGHT',
      trafficDensity: 0.80,
      trafficSpeedMin: 6.0,
      trafficSpeedMax: 9.0,
      spawnInterval: 80,
      coinFrequency: 0.7,
      powerupFrequency: 0.35,
      aggressiveSpawnRate: 0.35,
      description: 'Dark cyber-city freeways. Headlights and neon glows.'
    },
    {
      level: 7,
      name: 'Storm Approaching',
      targetDistance: 4500,
      env: 'RAIN',
      trafficDensity: 0.80,
      trafficSpeedMin: 5.5,
      trafficSpeedMax: 8.5,
      spawnInterval: 80,
      coinFrequency: 0.75,
      powerupFrequency: 0.4,
      aggressiveSpawnRate: 0.4,
      description: 'Heavy rain slicking the pavement. Traction is reduced.'
    },
    {
      level: 8,
      name: 'Monsoon Run',
      targetDistance: 5000,
      env: 'RAIN',
      trafficDensity: 0.85,
      trafficSpeedMin: 6.0,
      trafficSpeedMax: 9.5,
      spawnInterval: 75,
      coinFrequency: 0.8,
      powerupFrequency: 0.4,
      aggressiveSpawnRate: 0.45,
      description: 'Zero visibility storm. Precision dodging required.'
    },
    {
      level: 9,
      name: 'Supercharged Interstate',
      targetDistance: 5500,
      env: 'SUNSET',
      trafficDensity: 0.90,
      trafficSpeedMin: 7.0,
      trafficSpeedMax: 10.5,
      spawnInterval: 65,
      coinFrequency: 0.85,
      powerupFrequency: 0.45,
      aggressiveSpawnRate: 0.5,
      description: 'Blistering fast traffic and aggressive lane-switchers.'
    },
    {
      level: 10,
      name: 'Final Legend Run',
      targetDistance: 6500,
      env: 'NIGHT',
      trafficDensity: 0.95,
      trafficSpeedMin: 7.5,
      trafficSpeedMax: 11.5,
      spawnInterval: 55,
      coinFrequency: 1.0,
      powerupFrequency: 0.5,
      aggressiveSpawnRate: 0.6,
      description: 'The ultimate endurance test. Become the Street Legend.'
    }
  ],
  
  POWERUPS: {
    shield: {
      type: 'shield',
      name: 'Shield',
      icon: '🛡️',
      color: '#38bdf8',
      duration: 10, // seconds
      description: 'Absorbs 1 collision'
    },
    magnet: {
      type: 'magnet',
      name: 'Coin Magnet',
      icon: '🧲',
      color: '#ec4899',
      duration: 8,
      radius: 180,
      description: 'Pulls coins to car'
    },
    nitro: {
      type: 'nitro',
      name: 'Nitro Refill',
      icon: '⚡',
      color: '#f59e0b',
      instant: true,
      description: 'Instant full nitro'
    },
    multiplier: {
      type: 'multiplier',
      name: '2X Score',
      icon: '⭐',
      color: '#10b981',
      duration: 10,
      multiplier: 2,
      description: 'Double score points'
    }
  }
};
