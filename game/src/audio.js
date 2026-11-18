export function createAudio() {
  const supported = typeof window !== 'undefined' && 'AudioContext' in window;
  let context = null;
  let master = null;
  let musicGain = null;
  let sirenOsc = null;
  let sirenGain = null;
  let oceanGain = null;
  let oceanSource = null;
  let station = 0;
  let musicTime = 0;
  let musicTimer = null;
  let engineOsc = null;
  let engineGain = null;
  let engineFilter = null;
  const stations = [
    { name: 'PALM FM', root: 220, scale: [0, 3, 5, 7, 10], wave: 'sawtooth', tempo: 0.22 },
    { name: 'ONDA 103', root: 196, scale: [0, 2, 3, 7, 9], wave: 'triangle', tempo: 0.28 },
    { name: 'DUSK FM', root: 174.6, scale: [0, 2, 5, 7, 9], wave: 'sine', tempo: 0.36 },
  ];

  function ensureContext() {
    if (!supported || context) return context;
    context = new window.AudioContext();
    master = context.createGain();
    master.gain.value = 0.5;
    master.connect(context.destination);
    musicGain = context.createGain();
    musicGain.gain.value = 0.14;
    musicGain.connect(master);
    return context;
  }

  function resume() {
    if (!supported) return;
    ensureContext();
    if (context.state === 'suspended') context.resume();
  }

  function tone(frequency, duration, type = 'square', gain = 0.1, destination = null) {
    if (!supported || !context) return;
    const oscillator = context.createOscillator();
    const amplifier = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    amplifier.gain.setValueAtTime(gain, context.currentTime);
    amplifier.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(amplifier).connect(destination ?? master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }

  function noise(duration, gain, filterFrequency) {
    if (!supported || !context) return;
    const size = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, size, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < size; index += 1) data[index] = (Math.random() * 2 - 1) * (1 - index / size);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFrequency;
    const amplifier = context.createGain();
    amplifier.gain.value = gain;
    source.connect(filter).connect(amplifier).connect(master);
    source.start();
  }

  function gunshot() {
    noise(0.14, 0.16, 1800);
    tone(90, 0.05, 'square', 0.05);
  }

  function explosion() {
    noise(0.8, 0.4, 320);
    tone(45, 0.7, 'sine', 0.22);
  }

  function blip() {
    tone(720, 0.08, 'square', 0.05);
  }

  function missionPassed() {
    tone(523, 0.15, 'triangle', 0.08);
    setTimeout(() => tone(659, 0.18, 'triangle', 0.08), 140);
    setTimeout(() => tone(784, 0.24, 'triangle', 0.08), 300);
  }

  function screech() {
    noise(0.2, 0.035, 3000);
  }

  function setEngine(speedRatio, active) {
    if (!supported || !context) return;
    if (active && !engineOsc) {
      engineOsc = context.createOscillator();
      engineGain = context.createGain();
      engineFilter = context.createBiquadFilter();
      engineOsc.type = 'sawtooth';
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 420;
      engineGain.gain.value = 0.045;
      engineOsc.connect(engineFilter).connect(engineGain).connect(master);
      engineOsc.start();
    }
    if (!engineOsc) return;
    engineOsc.frequency.value = 55 + speedRatio * 130;
    engineGain.gain.value = active ? 0.035 + speedRatio * 0.035 : 0;
  }

  function setSiren(active) {
    if (!supported || !context) return;
    if (active && !sirenOsc) {
      sirenOsc = context.createOscillator();
      sirenGain = context.createGain();
      sirenOsc.type = 'square';
      sirenGain.gain.value = 0.035;
      sirenOsc.connect(sirenGain).connect(master);
      sirenOsc.start();
    }
    if (!sirenOsc) return;
    sirenOsc.frequency.value = active ? 620 + Math.sin(performance.now() * 0.012) * 190 : 0;
    sirenGain.gain.value = active ? 0.035 : 0;
    if (!active) {
      sirenOsc.stop();
      sirenOsc = null;
    }
  }

  function setOcean(active) {
    if (!supported || !context) return;
    if (active && !oceanSource) {
      const size = context.sampleRate * 2;
      const buffer = context.createBuffer(1, size, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < size; index += 1) data[index] = Math.random() * 2 - 1;
      oceanSource = context.createBufferSource();
      oceanSource.buffer = buffer;
      oceanSource.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      oceanGain = context.createGain();
      oceanGain.gain.value = 0.035;
      oceanSource.connect(filter).connect(oceanGain).connect(master);
      oceanSource.start();
    }
    if (oceanGain) oceanGain.gain.value = active ? 0.035 : 0;
  }

  function playMusicBar() {
    const preset = stations[station];
    const beat = context.currentTime;
    for (let note = 0; note < 8; note += 1) {
      const degree = preset.scale[(note * 3 + Math.floor(musicTime * 7)) % preset.scale.length];
      tone(preset.root * Math.pow(2, degree / 12), preset.tempo * 0.8, preset.wave, 0.035, musicGain);
      if (note % 2 === 0) tone(preset.root / 2, preset.tempo * 0.7, 'sine', 0.045, musicGain);
    }
    musicTime += 1;
    musicTimer = setTimeout(playMusicBar, preset.tempo * 8000);
  }

  function setRadio(index) {
    station = (index + stations.length) % stations.length;
    if (!supported || !context) return station;
    clearTimeout(musicTimer);
    if (station >= 0) playMusicBar();
    return station;
  }

  function cycleRadio() {
    return setRadio(station + 1);
  }

  function stationName() {
    return stations[station].name;
  }

  function suspend() {
    if (context) context.suspend();
  }

  function dispose() {
    clearTimeout(musicTimer);
    if (context) context.close();
  }

  return {
    resume, gunshot, explosion, blip, missionPassed, screech, tone, noise,
    setEngine, setSiren, setOcean, setRadio, cycleRadio, stationName, suspend, dispose,
  };
}
