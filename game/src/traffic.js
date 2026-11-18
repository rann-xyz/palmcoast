import { TRAFFIC } from './config.js';
import { createVehicle, vehicleRadius } from './vehicles.js';
import { distanceSquared, pick, randomRange } from './util.js';

const CIVILIAN_TYPES = ['pica', 'vista', 'taxi', 'bravo', 'cargovan', 'furia', 'vespid', 'metrobus'];
const TYPE_WEIGHTS = [24, 22, 10, 12, 10, 8, 5, 4];

function weightedType(random) {
  let roll = random() * TYPE_WEIGHTS.reduce((sum, value) => sum + value, 0);
  for (let index = 0; index < CIVILIAN_TYPES.length; index += 1) {
    roll -= TYPE_WEIGHTS[index];
    if (roll <= 0) return CIVILIAN_TYPES[index];
  }
  return 'vista';
}

function laneSpawnPoint(city, random, centerX, centerY) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const horizontal = random() < 0.5;
    const roadIndex = randomInt(random, 0, horizontal ? city.roadsY.length - 1 : city.roadsX.length - 1);
    const coordinate = horizontal ? city.roadsY[roadIndex] : city.roadsX[roadIndex];
    const along = horizontal ? randomRange(random, 100, 4500) : randomRange(random, 100, 3200);
    const x = horizontal ? along : coordinate + (random() < 0.5 ? -20 : 20);
    const y = horizontal ? coordinate + (random() < 0.5 ? -20 : 20) : along;
    const squared = distanceSquared(x, y, centerX, centerY);
    if (squared > 320 * 320 && squared < TRAFFIC.spawnRadius * TRAFFIC.spawnRadius) return { x, y, horizontal };
  }
  return null;
}

function randomInt(random, min, max) {
  return Math.floor(min + random() * (max - min + 1));
}

export function createTrafficSystem(world) {
  const state = { spawnTimer: 0 };

  function spawnOne() {
    const point = laneSpawnPoint(world.city, world.random, world.player.x, world.player.y);
    if (!point) return null;
    const typeId = weightedType(world.random);
    const angle = point.horizontal ? (point.y < world.player.y ? 0 : Math.PI) : (point.x < world.player.x ? Math.PI / 2 : -Math.PI / 2);
    const vehicle = createVehicle(typeId, point.x, point.y, angle, { role: 'traffic', speed: 60 + world.random() * 70 });
    world.vehicles.push(vehicle);
    return vehicle;
  }

  function update(step) {
    state.spawnTimer -= step;
    const active = world.vehicles.filter(vehicle => vehicle.role === 'traffic' && !vehicle.exploded).length;
    if (active < TRAFFIC.count && state.spawnTimer <= 0) {
      if (spawnOne()) state.spawnTimer = 0.08;
    }
    for (let index = world.vehicles.length - 1; index >= 0; index -= 1) {
      const vehicle = world.vehicles[index];
      if (vehicle.role !== 'traffic') continue;
      const squared = distanceSquared(vehicle.x, vehicle.y, world.player.x, world.player.y);
      if (squared > TRAFFIC.despawnRadius * TRAFFIC.despawnRadius) world.vehicles.splice(index, 1);
    }
  }

  function seed() {
    for (let index = 0; index < TRAFFIC.count; index += 1) spawnOne();
  }

  return { update, seed, spawnOne };
}
