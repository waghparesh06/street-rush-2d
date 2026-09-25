// STREET RUSH 2D - Particle System & Visual FX Engine

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.skidMarks = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
    this.flashAlpha = 0;
    this.flashColor = '#ff0055';
    this.speedLines = [];
    this.rainDrops = [];
    
    // Pre-populate rain drops for seamless looping
    for (let i = 0; i < 90; i++) {
      this.rainDrops.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        length: 12 + Math.random() * 18,
        speed: 18 + Math.random() * 12,
        alpha: 0.2 + Math.random() * 0.4
      });
    }

    // Pre-populate speed lines
    for (let i = 0; i < 30; i++) {
      this.speedLines.push({
        x: Math.random() * CONFIG.CANVAS_WIDTH,
        y: Math.random() * CONFIG.CANVAS_HEIGHT,
        length: 20 + Math.random() * 50,
        speed: 25 + Math.random() * 15,
        alpha: 0.1 + Math.random() * 0.3
      });
    }
  }

  reset() {
    this.particles = [];
    this.skidMarks = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
    this.flashAlpha = 0;
  }

  triggerScreenShake(intensity = 10, duration = 0.3) {
    const settings = storage.getSettings();
    if (!settings.screenShake) return;
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  triggerFlash(color = '#ff0055', alpha = 0.4) {
    const settings = storage.getSettings();
    if (settings.reducedEffects) {
      alpha = 0.15;
    }
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  // --- PARTICLE EMITTERS ---

  emitNitroFlames(x, y, isSuper = false) {
    const count = isSuper ? 5 : 3;
    const colors = isSuper 
      ? ['#a855f7', '#c084fc', '#e9d5ff', '#38bdf8'] 
      : ['#38bdf8', '#0ea5e9', '#0284c7', '#ffffff', '#f59e0b'];

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() * 12 - 6),
        y: y + Math.random() * 6,
        vx: (Math.random() * 2 - 1) * 1.5,
        vy: 6 + Math.random() * 8, // shoots backward
        radius: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.9,
        decay: 0.045 + Math.random() * 0.04,
        shape: 'circle'
      });
    }
  }

  emitSparks(x, y, count = 18) {
    const colors = ['#f59e0b', '#fbbf24', '#ef4444', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.03,
        shape: 'spark'
      });
    }
  }

  emitCoinGlow(x, y, color = '#fbbf24') {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2,
        color: color,
        alpha: 1.0,
        decay: 0.035,
        shape: 'star'
      });
    }
  }

  emitTextPopup(x, y, text, color = '#fbbf24', fontSize = 18) {
    this.particles.push({
      x: x,
      y: y,
      vx: 0,
      vy: -1.8,
      text: text,
      color: color,
      fontSize: fontSize,
      alpha: 1.0,
      decay: 0.022,
      shape: 'text'
    });
  }

  addSkidMark(x, y, width = 6, length = 12) {
    this.skidMarks.push({
      x: x,
      y: y,
      width: width,
      length: length,
      alpha: 0.4
    });
    if (this.skidMarks.length > 80) {
      this.skidMarks.shift();
    }
  }

  // --- UPDATE & RENDER ---

  update(dt, speedRatio = 1.0, isRaining = false, isNitro = false) {
    // Screen shake update
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
      if (this.screenShakeTime <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.shape === 'circle' || p.shape === 'spark') {
        p.radius *= 0.96;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update skid marks relative to road scroll
    const scrollDelta = 8 * speedRatio;
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const mark = this.skidMarks[i];
      mark.y += scrollDelta;
      mark.alpha -= 0.001;
      if (mark.y > CONFIG.CANVAS_HEIGHT + 50 || mark.alpha <= 0) {
        this.skidMarks.splice(i, 1);
      }
    }

    // Update rain
    if (isRaining) {
      this.rainDrops.forEach(drop => {
        drop.y += drop.speed * speedRatio;
        drop.x += 1.5; // diagonal wind
        if (drop.y > CONFIG.CANVAS_HEIGHT) {
          drop.y = -drop.length;
          drop.x = Math.random() * (CONFIG.CANVAS_WIDTH + 60) - 30;
        }
      });
    }

    // Update speed lines when moving fast or nitro
    if (isNitro || speedRatio > 1.25) {
      this.speedLines.forEach(line => {
        line.y += line.speed * (isNitro ? 2.0 : 1.2);
        if (line.y > CONFIG.CANVAS_HEIGHT) {
          line.y = -line.length;
          line.x = Math.random() * CONFIG.CANVAS_WIDTH;
        }
      });
    }
  }

  getShakeOffset() {
    if (this.screenShakeTime <= 0) return { x: 0, y: 0 };
    const factor = this.screenShakeTime * this.screenShakeIntensity;
    return {
      x: (Math.random() * 2 - 1) * factor,
      y: (Math.random() * 2 - 1) * factor
    };
  }

  renderSkidMarks(ctx) {
    ctx.save();
    this.skidMarks.forEach(mark => {
      ctx.fillStyle = `rgba(15, 23, 42, ${mark.alpha})`;
      ctx.fillRect(mark.x - mark.width / 2, mark.y, mark.width, mark.length);
    });
    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.radius / 2, p.y - p.radius / 2, p.radius, p.radius * 2);
      } else if (p.shape === 'star') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'text') {
        ctx.font = `900 ${p.fontSize}px 'Outfit', 'Montserrat', sans-serif`;
        ctx.fillStyle = p.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 6;
        ctx.fillText(p.text, p.x, p.y);
      }
    });
    ctx.restore();
  }

  renderRain(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    this.rainDrops.forEach(drop => {
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + 3, drop.y + drop.length);
    });
    ctx.stroke();
    ctx.restore();
  }

  renderSpeedLines(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.speedLines.forEach(line => {
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x, line.y + line.length);
    });
    ctx.stroke();
    ctx.restore();
  }

  renderFlash(ctx) {
    if (this.flashAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.flashAlpha;
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    ctx.restore();
  }
}

const particles = new ParticleSystem();
