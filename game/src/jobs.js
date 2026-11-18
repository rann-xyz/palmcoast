import { PACKAGE_COUNT, TAXI_FARE } from './config.js';
import { distance, distanceSquared, randomRange } from './util.js';

const PACKAGE_LOCATIONS = [
  { x: 320, y: 340 }, { x: 970, y: 660 }, { x: 1580, y: 320 }, { x: 2530, y: 660 },
  { x: 3190, y: 320 }, { x: 3850, y: 660 }, { x: 320, y: 1640 }, { x: 970, y: 1960 },
  { x: 2530, y: 1640 }, { x: 3190, y: 1960 }, { x: 3850, y: 1640 }, { x: 320, y: 2960 },
  { x: 970, y: 3280 }, { x: 2530, y: 2960 }, { x: 3850, y: 3280 },
];

export function createJobsSystem(world) {
  const state = {
    packages: PACKAGE_LOCATIONS.slice(0, PACKAGE_COUNT).map(location => ({ ...location, taken: false })),
    packagesFound: 0,
    taxiActive: false,
    taxiPassenger: null,
    taxiDestination: null,
    taxiTimer: 0,
    taxiEarned: 0,
    faresCompleted: 0,
  };

  function randomRoadside() {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const x = randomRange(world.random, 120, 4500);
      const y = randomRange(world.random, 120, 3200);
      if (world.city.onRoad(x, y)) return { x, y };
    }
    return { x: 1000, y: 1000 };
  }

  function startTaxi() {
    if (state.taxiActive || !world.player.vehicle || world.player.vehicle.type.id !== 'taxi') {
      world.notify('Use a Coast Cab to start fares');
      return;
    }
    state.taxiActive = true;
    state.taxiPassenger = randomRoadside();
    state.taxiDestination = randomRoadside();
    state.taxiTimer = 95;
    world.notify('Taxi gig: collect the fare');
  }

  function update(step) {
    for (const pack of state.packages) {
      if (pack.taken) continue;
      if (distanceSquared(pack.x, pack.y, world.player.x, world.player.y) < 28 * 28) {
        pack.taken = true;
        state.packagesFound += 1;
        const reward = 180 + state.packagesFound * 20;
        world.player.cash += reward;
        world.audio.blip();
        world.notify(`Hidden package ${state.packagesFound}/15 · +$${reward}`);
      }
    }
    if (!state.taxiActive) return;
    const player = world.player;
    if (!player.vehicle || player.vehicle.type.id !== 'taxi') {
      state.taxiActive = false;
      world.notify('Taxi gig ended');
      return;
    }
    state.taxiTimer -= step;
    if (state.taxiTimer <= 0) {
      state.taxiActive = false;
      world.notify('Fare expired');
      return;
    }
    const target = state.taxiPassenger ?? state.taxiDestination;
    if (distance(player.x, player.y, target.x, target.y) < 42) {
      if (state.taxiPassenger) {
        state.taxiPassenger = null;
        world.notify('Fare aboard: drive to the marker');
      } else {
        player.cash += TAXI_FARE;
        state.taxiEarned += TAXI_FARE;
        state.faresCompleted += 1;
        state.taxiActive = false;
        state.taxiPassenger = null;
        world.audio.missionPassed();
        world.notify(`Fare complete · +$${TAXI_FARE}`);
      }
    }
  }

  function reset() {
    for (const pack of state.packages) pack.taken = false;
    state.packagesFound = 0;
    state.taxiActive = false;
    state.taxiPassenger = null;
    state.taxiDestination = null;
    state.taxiTimer = 0;
    state.taxiEarned = 0;
    state.faresCompleted = 0;
  }

  function serialize() {
    return { packagesFound: state.packagesFound, taken: state.packages.map(pack => pack.taken), faresCompleted: state.faresCompleted, taxiEarned: state.taxiEarned };
  }

  function deserialize(data) {
    if (!data) return;
    state.packagesFound = data.packagesFound ?? 0;
    state.faresCompleted = data.faresCompleted ?? 0;
    state.taxiEarned = data.taxiEarned ?? 0;
    if (Array.isArray(data.taken)) data.taken.forEach((taken, index) => { if (state.packages[index]) state.packages[index].taken = taken; });
  }

  return { state, startTaxi, update, reset, serialize, deserialize };
}
