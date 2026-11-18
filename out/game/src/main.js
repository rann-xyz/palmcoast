import { STEP } from './config.js';
import { createAudio } from './audio.js';
import { createCamera } from './camera.js';
import { createInput, ACTION_CONFIRM, ACTION_HORN, ACTION_INTERACT, ACTION_MAP, ACTION_PAUSE, ACTION_RADIO } from './input.js';
import { createMenu, SCREEN_BUSTED, SCREEN_CONTROLS, SCREEN_CREDITS, SCREEN_FAILED, SCREEN_PASSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WASTED } from './menu.js';
import { createHud } from './hud.js';
import { createMinimap } from './minimap.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';

const MAX_FRAME = 0.2;
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 20261117;
const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const menu = createMenu(canvas.getContext('2d'));
const hud = createHud(canvas.getContext('2d'));
const minimap = createMinimap(256);
const audio = createAudio();
const camera = createCamera(canvas);

world.input = createInput();
world.audio = audio;
world.camera = camera;
world.minimap = minimap;

function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = shotName ? 1280 : Math.round(window.innerWidth * ratio);
  canvas.height = shotName ? 720 : Math.round(window.innerHeight * ratio);
}

function announce(message) {
  status.textContent = message;
}

function handleActions(actions) {
  if (actions & ACTION_CONFIRM) {
    if (world.screen === SCREEN_TITLE) {
      world.screen = SCREEN_PLAY;
      world.seed();
      world.missions.startNextAvailable();
      audio.resume();
      audio.setRadio(world.radio);
      announce('Playing Palmcoast');
    } else if (world.screen === SCREEN_PASSED || world.screen === SCREEN_FAILED || world.screen === SCREEN_BUSTED || world.screen === SCREEN_WASTED || world.screen === SCREEN_CREDITS) {
      world.screen = SCREEN_PLAY;
    }
  }
  if (actions & ACTION_PAUSE) {
    if (world.screen === SCREEN_PLAY) world.screen = 'paused';
    else if (world.screen === 'paused') world.screen = SCREEN_PLAY;
    else if (world.screen === SCREEN_CONTROLS) world.screen = 'paused';
  }
  if (actions & ACTION_MAP) world.mapOpen = !world.mapOpen;
  if (actions & ACTION_RADIO) {
    world.radio = audio.cycleRadio();
    world.radioVisible = 3;
  }
  if (actions & ACTION_INTERACT && world.screen === SCREEN_PLAY) world.interact();
  if (actions & ACTION_HORN && world.player.vehicle) {
    world.player.vehicle.hornTimer = 0.3;
    world.audio.tone(340, 0.25, 'square', 0.06);
    world.peds.panicNear(world.player.x, world.player.y, 150, 2);
  }
  if (world.screen === 'paused') {
    if (world.input.isDown('KeyS')) world.save.save();
    if (world.input.isDown('KeyC')) world.screen = SCREEN_CONTROLS;
    if (world.input.isDown('KeyQ')) world.screen = SCREEN_TITLE;
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const delta = Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  accumulator += delta;
  handleActions(world.input.takeActions());
  if (world.screen === SCREEN_PLAY && !world.mapOpen) {
    while (accumulator >= STEP) {
      world.step(STEP);
      accumulator -= STEP;
    }
    camera.follow(world.player.vehicle ?? world.player, world.input, delta, world.player.vehicle ? Math.abs(world.player.vehicle.speed) / world.player.vehicle.type.speed : 0);
    camera.addShake(world.effects.shake * 0.3);
  } else {
    accumulator = 0;
  }
  if (world.mapOpen) renderer.drawMapOverlay(world);
  else if (world.screen === SCREEN_PLAY) {
    renderer.draw(world, world.screen, minimap.update(world));
    hud.draw(world, minimap.canvas);
  } else {
    menu.draw(world.screen, world.time, world.save.hasSave(), world.missions.state);
  }
}

function runShot() {
  resize();
  stageShot(shotName, world, renderer, minimap, hud);
  requestAnimationFrame(() => { window.__shotReady = true; });
}

function runGame() {
  resize();
  window.addEventListener('resize', resize);
  camera.follow(world.player, null, STEP);
  announce('PALMCOAST. Press Enter to play.');
  requestAnimationFrame(frame);
}

let last = performance.now();
let accumulator = 0;

if (shotName) runShot();
else runGame();
