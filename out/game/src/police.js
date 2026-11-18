import { POLICE } from './config.js';
import { createVehicle } from './vehicles.js';
import { distance, distanceSquared } from './util.js';

export function createPoliceSystem(world) {
  const state = { stars: 0, witnessed: 0, decayTimer: 0, spawnTimer: 0, officerTimer: 0, canSee: false, lastSeen: 0, bustTimer: 0 };

  function addHeat(amount) {
    state.witnessed = Math.min(100, state.witnessed + amount);
    const newStars = Math.min(5, Math.floor(state.witnessed / 18));
    if (newStars > state.stars) world.notify(`Wanted: ${newStars} star${newStars > 1 ? 's' : ''}`);
    state.stars = newStars;
    state.decayTimer = 8;
  }

  function update(step) {
    if (state.stars === 0) {
      state.witnessed = 0;
      return;
    }
    const player = world.player;
    state.canSee = false;
    for (const officer of world.peds) {
      if (officer.role !== 'police' || officer.down) continue;
      if (distanceSquared(officer.x, officer.y, player.x, player.y) < 420 * 420 && world.combat.hasLineOfSight(officer.x, officer.y, player.x, player.y)) {
        state.canSee = true;
        break;
      }
    }
    for (const car of world.vehicles) {
      if (car.role !== 'police' || car.exploded) continue;
      if (distanceSquared(car.x, car.y, player.x, player.y) < 520 * 520 && world.combat.hasLineOfSight(car.x, car.y, player.x, player.y)) {
        state.canSee = true;
        break;
      }
    }
    if (state.canSee) {
      state.lastSeen = 0;
      state.decayTimer = Math.max(state.decayTimer, 6);
    } else {
      state.lastSeen += step;
      state.decayTimer -= step;
      if (state.decayTimer <= 0) {
        state.witnessed = Math.max(0, state.witnessed - 7);
        state.decayTimer = 1.2;
        const newStars = Math.floor(state.witnessed / 18);
        if (newStars < state.stars) world.notify('Losing the heat');
        state.stars = newStars;
      }
    }
    state.spawnTimer -= step;
    const carTarget = POLICE.maxCars[state.stars];
    const carCount = world.vehicles.filter(vehicle => vehicle.role === 'police' && !vehicle.exploded).length;
    if (carCount < carTarget && state.spawnTimer <= 0) {
      const angle = world.random() * Math.PI * 2;
      const spawnDistance = 620 + world.random() * 260;
      const node = world.city.nearestNode(player.x + Math.cos(angle) * spawnDistance, player.y + Math.sin(angle) * spawnDistance);
      const car = createVehicle('interceptor', node.x, node.y, world.random() * Math.PI * 2, { role: 'police', driver: 'police', target: player, health: POLICE.carHealth });
      car.siren = true;
      world.vehicles.push(car);
      state.spawnTimer = POLICE.spawnDelay[state.stars];
    }
    state.officerTimer -= step;
    const officerTarget = POLICE.maxOfficers[state.stars];
    const officerCount = world.peds.filter(ped => ped.role === 'police' && !ped.down).length;
    if (officerCount < officerTarget && state.officerTimer <= 0) {
      const node = world.city.nearestNode(player.x + (world.random() - 0.5) * 520, player.y + (world.random() - 0.5) * 520);
      world.peds.spawnOfficer(node.x, node.y);
      state.officerTimer = 2.2;
    }
    for (const car of world.vehicles) {
      if (car.role !== 'police' || car.exploded) continue;
      car.target = player;
      car.siren = true;
      const gap = distance(car.x, car.y, player.x, player.y);
      if (gap < 120) {
        car.speed *= 0.92;
        if (player.vehicle) world.effects.spark((car.x + player.x) / 2, (car.y + player.y) / 2, 1);
      }
    }
    for (const officer of world.peds) {
      if (officer.role !== 'police' || officer.down) continue;
      const gap = distance(officer.x, officer.y, player.x, player.y);
      const angle = Math.atan2(player.y - officer.y, player.x - officer.x);
      const desired = gap > 110 ? 92 : gap < 65 ? -45 : 0;
      officer.x += Math.cos(angle) * desired * step;
      officer.y += Math.sin(angle) * desired * step;
      officer.angle = angle;
      officer.shootTimer -= step;
      if (state.stars >= POLICE.shootStars && gap < 300 && officer.shootTimer <= 0 && world.combat.hasLineOfSight(officer.x, officer.y, player.x, player.y)) {
        officer.shootTimer = 0.8;
        world.combat.spawnBullet(officer.x, officer.y, angle + (world.random() - 0.5) * 0.14, 320, 10, 'enemy');
        world.effects.muzzleFlash(officer.x, officer.y, angle);
        world.audio.gunshot();
      }
      if (gap < POLICE.bustRange && !player.vehicle) state.bustTimer += step;
    }
    if (player.vehicle) {
      let surrounding = 0;
      for (const car of world.vehicles) {
        if (car.role === 'police' && !car.exploded && distance(car.x, car.y, player.x, player.y) < 85) surrounding += 1;
      }
      if (surrounding >= 2 && Math.abs(player.vehicle.speed) < 16) state.bustTimer += step;
      else state.bustTimer = Math.max(0, state.bustTimer - step);
    } else if (state.bustTimer > 1.2) {
      state.bustTimer = Math.max(0, state.bustTimer - step);
    }
    if (state.bustTimer > 1.5) world.busted();
  }

  function clear() {
    state.stars = 0;
    state.witnessed = 0;
    state.bustTimer = 0;
    for (let index = world.vehicles.length - 1; index >= 0; index -= 1) {
      if (world.vehicles[index].role === 'police') world.vehicles.splice(index, 1);
    }
    for (let index = world.peds.length - 1; index >= 0; index -= 1) {
      if (world.peds[index].role === 'police') world.peds.splice(index, 1);
    }
  }

  function removeCar(car) {
    const index = world.vehicles.indexOf(car);
    if (index >= 0) world.vehicles.splice(index, 1);
  }

  return { state, addHeat, update, clear, removeCar };
}

export function createCrimeReporter(world) {
  return {
    shotFired() {
      world.peds.panicNear(world.player.x, world.player.y, 260, 5);
      world.police.addHeat(3);
    },
    carTheft() {
      world.police.addHeat(7);
    },
    pedHarmed(police) {
      world.police.addHeat(police ? 18 : 9);
    },
    policeHarmed(injured) {
      world.police.addHeat(injured ? 18 : 10);
    },
    vehicleCollision() {
      world.police.addHeat(1.5);
    },
    explosionAt(x, y) {
      world.peds.panicNear(x, y, 320, 8);
      world.police.addHeat(12);
    },
  };
}
