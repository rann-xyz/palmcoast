import { formatMoney, formatTime } from './util.js';
import { currentWeapon } from './weapons.js';

export function createHud(context) {
  let lastHealth = 100;
  let ghostHealth = 100;
  function panel(x, y, width, height, alpha = 0.72) {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = '#101823';
    context.beginPath();
    context.roundRect(x, y, width, height, 10);
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = 'rgba(255,205,140,0.38)';
    context.lineWidth = 1.5;
    context.stroke();
    context.restore();
  }

  function text(value, x, y, size = 18, color = '#fff5e2', align = 'left', weight = '600') {
    context.fillStyle = color;
    context.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function bar(x, y, width, height, ratio, color, background = 'rgba(255,255,255,0.16)') {
    context.fillStyle = background;
    context.beginPath();
    context.roundRect(x, y, width, height, height / 2);
    context.fill();
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(x, y, width * Math.max(0, Math.min(1, ratio)), height, height / 2);
    context.fill();
  }

  function drawWanted(x, y, stars, time) {
    const pulse = Math.sin(time * 9) * 0.5 + 0.5;
    for (let index = 0; index < 5; index += 1) {
      const active = index < stars;
      const scale = active ? 1 + pulse * 0.08 : 0.62;
      context.save();
      context.translate(x + index * 26, y);
      context.scale(pulse, pulse);
      context.fillStyle = active ? '#ffd166' : 'rgba(255,255,255,0.16)';
      context.beginPath();
      for (let point = 0; point < 10; point += 1) {
        const radius = point % 2 ? 5 : 11;
        const angle = (point / 10) * Math.PI * 2 - Math.PI / 2;
        context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      context.closePath();
      context.fill();
      context.restore();
    }
  }

  function draw(state, minimapCanvas) {
    const width = context.canvas.width;
    const height = context.canvas.height;
    const scale = Math.min(width / 1280, height / 720);
    context.save();
    context.scale(scale, scale);
    const displayedHealth = state.player.health / 100;
    lastHealth = Math.min(lastHealth, displayedHealth);
    if (displayedHealth >= lastHealth) lastHealth = displayedHealth;
    ghostHealth = Math.max(displayedHealth, ghostHealth - (ghostHealth > displayedHealth ? 0.0012 : 0));
    panel(20, 18, 312, 96);
    text('HEALTH', 36, 47, 12, '#ffd9a8');
    bar(36, 55, 184, 9, ghostHealth, 'rgba(255,150,120,0.35)');
    bar(36, 55, 184, 9, displayedHealth, state.player.health < 30 ? '#ff6b6b' : '#74d6a4');
    text('ARMOR', 36, 89, 12, '#cfe8ff');
    bar(36, 97, 184, 9, state.player.armor / 100, '#7cc4ff');
    text(formatMoney(state.player.cash), 312, 60, 25, '#ffe9a8', 'right');
    drawWanted(244, 94, state.police.state.stars, state.time);
    const weapon = currentWeapon(state.player.weaponState);
    panel(20, height / scale - 86, 284, 60);
    text(`${weapon.name.toUpperCase()}`, 36, height / scale - 52, 17, '#fff5e2');
    text(weapon.ammoUse ? `${weapon.ammo}` : '∞', 284, height / scale - 52, 20, '#ffd166', 'right');
    if (state.player.vehicle) {
      const speed = Math.abs(state.player.vehicle.speed) * 0.42;
      panel(width / scale - 254, height / scale - 112, 230, 86);
      text(`${Math.round(speed)} MPH`, width / scale - 44, height / scale - 56, 30, '#fff5e2', 'right');
      bar(width / scale - 226, height / scale - 44, 182, 10, Math.abs(state.player.vehicle.speed) / state.player.vehicle.type.speed, '#ffb36b');
      text(state.player.vehicle.type.name, width / scale - 44, height / scale - 76, 15, '#ffd9a8', 'right');
    }
    if (state.notification && state.notificationTimer > 0) {
      panel(width / scale / 2 - 190, 132, 380, 46, 0.66);
      text(state.notification, width / scale / 2, 162, 18, '#fff5e2', 'center');
    }
    if (state.missions.state.active || state.missions.state.passed || state.missions.state.failed) {
      const mission = state.missions.state;
      panel(width / scale / 2 - 280, 22, 560, 58, 0.7);
      text(mission.objective || (mission.passed ? 'MISSION PASSED' : 'MISSION FAILED'), width / scale / 2, 60, 21, mission.failed ? '#ff9d9d' : '#fff5e2', 'center');
    }
    if (state.missions.state.subtitleTimer > 0 && state.missions.state.subtitle) {
      panel(width / scale / 2 - 330, height / scale - 150, 660, 44, 0.56);
      text(state.missions.state.subtitle, width / scale / 2, height / scale - 120, 18, '#ffeacc', 'center');
    }
    if (state.radioVisible > 0) {
      panel(width / scale / 2 - 130, height / scale - 220, 260, 44, 0.62);
      text(state.radioNames[state.radio], width / scale / 2, height / scale - 190, 19, '#ffd166', 'center');
    }
    if (minimapCanvas) context.drawImage(minimapCanvas, 24, height / scale - 258, 210, 210);
    context.restore();
  }

  return { draw };
}
