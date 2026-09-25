// STREET RUSH 2D - Save & Persistent Storage System

class StorageManager {
  constructor() {
    this.STORAGE_KEY = 'STREET_RUSH_2D_DATA_V1';
    this.data = this.load();
  }

  getDefaults() {
    return {
      highScore: 0,
      totalCoins: 150, // Starter coins so player can try garage or save
      currentLevel: 1,
      maxLevelUnlocked: 1,
      selectedCarId: 'starter',
      unlockedCars: ['starter'],
      upgrades: {
        starter: { speed: 0, handling: 0, nitro: 0, armor: 0 },
        sport: { speed: 0, handling: 0, nitro: 0, armor: 0 },
        muscle: { speed: 0, handling: 0, nitro: 0, armor: 0 },
        super: { speed: 0, handling: 0, nitro: 0, armor: 0 }
      },
      settings: {
        sound: true,
        music: true,
        screenShake: true,
        reducedEffects: false
      },
      stats: {
        totalRaces: 0,
        totalDistance: 0,
        totalNearMisses: 0,
        totalCoinsCollected: 0
      }
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.getDefaults();
      const parsed = JSON.parse(raw);
      // Merge with defaults to ensure missing keys are populated
      const defaults = this.getDefaults();
      return {
        highScore: typeof parsed.highScore === 'number' ? parsed.highScore : defaults.highScore,
        totalCoins: typeof parsed.totalCoins === 'number' ? parsed.totalCoins : defaults.totalCoins,
        currentLevel: typeof parsed.currentLevel === 'number' ? parsed.currentLevel : defaults.currentLevel,
        maxLevelUnlocked: typeof parsed.maxLevelUnlocked === 'number' ? parsed.maxLevelUnlocked : defaults.maxLevelUnlocked,
        selectedCarId: typeof parsed.selectedCarId === 'string' ? parsed.selectedCarId : defaults.selectedCarId,
        unlockedCars: Array.isArray(parsed.unlockedCars) ? parsed.unlockedCars : defaults.unlockedCars,
        upgrades: parsed.upgrades && typeof parsed.upgrades === 'object' ? { ...defaults.upgrades, ...parsed.upgrades } : defaults.upgrades,
        settings: parsed.settings && typeof parsed.settings === 'object' ? { ...defaults.settings, ...parsed.settings } : defaults.settings,
        stats: parsed.stats && typeof parsed.stats === 'object' ? { ...defaults.stats, ...parsed.stats } : defaults.stats
      };
    } catch (err) {
      console.warn('Storage corrupted or inaccessible, restoring defaults:', err);
      return this.getDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      return true;
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      return false;
    }
  }

  getHighScore() {
    return this.data.highScore;
  }

  setHighScore(score) {
    if (score > this.data.highScore) {
      this.data.highScore = Math.floor(score);
      this.save();
      return true; // Indicates new high score!
    }
    return false;
  }

  getCoins() {
    return this.data.totalCoins;
  }

  addCoins(amount) {
    this.data.totalCoins = Math.max(0, this.data.totalCoins + Math.floor(amount));
    this.data.stats.totalCoinsCollected += Math.floor(amount);
    this.save();
    return this.data.totalCoins;
  }

  spendCoins(amount) {
    if (this.data.totalCoins >= amount) {
      this.data.totalCoins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  getSelectedCar() {
    return this.data.selectedCarId;
  }

  setSelectedCar(carId) {
    if (this.isCarUnlocked(carId)) {
      this.data.selectedCarId = carId;
      this.save();
      return true;
    }
    return false;
  }

  isCarUnlocked(carId) {
    return this.data.unlockedCars.includes(carId);
  }

  unlockCar(carId, cost) {
    if (!this.isCarUnlocked(carId)) {
      if (this.spendCoins(cost)) {
        this.data.unlockedCars.push(carId);
        this.data.selectedCarId = carId;
        this.save();
        return true;
      }
    }
    return false;
  }

  getUpgradeLevel(carId, statKey) {
    if (!this.data.upgrades[carId]) {
      this.data.upgrades[carId] = { speed: 0, handling: 0, nitro: 0, armor: 0 };
    }
    return this.data.upgrades[carId][statKey] || 0;
  }

  upgradeStat(carId, statKey, cost) {
    const currentLvl = this.getUpgradeLevel(carId, statKey);
    if (currentLvl < 5) {
      if (this.spendCoins(cost)) {
        this.data.upgrades[carId][statKey] = currentLvl + 1;
        this.save();
        return true;
      }
    }
    return false;
  }

  getMaxLevelUnlocked() {
    return this.data.maxLevelUnlocked || 1;
  }

  unlockNextLevel(completedLevel) {
    if (completedLevel >= this.data.maxLevelUnlocked && this.data.maxLevelUnlocked < CONFIG.LEVELS.length) {
      this.data.maxLevelUnlocked = completedLevel + 1;
    }
    this.data.currentLevel = Math.min(completedLevel + 1, CONFIG.LEVELS.length);
    this.save();
  }

  setCurrentLevel(lvl) {
    if (lvl <= this.data.maxLevelUnlocked && lvl >= 1 && lvl <= CONFIG.LEVELS.length) {
      this.data.currentLevel = lvl;
      this.save();
      return true;
    }
    return false;
  }

  getCurrentLevel() {
    return this.data.currentLevel || 1;
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(key, value) {
    this.data.settings[key] = value;
    this.save();
  }

  recordRaceStats(distance, nearMisses) {
    this.data.stats.totalRaces += 1;
    this.data.stats.totalDistance += Math.floor(distance);
    this.data.stats.totalNearMisses += nearMisses;
    this.save();
  }

  resetAll() {
    this.data = this.getDefaults();
    this.save();
    return this.data;
  }
}

const storage = new StorageManager();
