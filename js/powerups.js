// STREET RUSH 2D - Coins & Powerups System

class CollectibleItem {
  constructor(type, x, y, extra = {}) {
    this.type = type; // 'coin', 'rare_coin', 'gold_coin', 'shield', 'magnet', 'nitro', 'multiplier'
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 28;
    this.radius = 14;
    this.isCollected = false;
    this.animTime = Math.random() * 10;
    this.extra = extra;
  }

  update(dt, roadSpeed, player) {
    this.animTime += dt * 5;
    this.y += roadSpeed;

    // Coin magnet pull physics
    if (player && player.hasActivePowerup('magnet') && this.type.includes('coin')) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      const magnetRadius = CONFIG.POWERUPS.magnet.radius;

      if (dist < magnetRadius && dist > 1) {
        const pullSpeed = 16 * (1 - dist / magnetRadius) + 8;
        this.x += (dx / dist) * pullSpeed;
        this.y += (dy / dist) * pullSpeed;
      }
    }
  }

  render(ctx) {
    if (this.isCollected) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const bobY = Math.sin(this.animTime) * 3;
    const spinScaleX = Math.cos(this.animTime);

    if (this.type === 'coin' || this.type === 'rare_coin' || this.type === 'gold_coin') {
      this.renderCoin(ctx, bobY, spinScaleX);
    } else {
      this.renderPowerup(ctx, bobY);
    }

    ctx.restore();
  }

  renderCoin(ctx, bobY, spinScaleX) {
    let baseColor = '#eab308';
    let rimColor = '#facc15';
    let innerColor = '#ca8a04';
    let symbol = '★';

    if (this.type === 'rare_coin') {
      baseColor = '#06b6d4';
      rimColor = '#38bdf8';
      innerColor = '#0891b2';
      symbol = '◆';
    } else if (this.type === 'gold_coin') {
      baseColor = '#ec4899';
      rimColor = '#f472b6';
      innerColor = '#db2777';
      symbol = '💎';
    }

    ctx.translate(0, bobY);
    ctx.scale(Math.max(0.1, Math.abs(spinScaleX)), 1);

    // Glow aura
    ctx.fillStyle = rimColor + '55';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim
    ctx.fillStyle = rimColor;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Inner disc
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Embossed symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, 0, 1);
  }

  renderPowerup(ctx, bobY) {
    const pConfig = CONFIG.POWERUPS[this.type];
    if (!pConfig) return;

    ctx.translate(0, bobY);

    // Outer pulsing halo
    const pulse = 18 + Math.sin(this.animTime * 1.5) * 3;
    const haloGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, pulse);
    haloGrad.addColorStop(0, pConfig.color + 'aa');
    haloGrad.addColorStop(1, pConfig.color + '00');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.fill();

    // Powerup orb container
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    // Glowing border ring
    ctx.strokeStyle = pConfig.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Inner icon
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pConfig.icon, 0, 0);
  }
}
