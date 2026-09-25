// STREET RUSH 2D - Main Bootstrapper & Initialization

window.addEventListener('DOMContentLoaded', () => {
  console.log('%c STREET RUSH 2D %c Engine Initialized ', 'background: #e11d48; color: #fff; font-weight: bold; border-radius: 3px 0 0 3px;', 'background: #0f172a; color: #38bdf8; border-radius: 0 3px 3px 0;');

  // Initialize Game & UI Subsystems
  game.init('game-canvas');
  ui.init();

  // First interaction unlock for Web Audio API
  const unlockAudio = () => {
    audio.ensureContext();
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // Auto-resize / scaling container listener
  const handleResize = () => {
    const container = document.getElementById('game-container');
    if (!container) return;

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const targetRatio = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
    const currentRatio = winW / winH;

    if (currentRatio < targetRatio) {
      // Screen is narrower than game ratio
      const scale = Math.min(1, (winW - 16) / CONFIG.CANVAS_WIDTH);
      container.style.transform = `scale(${scale})`;
    } else {
      // Screen is wider/taller
      const scale = Math.min(1, (winH - 16) / CONFIG.CANVAS_HEIGHT);
      container.style.transform = `scale(${scale})`;
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();
});
