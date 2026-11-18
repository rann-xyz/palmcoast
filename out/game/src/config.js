export const STEP = 1 / 60;
export const WORLD = { width: 4700, height: 4040 };
export const ROAD = { width: 80, lane: 20, crosswalk: 26 };
export const GRID = { columns: 14, rows: 10, pitch: 330, blockWidth: 250, blockHeight: 250 };
export const BEACH = { top: 3300, sand: 3700, water: 4040 };
export const VIEW = { width: 1280, height: 720, zoom: 0.86, maxZoom: 1.08, minZoom: 0.62 };
export const PLAYER = {
  radius: 11,
  walkSpeed: 108,
  runSpeed: 182,
  maxHealth: 100,
  maxArmor: 100,
  enterRange: 52,
  invulnTime: 0.8,
};
export const VEHICLE_TYPES = [
  { id: 'pica', name: 'Pica', length: 48, width: 24, mass: 0.82, speed: 238, grip: 0.90, color: '#f5d76e', roof: '#d8ab3c' },
  { id: 'vista', name: 'Vista', length: 60, width: 27, mass: 1.0, speed: 258, grip: 0.94, color: '#dfe7ef', roof: '#aebfce' },
  { id: 'taxi', name: 'Coast Cab', length: 60, width: 27, mass: 1.0, speed: 252, grip: 0.93, color: '#ffcc33', roof: '#2f3640' },
  { id: 'bravo', name: 'Bravo', length: 64, width: 30, mass: 1.15, speed: 242, grip: 0.88, color: '#7a9e7e', roof: '#5d7a61' },
  { id: 'cargovan', name: 'Cargovan', length: 72, width: 32, mass: 1.35, speed: 214, grip: 0.82, color: '#e8e3d8', roof: '#bcb5a7' },
  { id: 'furia', name: 'Furia', length: 64, width: 29, mass: 1.05, speed: 312, grip: 0.86, color: '#c0392b', roof: '#8e2b20' },
  { id: 'vespid', name: 'Vespid GT', length: 62, width: 28, mass: 0.88, speed: 348, grip: 0.98, color: '#18a4b8', roof: '#0f7385' },
  { id: 'interceptor', name: 'Interceptor', length: 64, width: 28, mass: 1.05, speed: 318, grip: 0.97, color: '#f4f6f8', roof: '#254b73' },
  { id: 'metrobus', name: 'Metrobus', length: 96, width: 34, mass: 1.8, speed: 182, grip: 0.72, color: '#4b7bec', roof: '#33549e' },
];
export const WEAPONS = [
  { id: 'fists', name: 'Fists', damage: 8, rate: 0.45, range: 26, ammoUse: 0, spread: 0, pellets: 0, auto: false },
  { id: 'bat', name: 'Bat', damage: 22, rate: 0.55, range: 34, ammoUse: 0, spread: 0, pellets: 0, auto: false },
  { id: 'pistol', name: 'Pistol', damage: 18, rate: 0.30, range: 380, ammoUse: 1, spread: 0.035, pellets: 1, auto: false },
  { id: 'smg', name: 'SMG', damage: 11, rate: 0.09, range: 330, ammoUse: 1, spread: 0.085, pellets: 1, auto: true },
  { id: 'shotgun', name: 'Shotgun', damage: 12, rate: 0.85, range: 210, ammoUse: 1, spread: 0.16, pellets: 5, auto: false },
];
export const WEAPON_PICKUPS = [
  { weapon: 'bat', ammo: 0, color: '#c98b3d' },
  { weapon: 'pistol', ammo: 48, color: '#dfe6e9' },
  { weapon: 'smg', ammo: 90, color: '#8898aa' },
  { weapon: 'shotgun', ammo: 24, color: '#a55d34' },
];
export const POLICE = {
  maxCars: [0, 0, 1, 2, 4, 6],
  maxOfficers: [0, 1, 2, 4, 6, 8],
  spawnDelay: [999, 7, 5, 3.5, 2.2, 1.4],
  shootStars: 3,
  bustRange: 52,
  carHealth: 105,
  officerHealth: 48,
};
export const TRAFFIC = { count: 68, spawnRadius: 1250, despawnRadius: 1650 };
export const PEDS = { count: 78, spawnRadius: 850, despawnRadius: 1150 };
export const MISSIONS = [
  { id: 'welcome', title: 'Welcome Home', reward: 150, fixer: 'Marisol' },
  { id: 'first-job', title: 'First Job', reward: 220, fixer: 'Marisol' },
  { id: 'repo-man', title: 'Repo Man', reward: 300, fixer: 'Marisol' },
  { id: 'heat-line', title: 'Heat Line', reward: 380, fixer: 'Tiburon' },
  { id: 'beach-race', title: 'Beach Race', reward: 500, fixer: 'Marisol' },
  { id: 'the-courier', title: 'The Courier', reward: 650, fixer: 'Tiburon' },
  { id: 'dock-wars', title: 'Dock Wars', reward: 800, fixer: 'Tiburon' },
  { id: 'palm-heist', title: 'Palm Heist', reward: 950, fixer: 'Marisol' },
  { id: 'snakes-water', title: 'Snakes in the Water', reward: 1150, fixer: 'Marisol' },
  { id: 'payback', title: 'Payback', reward: 1400, fixer: 'Marisol' },
  { id: 'golden-hour', title: 'Golden Hour', reward: 1800, fixer: 'Marisol' },
  { id: 'costa-finale', title: 'Costa Finale', reward: 2500, fixer: 'Rio' },
];
export const RADIO_STATIONS = [
  { id: 'palm', name: 'PALM FM', hue: 45 },
  { id: 'onda', name: 'ONDA 103', hue: 12 },
  { id: 'dusk', name: 'DUSK FM', hue: 255 },
];
export const SAVE_KEY = 'palmcoast-save-v1';
export const PACKAGE_COUNT = 15;
export const TAXI_FARE = 95;
