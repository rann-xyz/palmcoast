import { WORLD } from './config.js';

export function createMinimap(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  let background = null;

  function drawBackground(city) {
    background = document.createElement('canvas');
    background.width = size;
    background.height = size;
    const bg = background.getContext('2d');
    bg.fillStyle = '#16232d';
    bg.fillRect(0, 0, size, size);
    const scale = size / WORLD.width;
    for (const roadX of city.roadsX) {
      bg.strokeStyle = '#7f8c9b';
      bg.lineWidth = 4;
      bg.beginPath();
      bg.moveTo(roadX * scale, 0);
      bg.lineTo(roadX * scale, WORLD.height * scale);
      bg.stroke();
    }
    for (const roadY of city.roadsY) {
      bg.strokeStyle = '#7f8c9b';
      bg.beginPath();
      bg.moveTo(0, roadY * scale);
      bg.lineTo(WORLD.width * scale, roadY * scale);
      bg.stroke();
    }
    bg.fillStyle = '#3f6d52';
    bg.fillRect(1400 * scale, 1500 * scale, 1600 * scale, 800 * scale);
    bg.fillStyle = '#e7c98f';
    bg.fillRect(0, 3300 * scale, WORLD.width * scale, 700 * scale);
    bg.fillStyle = '#3a7ca5';
    bg.fillRect(0, 3700 * scale, WORLD.width * scale, 340 * scale);
    for (const building of city.buildings) {
      bg.fillStyle = building.landmark ? '#ffd166' : 'rgba(255,255,255,0.18)';
      bg.fillRect(building.x * scale, building.y * scale, building.width * scale, building.height * scale);
    }
  }

  function drawBlip(context, x, y, color, radius = 4, square = false) {
    context.fillStyle = color;
    if (square) context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    else {
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function update(world, big = false) {
    if (!background) drawBackground(world.city);
    const viewSize = big ? WORLD.width : 1400;
    const center = big ? { x: WORLD.width / 2, y: WORLD.height / 2 } : { x: world.player.x, y: world.player.y };
    const scale = size / viewSize;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, size, size);
    context.save();
    context.beginPath();
    if (big) context.rect(0, 0, size, size);
    else context.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    context.clip();
    context.fillStyle = '#16232d';
    context.fillRect(0, 0, size, size);
    context.translate(size / 2, size / 2);
    context.scale(scale, scale);
    context.translate(-center.x, -center.y);
    context.drawImage(background, 0, 0, WORLD.width, WORLD.height);
    const marker = world.missions.state.marker;
    if (marker) drawBlip(context, marker.x, marker.y, '#ffd166', big ? 10 : 7);
    if (world.jobs.state.taxiActive) {
      const target = world.jobs.state.taxiPassenger ?? world.jobs.state.taxiDestination;
      drawBlip(context, target.x, target.y, '#5fd0ff', big ? 9 : 6);
    }
    if (world.police.state.stars > 0) {
      for (const car of world.vehicles) if (car.role === 'police' && !car.exploded) drawBlip(context, car.x, car.y, '#5aa9ff', big ? 6 : 4);
    }
    for (const pack of world.jobs.state.packages) if (!pack.taken) drawBlip(context, pack.x, pack.y, '#a4f7b9', big ? 4 : 2);
    drawBlip(context, world.player.x, world.player.y, '#ffffff', big ? 8 : 6, true);
    context.restore();
    context.strokeStyle = 'rgba(255,255,255,0.5)';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    context.stroke();
    return canvas;
  }

  return { update, canvas };
}
