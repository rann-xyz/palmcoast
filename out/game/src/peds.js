import { PEDS } from './config.js';
import { angleTowards, clamp, distance, distanceSquared, moveTowards, moveTowardsAngle, randomRange } from './util.js';

const SKIN = ['#f2c9a4', '#d9a67b', '#b47b58', '#8b5a3d', '#f6ddc0'];
const SHIRTS = ['#ef476f', '#ffd166', '#06d6a0', '#118ab2', '#f8f9fa', '#8d6e63', '#6c5ce7', '#e17055'];

function createPed(x, y, role = 'civilian') {
  return {
    x, y,
    angle: Math.random() * Math.PI * 2,
    speed: 0,
    role,
    health: role === 'police' ? 48 : role === 'ally' ? 70 : 34,
    down: false,
    downTime: 0,
    panic: 0,
    walkPhase: Math.random() * Math.PI * 2,
    waypoint: null,
    skin: SKIN[Math.floor(Math.random() * SKIN.length)],
    shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
    shootTimer: 0,
    missionMarker: false,
    target: null,
  };
}

function sidewalkPoint(city, random, centerX, centerY) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const x = centerX + randomRange(random, -PEDS.spawnRadius, PEDS.spawnRadius);
    const y = centerY + randomRange(random, -PEDS.spawnRadius, PEDS.spawnRadius);
    if (city.isSidewalk(x, y)) return { x, y };
  }
  return null;
}

function chooseWaypoint(city, ped, random) {
  const node = city.nearestNode(ped.x, ped.y);
  const options = city.nodes.filter(candidate => distance(candidate.x, candidate.y, node.x, node.y) < 390 && distance(candidate.x, candidate.y, node.x, node.y) > 90);
  const chosen = options[Math.floor(random() * options.length)] ?? node;
  return { x: chosen.x + randomRange(random, -55, 55), y: chosen.y + randomRange(random, -55, 55) };
}

function movePed(ped, targetX, targetY, speed, step, world) {
  const angle = angleTowards(ped, { x: targetX, y: targetY });
  ped.angle = moveTowardsAngle(ped.angle, angle, 5 * step);
  ped.speed = moveTowards(ped.speed, speed, 320 * step);
  const nextX = ped.x + Math.cos(ped.angle) * ped.speed * step;
  const nextY = ped.y + Math.sin(ped.angle) * ped.speed * step;
  let blocked = false;
  for (const building of world.city.buildings) {
    if (nextX > building.x - 6 && nextX < building.x + building.width + 6 && nextY > building.y - 6 && nextY < building.y + building.height + 6) {
      blocked = true;
      break;
    }
  }
  if (blocked) {
    ped.waypoint = chooseWaypoint(world.city, ped, world.random);
    ped.speed *= 0.2;
  } else {
    ped.x = nextX;
    ped.y = nextY;
  }
}

export function createPedSystem(world) {
  const state = { spawnTimer: 0 };

  function spawnOne() {
    const point = sidewalkPoint(world.city, world.random, world.player.x, world.player.y);
    if (!point) return null;
    const ped = createPed(point.x, point.y);
    ped.waypoint = chooseWaypoint(world.city, ped, world.random);
    world.peds.push(ped);
    return ped;
  }

  function spawnOfficer(x, y) {
    const officer = createPed(x, y, 'police');
    officer.shirt = '#274b73';
    world.peds.push(officer);
    return officer;
  }

  function update(step) {
    state.spawnTimer -= step;
    const civilianCount = world.peds.filter(ped => ped.role === 'civilian' && !ped.down).length;
    if (civilianCount < PEDS.count && state.spawnTimer <= 0) {
      if (spawnOne()) state.spawnTimer = 0.06;
    }
    for (let index = world.peds.length - 1; index >= 0; index -= 1) {
      const ped = world.peds[index];
      if (ped.role === 'police' || ped.role === 'ally') continue;
      const squared = distanceSquared(ped.x, ped.y, world.player.x, world.player.y);
      if (squared > PEDS.despawnRadius * PEDS.despawnRadius) {
        world.peds.splice(index, 1);
        continue;
      }
      if (ped.down) {
        ped.downTime += step;
        if (ped.downTime > 14) world.peds.splice(index, 1);
        continue;
      }
      const threatDistance = distance(ped.x, ped.y, world.player.x, world.player.y);
      if (ped.panic > 0) {
        ped.panic -= step;
        const fleeAngle = angleTowards(world.player, ped);
        movePed(ped, ped.x + Math.cos(fleeAngle) * 100, ped.y + Math.sin(fleeAngle) * 100, 145, step, world);
      } else {
        if (!ped.waypoint || distance(ped.x, ped.y, ped.waypoint.x, ped.waypoint.y) < 16) ped.waypoint = chooseWaypoint(world.city, ped, world.random);
        movePed(ped, ped.waypoint.x, ped.waypoint.y, 38 + Math.sin(ped.walkPhase) * 5, step, world);
      }
      ped.walkPhase += ped.speed * step * 0.16;
    }
  }

  function panicNear(x, y, radius, strength = 5) {
    for (const ped of world.peds) {
      if (ped.role !== 'civilian' || ped.down) continue;
      if (distanceSquared(ped.x, ped.y, x, y) < radius * radius) ped.panic = Math.max(ped.panic, strength);
    }
  }

  function damagePed(ped, amount, world) {
    if (ped.down) return false;
    ped.health -= amount;
    world.effects.blood(ped.x, ped.y, 3);
    if (ped.health <= 0) {
      ped.down = true;
      ped.downTime = 0;
      panicNear(ped.x, ped.y, 230, 7);
      world.crime.pedHarmed(ped.role === 'police');
      return true;
    }
    ped.panic = 7;
    return false;
  }

  function seed() {
    for (let index = 0; index < PEDS.count; index += 1) spawnOne();
  }

  const system = [];
  system.update = update;
  system.spawnOne = spawnOne;
  system.spawnOfficer = spawnOfficer;
  system.panicNear = panicNear;
  system.damagePed = damagePed;
  system.seed = seed;
  return system;
}
