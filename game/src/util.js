export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function distanceSquared(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return dx * dx + dy * dy;
}

export function distance(ax, ay, bx, by) {
  return Math.sqrt(distanceSquared(ax, ay, bx, by));
}

export function angleDifference(from, to) {
  let difference = (to - from) % TAU;
  if (difference > Math.PI) difference -= TAU;
  if (difference < -Math.PI) difference += TAU;
  return difference;
}

export function angleTowards(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function moveTowardsAngle(current, target, maxTurn) {
  const difference = angleDifference(current, target);
  return current + clamp(difference, -maxTurn, maxTurn);
}

export function moveTowards(current, target, maxDelta) {
  return current < target ? Math.min(current + maxDelta, target) : Math.max(current - maxDelta, target);
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export function circleRectOverlap(x, y, radius, rect) {
  const closestX = clamp(x, rect.x, rect.x + rect.width);
  const closestY = clamp(y, rect.y, rect.y + rect.height);
  return distanceSquared(x, y, closestX, closestY) <= radius * radius;
}

export function rotatePoint(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

export function pick(random, values) {
  return values[Math.floor(random() * values.length) % values.length];
}

export function randomRange(random, min, max) {
  return min + random() * (max - min);
}

export function randomInt(random, min, max) {
  return Math.floor(randomRange(random, min, max + 1));
}

export function formatMoney(value) {
  return `$${Math.max(0, Math.floor(value)).toLocaleString('en-US')}`;
}

export function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function easeOutCubic(value) {
  const rest = 1 - value;
  return 1 - rest * rest * rest;
}
