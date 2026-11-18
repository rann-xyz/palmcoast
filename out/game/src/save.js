import { SAVE_KEY } from './config.js';

export function createSaveSystem(world) {
  function serialize() {
    return {
      version: 1,
      cash: world.player.cash,
      health: world.player.health,
      armor: world.player.armor,
      x: world.player.x,
      y: world.player.y,
      weapon: {
        selected: world.player.weaponState.selected,
        slots: world.player.weaponState.slots.map(slot => ({ id: slot.id, owned: slot.owned, ammo: slot.ammo })),
      },
      missions: world.missions.serialize(),
      jobs: world.jobs.serialize(),
      radio: world.radio,
      time: world.clock,
    };
  }

  function save(auto = false) {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(serialize()));
      world.notify(auto ? 'Mission saved' : 'Game saved');
      return true;
    } catch {
      world.notify('Save unavailable');
      return false;
    }
  }

  function hasSave() {
    try {
      return Boolean(window.localStorage.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  function load() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.version !== 1) return false;
      world.player.cash = data.cash ?? 350;
      world.player.health = data.health ?? 100;
      world.player.armor = data.armor ?? 0;
      world.player.x = data.x ?? 880;
      world.player.y = data.y ?? 990;
      world.radio = data.radio ?? 0;
      world.clock = data.time ?? 17 * 60;
      if (data.weapon?.slots) {
        data.weapon.slots.forEach((saved, index) => {
          const slot = world.player.weaponState.slots[index];
          if (slot && slot.id === saved.id) {
            slot.owned = saved.owned;
            slot.ammo = saved.ammo;
          }
        });
        world.player.weaponState.selected = data.weapon.selected ?? 2;
      }
      world.missions.deserialize(data.missions);
      world.jobs.deserialize(data.jobs);
      world.notify('Save loaded');
      return true;
    } catch {
      return false;
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(SAVE_KEY);
    } catch {}
  }

  return { serialize, save, hasSave, load, clear };
}
