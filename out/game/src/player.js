import { PLAYER } from './config.js';
import { clamp, distance, distanceSquared } from './util.js';
import { createVehicle, damageVehicle, vehicleRadius } from './vehicles.js';
import { createWeaponState, currentWeapon, fireWeapon, selectWeapon, updateWeapons } from './weapons.js';

export function createPlayer(x, y) {
  return {
    x, y,
    angle: 0,
    speed: 0,
    health: PLAYER.maxHealth,
    armor: 0,
    cash: 350,
    vehicle: null,
    invuln: 0,
    weaponState: createWeaponState(),
    walkPhase: 0,
    enterCooldown: 0,
    alive: true,
  };
}

function nearestVehicle(world, player) {
  let closest = null;
  let best = PLAYER.enterRange * PLAYER.enterRange;
  for (const vehicle of world.vehicles) {
    if (vehicle.exploded) continue;
    const squared = distanceSquared(vehicle.x, vehicle.y, player.x, player.y);
    if (squared < best) {
      best = squared;
      closest = vehicle;
    }
  }
  return closest;
}

export function enterVehicle(player, world) {
  if (player.vehicle) return exitVehicle(player, world);
  const vehicle = nearestVehicle(world, player);
  if (!vehicle) return;
  if (vehicle.driver && vehicle.driver !== 'player') {
    if (vehicle.driver === 'police') return;
    world.peds.push({ x: vehicle.x + Math.cos(vehicle.angle + Math.PI / 2) * 24, y: vehicle.y + Math.sin(vehicle.angle + Math.PI / 2) * 24, angle: vehicle.angle, speed: 0, role: 'civilian', health: 20, down: false, downTime: 0, panic: 8, walkPhase: 0, waypoint: null, skin: '#e5b48d', shirt: '#7f8c8d', shootTimer: 0, missionMarker: false, target: null });
    world.crime.carTheft();
  }
  vehicle.driver = 'player';
  vehicle.role = 'player';
  vehicle.occupied = true;
  vehicle.waypoint = null;
  player.vehicle = vehicle;
  world.audio.blip();
  world.notify(`Stolen: ${vehicle.type.name}`);
}

export function exitVehicle(player, world, forced = false) {
  const vehicle = player.vehicle;
  if (!vehicle) return;
  vehicle.driver = null;
  vehicle.occupied = false;
  vehicle.role = 'parked';
  vehicle.speed *= 0.3;
  player.x = vehicle.x + Math.cos(vehicle.angle + Math.PI / 2) * (vehicleRadius(vehicle) + 12);
  player.y = vehicle.y + Math.sin(vehicle.angle + Math.PI / 2) * (vehicleRadius(vehicle) + 12);
  player.vehicle = null;
  if (forced) {
    player.invuln = PLAYER.invulnTime;
    player.health = Math.max(1, player.health - 12);
  }
}

export function damagePlayer(player, amount, world, armorFirst = true) {
  if (player.invuln > 0 || !player.alive) return;
  let remaining = amount;
  if (armorFirst && player.armor > 0) {
    const absorbed = Math.min(player.armor, remaining * 0.7);
    player.armor -= absorbed;
    remaining -= absorbed;
  }
  player.health -= remaining;
  player.invuln = 0.12;
  world.effects.blood(player.x, player.y, 2);
  if (player.health <= 0) {
    player.health = 0;
    player.alive = false;
    world.wasted();
  }
}

export function updatePlayer(player, world, step) {
  player.invuln = Math.max(0, player.invuln - step);
  player.enterCooldown = Math.max(0, player.enterCooldown - step);
  updateWeapons(player.weaponState, step, player, world);
  if (!player.alive) return;
  const input = world.input;
  if (player.vehicle) {
    const vehicle = player.vehicle;
    player.x = vehicle.x;
    player.y = vehicle.y;
    player.angle = vehicle.angle;
    if (vehicle.health < 45) world.effects.smoke(vehicle.x, vehicle.y, 1);
    if (vehicle.health < 18) world.effects.spark(vehicle.x, vehicle.y, 1);
    return;
  }
  const axis = input.axis();
  const running = input.running();
  const speed = running ? PLAYER.runSpeed : PLAYER.walkSpeed;
  const length = Math.hypot(axis.x, axis.y) || 1;
  const targetX = player.x + (axis.x / length) * speed * step;
  const targetY = player.y + (axis.y / length) * speed * step;
  let blocked = false;
  for (const building of world.city.buildings) {
    if (targetX > building.x - 7 && targetX < building.x + building.width + 7 && targetY > building.y - 7 && targetY < building.y + building.height + 7) {
      blocked = true;
      break;
    }
  }
  if (!blocked) {
    player.x = clamp(targetX, 20, 4680);
    player.y = clamp(targetY, 20, 4020);
  }
  const moving = axis.x !== 0 || axis.y !== 0;
  if (moving) player.walkPhase += (running ? 16 : 10) * step;
  const aim = world.camera.screenToWorld(input.mouse.x, input.mouse.y);
  player.angle = Math.atan2(aim.y - player.y, aim.x - player.x);
  const weapon = currentWeapon(player.weaponState);
  const firing = weapon.auto ? input.mouse.down : input.consumeMousePress();
  if (firing) fireWeapon(player.weaponState, world, player.x + Math.cos(player.angle) * 14, player.y + Math.sin(player.angle) * 14, player.angle, true);
  if (input.isDown('Digit1')) selectWeapon(player.weaponState, 0);
  if (input.isDown('Digit2')) selectWeapon(player.weaponState, 1);
  if (input.isDown('Digit3')) selectWeapon(player.weaponState, 2);
  if (input.isDown('Digit4')) selectWeapon(player.weaponState, 3);
  if (input.isDown('Digit5')) selectWeapon(player.weaponState, 4);
}

export function playerInteract(player, world) {
  if (player.vehicle) {
    exitVehicle(player, world);
    return;
  }
  enterVehicle(player, world);
}
