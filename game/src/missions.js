import { MISSIONS } from './config.js';
import { createVehicle } from './vehicles.js';
import { exitVehicle } from './player.js';
import { distance, distanceSquared } from './util.js';

const BEATS = [
  'Rio: Six years away, and Palmcoast still smells like salt and trouble.',
  'Marisol: One clean delivery, Rio. Then we talk about who burned you.',
  'Marisol: The bank took a sedan. Take it back before they take more.',
  'Tiburon: Make noise on the coast line, then vanish. Respray helps.',
  'Marisol: Three locals think they own the strand. Prove otherwise.',
  'Tiburon: A Cuervos courier is moving ledgers. Stop the car.',
  'Tiburon: Los Cuervos hit my dock. Take it back with Marisol’s people.',
  'Marisol: The Vespid GT is the key to a private gate. Steal it hot.',
  'Marisol: They knew our route. Survive, then lose the heat.',
  'Rio: I found the face from six years ago. This ends here.',
  'Marisol: Escort my convoy to Golden Hour. Do not let it burn.',
  'Rio: One last run to the pier. Palmcoast gets its answer tonight.',
];

function marker(x, y, label, radius = 42) {
  return { x, y, label, radius };
}

export function createMissionSystem(world) {
  const state = {
    index: 0,
    active: false,
    stage: 0,
    timer: 0,
    objective: '',
    subtitle: '',
    subtitleTimer: 0,
    marker: null,
    reward: 0,
    passed: false,
    failed: false,
    tallyTimer: 0,
    missionVehicle: null,
    targetVehicle: null,
    targetPed: null,
    allies: [],
    laps: 0,
    checkpoints: [],
    convoy: null,
    completed: [],
  };

  function begin(index) {
    const mission = MISSIONS[index];
    state.index = index;
    state.active = true;
    state.stage = 0;
    state.passed = false;
    state.failed = false;
    state.timer = 0;
    state.subtitle = BEATS[index];
    state.subtitleTimer = 5;
    state.reward = mission.reward;
    state.completed[index] = false;
    setupStage();
    world.notify(`${mission.title} started`);
  }

  function startNextAvailable() {
    if (state.active) return;
    const next = Math.min(MISSIONS.length - 1, state.index);
    begin(next);
  }

  function setObjective(text, markerPoint = null, timer = 0) {
    state.objective = text;
    state.marker = markerPoint;
    state.timer = timer;
  }

  function spawnAllies(count, x, y) {
    for (let index = 0; index < count; index += 1) {
      world.peds.push({ x: x + index * 24, y: y + 20, angle: 0, speed: 0, role: 'ally', health: 70, down: false, downTime: 0, panic: 0, walkPhase: 0, waypoint: null, skin: '#e3b28c', shirt: '#2f9e8f', shootTimer: 0, missionMarker: false, target: null });
    }
  }

  function spawnEnemies(count, x, y) {
    for (let index = 0; index < count; index += 1) {
      world.peds.push({ x: x + index * 28, y, angle: Math.PI, speed: 0, role: 'enemy', health: 38, down: false, downTime: 0, panic: 0, walkPhase: 0, waypoint: null, skin: '#c78f68', shirt: '#743a3a', shootTimer: 1, missionMarker: true, target: world.player });
    }
  }

  function setupStage() {
    const player = world.player;
    switch (MISSIONS[state.index].id) {
      case 'welcome':
        setObjective('Walk to Marisol’s safehouse', marker(880, 990, 'Marisol'));
        break;
      case 'first-job':
        setObjective('Drive the package to Tiburon Docks', marker(3740, 2310, 'Docks'), 105);
        break;
      case 'repo-man': {
        const vehicle = createVehicle('vista', 1580, 660, 0, { role: 'mission', missionMarker: true, health: 100 });
        world.vehicles.push(vehicle);
        state.missionVehicle = vehicle;
        setObjective('Steal the marked Vista without wrecking it', marker(vehicle.x, vehicle.y, 'Repo'));
        break;
      }
      case 'heat-line':
        setObjective('Reach the respray with heat', marker(2860, 2640, 'Respray'), 130);
        break;
      case 'beach-race':
        state.checkpoints = [marker(770, 2970, 'CP1'), marker(1980, 3180, 'CP2'), marker(3190, 2970, 'CP3'), marker(770, 3180, 'Finish')];
        state.laps = 0;
        setObjective('Race: pass all checkpoints, 3 laps', state.checkpoints[0], 180);
        break;
      case 'the-courier': {
        const courier = createVehicle('furia', 2530, 1640, Math.PI, { role: 'mission', missionMarker: true, health: 90 });
        world.vehicles.push(courier);
        state.targetVehicle = courier;
        setObjective('Ram the courier until it stops', marker(courier.x, courier.y, 'Courier'), 115);
        break;
      }
      case 'dock-wars':
        spawnAllies(2, 3700, 2350);
        spawnEnemies(4, 3820, 2280);
        setObjective('Clear Los Cuervos at the dock', marker(3820, 2280, 'Ambush'), 150);
        break;
      case 'palm-heist': {
        const vespid = createVehicle('vespid', 3190, 320, 0, { role: 'mission', missionMarker: true, health: 100 });
        world.vehicles.push(vespid);
        state.missionVehicle = vespid;
        setObjective('Steal the Vespid GT and survive 3 stars', marker(vespid.x, vespid.y, 'GT'));
        break;
      }
      case 'snakes-water':
        spawnEnemies(6, 1980, 3960);
        setObjective('Survive the pier ambush', marker(1980, 3960, 'Pier'), 90);
        break;
      case 'payback':
        spawnEnemies(3, 2310, 1320);
        state.targetPed = world.peds.find(ped => ped.role === 'enemy');
        setObjective('Eliminate the marked target', marker(2310, 1320, 'Target'), 140);
        break;
      case 'golden-hour': {
        const convoy = createVehicle('cargovan', 880, 990, 0, { role: 'mission', missionMarker: true, health: 140 });
        world.vehicles.push(convoy);
        state.convoy = convoy;
        setObjective('Escort the convoy to Golden Hour', marker(3740, 2310, 'Docks'), 170);
        break;
      }
      case 'costa-finale':
        setObjective('Race to Sunset Pier', marker(1980, 3960, 'Pier'), 120);
        break;
    }
  }

  function advanceStage() {
    state.stage += 1;
    switch (MISSIONS[state.index].id) {
      case 'costa-finale':
        spawnEnemies(5, 1980, 3900);
        setObjective('Final shootout: clear the pier', marker(1980, 3900, 'Fight'), 90);
        break;
      case 'snakes-water':
        setObjective('Lose the heat', null, 70);
        break;
      case 'payback':
        setObjective('Escape the scene', marker(320, 340, 'Escape'), 80);
        break;
      default:
        complete();
    }
  }

  function complete() {
    state.active = false;
    state.passed = true;
    state.tallyTimer = 4;
    world.player.cash += state.reward;
    state.completed[state.index] = true;
    world.audio.missionPassed();
    if (state.index < MISSIONS.length - 1) state.index += 1;
    world.saveGame(true);
  }

  function fail(reason) {
    if (!state.active) return;
    state.active = false;
    state.failed = true;
    state.tallyTimer = 3.5;
    state.objective = reason;
    state.marker = null;
    world.audio.tone(180, 0.5, 'sawtooth', 0.08);
  }

  function update(step) {
    state.subtitleTimer = Math.max(0, state.subtitleTimer - step);
    if (state.tallyTimer > 0) {
      state.tallyTimer -= step;
      if (state.tallyTimer <= 0) { state.passed = false; state.failed = false; }
      return;
    }
    if (!state.active) return;
    const player = world.player;
    if (state.timer > 0) {
      state.timer -= step;
      if (state.timer <= 0) return fail('Mission failed: out of time');
    }
    const target = state.marker;
    if (target && distanceSquared(player.x, player.y, target.x, target.y) < target.radius * target.radius) {
      if (MISSIONS[state.index].id === 'heat-line' && world.police.state.stars < 2) {
        world.notify('Draw at least two stars first');
      } else if (MISSIONS[state.index].id === 'palm-heist' && world.police.state.stars < 3) {
        world.notify('The GT only opens under three stars');
      } else {
        advanceStage();
      }
    }
    switch (MISSIONS[state.index].id) {
      case 'first-job':
        if (!player.vehicle) state.timer = Math.min(state.timer, 35);
        break;
      case 'repo-man':
        if (state.missionVehicle && state.missionVehicle.health < 55) fail('Mission failed: sedan wrecked');
        if (state.missionVehicle && player.vehicle === state.missionVehicle && !state.marker) setObjective('Deliver the Vista to the docks', marker(3740, 2310, 'Delivery'), 90);
        break;
      case 'the-courier':
        if (state.targetVehicle && state.targetVehicle.speed < 8) advanceStage();
        break;
      case 'dock-wars':
        if (!world.peds.some(ped => ped.role === 'enemy' && !ped.down)) advanceStage();
        break;
      case 'palm-heist':
        if (player.vehicle === state.missionVehicle) world.police.addHeat(12);
        break;
      case 'snakes-water':
        if (state.stage === 1 && world.police.state.stars === 0) complete();
        break;
      case 'payback':
        if (state.stage === 0 && (!state.targetPed || state.targetPed.down)) advanceStage();
        break;
      case 'golden-hour':
        if (state.convoy.exploded) fail('Mission failed: convoy destroyed');
        if (state.convoy) {
          const angle = Math.atan2(player.y - state.convoy.y, player.x - state.convoy.x);
          state.convoy.x += Math.cos(angle) * 50 * step;
          state.convoy.y += Math.sin(angle) * 50 * step;
        }
        break;
      case 'costa-finale':
        if (state.stage === 1 && !world.peds.some(ped => ped.role === 'enemy' && !ped.down)) {
          setObjective('Escape Palmcoast', marker(320, 340, 'Escape'), 80);
          state.stage = 2;
        } else if (state.stage === 2 && target && distanceSquared(player.x, player.y, target.x, target.y) < target.radius * target.radius) {
          complete();
        }
        break;
    }
  }

  function serialize() {
    return { index: state.index, completed: state.completed };
  }

  function deserialize(data) {
    if (!data) return;
    state.index = data.index ?? 0;
    state.completed = data.completed ?? [];
    state.active = false;
  }

  return { state, begin, startNextAvailable, update, fail, serialize, deserialize };
}
