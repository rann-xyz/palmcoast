import { WEAPONS, WEAPON_PICKUPS } from './config.js';
import { randomRange } from './util.js';

export function createWeaponState() {
  return {
    slots: WEAPONS.map(weapon => ({ ...weapon, owned: weapon.id === 'fists' || weapon.id === 'pistol', ammo: weapon.id === 'pistol' ? 64 : 0 })),
    selected: 2,
    cooldown: 0,
    pickups: [],
  };
}

export function currentWeapon(state) {
  return state.slots[state.selected];
}

export function selectWeapon(state, slotIndex) {
  const weapon = state.slots[slotIndex];
  if (weapon && weapon.owned) state.selected = slotIndex;
}

export function cycleWeapon(state, direction = 1) {
  for (let offset = 1; offset <= state.slots.length; offset += 1) {
    const index = (state.selected + direction * offset + state.slots.length * 2) % state.slots.length;
    if (state.slots[index].owned) {
      state.selected = index;
      return;
    }
  }
}

export function giveWeapon(state, weaponId, ammo) {
  const slot = state.slots.find(weapon => weapon.id === weaponId);
  if (!slot) return;
  slot.owned = true;
  slot.ammo += ammo;
  state.selected = state.slots.indexOf(slot);
}

export function spawnWeaponPickups(state, random, positions) {
  state.pickups = positions.map((position, index) => {
    const preset = WEAPON_PICKUPS[index % WEAPON_PICKUPS.length];
    return { ...position, ...preset, taken: false, respawn: 0, bob: random() * 6 };
  });
}

export function updateWeapons(state, step, player, world) {
  state.cooldown = Math.max(0, state.cooldown - step);
  for (const pickup of state.pickups) {
    if (pickup.taken) {
      pickup.respawn -= step;
      if (pickup.respawn <= 0) pickup.taken = false;
      continue;
    }
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    if (dx * dx + dy * dy < 26 * 26) {
      giveWeapon(state, pickup.weapon, pickup.ammo);
      pickup.taken = true;
      pickup.respawn = 45;
      world.audio.blip();
      world.notify(`Picked up ${pickup.weapon.toUpperCase()}`);
    }
  }
}

export function fireWeapon(state, world, originX, originY, aimAngle, isPlayer) {
  const weapon = currentWeapon(state);
  if (state.cooldown > 0) return false;
  if (weapon.ammoUse && weapon.ammo <= 0) {
    if (isPlayer) world.notify('No ammunition');
    return false;
  }
  state.cooldown = weapon.rate;
  if (weapon.ammoUse) weapon.ammo -= weapon.ammoUse;
  const pellets = weapon.pellets || 1;
  for (let index = 0; index < pellets; index += 1) {
    const spread = weapon.spread ? randomRange(world.random, -weapon.spread, weapon.spread) : 0;
    world.combat.spawnBullet(originX, originY, aimAngle + spread, weapon.range, weapon.damage, isPlayer ? 'player' : 'enemy');
  }
  world.effects.muzzleFlash(originX, originY, aimAngle);
  world.audio.gunshot();
  if (isPlayer) world.crime.shotFired();
  return true;
}
