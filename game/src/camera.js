import { VIEW } from './config.js';
import { clamp, easeOutCubic, lerp } from './util.js';

export function createCamera(canvas) {
  const state = { x: 0, y: 0, zoom: VIEW.zoom, targetX: 0, targetY: 0, targetZoom: VIEW.zoom, shakeX: 0, shakeY: 0, transition: 1 };
  let context = null;

  function follow(target, input, step, speedRatio = 0) {
    const lookAhead = target.vehicle ? 96 * speedRatio : 36;
    let aimX = target.x;
    let aimY = target.y;
    if (input) {
      const rect = canvas.getBoundingClientRect();
      aimX += (input.mouse.x - rect.width / 2) * 0.18;
      aimY += (input.mouse.y - rect.height / 2) * 0.18;
    }
    state.targetX = aimX + Math.cos(target.angle ?? 0) * lookAhead;
    state.targetY = aimY + Math.sin(target.angle ?? 0) * lookAhead;
    state.targetZoom = target.vehicle ? clamp(VIEW.zoom - Math.sqrt(speedRatio) * 0.2, VIEW.minZoom, VIEW.maxZoom) : VIEW.maxZoom + 0.04;
    state.x = lerp(state.x, state.targetX, 1 - Math.pow(0.001, step));
    state.y = lerp(state.y, state.targetY, 1 - Math.pow(0.001, step));
    state.zoom = lerp(state.zoom, state.targetZoom, 1 - Math.pow(0.02, step));
  }

  function addShake(amount) {
    state.shakeX = (Math.random() - 0.5) * amount;
    state.shakeY = (Math.random() - 0.5) * amount;
  }

  function apply(contextTarget, effectsShake) {
    context = contextTarget;
    const width = canvas.width;
    const height = canvas.height;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#0d1622';
    context.fillRect(0, 0, width, height);
    const scale = state.zoom * Math.min(width / VIEW.width, height / VIEW.height);
    context.translate(width / 2 + state.shakeX, height / 2 + state.shakeY);
    context.scale(scale, scale);
    context.translate(-state.x, -state.y);
    state.shakeX *= 0.82;
    state.shakeY *= 0.82;
  }

  function screenToWorld(screenX, screenY) {
    const width = canvas.width;
    const height = canvas.height;
    const scale = state.zoom * Math.min(width / VIEW.width, height / VIEW.height);
    return {
      x: state.x + (screenX - width / 2) / scale,
      y: state.y + (screenY - height / 2) / scale,
    };
  }

  return { follow, addShake, apply, screenToWorld, state };
}
