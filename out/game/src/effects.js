export function createEffects(canvas) {
  const particles = [];
  const decals = [];
  let shake = 0;
  let flash = 0;
  let shockwaves = [];
  let decalCanvas = null;
  let decalContext = null;
  const DECAL_SIZE = 2048;

  function ensureDecalCanvas() {
    if (decalCanvas) return;
    decalCanvas = document.createElement('canvas');
    decalCanvas.width = DECAL_SIZE;
    decalCanvas.height = DECAL_SIZE;
    decalContext = decalCanvas.getContext('2d');
  }

  function push(particle) {
    if (particles.length < 900) particles.push(particle);
  }

  function spark(x, y, count = 5) {
    for (let index = 0; index < count; index += 1) {
      push({ x, y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, life: 0.25, maxLife: 0.25, size: 2, color: '#ffe08a', kind: 'spark' });
    }
  }

  function smoke(x, y, count = 2) {
    for (let index = 0; index < count; index += 1) {
      push({ x, y, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20, life: 0.9, maxLife: 0.9, size: 7 + Math.random() * 8, color: 'rgba(90,90,90,0.55)', kind: 'smoke' });
    }
  }

  function blood(x, y, count = 3) {
    for (let index = 0; index < count; index += 1) {
      push({ x, y, vx: (Math.random() - 0.5) * 90, vy: (Math.random() - 0.5) * 90, life: 0.35, maxLife: 0.35, size: 3, color: '#b8323a', kind: 'blood' });
    }
  }

  function muzzleFlash(x, y, angle) {
    push({ x, y, vx: Math.cos(angle) * 90, vy: Math.sin(angle) * 90, life: 0.07, maxLife: 0.07, size: 12, color: '#fff2b0', kind: 'flash', angle });
  }

  function tracer(x1, y1, x2, y2, color = '#fff6c8') {
    push({ x: x1, y: y1, x2, y2, life: 0.06, maxLife: 0.06, size: 2, color, kind: 'tracer' });
  }

  function explosion(x, y) {
    for (let index = 0; index < 32; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 240;
      push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.55, maxLife: 0.55, size: 4 + Math.random() * 8, color: index % 3 ? '#ffb347' : '#fff1a8', kind: 'fire' });
    }
    shockwaves.push({ x, y, radius: 12, life: 0.45, maxLife: 0.45 });
    flash = Math.max(flash, 0.18);
  }

  function skidMark(x, y, angle, strength = 0.7) {
    ensureDecalCanvas();
    decalContext.save();
    decalContext.translate(x, y);
    decalContext.rotate(angle);
    decalContext.globalAlpha = strength * 0.4;
    decalContext.fillStyle = '#241f22';
    decalContext.fillRect(-9, -11, 18, 5);
    decalContext.fillRect(-9, 6, 18, 5);
    decalContext.restore();
    decalContext.globalAlpha = 1;
  }

  function addDecal(x, y, kind) {
    decals.push({ x, y, kind, life: kind === 'scorch' ? 30 : 18 });
  }

  function update(step, camera) {
    shake = Math.max(0, shake - step * 18);
    flash = Math.max(0, flash - step * 2.5);
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.life -= step;
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      if (particle.kind === 'smoke') particle.size += 12 * step;
      if (particle.life <= 0) particles.splice(index, 1);
    }
    for (let index = shockwaves.length - 1; index >= 0; index -= 1) {
      const wave = shockwaves[index];
      wave.life -= step;
      wave.radius += 420 * step;
      if (wave.life <= 0) shockwaves.splice(index, 1);
    }
    for (let index = decals.length - 1; index >= 0; index -= 1) {
      decals[index].life -= step;
      if (decals[index].life <= 0) decals.splice(index, 1);
    }
  }

  function draw(context, camera) {
    context.save();
    for (const decal of decals) {
      context.globalAlpha = Math.min(1, decal.life / 5) * 0.7;
      if (decal.kind === 'scorch') {
        context.fillStyle = '#1d1a1c';
        context.beginPath();
        context.ellipse(decal.x, decal.y, 32, 26, 0, 0, Math.PI * 2);
        context.fill();
      } else if (decal.kind === 'body') {
        context.fillStyle = '#692f34';
        context.beginPath();
        context.ellipse(decal.x, decal.y, 10, 6, 0, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife;
      context.globalAlpha = alpha;
      if (particle.kind === 'tracer') {
        context.strokeStyle = particle.color;
        context.lineWidth = particle.size;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        context.lineTo(particle.x2, particle.y2);
        context.stroke();
      } else if (particle.kind === 'flash') {
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.angle);
        context.fillStyle = particle.color;
        context.beginPath();
        context.moveTo(0, -4);
        context.lineTo(18, 0);
        context.lineTo(0, 4);
        context.fill();
        context.restore();
      } else {
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
    for (const wave of shockwaves) {
      context.strokeStyle = `rgba(255,220,150,${wave.life / wave.maxLife * 0.7})`;
      context.lineWidth = 6;
      context.beginPath();
      context.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      context.stroke();
    }
    context.restore();
  }

  function drawOverlay(context) {
    if (flash > 0) {
      context.fillStyle = `rgba(255,220,170,${flash})`;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
  }

  function addShake(amount) {
    shake = Math.min(16, shake + amount);
  }

  return {
    spark, smoke, blood, muzzleFlash, tracer, explosion, skidMark, addDecal,
    update, draw, drawOverlay, addShake,
    get shake() { return shake; },
  };
}
