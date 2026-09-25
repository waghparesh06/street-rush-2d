// STREET RUSH 2D - Procedural Scrolling Road & Highway Environment

class Road {
  constructor() {
    this.width = CONFIG.ROAD_WIDTH;
    this.x = (CONFIG.CANVAS_WIDTH - this.width) / 2;
    this.laneWidth = this.width / CONFIG.LANE_COUNT;
    this.scrollY = 0;
    this.dashOffset = 0;
    this.sideScenery = [];
    this.currentEnv = CONFIG.ENVIRONMENTS.DAY;
    
    // Lane center X positions
    this.laneCenters = [
      this.x + this.laneWidth * 0.5,
      this.x + this.laneWidth * 1.5,
      this.x + this.laneWidth * 2.5
    ];

    this.initScenery();
  }

  initScenery() {
    this.sideScenery = [];
    const spacing = 140;
    const count = Math.ceil(CONFIG.CANVAS_HEIGHT / spacing) + 2;

    for (let i = 0; i < count; i++) {
      this.sideScenery.push({
        y: i * spacing,
        leftType: i % 2 === 0 ? 'tree' : 'lamp',
        rightType: i % 2 === 1 ? 'tree' : 'lamp',
        leftScale: 0.8 + Math.random() * 0.4,
        rightScale: 0.8 + Math.random() * 0.4
      });
    }
  }

  setEnvironment(envName) {
    this.currentEnv = CONFIG.ENVIRONMENTS[envName] || CONFIG.ENVIRONMENTS.DAY;
  }

  getLaneX(laneIndex) {
    const idx = Math.max(0, Math.min(CONFIG.LANE_COUNT - 1, laneIndex));
    return this.laneCenters[idx];
  }

  getClosestLane(xPos) {
    let closestLane = 0;
    let minDiff = Infinity;
    for (let i = 0; i < this.laneCenters.length; i++) {
      const diff = Math.abs(xPos - this.laneCenters[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestLane = i;
      }
    }
    return closestLane;
  }

  update(speed) {
    const scrollDelta = speed;
    this.scrollY += scrollDelta;
    this.dashOffset = (this.dashOffset + scrollDelta) % 48;

    // Scroll side objects
    this.sideScenery.forEach(item => {
      item.y += scrollDelta;
      if (item.y > CONFIG.CANVAS_HEIGHT + 80) {
        item.y -= (CONFIG.CANVAS_HEIGHT + 160);
        item.leftType = Math.random() > 0.4 ? 'tree' : (Math.random() > 0.5 ? 'lamp' : 'sign');
        item.rightType = Math.random() > 0.4 ? 'tree' : (Math.random() > 0.5 ? 'lamp' : 'barrier');
      }
    });
  }

  render(ctx) {
    const env = this.currentEnv;

    // 1. Draw Side Grass / Terrain Background
    const grassGrad = ctx.createLinearGradient(0, 0, CONFIG.CANVAS_WIDTH, 0);
    grassGrad.addColorStop(0, env.grassColor);
    grassGrad.addColorStop(0.12, env.grassAccent);
    grassGrad.addColorStop(0.88, env.grassAccent);
    grassGrad.addColorStop(1, env.grassColor);
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // 2. Draw Road Bed (Asphalt)
    ctx.save();
    
    // Asphalt gradient for pseudo-depth and lighting
    const roadGrad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
    roadGrad.addColorStop(0, env.roadColor);
    roadGrad.addColorStop(0.5, env.roadColor);
    roadGrad.addColorStop(1, env.roadColor);
    ctx.fillStyle = roadGrad;
    ctx.fillRect(this.x, 0, this.width, CONFIG.CANVAS_HEIGHT);

    // Wet road reflection sheen in RAIN or NIGHT
    if (env.rain || env.name === 'NIGHT') {
      const wetGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
      wetGrad.addColorStop(0, 'rgba(56, 189, 248, 0.08)');
      wetGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
      wetGrad.addColorStop(1, 'rgba(56, 189, 248, 0.12)');
      ctx.fillStyle = wetGrad;
      ctx.fillRect(this.x, 0, this.width, CONFIG.CANVAS_HEIGHT);
    }

    // 3. Draw Curbs / Red-White Shoulder Strips
    const curbWidth = 10;
    const curbPatternLen = 32;
    const curbOffset = this.dashOffset % (curbPatternLen * 2);

    for (let y = -curbPatternLen * 2; y < CONFIG.CANVAS_HEIGHT + curbPatternLen; y += curbPatternLen) {
      const isRed = Math.floor((y + curbOffset) / curbPatternLen) % 2 === 0;
      ctx.fillStyle = isRed ? '#ef4444' : '#ffffff';
      // Left curb
      ctx.fillRect(this.x - curbWidth, y + curbOffset, curbWidth, curbPatternLen);
      // Right curb
      ctx.fillRect(this.x + this.width, y + curbOffset, curbWidth, curbPatternLen);
    }

    // Outer edge boundary lines (Solid Yellow / White)
    ctx.strokeStyle = env.roadEdge;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, 0);
    ctx.lineTo(this.x, CONFIG.CANVAS_HEIGHT);
    ctx.moveTo(this.x + this.width, 0);
    ctx.lineTo(this.x + this.width, CONFIG.CANVAS_HEIGHT);
    ctx.stroke();

    // 4. Draw Dashed Lane Lines (Between 3 lanes)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.setLineDash([26, 22]);
    ctx.lineDashOffset = -this.dashOffset;

    // Lane divider 1 (between lane 0 and 1)
    const lane1X = this.x + this.laneWidth;
    ctx.beginPath();
    ctx.moveTo(lane1X, 0);
    ctx.lineTo(lane1X, CONFIG.CANVAS_HEIGHT);
    ctx.stroke();

    // Lane divider 2 (between lane 1 and 2)
    const lane2X = this.x + this.laneWidth * 2;
    ctx.beginPath();
    ctx.moveTo(lane2X, 0);
    ctx.lineTo(lane2X, CONFIG.CANVAS_HEIGHT);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash
    ctx.restore();

    // 5. Draw Roadside Scenery (Trees, Street Lamps, Signs)
    this.renderSideScenery(ctx, env);
  }

  renderSideScenery(ctx, env) {
    ctx.save();
    this.sideScenery.forEach(item => {
      // Left side object
      const leftX = this.x - 36;
      this.drawObject(ctx, item.leftType, leftX, item.y, item.leftScale, env, true);

      // Right side object
      const rightX = this.x + this.width + 36;
      this.drawObject(ctx, item.rightType, rightX, item.y, item.rightScale, env, false);
    });
    ctx.restore();
  }

  drawObject(ctx, type, x, y, scale, env, isLeft) {
    if (y < -60 || y > CONFIG.CANVAS_HEIGHT + 60) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    if (type === 'tree') {
      // Tree trunk
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(-4, 0, 8, 18);
      // Foliage shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(2, 2, 18, 0, Math.PI * 2);
      ctx.fill();
      // Foliage
      ctx.fillStyle = env.name === 'SUNSET' ? '#b45309' : (env.name === 'RAIN' ? '#1e3a29' : '#15803d');
      ctx.beginPath();
      ctx.arc(0, -6, 18, 0, Math.PI * 2);
      ctx.arc(-8, 2, 14, 0, Math.PI * 2);
      ctx.arc(8, 2, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'lamp') {
      // Street Light post
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-2, -24, 4, 34);
      // Arm reaching toward road
      ctx.fillRect(isLeft ? -2 : -14, -24, 16, 4);
      // Lamp head
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(isLeft ? 10 : -16, -22, 6, 6);

      // Glowing light pool at night or sunset
      if (env.headlights) {
        const glowGrad = ctx.createRadialGradient(isLeft ? 20 : -20, 0, 4, isLeft ? 20 : -20, 0, 50);
        glowGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        glowGrad.addColorStop(0.5, 'rgba(254, 240, 138, 0.15)');
        glowGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(isLeft ? 20 : -20, 0, 50, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'sign') {
      // Highway chevron or speed sign
      ctx.fillStyle = '#475569';
      ctx.fillRect(-2, -10, 4, 20);
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, -14, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', 0, -11);
    } else {
      // Barrier / Cyber pylon
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(-4, -12, 8, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, -6, 8, 4);
      ctx.fillRect(-4, 6, 8, 4);
    }

    ctx.restore();
  }
}

const road = new Road();
