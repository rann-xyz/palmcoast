export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MAP = 4;
export const ACTION_RADIO = 8;
export const ACTION_INTERACT = 16;
export const ACTION_HORN = 32;

export function createInput() {
  const held = new Set();
  const mouse = { x: 640, y: 360, down: false, pressed: false };
  const actions = { value: 0 };

  const keyActions = {
    Enter: ACTION_CONFIRM,
    Space: ACTION_CONFIRM,
    Escape: ACTION_PAUSE,
    KeyM: ACTION_MAP,
    KeyR: ACTION_RADIO,
    KeyE: ACTION_INTERACT,
    KeyH: ACTION_HORN,
  };

  function refreshPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  }

  function onKeyDown(event) {
    if (event.code === 'Tab') return;
    if (keyActions[event.code]) {
      event.preventDefault();
      if (!event.repeat) actions.value |= keyActions[event.code];
    }
    held.add(event.code);
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onMouseMove(event) {
    refreshPointer(event);
  }

  function onMouseDown(event) {
    refreshPointer(event);
    if (event.button === 0) {
      mouse.down = true;
      mouse.pressed = true;
    }
    if (event.button === 2) actions.value |= ACTION_CONFIRM;
  }

  function onMouseUp(event) {
    if (event.button === 0) mouse.down = false;
  }

  function onBlur() {
    held.clear();
    mouse.down = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('blur', onBlur);
  window.addEventListener('contextmenu', event => event.preventDefault());

  return {
    held,
    mouse,
    actions,
    takeActions() {
      const value = actions.value;
      actions.value = 0;
      return value;
    },
    consumeMousePress() {
      const value = mouse.pressed;
      mouse.pressed = false;
      return value;
    },
    isDown(code) {
      return held.has(code);
    },
    axis() {
      return {
        x: (held.has('KeyD') || held.has('ArrowRight') ? 1 : 0) - (held.has('KeyA') || held.has('ArrowLeft') ? 1 : 0),
        y: (held.has('KeyS') || held.has('ArrowDown') ? 1 : 0) - (held.has('KeyW') || held.has('ArrowUp') ? 1 : 0),
      };
    },
    running() {
      return held.has('ShiftLeft') || held.has('ShiftRight');
    },
  };
}
