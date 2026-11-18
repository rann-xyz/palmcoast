import { BEACH, ROAD, WORLD } from './config.js';
import { clamp } from './util.js';

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  let cachedGround = null;
  let cachedGroundCanvas = null;
  let gradeGradient = null;
  let vignetteGradient = null;
  let worldTime = 0;
  let policeGlowWarm = null;
  let policeGlowCool = null;

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
    ground.fillStyle = '#d9b98a';
    ground.fillRect(0, 0, WORLD.width, WORLD.height);
    ground.fillStyle = '#c9c3b8';
    ground.fillRect(0, 0, WORLD.width, BEACH.top);
    for (let y = 0; y < BEACH.top; y += 4) {
      ground.fillStyle = `rgba(255,220,170,${0.03 + (y / BEACH.top) * 0.05})`;
      ground.fillRect(0, y, WORLD.width, 4);
    }
    for (const roadX of city.roadsX) {
      ground.fillStyle = '#4b515c';
      ground.fillRect(roadX - ROAD.width / 2, 0, ROAD.width, BEACH.top);
      ground.fillStyle = 'rgba(255,244,220,0.58)';
      ground.fillRect(roadX - 2, 0, 3, BEACH.top);
    }
    for (const roadY of city.roadsY) {
      ground.fillStyle = '#4b515c';
      ground.fillRect(0, roadY - ROAD.width / 2, WORLD.width, ROAD.width);
      ground.fillStyle = 'rgba(255,244,220,0.58)';
      ground.fillRect(0, roadY - 2, WORLD.width, 3);
    }
    for (const rect of city.sidewalkRects) {
    ground.strokeStyle = 'rgba(235,228,212,0.55)';
      ground.lineWidth = 8;
      ground.strokeRect(rect.x, rect.y, rect.width, rect.height);
    }
    for (let row = 0; row < city.roadsY.length; row += 1) {
      for (let column = 0; column < city.roadsX.length; column += 1) {
        const x = city.roadsX[column];
        const y = city.roadsY[row];
        ground.fillStyle = '#cfc9bd';
        for (let stripe = -ROAD.width / 2; stripe < ROAD.width / 2; stripe += 8) {
          ground.fillRect(x - ROAD.width / 2 - 24, y + stripe, 18, 6);
          ground.fillRect(x + ROAD.width / 2 + 6, y + stripe, 18, 6);
          ground.fillRect(x + stripe, y - ROAD.width / 2 - 24, 6, 18);
          ground.fillRect(x + stripe, y + ROAD.width / 2 + 6, 6, 18);
        }
      }
    }
    for (let index = 0; index < 46; index += 1) {
      const horizontal = index % 2 === 1;
      const road = horizontal ? city.roadsY[index % city.roadsY.length] : city.roadsX[index % city.roadsX.length];
      const along = 180 + ((index * 731) % (horizontal ? WORLD.width - 360 : BEACH.top - 360));
      const size = 12 + (index % 5) * 7;
      ground.fillStyle = `rgba(28,28,34,${0.09 + (index % 3) * 0.05})`;
      if (horizontal) ground.fillRect(along, road - ROAD.width / 2 + 6 + (index % 7) * 5, size * 0.55, size);
      else ground.fillRect(road - ROAD.width / 2 + 6 + (index % 7) * 5, along, size, size * 0.55);
    }
    ground.fillStyle = '#f3d7a2';
    ground.fillRect(0, BEACH.top, WORLD.width, BEACH.sand - BEACH.top);
    ground.fillStyle = '#225d80';
    ground.fillRect(0, BEACH.sand, WORLD.width, WORLD.height - BEACH.sand);
    ground.fillStyle = 'rgba(38,102,138,0.55)';
    for (let index = 0; index < 26; index += 1) {
      ground.fillRect(0, BEACH.sand + 30 + index * ((WORLD.height - BEACH.sand - 30) / 26), WORLD.width, 14 + (index % 3) * 8);
    }
    for (let index = 0; index < 80; index += 1) {
      ground.fillStyle = 'rgba(255,244,220,0.08)';
      ground.fillRect(0, BEACH.sand + (index * 13) % (WORLD.height - BEACH.sand), WORLD.width, 4);
    }
    ground.fillStyle = 'rgba(214,236,244,0.5)';
    for (let index = 0; index < 56; index += 1) {
      ground.fillRect((index * 137) % (WORLD.width - 40), BEACH.sand + 8 + ((index * 97) % (WORLD.height - BEACH.sand - 20)), 24 + (index % 4) * 10, 2);
    }
    ground.fillStyle = 'rgba(246,250,252,0.6)';
    ground.fillRect(0, BEACH.sand - 2, WORLD.width, 3);
    ground.fillStyle = '#7d5a3c';
    ground.fillRect(1930, 3400, 100, 560);
    ground.fillStyle = '#b08a5e';
    ground.fillRect(1880, 3860, 200, 120);
    return cachedGroundCanvas;
  }

  function drawBuildingShadow(building, sunX, sunY) {
    const shadowLength = 2.9 + building.heightLevel * 0.5;
    context.fillStyle = 'rgba(46,36,66,0.34)';
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
    const detailSeed = (building.x * 31 + building.y * 17) % 97;
    if (detailSeed % 3 === 0) {
      context.fillStyle = 'rgba(0,0,0,0.18)';
      context.fillRect(building.x + building.width * 0.6 + 2, building.y + building.height * 0.22 + 2, 13, 13);
      context.fillStyle = '#6b4f3a';
      context.fillRect(building.x + building.width * 0.6, building.y + building.height * 0.22, 13, 13);
      context.fillStyle = '#54402f';
      context.fillRect(building.x + building.width * 0.6 + 4, building.y + building.height * 0.22 - 4, 5, 4);
    } else if (detailSeed % 3 === 1) {
      context.fillStyle = 'rgba(0,0,0,0.16)';
      context.fillRect(building.x + 11 + (detailSeed % 9), building.y + 11, 9, 7);
      context.fillStyle = '#7e8a92';
      context.fillRect(building.x + 10 + (detailSeed % 9), building.y + 10, 9, 7);
      context.fillStyle = '#9aa5ad';
      context.fillRect(building.x + 10 + (detailSeed % 9), building.y + 10, 9, 2);
    }
    context.strokeStyle = 'rgba(255,244,220,0.22)';
    context.lineWidth = 1;
    context.strokeRect(building.x + 3.5, building.y + 3.5, building.width - 7, building.height - 7);
    if (building.landmark) {
      context.fillStyle = '#ffd166';
      context.fillRect(building.x + 4, building.y - 12, building.width - 8, 7);
      context.fillStyle = '#2d2a26';
      context.font = '600 13px system-ui';
      context.textAlign = 'center';
      context.fillText(building.landmark, building.x + building.width / 2, building.y - 18);
    }
  }

  function world_time() {
    return worldTime;
  }

  function drawVehicle(vehicle) {
    const length = vehicle.type.length;
    const width = vehicle.type.width;
    const low = vehicle.type.id === 'vespid';
    const cabinFront = low ? length * 0.06 : length * 0.1;
    const cabinRear = low ? -length * 0.28 : -length * 0.16;
    const cabinWidth = width - (low ? 9 : 6);
    context.save();
    context.translate(vehicle.x, vehicle.y);
    context.rotate(vehicle.angle);
    context.fillStyle = 'rgba(34,24,44,0.44)';
    context.beginPath();
    context.ellipse(4, 5, length * 0.55, width * 0.68, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#1b1d22';
    for (const axle of [length * (low ? 0.3 : 0.27), -length * (low ? 0.31 : 0.3)]) {
      context.fillRect(axle - 4, -width / 2 - 1, 8, 5);
      context.fillRect(axle - 4, width / 2 - 4, 8, 5);
    }
    context.fillStyle = vehicle.exploded ? '#2c2727' : shade(vehicle.type.color, -34);
    context.fillRect(-length / 2, -width / 2 + 4, length, width - 4);
    context.fillStyle = vehicle.exploded ? '#3b3434' : vehicle.type.color;
    context.fillRect(-length / 2, -width / 2, length, width - 4);
    context.fillStyle = 'rgba(255,240,210,0.24)';
    context.fillRect(-length / 2 + 4, -width / 2 + 2, length - 8, 4);
    context.fillStyle = vehicle.exploded ? '#232323' : vehicle.type.roof;
    context.fillRect(cabinRear, -cabinWidth / 2, cabinFront - cabinRear, cabinWidth);
    context.fillStyle = 'rgba(193,226,255,0.78)';
    context.fillRect(cabinFront - length * 0.11, -cabinWidth / 2 + 2, length * 0.07, cabinWidth - 4);
    context.fillRect(cabinRear + 3, -cabinWidth / 2 + 2, length * 0.05, cabinWidth - 4);
    if (vehicle.type.id === 'vespid') {
      context.fillStyle = 'rgba(18,22,26,0.8)';
      context.fillRect(length * 0.16, -width / 2 + 5, 10, 4);
      context.fillRect(length * 0.16, width / 2 - 9, 10, 4);
      context.fillStyle = 'rgba(255,248,230,0.68)';
      context.fillRect(-length * 0.1, -2, length * 0.45, 4);
    }
    if (vehicle.type.id === 'metrobus') {
      context.fillStyle = 'rgba(255,255,255,0.16)';
      for (let window = 0; window < 5; window += 1) context.fillRect(-length / 2 + 8 + window * 17, -width / 2 + 4, 10, width - 8);
    }
    const braking = vehicle.braking;
    context.fillStyle = braking ? '#ff6b52' : '#ff8f70';
    context.fillRect(length / 2 - 5, -width / 2 + 3, 4, 5);
    context.fillRect(length / 2 - 5, width / 2 - 8, 4, 5);
    context.fillStyle = braking ? 'rgba(255,80,60,0.55)' : 'rgba(255,150,100,0.22)';
    context.beginPath(); context.arc(length / 2 + 4, 0, braking ? 12 : 7, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#ff5f5f';
    context.fillRect(-length / 2 + 1, -width / 2 + 3, 3, 5);
    context.fillRect(-length / 2 + 1, width / 2 - 8, 3, 5);
    if (vehicle.role === 'police') {
      const flash = Math.sin(world_time() * 0.02) > 0;
      if (!policeGlowWarm) {
        policeGlowWarm = context.createRadialGradient(0, 0, 4, 0, 0, 44);
        policeGlowWarm.addColorStop(0, 'rgba(255,84,84,0.42)');
        policeGlowWarm.addColorStop(1, 'rgba(255,84,84,0)');
        policeGlowCool = context.createRadialGradient(0, 0, 4, 0, 0, 44);
        policeGlowCool.addColorStop(0, 'rgba(96,148,255,0.42)');
        policeGlowCool.addColorStop(1, 'rgba(96,148,255,0)');
      }
      context.fillStyle = flash ? policeGlowWarm : policeGlowCool;
      context.beginPath();
      context.arc(0, 0, 44, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = flash ? '#ff4d4d' : '#4d8dff';
      context.fillRect(-6, -width / 2 - 3, 12, 4);
      context.fillStyle = flash ? 'rgba(255,130,130,0.85)' : 'rgba(140,175,255,0.85)';
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
    context.fillStyle = 'rgba(40,30,60,0.34)';
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
    for (const boat of city.boats) {
      context.save();
      context.translate(boat.x, boat.y);
      context.rotate(boat.angle);
      context.fillStyle = 'rgba(18,45,65,0.28)';
      context.fillRect(-boat.length / 2 + 5, -7, boat.length, 14);
      context.fillStyle = boat.hull;
      context.fillRect(-boat.length / 2, -7, boat.length, 14);
      context.fillStyle = 'rgba(255,240,215,0.45)';
      context.fillRect(-boat.length / 2 + 4, -5, boat.length - 8, 3);
      if (boat.mast) {
        context.strokeStyle = '#d8d2c5';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(0, -8);
        context.lineTo(0, -25);
        context.stroke();
      }
      context.restore();
    }
    for (const prop of city.props) {
      context.fillStyle = 'rgba(40,30,60,0.18)';
      context.beginPath();
      context.ellipse(prop.x + 8, prop.y + 6, prop.size * 0.8, prop.size * 0.35, 0, 0, Math.PI * 2);
      context.fill();
      if (prop.kind === 'palm') {
        context.strokeStyle = '#7d5a3c';
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(prop.x, prop.y);
        context.quadraticCurveTo(prop.x + 5, prop.y - prop.size * 0.6, prop.x + 2, prop.y - prop.size);
        context.stroke();
        for (let leaf = 0; leaf < 6; leaf += 1) {
          const angle = (leaf / 6) * Math.PI * 2 + prop.x * 0.01;
          context.strokeStyle = leaf % 2 ? '#4a8d60' : '#5da86d';
          context.lineWidth = 4;
          context.beginPath();
          context.moveTo(prop.x + 2, prop.y - prop.size);
          context.quadraticCurveTo(prop.x + 2 + Math.cos(angle) * prop.size * 0.7, prop.y - prop.size + Math.sin(angle) * prop.size * 0.4, prop.x + 2 + Math.cos(angle) * prop.size, prop.y - prop.size + Math.sin(angle) * prop.size * 0.55);
          context.stroke();
        }
      } else if (prop.kind === 'lamp') {
        context.strokeStyle = '#8a949e';
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(prop.x, prop.y);
        context.lineTo(prop.x, prop.y - 18);
        context.stroke();
        context.fillStyle = '#ffedbb';
        context.beginPath();
        context.arc(prop.x, prop.y - 20, 4, 0, Math.PI * 2);
        context.fill();
      } else if (prop.kind === 'hydrant') {
        context.fillStyle = 'rgba(40,30,60,0.2)';
        context.fillRect(prop.x - 4, prop.y + 2, 9, 3);
        context.fillStyle = '#b8432f';
        context.fillRect(prop.x - 3, prop.y - 5, 7, 9);
        context.fillStyle = '#d95a41';
        context.fillRect(prop.x - 4, prop.y - 6, 9, 3);
      } else if (prop.kind === 'bin') {
        context.fillStyle = 'rgba(40,30,60,0.2)';
        context.fillRect(prop.x - 5, prop.y + 3, 11, 3);
        context.fillStyle = '#39434b';
        context.fillRect(prop.x - 5, prop.y - 4, 11, 8);
        context.fillStyle = '#55636d';
        context.fillRect(prop.x - 5, prop.y - 4, 11, 2);
      } else {
        context.fillStyle = 'rgba(40,30,60,0.2)';
        context.fillRect(prop.x - 7, prop.y + 2, 17, 3);
        const benchVariant = (Math.floor(prop.x / 96) + Math.floor(prop.y / 64)) % 2;
        context.fillStyle = benchVariant ? '#876b50' : '#7a6248';
        context.fillRect(prop.x - 8, prop.y - 3, 16, 6);
        context.fillStyle = benchVariant ? '#6e563f' : '#5f4936';
        context.fillRect(prop.x - 8, prop.y - 3, 16, 2);
        context.fillStyle = 'rgba(52,60,68,0.75)';
        context.fillRect(prop.x - 7, prop.y + 1, 3, 2);
        context.fillRect(prop.x + 4, prop.y + 1, 3, 2);
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
    const shimmer = Math.sin(world.time * 2.1) * 9;
    context.fillStyle = 'rgba(255,225,175,0.13)';
    for (let index = 0; index < 30; index += 1) {
      const y = BEACH.sand + 20 + ((index * 61 + world.time * 30) % (WORLD.height - BEACH.sand - 20));
      context.fillRect(((index * 193 + world.time * 45) % WORLD.width) - 120, y + shimmer, 240, 3);
    }
    for (const building of world.city.buildings) drawBuilding(building);
    drawProps(world.city);
    drawTrafficLights(world.city, world.time);
    drawMarkers(world);
    worldTime = world.time;
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
    if (!gradeGradient) {
      gradeGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradeGradient.addColorStop(0, 'rgba(255,205,130,0.15)');
      gradeGradient.addColorStop(0.65, 'rgba(255,145,90,0.07)');
      gradeGradient.addColorStop(1, 'rgba(58,50,100,0.16)');
    }
    if (!vignetteGradient) {
      vignetteGradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, canvas.height * 0.38, canvas.width / 2, canvas.height / 2, canvas.height * 0.85);
      vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
      vignetteGradient.addColorStop(1, 'rgba(18,12,24,0.34)');
    }
    context.fillStyle = gradeGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = vignetteGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (state.mapOpen) drawMapOverlay(state);
  }

  function world_camera_apply(world) {
    world.camera.apply(context, world.effects.shake);
  }

  return { draw, buildGround, drawMapOverlay };
}
