import { BEACH, ROAD, WORLD } from './config.js';
import { clamp } from './util.js';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  let cachedGround = null;
  let cachedGroundCanvas = null;

  function shade(color, amount) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const adjust = value => clamp(Math.round(value + amount), 0, 255);
    return `rgb(${adjust(r)},${adjust(g)},${adjust(b)})`;
  }

  function buildGround(city) {
    cachedGroundCanvas = document.createElement('canvas');
    cachedGroundCanvas.width = WORLD.width;
    cachedGroundCanvas.height = WORLD.height;
    const ground = cachedGroundCanvas.getContext('2d');
    ground.fillStyle = '#e4c9a0';
    ground.fillRect(0, 0, WORLD.width, WORLD.height);
    ground.fillStyle = '#d8d3c8';
    ground.fillRect(0, 0, WORLD.width, BEACH.top);
    for (let y = 0; y < BEACH.top; y += 4) {
      ground.fillStyle = `rgba(255,220,170,${0.02 + (y / BEACH.top) * 0.03})`;
      ground.fillRect(0, y, WORLD.width, 4);
    }
    for (const roadX of city.roadsX) {
      ground.fillStyle = '#59616c';
      ground.fillRect(roadX - ROAD.width / 2, 0, ROAD.width, BEACH.top);
      ground.fillStyle = 'rgba(255,255,255,0.65)';
      ground.fillRect(roadX - 2, 0, 3, BEACH.top);
    }
    for (const roadY of city.roadsY) {
      ground.fillStyle = '#59616c';
      ground.fillRect(0, roadY - ROAD.width / 2, WORLD.width, ROAD.width);
      ground.fillStyle = 'rgba(255,255,255,0.65)';
      ground.fillRect(0, roadY - 2, WORLD.width, 3);
    }
    for (const rect of city.sidewalkRects) {
      ground.strokeStyle = 'rgba(220,220,220,0.5)';
      ground.lineWidth = 8;
      ground.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    for (let row = 0; row < city.roadsY.length; row += 1) {
      for (let column = 0; column < city.roadsX.length; column += 1) {
        const x = city.roadsX[column];
        const y = city.roadsY[row];
        ground.fillStyle = '#d8d3c8';
        for (let stripe = -ROAD.width / 2; stripe < ROAD.width / 2; stripe += 8) {
          ground.fillRect(x - ROAD.width / 2 - 24, y + stripe, 18, 6);
          ground.fillRect(x + ROAD.width / 2 + 6, y + stripe, 18, 6);
          ground.fillRect(x + stripe, y - ROAD.width / 2 - 24, 6, 18);
          ground.fillRect(x + stripe, y + ROAD.width / 2 + 6, 6, 18);
        }
      }
    }
    ground.fillStyle = '#f7d9a0';
    ground.fillRect(0, BEACH.top, WORLD.width, BEACH.sand - BEACH.top);
    ground.fillStyle = '#2f8bb0';
    ground.fillRect(0, BEACH.sand, WORLD.width, WORLD.height - BEACH.sand);
    for (let index = 0; index < 80; index += 1) {
      ground.fillStyle = 'rgba(255,255,255,0.08)';
      ground.fillRect(0, BEACH.sand + (index * 13) % (WORLD.height - BEACH.sand), WORLD.width, 4);
    }
    ground.fillStyle = '#8b5e3c';
    ground.fillRect(1930, 3400, 100, 560);
    ground.fillStyle = '#c29a6a';
    ground.fillRect(1880, 3860, 200, 120);
    return cachedGroundCanvas;
  }

  function drawBuildingShadow(building, sunX, sunY) {
    const shadowLength = 2.2 + building.heightLevel * 0.35;
    context.fillStyle = 'rgba(50,40,70,0.24)';
    context.beginPath();
    context.moveTo(building.x, building.y);
    context.lineTo(building.x + building.width, building.y);
    context.lineTo(building.x + building.width + sunX * shadowLength, building.y + building.height + sunY * shadowLength);
    context.lineTo(building.x + sunX * shadowLength, building.y + building.height + sunY * shadowLength);
    context.closePath();
    context.fill();
  }

  function drawBuilding(building) {
    drawBuildingShadow(building, 0.8, 0.45);
    context.fillStyle = shade(building.shade, -18);
    context.fillRect(building.x + 6, building.y + 8, building.width, building.height);
    context.fillStyle = building.shade;
    context.fillRect(building.x, building.y, building.width, building.height);
    context.fillStyle = building.roof;
    context.fillRect(building.x + 3, building.y + 3, building.width - 6, building.height - 6);
    if (building.heightLevel >= 4) {
      context.fillStyle = 'rgba(255,255,255,0.14)';
      for (let index = 0; index < building.heightLevel; index += 1) context.fillRect(building.x + 8 + index * 8, building.y + 8, 4, building.height - 16);
    }
    context.fillStyle = 'rgba(60,70,80,0.45)';
    context.fillRect(building.x + building.width * 0.25, building.y + building.height * 0.28, 16, 12);
    context.fillRect(building.x + building.width * 0.58, building.y + building.height * 0.58, 12, 12);
    if (building.heightLevel > 2) {
      context.fillStyle = '#9aa5ad';
      context.fillRect(building.x + building.width - 28, building.y + 10, 18, 10);
    }
    if (building.landmark) {
      context.fillStyle = '#ffd166';
      context.fillRect(building.x + 4, building.y - 12, building.width - 8, 7);
      context.fillStyle = '#2d2a26';
      context.font = '600 13px system-ui';
      context.textAlign = 'center';
      context.fillText(building.landmark, building.x + building.width / 2, building.y - 18);
    }
  }

  function drawVehicle(vehicle) {
    const length = vehicle.type.length;
    const width = vehicle.type.width;
    context.save();
    context.translate(vehicle.x, vehicle.y);
    context.rotate(vehicle.angle);
    context.fillStyle = 'rgba(40,35,60,0.28)';
    context.fillRect(-length / 2 + 8, -width / 2 + 10, length, width);
    context.fillStyle = vehicle.exploded ? '#2c2727' : shade(vehicle.type.color, -22);
    context.fillRect(-length / 2, -width / 2 + 3, length, width - 3);
    context.fillStyle = vehicle.exploded ? '#3b3434' : vehicle.type.color;
    context.fillRect(-length / 2, -width / 2, length, width - 3);
    context.fillStyle = vehicle.exploded ? '#232323' : vehicle.type.roof;
    context.fillRect(-length * 0.12, -width / 2 + 4, length * 0.36, width - 8);
    context.fillStyle = 'rgba(180,220,255,0.75)';
    context.fillRect(-length * 0.08, -width / 2 + 5, length * 0.12, width - 10);
    context.fillRect(length * 0.1, -width / 2 + 5, length * 0.1, width - 10);
    context.fillStyle = '#ffd166';
    context.fillRect(length / 2 - 5, -width / 2 + 3, 4, 5);
    context.fillRect(length / 2 - 5, width / 2 - 8, 4, 5);
    context.fillStyle = '#ff5f5f';
    context.fillRect(-length / 2 + 1, -width / 2 + 3, 3, 5);
    context.fillRect(-length / 2 + 1, width / 2 - 8, 3, 5);
    if (vehicle.role === 'police') {
      const flash = Math.sin(performance.now() * 0.02) > 0;
      context.fillStyle = flash ? '#ff4d4d' : '#4d8dff';
      context.fillRect(-6, -width / 2 - 3, 12, 4);
    }
    if (vehicle.missionMarker) {
      context.strokeStyle = '#ffd166';
      context.lineWidth = 2;
      context.strokeRect(-length / 2, -width / 2, length, width);
    }
    context.restore();
    if (vehicle.damageSmoke > 0) context.fillStyle = 'rgba(90,90,90,0.4)';
  }

  function drawPed(ped) {
    context.save();
    context.translate(ped.x, ped.y);
    if (ped.down) {
      context.rotate(ped.angle + Math.PI / 2);
      context.globalAlpha = 0.8;
      context.scale(1.2, 0.7);
    } else {
      context.rotate(ped.angle);
    }
    context.fillStyle = 'rgba(40,30,60,0.25)';
    context.beginPath();
    context.ellipse(3, 4, 11, 7, 0, 0, Math.PI * 2);
    context.fill();
    const swing = Math.sin(ped.walkPhase) * 3;
    context.strokeStyle = '#2f3640';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(-2, -4); context.lineTo(-2 + swing, -8);
    context.moveTo(-2, 4); context.lineTo(-2 - swing, 8);
    context.stroke();
    context.fillStyle = ped.role === 'police' ? '#274b73' : ped.role === 'ally' ? '#2f9e8f' : ped.role === 'enemy' ? '#743a3a' : ped.shirt;
    context.beginPath();
    context.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = ped.skin;
    context.beginPath();
    context.arc(3, 0, 4, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawPlayer(player) {
    context.save();
    context.translate(player.x, player.y);
    context.fillStyle = 'rgba(40,30,60,0.3)';
    context.beginPath();
    context.ellipse(5, 6, 12, 8, 0, 0, Math.PI * 2);
    context.fill();
    context.rotate(player.angle);
    const swing = Math.sin(player.walkPhase) * 4;
    context.strokeStyle = '#2b2b31';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(-2, -5); context.lineTo(-2 + swing, -9);
    context.moveTo(-2, 5); context.lineTo(-2 - swing, 9);
    context.stroke();
    context.fillStyle = '#e0574f';
    context.beginPath();
    context.ellipse(0, 0, 9, 7, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#e8b48a';
    context.beginPath();
    context.arc(4, 0, 4.5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#1d1d22';
    context.fillRect(8, -2, 9, 4);
    context.restore();
  }

  function drawProps(city) {
    for (const prop of city.props) {
      context.fillStyle = 'rgba(40,30,60,0.18)';
      context.beginPath();
      context.ellipse(prop.x + 8, prop.y + 6, prop.size * 0.8, prop.size * 0.35, 0, 0, Math.PI * 2);
      context.fill();
      if (prop.kind === 'palm') {
        context.strokeStyle = '#8b5e3c';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(prop.x, prop.y);
        context.quadraticCurveTo(prop.x + 5, prop.y - prop.size * 0.6, prop.x + 2, prop.y - prop.size);
        context.stroke();
        for (let leaf = 0; leaf < 6; leaf += 1) {
          const angle = (leaf / 6) * Math.PI * 2 + prop.x * 0.01;
          context.strokeStyle = leaf % 2 ? '#4f9d69' : '#61b377';
          context.lineWidth = 4;
          context.beginPath();
          context.moveTo(prop.x + 2, prop.y - prop.size);
          context.quadraticCurveTo(prop.x + 2 + Math.cos(angle) * prop.size * 0.7, prop.y - prop.size + Math.sin(angle) * prop.size * 0.4, prop.x + 2 + Math.cos(angle) * prop.size, prop.y - prop.size + Math.sin(angle) * prop.size * 0.55);
          context.stroke();
        }
      } else if (prop.kind === 'lamp') {
        context.strokeStyle = '#7f8c9b';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(prop.x, prop.y);
        context.lineTo(prop.x, prop.y - 18);
        context.stroke();
        context.fillStyle = '#ffe9a8';
        context.beginPath();
        context.arc(prop.x, prop.y - 20, 4, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = '#8b6f52';
        context.fillRect(prop.x - 8, prop.y - 3, 16, 6);
      }
    }
  }

  function drawTrafficLights(city, time) {
    for (const light of city.lights) {
      const cycle = (time * 0.16 + light.timer) % 2;
      light.phase = cycle < 1 ? 0 : 1;
      context.fillStyle = '#2f3640';
      context.fillRect(light.x - 3, light.y - 3, 6, 6);
      context.fillStyle = light.phase === 0 ? '#ff5f5f' : '#67d6a4';
      context.beginPath();
      context.arc(light.x, light.y, 4, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawMarkers(world) {
    const marker = world.missions.state.marker;
    if (marker) {
      context.save();
      context.globalAlpha = 0.35 + Math.sin(world.time * 4) * 0.1;
      context.fillStyle = '#ffd166';
      context.beginPath();
      context.arc(marker.x, marker.y, marker.radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
      context.strokeStyle = '#ffd166';
      context.lineWidth = 3;
      context.beginPath();
      context.arc(marker.x, marker.y, marker.radius, 0, Math.PI * 2);
      context.stroke();
    }
    for (const pack of world.jobs.state.packages) {
      if (pack.taken) continue;
      context.fillStyle = '#a4f7b9';
      context.save();
      context.translate(pack.x, pack.y);
      context.rotate(world.time);
      context.fillRect(-7, -7, 14, 14);
      context.restore();
    }
  }

  function drawWorld(world) {
    if (!cachedGroundCanvas) buildGround(world.city);
    context.drawImage(cachedGroundCanvas, 0, 0);
    const shimmer = Math.sin(world.time * 2) * 8;
    context.fillStyle = 'rgba(255,255,255,0.12)';
    for (let index = 0; index < 30; index += 1) {
      const y = BEACH.sand + 20 + ((index * 61 + world.time * 30) % (WORLD.height - BEACH.sand - 20));
      context.fillRect(0, y + shimmer, WORLD.width, 3);
    }
    for (const building of world.city.buildings) drawBuilding(building);
    drawProps(world.city);
    drawTrafficLights(world.city, world.time);
    drawMarkers(world);
    for (const vehicle of world.vehicles) if (!vehicle.exploded) drawVehicle(vehicle);
    for (const ped of world.peds) drawPed(ped);
    if (!world.player.vehicle) drawPlayer(world.player);
    world.effects.draw(context, world.camera);
  }

  function drawMapOverlay(world) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = 'rgba(8,12,20,0.88)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const size = Math.min(canvas.width, canvas.height) * 0.82;
    const x = (canvas.width - size) / 2;
    const y = (canvas.height - size) / 2;
    const mapCanvas = world.minimap.update(world, true);
    context.drawImage(mapCanvas, x, y, size, size);
    context.strokeStyle = '#ffd166';
    context.lineWidth = 4;
    context.strokeRect(x, y, size, size);
    context.fillStyle = '#fff5e2';
    context.font = '700 28px system-ui';
    context.textAlign = 'center';
    context.fillText('PALMCOAST', canvas.width / 2, y - 18);
    context.font = '500 18px system-ui';
    context.fillText('M or ESC closes the map', canvas.width / 2, y + size + 34);
  }

  function draw(state, screen, minimapCanvas) {
    if (screen === 'title') return;
    world_camera_apply(state);
    drawWorld(state);
    state.effects.drawOverlay(context);
    context.setTransform(1, 0, 0, 1, 0, 0);
    const grade = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    grade.addColorStop(0, 'rgba(255,190,110,0.08)');
    grade.addColorStop(1, 'rgba(70,40,90,0.12)');
    context.fillStyle = grade;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (state.mapOpen) drawMapOverlay(state);
  }

  function world_camera_apply(world) {
    world.camera.apply(context, world.effects.shake);
  }

  return { draw, buildGround, drawMapOverlay };
}
