// STREET RUSH 2D - Player Car Entity & Controls

class PlayerCar {
  constructor() {
    this.x = CONFIG.CANVAS_WIDTH / 2;
    this.y = CONFIG.CANVAS_HEIGHT - 130;
    this.width = 44;
    this.height = 78;
    
    this.currentLane = 1; // Middle lane (0, 1, 2)
    this.targetX = this.x;
    this.vx = 0;
    this.tiltAngle = 0;
    
    this.health = 3;
    this.maxHealth = 3;
    this.nitro = CONFIG.NITRO_MAX;
    this.isNitroActive = false;
    this.invulnerableTime = 0; // For flashing after crash
    
    this.activePowerups = {}; // e.g. { shield: 10, magnet: 8, multiplier: 10 }
    this.carData = null;
    this.statMultipliers = { speed: 1, handling: 1, nitro: 1, armor: 1 };
    
    this.loadCarConfig();
  }

  loadCarConfig() {
    const selectedId = storage.getSelectedCar();
    this.carData = CONFIG.CARS.find(c => c.id === selectedId) || CONFIG.CARS[0];

    // Compute effective stats with upgrades
    const speedLvl = storage.getUpgradeLevel(selectedId, 'speed');
    const handLvl = storage.getUpgradeLevel(selectedId, 'handling');
    const nitroLvl = storage.getUpgradeLevel(selectedId, 'nitro');
    const armorLvl = storage.getUpgradeLevel(selectedId, 'armor');

    const speedBoost = speedLvl > 0 ? CONFIG.UPGRADES.speed.levels[speedLvl - 1].boost : 1.0;
    const handBoost = handLvl > 0 ? CONFIG.UPGRADES.handling.levels[handLvl - 1].boost : 1.0;
    const nitroBoost = nitroLvl > 0 ? CONFIG.UPGRADES.nitro.levels[nitroLvl - 1].boost : 1.0;
    const armorBoost = armorLvl > 0 ? CONFIG.UPGRADES.armor.levels[armorLvl - 1].boost : 1.0;

    this.statMultipliers = {
      speed: (this.carData.baseSpeed / 60) * speedBoost,
      handling: (this.carData.baseHandling / 70) * handBoost,
      nitro: (this.carData.baseNitro / 50) * nitroBoost,
      armor: (this.carData.baseArmor / 60) * armorBoost
    };
  }

  reset(roadInstance) {
    this.currentLane = 1;
    this.x = roadInstance ? roadInstance.getLaneX(1) : CONFIG.CANVAS_WIDTH / 2;
    this.y = CONFIG.CANVAS_HEIGHT - 130;
    this.targetX = this.x;
    this.vx = 0;
    this.tiltAngle = 0;
    this.health = 3;
    this.nitro = CONFIG.NITRO_MAX;
    this.isNitroActive = false;
    this.invulnerableTime = 0;
    this.activePowerups = {};
    this.loadCarConfig();
  }

  moveLeft(roadInstance) {
    if (this.currentLane > 0) {
      this.currentLane -= 1;
      this.targetX = roadInstance.getLaneX(this.currentLane);
    }
  }

  moveRight(roadInstance) {
    if (this.currentLane < CONFIG.LANE_COUNT - 1) {
      this.currentLane += 1;
      this.targetX = roadInstance.getLaneX(this.currentLane);
    }
  }

  activatePowerup(type) {
    const pConfig = CONFIG.POWERUPS[type];
    if (!pConfig) return;

    audio.playPowerup();

    if (pConfig.instant && type === 'nitro') {
      this.nitro = CONFIG.NITRO_MAX;
      particles.emitTextPopup(this.x, this.y - 20, 'NITRO REFILLED! ⚡', '#f59e0b', 16);
      return;
    }

    this.activePowerups[type] = pConfig.duration;
    particles.emitTextPopup(this.x, this.y - 20, `${pConfig.name.toUpperCase()}!`, pConfig.color, 16);
  }

  hasActivePowerup(type) {
    return (this.activePowerups[type] && this.activePowerups[type] > 0);
  }

  applyDamage(baseDamage = 1) {
    if (this.invulnerableTime > 0) return false;

    // Check shield powerup first
    if (this.hasActivePowerup('shield')) {
      delete this.activePowerups.shield;
      this.invulnerableTime = 1.0;
      audio.playCrash();
      particles.triggerScreenShake(8, 0.2);
      particles.triggerFlash('#38bdf8', 0.3);
      particles.emitSparks(this.x, this.y, 25);
      particles.emitTextPopup(this.x, this.y - 30, 'SHIELD ABSORBED HIT!', '#38bdf8', 16);
      return false; // Did not take health damage
    }

    // Health reduction modified by armor
    this.health -= 1;
    this.invulnerableTime = 1.5;
    audio.playCrash();
    particles.triggerScreenShake(14, 0.4);
    particles.triggerFlash('#ef4444', 0.5);
    particles.emitSparks(this.x, this.y, 35);
    particles.emitTextPopup(this.x, this.y - 30, 'CRASH! -1 ❤️', '#ef4444', 18);

    return true; // Took damage
  }

  update(dt, input, roadInstance, isRaining = false) {
    // 1. Powerups timer countdown
    for (const key in this.activePowerups) {
      this.activePowerups[key] -= dt;
      if (this.activePowerups[key] <= 0) {
        delete this.activePowerups[key];
      }
    }

    // 2. Invulnerability countdown
    if (this.invulnerableTime > 0) {
      this.invulnerableTime = Math.max(0, this.invulnerableTime - dt);
    }

    // 3. Smooth lane movement & handling physics
    const slickMult = isRaining ? 0.8 : 1.0;
    const handlingSpeed = 16 * this.statMultipliers.handling * slickMult;
    const dx = this.targetX - this.x;

    this.vx = dx * (handlingSpeed * dt * 3.5);
    this.x += this.vx;

    // Tilt visual lean during steering
    const targetTilt = (this.vx / 14) * 0.18;
    this.tiltAngle += (targetTilt - this.tiltAngle) * 0.2;

    // Road skid mark if turning sharply
    if (Math.abs(this.vx) > 3.5 && Math.random() < 0.3) {
      particles.addSkidMark(this.x - 14, this.y + 24, 4, 10);
      particles.addSkidMark(this.x + 14, this.y + 24, 4, 10);
    }

    // 4. Nitro Logic
    const wantsNitro = (input.nitro || input.space);
    if (wantsNitro && this.nitro > 5) {
      this.isNitroActive = true;
      const drain = CONFIG.NITRO_DRAIN_RATE / this.statMultipliers.nitro;
      this.nitro = Math.max(0, this.nitro - drain * dt);

      // Emit flames from dual exhaust
      const isSuper = this.carData.id === 'super';
      particles.emitNitroFlames(this.x - 12, this.y + 36, isSuper);
      particles.emitNitroFlames(this.x + 12, this.y + 36, isSuper);

      if (Math.random() < 0.15) {
        particles.triggerScreenShake(2.5, 0.1);
      }
    } else {
      this.isNitroActive = false;
      // Nitro passive regen
      this.nitro = Math.min(CONFIG.NITRO_MAX, this.nitro + CONFIG.NITRO_REGEN_RATE * dt);
    }
  }

  getHitbox() {
    return {
      x: this.x - this.width / 2 + 4,
      y: this.y - this.height / 2 + 6,
      width: this.width - 8,
      height: this.height - 12
    };
  }

  render(ctx, env) {
    // Flashing during invulnerability
    if (this.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tiltAngle);

    // 1. Underglow Neon
    const underglowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 36);
    underglowGrad.addColorStop(0, this.carData.glowColor);
    underglowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = underglowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 28, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Headlight Beams (Night, Sunset, Rain)
    if (env.headlights || this.isNitroActive) {
      const beamGrad = ctx.createLinearGradient(0, -this.height / 2, 0, -this.height / 2 - 160);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      beamGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.25)');
      beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
      
      ctx.fillStyle = beamGrad;
      // Left Beam
      ctx.beginPath();
      ctx.moveTo(-14, -this.height / 2);
      ctx.lineTo(-32, -this.height / 2 - 160);
      ctx.lineTo(-2, -this.height / 2 - 160);
      ctx.lineTo(-8, -this.height / 2);
      ctx.fill();

      // Right Beam
      ctx.beginPath();
      ctx.moveTo(8, -this.height / 2);
      ctx.lineTo(2, -this.height / 2 - 160);
      ctx.lineTo(32, -this.height / 2 - 160);
      ctx.lineTo(14, -this.height / 2);
      ctx.fill();
    }

    // 3. Wheels / Tires
    ctx.fillStyle = '#090d16';
    const wW = 6;
    const wH = 16;
    // Front wheels
    ctx.fillRect(-this.width / 2 - 1, -this.height / 2 + 10, wW, wH);
    ctx.fillRect(this.width / 2 - wW + 1, -this.height / 2 + 10, wW, wH);
    // Rear wheels
    ctx.fillRect(-this.width / 2 - 1, this.height / 2 - 24, wW, wH);
    ctx.fillRect(this.width / 2 - wW + 1, this.height / 2 - 24, wW, wH);

    // 4. Car Main Body Chassis
    const hw = this.width / 2;
    const hh = this.height / 2;

    // Body shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.roundRect(-hw + 2, -hh + 4, this.width, this.height, 12);
    ctx.fill();

    // Body Paint Gradient
    const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
    bodyGrad.addColorStop(0, this.carData.color);
    bodyGrad.addColorStop(0.3, this.carData.accentColor);
    bodyGrad.addColorStop(0.7, this.carData.color);
    bodyGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, this.width, this.height, 10);
    ctx.fill();

    // Side racing aerodynamic skirts
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-hw, -hh + 20, 3, hh + 6);
    ctx.fillRect(hw - 3, -hh + 20, 3, hh + 6);

    // Front Bumper / Hood intake
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-hw + 8, -hh + 3, this.width - 16, 12, 3);
    ctx.fill();

    // Hood Racing Stripes
    ctx.fillStyle = '#ffffffaa';
    ctx.fillRect(-4, -hh + 6, 3, 20);
    ctx.fillRect(1, -hh + 6, 3, 20);

    // Windshield (Tinted glass with reflection)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-hw + 6, -hh + 24);
    ctx.lineTo(hw - 6, -hh + 24);
    ctx.lineTo(hw - 8, -hh + 40);
    ctx.lineTo(-hw + 8, -hh + 40);
    ctx.closePath();
    ctx.fill();

    // Windshield glass glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.moveTo(-hw + 10, -hh + 26);
    ctx.lineTo(-hw + 16, -hh + 26);
    ctx.lineTo(-hw + 12, -hh + 38);
    ctx.lineTo(-hw + 8, -hh + 38);
    ctx.closePath();
    ctx.fill();

    // Roof & Rear Window
    ctx.fillStyle = this.carData.color;
    ctx.fillRect(-hw + 7, -hh + 40, this.width - 14, 14);

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-hw + 8, -hh + 54);
    ctx.lineTo(hw - 8, -hh + 54);
    ctx.lineTo(hw - 6, -hh + 64);
    ctx.lineTo(-hw + 6, -hh + 64);
    ctx.closePath();
    ctx.fill();

    // Rear Spoiler / Wing
    ctx.fillStyle = '#090d16';
    ctx.fillRect(-hw - 1, hh - 8, this.width + 2, 5);
    ctx.fillStyle = this.carData.accentColor;
    ctx.fillRect(-hw + 2, hh - 9, this.width - 4, 2);

    // Headlight bulbs
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-hw + 4, -hh, 6, 3);
    ctx.fillRect(hw - 10, -hh, 6, 3);

    // Taillights (Glowing Red)
    ctx.fillStyle = this.isNitroActive ? '#f97316' : '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(-hw + 3, hh - 3, 8, 3);
    ctx.fillRect(hw - 11, hh - 3, 8, 3);
    ctx.shadowBlur = 0;

    // 5. Render Active Shield Powerup Aura
    if (this.hasActivePowerup('shield')) {
      const sTime = Date.now() / 200;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, hw + 14 + Math.sin(sTime) * 2, hh + 14 + Math.cos(sTime) * 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 6. Render Active Magnet Powerup Rings
    if (this.hasActivePowerup('magnet')) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Render 2X Score Star Aura
    if (this.hasActivePowerup('multiplier')) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 34, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}
