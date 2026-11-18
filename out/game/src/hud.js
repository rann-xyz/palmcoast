import { formatMoney, formatTime } from './util.js';
import { currentWeapon } from './weapons.js';

export function createHud(context) {
  function panel(x, y, width, height, alpha = 0.72) {
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = '#101823';
    context.beginPath();
    context.rect(x, y, width, height);
    context.fill();
    context.globalAlpha = 1;
    context.strokeStyle = 'rgba(255,205,140,0.35)';
    context.lineWidth = 2;
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
    context.fillRect(x, y, width, height);
    context.fillStyle = color;
    context.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), height);
  }

  function drawWanted(x, y, stars, time) {
    for (let index = 0; index < 5; index += 1) {
      const pulse = index < stars ? 1 + Math.sin(time * 8 + index) * 0.08 : 0.6;
      context.save();
      context.translate(x + index * 26, y);
      context.scale(pulse, pulse);
      context.fillStyle = index < stars ? '#ffd166' : 'rgba(255,255,255,0.18)';
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
    panel(20, 18, 300, 92);
    text('HEALTH', 36, 46, 13, '#ffd9a8');
    bar(36, 54, 180, 10, state.player.health / 100, state.player.health < 30 ? '#ff6b6b' : '#67d6a4');
    text('ARMOR', 36, 86, 13, '#cfe8ff');
    bar(36, 94, 180, 10, state.player.armor / 100, '#7cc4ff');
    text(formatMoney(state.player.cash), 236, 58, 24, '#ffe9a8', 'right');
    drawWanted(238, 92, state.police.state.stars, state.time);
    const weapon = currentWeapon(state.player.weaponState);
    panel(20, height / scale - 84, 280, 58);
    text(`${weapon.name.toUpperCase()}`, 36, height / scale - 52, 18, '#fff5e2');
    text(weapon.ammoUse ? `${weapon.ammo}` : '∞', 284, height / scale - 52, 20, '#ffd166', 'right');
    if (state.player.vehicle) {
      const speed = Math.abs(state.player.vehicle.speed) * 0.42;
      panel(width / scale - 250, height / scale - 110, 226, 84);
      text(`${Math.round(speed)} MPH`, width / scale - 44, height / scale - 56, 30, '#fff5e2', 'right');
      bar(width / scale - 226, height / scale - 44, 182, 10, Math.abs(state.player.vehicle.speed) / state.player.vehicle.type.speed, '#ffb36b');
      text(state.player.vehicle.type.name, width / scale - 44, height / scale - 76, 15, '#ffd9a8', 'right');
    }
    if (state.notification && state.notificationTimer > 0) {
      panel(width / scale / 2 - 190, 132, 380, 46, 0.65);
      text(state.notification, width / scale / 2, 162, 18, '#fff5e2', 'center');
    }
    if (state.missions.state.active || state.missions.state.passed || state.missions.state.failed) {
      const mission = state.missions.state;
      panel(width / scale / 2 - 280, 22, 560, 58, 0.68);
      text(mission.objective || (mission.passed ? 'MISSION PASSED' : 'MISSION FAILED'), width / scale / 2, 60, 21, mission.failed ? '#ff9d9d' : '#fff5e2', 'center');
    }
    if (state.missions.state.subtitleTimer > 0 && state.missions.state.subtitle) {
      panel(width / scale / 2 - 330, height / scale - 150, 660, 44, 0.55);
      text(state.missions.state.subtitle, width / scale / 2, height / scale - 120, 18, '#ffeacc', 'center');
    }
    if (state.radioVisible > 0) {
      panel(width / scale / 2 - 130, height / scale - 220, 260, 44, 0.6);
      text(state.radioNames[state.radio], width / scale / 2, height / scale - 190, 19, '#ffd166', 'center');
    }
    if (minimapCanvas) context.drawImage(minimapCanvas, 24, height / scale - 258, 210, 210);
    context.restore();
  }

  return { draw };
}
