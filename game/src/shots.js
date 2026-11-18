import { createVehicle, updateVehicles } from './vehicles.js';
import { MISSIONS } from './config.js';

const SHOT_NAMES = ['1-street', '2-drive', '3-chase', '4-mission'];

function placePlayer(world, x, y, angle = 0) {
  world.player.x = x;
  world.player.y = y;
  world.player.angle = angle;
  world.camera.state.x = x;
  world.camera.state.y = y;
}

function warmSimulation(world, seconds) {
  const step = 1 / 60;
  for (let index = 0; index < seconds * 60; index += 1) world.step(step);
}

function addSkid(world, x, y, angle, count) {
  for (let index = 0; index < count; index += 1) {
    world.effects.skidMark(x + Math.cos(angle) * index * 22, y + Math.sin(angle) * index * 22, angle);
  }
}

export function stageShot(name, world, renderer, minimap, hud) {
  if (!SHOT_NAMES.includes(name)) return null;
  world.screen = 'play';
  world.seed();
  const mission = world.missions.state;
  mission.active = true;
  mission.objective = MISSIONS[Math.min(11, world.missions.state.index)].title.toUpperCase();
  mission.subtitle = 'Marisol: The coast remembers everyone who left.';
  mission.subtitleTimer = 8;
  world.police.state.stars = 3;
  world.police.state.witnessed = 60;

  if (name === '1-street') {
    placePlayer(world, 2295, 1350, -0.8);
    world.player.vehicle = null;
    for (let index = 0; index < 4; index += 1) {
      const vehicle = createVehicle(index % 2 ? 'vista' : 'pica', 2180 + index * 68, 1288 + (index % 2) * 42, index % 2 ? 0 : Math.PI, { role: 'traffic', speed: index === 1 ? 0 : 82 });
      vehicle.braking = index === 1;
      world.vehicles.push(vehicle);
    }
    for (let index = 0; index < 8; index += 1) world.peds.spawnOne();
  } else if (name === '2-drive') {
    const vehicle = createVehicle('vespid', 880, 3290, 0, { role: 'player', driver: 'player', speed: 225 });
    world.vehicles.push(vehicle);
    world.player.vehicle = vehicle;
    placePlayer(world, 880, 3290, 0);
    world.radioVisible = 4;
  } else if (name === '3-chase') {
    const vehicle = createVehicle('furia', 2320, 2320, Math.PI, { role: 'player', driver: 'player', speed: 235 });
    world.vehicles.push(vehicle);
    world.player.vehicle = vehicle;
    placePlayer(world, 2320, 2320, Math.PI);
    for (let index = 0; index < 3; index += 1) {
      const car = createVehicle('interceptor', 2465 + index * 62, 2275 + index * 28, Math.PI, { role: 'police', driver: 'police', target: world.player });
      car.siren = true;
      world.vehicles.push(car);
    }
    addSkid(world, 2380, 2295, Math.PI, 5);
  } else if (name === '4-mission') {
    placePlayer(world, 3685, 2365, Math.PI);
    mission.objective = 'DOCK WARS · CLEAR LOS CUERVOS';
    for (let index = 0; index < 4; index += 1) {
      world.peds.push({ x: 3790 + index * 28, y: 2280, angle: Math.PI, speed: 0, role: 'enemy', health: 38, down: false, downTime: 0, panic: 0, walkPhase: index, waypoint: null, skin: '#c78f68', shirt: '#743a3a', shootTimer: 1, missionMarker: true, target: world.player });
    }
    for (let index = 0; index < 2; index += 1) {
      world.peds.push({ x: 3660 + index * 28, y: 2360, angle: 0, speed: 0, role: 'ally', health: 70, down: false, downTime: 0, panic: 0, walkPhase: index, waypoint: null, skin: '#e3b28c', shirt: '#2f9e8f', shootTimer: 0, missionMarker: false, target: null });
    }
  }
  warmSimulation(world, 2.5);
  updateVehicles(world, 1 / 60);
  renderer.draw(world, 'play', minimap.update(world));
  hud.draw(world, minimap.canvas);
  return { ready: true };
}
