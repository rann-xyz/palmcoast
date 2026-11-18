export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CONTROLS = 'controls';
export const SCREEN_PASSED = 'passed';
export const SCREEN_FAILED = 'failed';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_WASTED = 'wasted';
export const SCREEN_CREDITS = 'credits';

export function createMenu(context) {
  function panel(x, y, width, height, alpha = 0.82) {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = '#0d1520';
    context.beginPath();
    context.rect(x, y, width, height);
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = 'rgba(255,190,120,0.45)';
    context.lineWidth = 3;
    context.stroke();
    context.restore();
  }

  function text(value, x, y, size = 24, color = '#fff5e2', align = 'center', weight = '700') {
    context.fillStyle = color;
    context.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function drawWordmark(width, height, time) {
    const centerX = width / 2;
    const centerY = height * 0.36;
    const gradient = context.createLinearGradient(0, centerY - 80, 0, centerY + 50);
    gradient.addColorStop(0, '#ffdf8a');
    gradient.addColorStop(0.55, '#ff9166');
    gradient.addColorStop(1, '#c94f70');
    context.save();
    context.translate(centerX, centerY);
    context.rotate(Math.sin(time * 0.3) * 0.005);
    context.font = '900 104px "Segoe UI", system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillStyle = 'rgba(0,0,0,0.35)';
    context.fillText('PALMCOAST', 6, 8);
    context.fillStyle = gradient;
    context.fillText('PALMCOAST', 0, 0);
    context.font = '600 24px "Segoe UI", system-ui, sans-serif';
    context.fillStyle = '#ffeacc';
    context.fillText('SIX YEARS LATER · ONE LAST JOB', 0, 44);
    context.restore();
    const sunY = height * 0.58 + Math.sin(time * 0.4) * 3;
    const sun = context.createRadialGradient(centerX, sunY, 10, centerX, sunY, 170);
    sun.addColorStop(0, 'rgba(255,214,140,0.9)');
    sun.addColorStop(1, 'rgba(255,130,90,0)');
    context.fillStyle = sun;
    context.beginPath();
    context.arc(centerX, sunY, 170, 0, Math.PI * 2);
    context.fill();
  }

  function drawBackdrop(width, height, time) {
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#182636');
    sky.addColorStop(0.55, '#5d3a55');
    sky.addColorStop(1, '#f29a63');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);
    for (let index = 0; index < 16; index += 1) {
      const x = ((index * 173 + time * 18) % (width + 180)) - 90;
      const y = height * 0.62 + Math.sin(index * 2.1) * 24;
      context.fillStyle = index % 2 ? 'rgba(24,32,44,0.72)' : 'rgba(36,48,64,0.62)';
      context.fillRect(x, y, 80 + (index % 4) * 30, height);
    }
    context.fillStyle = 'rgba(255,214,140,0.16)';
    context.fillRect(0, height * 0.7, width, height * 0.3);
  }

  function drawLines(lines, startY, lineHeight) {
    lines.forEach((line, index) => text(line, context.canvas.width / 2, startY + index * lineHeight, 20, '#f6e7d2'));
  }

  function draw(state, time, hasSave, mission) {
    const width = context.canvas.width;
    const height = context.canvas.height;
    drawBackdrop(width, height, time);
    if (state === SCREEN_TITLE) {
      drawWordmark(width, height, time);
      panel(width / 2 - 240, height * 0.68, 480, 130, 0.62);
      drawLines([hasSave ? 'ENTER · Continue' : 'ENTER · New Game', 'M · Big map   ESC · Pause', 'WASD move · Mouse aim · LMB shoot'], height * 0.68 + 42, 30);
      return;
    }
    if (state === SCREEN_PAUSED || state === SCREEN_CONTROLS) {
      panel(width / 2 - 300, height * 0.2, 600, 360);
      text(state === SCREEN_CONTROLS ? 'CONTROLS' : 'PAUSED', width / 2, height * 0.2 + 60, 34, '#ffd166');
      const lines = state === SCREEN_CONTROLS
        ? ['WASD / Arrows · Move or drive', 'Shift · Run   E · Enter / exit vehicle', 'Mouse · Aim   LMB · Attack', '1-5 · Weapons   Space · Handbrake', 'H · Horn   R · Radio   M · Map', 'ESC · Pause / back']
        : ['ENTER · Resume', 'S · Save game', 'C · Controls', 'Q · Quit to title'];
      drawLines(lines, height * 0.2 + 112, 36);
      return;
    }
    if (state === SCREEN_PASSED || state === SCREEN_FAILED || state === SCREEN_BUSTED || state === SCREEN_WASTED || state === SCREEN_CREDITS) {
      const titles = {
        [SCREEN_PASSED]: 'MISSION PASSED',
        [SCREEN_FAILED]: 'MISSION FAILED',
        [SCREEN_BUSTED]: 'BUSTED',
        [SCREEN_WASTED]: 'WASTED',
        [SCREEN_CREDITS]: 'PALMCOAST',
      };
      const colors = { [SCREEN_PASSED]: '#8ef0b5', [SCREEN_FAILED]: '#ff8f8f', [SCREEN_BUSTED]: '#7cc4ff', [SCREEN_WASTED]: '#ff6b6b', [SCREEN_CREDITS]: '#ffd166' };
      panel(width / 2 - 320, height * 0.26, 640, 270);
      text(titles[state] ?? '', width / 2, height * 0.26 + 70, 42, colors[state] ?? '#fff');
      const lines = state === SCREEN_PASSED
        ? [`Reward $${mission?.reward ?? 0}`, 'Progress saved', 'ENTER · Continue']
        : state === SCREEN_CREDITS
          ? ['Rio found the truth at the pier.', 'Marisol kept the coast. Tiburon kept the docks.', 'Created for the make.fun open-world bounty.', 'ENTER · Return to Palmcoast']
          : state === SCREEN_BUSTED
            ? ['Fine paid · weapons kept, ammo halved', 'ENTER · Continue']
            : state === SCREEN_WASTED
              ? ['Hospital bill · 10% cash lost', 'ENTER · Continue']
              : ['Objective failed', 'ENTER · Retry'];
      drawLines(lines, height * 0.26 + 130, 34);
    }
  }

  return { draw };
}
