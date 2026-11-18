import { distanceSquared } from './util.js';
import { damageVehicle, vehicleRadius } from './vehicles.js';
import { damagePlayer } from './player.js';

function lineHitsVehicle(x, y, angle, range, vehicle) {
  const radius = vehicleRadius(vehicle);
  const dx = vehicle.x - x;
  const dy = vehicle.y - y;
  const along = dx * Math.cos(angle) + dy * Math.sin(angle);
  if (along < -radius || along > range + radius) return false;
  const perpendicular = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
  return perpendicular < radius;
}

function lineHitsPed(x, y, angle, range, ped) {
  const dx = ped.x - x;
  const dy = ped.y - y;
  const along = dx * Math.cos(angle) + dy * Math.sin(angle);
  if (along < 0 || along > range) return false;
  const perpendicular = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
  return perpendicular < 11;
}

function hasLineOfSight(world, fromX, fromY, toX, toY) {
  const steps = Math.ceil(Math.hypot(toX - fromX, toY - fromY) / 32);
  for (let index = 1; index < steps; index += 1) {
    const x = fromX + (toX - fromX) * (index / steps);
    const y = fromY + (toY - fromY) * (index / steps);
    for (const building of world.city.buildings) {
      if (x > building.x && x < building.x + building.width && y > building.y && y < building.y + building.height) return false;
    }
  }
  return true;
}

export function createCombatSystem(world) {
  const bullets = [];

  function spawnBullet(x, y, angle, range, damage, team) {
    bullets.push({ x, y, angle, range, traveled: 0, damage, team, speed: 720 });
  }

  function hitVehicle(vehicle, bullet, world) {
    damageVehicle(vehicle, bullet.damage * 0.8, world, bullet.x, bullet.y);
    world.effects.spark(bullet.x, bullet.y, 2);
    if (vehicle.driver === 'player') damagePlayer(world.player, bullet.damage * 0.25, world);
    if (vehicle.driver === 'police') world.crime.policeHarmed(false);
  }

  function update(step) {
    for (let index = bullets.length - 1; index >= 0; index -= 1) {
      const bullet = bullets[index];
      const moveDistance = bullet.speed * step;
      const nextX = bullet.x + Math.cos(bullet.angle) * moveDistance;
      const nextY = bullet.y + Math.sin(bullet.angle) * moveDistance;
      bullet.traveled += moveDistance;
      let consumed = false;
      for (const vehicle of world.vehicles) {
        if (vehicle.exploded) continue;
        if (bullet.team === 'player' && vehicle.driver === 'player') continue;
        if (bullet.team === 'enemy' && vehicle.driver !== 'player' && vehicle.role !== 'police') continue;
        if (lineHitsVehicle(bullet.x, bullet.y, bullet.angle, moveDistance + 12, vehicle)) {
          hitVehicle(vehicle, bullet, world);
          consumed = true;
          break;
        }
      }
      if (!consumed) {
        for (const ped of world.peds) {
          if (ped.down) continue;
          if (bullet.team === 'player' && ped.role === 'ally') continue;
          if (bullet.team === 'enemy' && ped.role !== 'player' && ped.role !== 'police') continue;
          if (lineHitsPed(bullet.x, bullet.y, bullet.angle, moveDistance + 10, ped)) {
            if (ped.role === 'police') {
              world.peds.damagePed(ped, bullet.damage, world);
              world.crime.policeHarmed(true);
            } else if (ped.role === 'player') {
              damagePlayer(world.player, bullet.damage, world);
            } else {
              world.peds.damagePed(ped, bullet.damage, world);
            }
            consumed = true;
            break;
          }
        }
      }
      if (!consumed) {
        for (const building of world.city.buildings) {
          if (nextX > building.x && nextX < building.x + building.width && nextY > building.y && nextY < building.y + building.height) {
            world.effects.spark(nextX, nextY, 2);
            consumed = true;
            break;
          }
        }
      }
      if (!consumed) {
        world.effects.tracer(bullet.x, bullet.y, nextX, nextY, bullet.team === 'player' ? '#fff6c8' : '#ff9d8a');
        bullet.x = nextX;
        bullet.y = nextY;
        if (bullet.traveled >= bullet.range) consumed = true;
      }
      if (consumed) bullets.splice(index, 1);
    }
  }

  return { bullets, spawnBullet, update, hasLineOfSight };
}
