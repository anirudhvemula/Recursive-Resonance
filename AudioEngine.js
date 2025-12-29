class Voice {
  constructor(ctx, freq, gainValue, depth) {
    this.ctx = ctx;
    this.depth = depth;

    this.osc = ctx.createOscillator();
    this.osc.type = "sine";
    this.osc.frequency.value = freq;

    this.gain = ctx.createGain();
    this.gain.gain.value = gainValue;

    this.osc.connect(this.gain);
    this.gain.connect(ctx.destination);

    this.osc.start();

    // Short, gentle lifespan
    const now = ctx.currentTime;
    this.gain.gain.setTargetAtTime(0, now + 1.5, 0.6);
    this.osc.stop(now + 3);
  }
}


export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.baseOsc = null;
    this.baseGain = null;
    this.filter = null;

    this.lastSpawn = 0;
    this.maxDepth = 3;
    this.onSpawn = null; // callback
  }

  init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    this.baseOsc = this.ctx.createOscillator();
    this.baseOsc.type = "sine";

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";

    this.baseGain = this.ctx.createGain();

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.audioData = new Uint8Array(this.analyser.frequencyBinCount);



    const t = this.ctx.currentTime;
    const breath = 0.12 + 0.03 * Math.sin(t * 0.4);

    this.baseGain.gain.setTargetAtTime(
    breath,
    t,
    0.5
    );


    this.baseOsc.connect(this.filter);
    this.filter.connect(this.baseGain);
    
    this.baseGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);


    this.baseOsc.start();
  }


  
spawnVoice(freq, gain, depth) {
  if (depth >= this.maxDepth) return;

  if (this.onSpawn) {
    this.onSpawn({ freq, gain, depth });
  }

  const voice = new Voice(this.ctx, freq, gain, depth);

  if (Math.random() < 0.4) {
    const delay = 400 + Math.random() * 800;
    setTimeout(() => {
      this.spawnVoice(freq * 2, gain * 0.5, depth + 1);
    }, delay);
  }
}

  update({ mean, peak }) {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const baseFreq = 90 + mean * 3;
    this.baseOsc.frequency.setTargetAtTime(baseFreq, now, 0.2);

    this.filter.frequency.setTargetAtTime(
    200 + peak * 12,
    now,
    0.6
    );


    // Spawn recursion every few seconds
    if (now - this.lastSpawn > 2.5) {
      this.lastSpawn = now;
      this.spawnVoice(baseFreq * 1.5, 0.08, 1);
    }
  }

  getAudioMetrics() {
  if (!this.analyser) return { energy: 0, peak: 0 };

  this.analyser.getByteFrequencyData(this.audioData);

  let sum = 0;
  let peak = 0;

  for (let i = 0; i < this.audioData.length; i++) {
    const v = this.audioData[i] / 255;
    sum += v;
    if (v > peak) peak = v;
  }

  return {
    energy: sum / this.audioData.length,
    peak
  };
}

}

