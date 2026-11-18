import { STEP } from './config.js';
import { createCity } from './city.js';
import { createCombatSystem } from './combat.js';
import { createCamera } from './camera.js';
import { createEffects } from './effects.js';
import { createJobsSystem } from './jobs.js';
import { createMissionSystem } from './missions.js';
import { createPedSystem } from './peds.js';
import { createPoliceSystem, createCrimeReporter } from './police.js';
import { createPlayer, damagePlayer, exitVehicle, playerInteract, updatePlayer } from './player.js';
import { createSaveSystem } from './save.js';
import { createTrafficSystem } from './traffic.js';
import { updateVehicles } from './vehicles.js';
import { RADIO_STATIONS, WEAPON_PICKUPS } from './config.js';
import { spawnWeaponPickups } from './weapons.js';

export const SCREEN_PLAY = 'play';

export function createWorld(seedRandom) {
  const city = createCity(seedRandom);
  const world = {
    random: seedRandom,
    city,
    time: 0,
    clock: 17 * 60,
    radio: 0,
    radioVisible: 0,
    radioNames: RADIO_STATIONS.map(station => station.name),
    notification: '',
    notificationTimer: 0,
    mapOpen: false,
    screen: 'title',
    vehicles: [],
    peds: [],
    input: null,
    audio: null,
    camera: null,
    minimap: null,
    missions: null,
    jobs: null,
    police: null,
    save: null,
  };

  world.player = createPlayer(880, 990);
  world.effects = createEffects();
  world.traffic = createTrafficSystem(world);
  world.peds = createPedSystem(world);
  world.combat = null;
  world.missions = createMissionSystem(world);
  world.jobs = createJobsSystem(world);
  world.police = createPoliceSystem(world);
  world.crime = createCrimeReporter(world);
  world.combat = createCombatSystem(world);
  world.save = createSaveSystem(world);
  spawnWeaponPickups(world.player.weaponState, seedRandom, [
    { x: 980, y: 700 }, { x: 2290, y: 1340 }, { x: 2880, y: 2660 }, { x: 3720, y: 2330 },
  ]);

  world.notify = message => {
    world.notification = message;
    world.notificationTimer = 3;
  };

  world.wasted = () => {
    world.screen = 'wasted';
    world.player.cash = Math.floor(world.player.cash * 0.9);
    world.player.health = 100;
    world.player.x = 1650;
    world.player.y = 2310;
    exitVehicle(world.player, world, true);
    world.police.clear();
  };

  world.busted = () => {
    world.screen = 'busted';
    world.player.cash = Math.max(0, world.player.cash - 250);
    for (const slot of world.player.weaponState.slots) slot.ammo = Math.floor(slot.ammo / 2);
    world.player.x = 2310;
    world.player.y = 1320;
    exitVehicle(world.player, world, true);
    world.police.clear();
  };

  world.step = function step(fixedStep = STEP) {
    world.time += fixedStep;
    world.clock = (world.clock + fixedStep / 60) % (24 * 60);
    world.notificationTimer = Math.max(0, world.notificationTimer - fixedStep);
    world.radioVisible = Math.max(0, world.radioVisible - fixedStep);
    updatePlayer(world.player, world, fixedStep);
    updateVehicles(world, fixedStep);
    world.traffic.update(fixedStep);
    world.peds.update(fixedStep);
    world.police.update(fixedStep);
    world.combat.update(fixedStep);
    world.missions.update(fixedStep);
    world.jobs.update(fixedStep);
    world.effects.update(fixedStep, world.camera);
    if (world.player.vehicle) {
      const speedRatio = Math.min(1, Math.abs(world.player.vehicle.speed) / world.player.vehicle.type.speed);
      world.audio?.setEngine(speedRatio, true);
      if (world.input.isDown('Space') && speedRatio > 0.2) {
        world.effects.skidMark(world.player.vehicle.x, world.player.vehicle.y, world.player.vehicle.angle);
        if (world.random() < 0.2) world.audio.screech();
      }
    } else {
      world.audio?.setEngine(0, false);
    }
    const nearOcean = world.player.y > 3100;
    world.audio?.setOcean(nearOcean);
    const wanted = world.police.state.stars > 0;
    world.audio?.setSiren(wanted);
    return true;
  };

  world.seed = function seed() {
    world.traffic.seed();
    world.peds.seed();
  };

  world.interact = () => playerInteract(world.player, world);
  world.saveGame = auto => world.save.save(auto);
  world.damagePlayer = amount => damagePlayer(world.player, amount, world);

  return world;
}
