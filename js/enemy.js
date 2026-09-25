// STREET RUSH 2D - Enemy Traffic AI & Vehicle Types

const ENEMY_TYPES = {
  SEDAN: {
    type: 'sedan',
    name: 'Sedan',
    width: 42,
    height: 72,
    speedMult: 0.8,
    colors: ['#3b82f6', '#10b981', '#8b5cf6', '#64748b', '#0284c7'],
    canChangeLanes: false
  },
  SPORT: {
    type: 'sport',
    name: 'Sports Car',
    width: 44,
    height: 76,
    speedMult: 1.15,
    colors: ['#f43f5e', '#f97316', '#e11d48', '#d946ef'],
    canChangeLanes: false
  },
  TRUCK: {
    type: 'truck',
    name: 'Semi Truck',
    width: 48,
    height: 110,
    speedMult: 0.6,
    colors: ['#0f766e', '#b45309', '#475569', '#1e293b'],
    canChangeLanes: false
  },
  AGGRESSIVE: {
    type: 'aggressive',
    name: 'Racer AI',
    width: 44,
    height: 74,
    speedMult: 0.95,
    colors: ['#dc2626', '#7c3aed', '#ea580c'],
    canChangeLanes: true
  }
};

class EnemyVehicle {
  constructor(typeKey, laneIndex, y, baseSpeed, roadInstance) {
    this.config = ENEMY_TYPES[typeKey] || ENEMY_TYPES.SEDAN;
    this.width = this.config.width;
    this.height = this.config.height;
    this.lane = laneIndex;
    this.x = roadInstance.getLaneX(laneIndex);
    this.y = y;
    this.targetX = this.x;
    
    this.color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
    this.speed = baseSpeed * this.config.speedMult * (0.9 + Math.random() * 0.2);
    
    // AI Lane change properties
    this.canChangeLanes = this.config.canChangeLanes;
    this.laneChangeTimer = 2.0 + Math.random() * 3.0;
    this.isChangingLane = false;
    this.blinker = null; // 'left' or 'right'
    this.blinkerTimer = 0;
    
    // Near miss detection state
    this.nearMissChecked = false;
    this.hasCollided = false;
  }

  update(dt, playerSpeed, roadInstance, otherEnemies) {
    // Relative vertical movement: road moves by playerSpeed, enemy moves down by this.speed
    // Net displacement = playerSpeed - this.speed
    const relativeSpeed = playerSpeed - this.speed;
    this.y += relativeSpeed;

    // AI Lane Switching Logic for Aggressive cars
    if (this.canChangeLanes && !this.hasCollided) {
      this.laneChangeTimer -= dt;

      if (this.laneChangeTimer <= 0 && !this.isChangingLane) {
        // Decide whether to switch left or right
        const possibleLanes = [];
        if (this.lane > 0) possibleLanes.push(this.lane - 1);
        if (this.lane < CONFIG.LANE_COUNT - 1) possibleLanes.push(this.lane + 1);

        if (possibleLanes.length > 0) {
          const newLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
          
          // Check if destination lane is clear of other enemies
          const isClear = !otherEnemies.some(other => {
            if (other === this) return false;
            return other.lane === newLane && Math.abs(other.y - this.y) < 130;
          });

          if (isClear) {
            this.isChangingLane = true;
            this.blinker = newLane < this.lane ? 'left' : 'right';
            this.blinkerTimer = 0.8; // Signal before moving
            this.lane = newLane;
            this.targetX = roadInstance.getLaneX(newLane);
          }
        }
        this.laneChangeTimer = 3.5 + Math.random() * 4.0;
      }

      // Execute lane shift smoothly
      if (this.isChangingLane) {
        const dx = this.targetX - this.x;
        this.x += dx * (dt * 4.5);
        if (Math.abs(dx) < 2) {
          this.x = this.targetX;
          this.isChangingLane = false;
          this.blinker = null;
        }
      }
    }

    // Blinker flash animation
    if (this.blinker) {
      this.blinkerTimer -= dt;
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

  checkNearMiss(player) {
    if (this.nearMissChecked || this.hasCollided) return false;

    // A near miss occurs when the enemy passes alongside the player with small lateral distance
    const yOverlap = Math.abs(this.y - player.y) < (this.height / 2 + player.height / 2);
    const xDist = Math.abs(this.x - player.x) - (this.width / 2 + player.width / 2);

    if (yOverlap && xDist > 0 && xDist <= CONFIG.NEAR_MISS_DISTANCE) {
      this.nearMissChecked = true;
      return true;
    }
    return false;
  }

  render(ctx, env) {
    if (this.y < -150 || this.y > CONFIG.CANVAS_HEIGHT + 150) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const hw = this.width / 2;
    const hh = this.height / 2;

    // 1. Vehicle Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-hw + 3, -hh + 5, this.width, this.height, 8);
    ctx.fill();

    // 2. Headlights on Road (Night, Sunset, Rain)
    if (env.headlights) {
      const beamGrad = ctx.createLinearGradient(0, -hh, 0, -hh - 120);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-hw + 6, -hh);
      ctx.lineTo(-hw - 14, -hh - 120);
      ctx.lineTo(hw + 14, -hh - 120);
      ctx.lineTo(hw - 6, -hh);
      ctx.fill();
    }

    // 3. Wheels
    ctx.fillStyle = '#0f172a';
    if (this.config.type === 'truck') {
      // 6-wheeler
      ctx.fillRect(-hw - 1, -hh + 14, 5, 14);
      ctx.fillRect(hw - 4, -hh + 14, 5, 14);
      ctx.fillRect(-hw - 1, hh - 38, 5, 14);
      ctx.fillRect(hw - 4, hh - 38, 5, 14);
      ctx.fillRect(-hw - 1, hh - 18, 5, 14);
      ctx.fillRect(hw - 4, hh - 18, 5, 14);
    } else {
      ctx.fillRect(-hw - 1, -hh + 10, 5, 14);
      ctx.fillRect(hw - 4, -hh + 10, 5, 14);
      ctx.fillRect(-hw - 1, hh - 22, 5, 14);
      ctx.fillRect(hw - 4, hh - 22, 5, 14);
    }

    // 4. Render Body based on vehicle type
    if (this.config.type === 'truck') {
      this.renderTruck(ctx, hw, hh);
    } else {
      this.renderCar(ctx, hw, hh);
    }

    // 5. Turn Signal Blinkers
    if (this.blinker && Math.floor(Date.now() / 150) % 2 === 0) {
      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      if (this.blinker === 'left') {
        ctx.fillRect(-hw - 1, -hh + 2, 4, 6);
        ctx.fillRect(-hw - 1, hh - 8, 4, 6);
      } else {
        ctx.fillRect(hw - 3, -hh + 2, 4, 6);
        ctx.fillRect(hw - 3, hh - 8, 4, 6);
      }
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  renderCar(ctx, hw, hh) {
    // Body gradient
    const grad = ctx.createLinearGradient(-hw, 0, hw, 0);
    grad.addColorStop(0, this.color);
    grad.addColorStop(0.5, '#ffffff33');
    grad.addColorStop(1, this.color);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, this.width, this.height, 8);
    ctx.fill();

    // Metallic highlight
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, this.width, this.height, 8);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-hw + 6, -hh + 20);
    ctx.lineTo(hw - 6, -hh + 20);
    ctx.lineTo(hw - 7, -hh + 34);
    ctx.lineTo(-hw + 7, -hh + 34);
    ctx.closePath();
    ctx.fill();

    // Rear window
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-hw + 7, -hh + 48);
    ctx.lineTo(hw - 7, -hh + 48);
    ctx.lineTo(hw - 6, -hh + 58);
    ctx.lineTo(-hw + 6, -hh + 58);
    ctx.closePath();
    ctx.fill();

    // Headlights (Front)
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-hw + 4, -hh, 6, 3);
    ctx.fillRect(hw - 10, -hh, 6, 3);

    // Taillights (Rear)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-hw + 4, hh - 3, 6, 3);
    ctx.fillRect(hw - 10, hh - 3, 6, 3);
  }

  renderTruck(ctx, hw, hh) {
    // Truck Cab (Front section)
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-hw, -hh, this.width, 36, 6);
    ctx.fill();

    // Cab windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-hw + 6, -hh + 14, this.width - 12, 10);

    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-hw + 3, -hh, 7, 3);
    ctx.fillRect(hw - 10, -hh, 7, 3);

    // Trailer / Cargo Box (Rear section)
    const cargoY = -hh + 38;
    const cargoHeight = this.height - 38;
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(-hw, cargoY, this.width, cargoHeight, 4);
    ctx.fill();

    // Cargo ridges / texture lines
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let y = cargoY + 8; y < hh - 6; y += 10) {
      ctx.beginPath();
      ctx.moveTo(-hw + 4, y);
      ctx.lineTo(hw - 4, y);
      ctx.stroke();
    }

    // Rear bumper & red lights
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-hw, hh - 4, this.width, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-hw + 3, hh - 3, 8, 3);
    ctx.fillRect(hw - 11, hh - 3, 8, 3);
  }
}
