import { VEHICLE_TYPES } from './config.js';
import { angleDifference, clamp, distance, distanceSquared, moveTowards, moveTowardsAngle, randomRange } from './util.js';
import { exitVehicle } from './player.js';

const TYPE_BY_ID = new Map(VEHICLE_TYPES.map(type => [type.id, type]));

export function createVehicle(typeId, x, y, angle, options = {}) {
  const type = TYPE_BY_ID.get(typeId) ?? VEHICLE_TYPES[1];
  return {
    id: options.id ?? `vehicle-${Math.random().toString(36).slice(2, 9)}`,
    type,
    x, y, angle,
    speed: options.speed ?? 0,
    lateral: 0,
    health: options.health ?? 100,
    driver: options.driver ?? null,
    role: options.role ?? 'traffic',
    targetNode: options.targetNode ?? null,
    route: options.route ?? [],
    waypoint: options.waypoint ?? null,
    stopped: false,
    waiting: false,
    siren: false,
    sirenPhase: 0,
    damageSmoke: 0,
    fire: 0,
    exploded: false,
    occupied: false,
    missionMarker: options.missionMarker ?? false,
    hornTimer: 0,
    collisionCooldown: 0,
    passenger: options.passenger ?? null,
  };
}

export function vehicleRadius(vehicle) {
  return Math.max(vehicle.type.length, vehicle.type.width) * 0.42;
}

export function vehicleForward(vehicle) {
  return { x: Math.cos(vehicle.angle), y: Math.sin(vehicle.angle) };
}

function steeringScale(speed) {
  return 0.055 * clamp(1.25 - Math.abs(speed) / 340, 0.35, 1.2);
}

function applyVehicleForces(vehicle, throttle, steering, handbrake, step) {
  const grip = vehicle.type.grip * (handbrake ? 0.35 : 1);
  const maxSpeed = vehicle.type.speed * (vehicle.health < 35 ? 0.65 : 1);
  const acceleration = throttle * 260 * (vehicle.type.mass < 1 ? 1.12 : 1) / vehicle.type.mass;
  vehicle.speed += acceleration * step;
  if (!throttle) vehicle.speed = moveTowards(vehicle.speed, 0, 55 * step);
  vehicle.speed = clamp(vehicle.speed, -maxSpeed * 0.45, maxSpeed);
  vehicle.angle = moveTowardsAngle(vehicle.angle, vehicle.angle + steering, steeringScale(vehicle.speed) * step * 60);
  vehicle.lateral *= Math.pow(0.015, step * grip * 2.2);
  if (handbrake) vehicle.lateral += steering * vehicle.speed * 0.24 * step * 60;
  const forward = vehicleForward(vehicle);
  const right = { x: -forward.y, y: forward.x };
  vehicle.x += (forward.x * vehicle.speed + right.x * vehicle.lateral) * step;
  vehicle.y += (forward.y * vehicle.speed + right.y * vehicle.lateral) * step;
}

function avoidObstacle(vehicle, world) {
  const forward = vehicleForward(vehicle);
  const probeX = vehicle.x + forward.x * 72;
  const probeY = vehicle.y + forward.y * 72;
  let blocked = false;
  for (const other of world.vehicles) {
    if (other === vehicle || other.exploded) continue;
    if (distanceSquared(other.x, other.y, probeX, probeY) < 48 * 48) {
      blocked = true;
      break;
    }
  }
  for (const ped of world.peds) {
    if (!ped.down && distanceSquared(ped.x, ped.y, probeX, probeY) < 32 * 32) {
      blocked = true;
      break;
    }
  }
  return blocked;
}

function followRoute(vehicle, world, step) {
  if (!vehicle.waypoint) {
    const node = world.city.nearestNode(vehicle.x, vehicle.y);
    const edge = world.city.edges[Math.floor(world.random() * world.city.edges.length)];
    const target = world.city.nodes.find(nodeCandidate => nodeCandidate.id === edge.to);
    vehicle.waypoint = target;
  }
  const target = vehicle.waypoint;
  const targetAngle = Math.atan2(target.y - vehicle.y, target.x - vehicle.x);
  const difference = angleDifference(vehicle.angle, targetAngle);
  const throttle = Math.abs(difference) < 0.9 ? 1 : 0.35;
  applyVehicleForces(vehicle, throttle, clamp(difference * 2.2, -1, 1), false, step);
  const light = world.city.lightAt(target.x, target.y);
  const nearIntersection = distance(vehicle.x, vehicle.y, target.x, target.y) < 62;
  if (nearIntersection && light && light.phase === 0) {
    vehicle.speed = moveTowards(vehicle.speed, 0, 180 * step);
    vehicle.waiting = true;
  } else if (avoidObstacle(vehicle, world)) {
    vehicle.speed = moveTowards(vehicle.speed, 0, 145 * step);
    vehicle.waiting = true;
  } else {
    vehicle.waiting = false;
  }
  if (distance(vehicle.x, vehicle.y, target.x, target.y) < 34) {
    const edges = world.city.edges.filter(edge => edge.from === target.id || edge.to === target.id);
    const edge = edges[Math.floor(world.random() * edges.length)];
    const nextId = edge.from === target.id ? edge.to : edge.from;
    vehicle.waypoint = world.city.nodes.find(node => node.id === nextId);
  }
}

function pursueTarget(vehicle, targetX, targetY, step, ramming = false) {
  const targetAngle = Math.atan2(targetY - vehicle.y, targetX - vehicle.x);
  const difference = angleDifference(vehicle.angle, targetAngle);
  applyVehicleForces(vehicle, ramming ? 1 : Math.abs(difference) < 1 ? 1 : 0.4, clamp(difference * 2.5, -1, 1), false, step);
}

export function updateVehicle(vehicle, world, step) {
  vehicle.collisionCooldown = Math.max(0, vehicle.collisionCooldown - step);
  if (vehicle.exploded) return;
  if (vehicle.health <= 0) {
    vehicle.fire += step;
    if (vehicle.fire > 2.2) explodeVehicle(vehicle, world);
    return;
  }
  if (vehicle.driver === 'player') {
    const throttle = (world.input.isDown('KeyW') || world.input.isDown('ArrowUp') ? 1 : 0) - (world.input.isDown('KeyS') || world.input.isDown('ArrowDown') ? 1 : 0);
    const steering = (world.input.isDown('KeyD') || world.input.isDown('ArrowRight') ? 1 : 0) - (world.input.isDown('KeyA') || world.input.isDown('ArrowLeft') ? 1 : 0);
    vehicle.braking = throttle < 0 && vehicle.speed > 0;
    applyVehicleForces(vehicle, throttle, steering, world.input.isDown('Space'), step);
    return;
  }
  if (vehicle.role === 'police' && vehicle.target) {
    pursueTarget(vehicle, vehicle.target.x, vehicle.target.y, step, distance(vehicle.x, vehicle.y, vehicle.target.x, vehicle.target.y) < 150);
    return;
  }
  if (vehicle.role === 'mission') {
    if (vehicle.waypoint) pursueTarget(vehicle, vehicle.waypoint.x, vehicle.waypoint.y, step);
    return;
  }
  followRoute(vehicle, world, step);
}

function separateVehicles(world) {
  for (let index = 0; index < world.vehicles.length; index += 1) {
    const first = world.vehicles[index];
    if (first.exploded) continue;
    for (let otherIndex = index + 1; otherIndex < world.vehicles.length; otherIndex += 1) {
      const second = world.vehicles[otherIndex];
      if (second.exploded) continue;
      const minimum = vehicleRadius(first) + vehicleRadius(second);
      const squared = distanceSquared(first.x, first.y, second.x, second.y);
      if (squared >= minimum * minimum || squared === 0) continue;
      const currentDistance = Math.sqrt(squared) || 0.01;
      const overlap = minimum - currentDistance;
      const nx = (second.x - first.x) / currentDistance;
      const ny = (second.y - first.y) / currentDistance;
      const firstMass = first.type.mass;
      const secondMass = second.type.mass;
      const totalMass = firstMass + secondMass;
      first.x -= nx * overlap * (secondMass / totalMass);
      first.y -= ny * overlap * (secondMass / totalMass);
      second.x += nx * overlap * (firstMass / totalMass);
      second.y += ny * overlap * (firstMass / totalMass);
      const impact = Math.abs(first.speed - second.speed) + Math.abs(first.lateral) + Math.abs(second.lateral);
      if (impact > 45 && first.collisionCooldown <= 0) {
        first.collisionCooldown = 0.2;
        second.collisionCooldown = 0.2;
        const damage = clamp(impact * 0.08, 2, 35);
        first.health -= damage;
        second.health -= damage;
        world.effects.spark(first.x, first.y, 6);
        world.effects.addShake(Math.min(7, impact * 0.035));
        world.audio.noise(0.12, 0.12, 900);
        first.speed *= -0.18;
        second.speed *= -0.18;
        if (first.driver === 'player' || second.driver === 'player') world.crime.vehicleCollision();
      }
    }
  }
}

export function explodeVehicle(vehicle, world) {
  if (vehicle.exploded) return;
  vehicle.exploded = true;
  vehicle.health = 0;
  world.effects.explosion(vehicle.x, vehicle.y);
  world.audio.explosion();
  world.effects.addShake(13);
  world.crime.explosionAt(vehicle.x, vehicle.y);
  if (vehicle.driver === 'player') exitVehicle(world.player, world, true);
  if (vehicle.driver === 'police') world.police.removeCar(vehicle);
}

export function updateVehicles(world, step) {
  for (const vehicle of world.vehicles) updateVehicle(vehicle, world, step);
  separateVehicles(world);
  for (let index = world.vehicles.length - 1; index >= 0; index -= 1) {
    const vehicle = world.vehicles[index];
    if (vehicle.exploded && vehicle.fire > 4) world.vehicles.splice(index, 1);
  }
}

export function damageVehicle(vehicle, amount, world, x, y) {
  if (vehicle.exploded) return;
  vehicle.health -= amount;
  if (x !== undefined) world.effects.spark(x, y, 3);
  if (vehicle.health < 45) vehicle.damageSmoke = Math.max(vehicle.damageSmoke, 1);
  if (vehicle.health <= 0) {
    vehicle.fire = Math.max(vehicle.fire, 0.01);
    world.effects.smoke(vehicle.x, vehicle.y, 4);
  }
}
