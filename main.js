import { FractalEngine } from "./fractalEngine.js";
import { AudioEngine } from "./audioEngine.js";
import {
  setAudioMetrics,
  setFractalType,
  setJuliaParams
} from "./webglFractal.js";


/*
function hsvToRgb(h, s, v) {
  let c = v * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = v - c;

  let r = 0, g = 0, b = 0;

  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120){ r = x; g = c; b = 0; }
  else if (h < 180){ r = 0; g = c; b = x; }
  else if (h < 240){ r = 0; g = x; b = c; }
  else if (h < 300){ r = x; g = 0; b = c; }
  else             { r = c; g = 0; b = x; }

  return [
    Math.floor((r + m) * 255),
    Math.floor((g + m) * 255),
    Math.floor((b + m) * 255)
  ];
}
*/


let overlay, overlayCtx, startBtn;
let audioTimer = null;
let audioStarted = false;
let smoothEnergy = 0;
let smoothPeak = 0;


overlay = document.getElementById("overlay");
overlayCtx = overlay.getContext("2d");

let audioEnabled = false;



function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}


function resizeOverlay() {
  overlay.width = window.innerWidth;
  overlay.height = window.innerHeight;
}

window.addEventListener("resize", resizeOverlay);
resizeOverlay();





function init() {
  startBtn = document.getElementById("startBtn");
  const audio = new AudioEngine();

  const fractal = new FractalEngine({
  width: 120,
  height: 80
  });

  const fractalSelect = document.getElementById("fractalType");
  fractalSelect.addEventListener("change", e => {
  fractal.type = e.target.value;



  const map = {
  mandelbrot: 0,
  julia: 1,
  burningship: 2
  };

  setFractalType(map[fractal.type]);
  });




  

  //const waveScale = Math.min(overlay.width, overlay.height);



  const waves = [];
  audio.onSpawn = ({ depth }) => {
  waves.push({
    x: 0.3 + Math.random() * 0.4,
    y: 0.3 + Math.random() * 0.4,
    radius: 0,
    life: 1,
    depth
  });
  };

  


  

  function draw() {
  overlayCtx.save();
  overlayCtx.globalCompositeOperation = "destination-out";
  overlayCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
  overlayCtx.fillRect(0, 0, overlay.width, overlay.height);
  overlayCtx.restore();



  const scale = Math.min(overlay.width, overlay.height);

  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];

    w.radius += scale * (0.003 + w.depth * 0.001);
    w.life -= 0.006;

    if (w.life <= 0) {
      waves.splice(i, 1);
      continue;
    }

    overlayCtx.beginPath();
    overlayCtx.arc(
      w.x * overlay.width,
      w.y * overlay.height,
      w.radius,
      0,
      Math.PI * 2
    );

    overlayCtx.strokeStyle = `rgba(120, 220, 255, ${w.life * 0.6})`;
    overlayCtx.lineWidth = scale * (0.002 - w.depth * 0.0006);
    overlayCtx.stroke();
  }

  requestAnimationFrame(draw);
}


  draw();

  if (startBtn) {

  startBtn.addEventListener("click", async () => {

  // First-ever click → initialize audio
  if (!audioStarted) {
    audio.init();
    audioStarted = true;
  }

  audioEnabled = !audioEnabled;

  if (audioEnabled) {
    await audio.ctx.resume();
    startBtn.textContent = "Mute! 🔇";
  } else {
    await audio.ctx.suspend();
    startBtn.textContent = "Start Jamming! 🔊";
  }


  if (audioTimer) clearInterval(audioTimer);
  audioTimer = setInterval(() => {

    const isJulia = fractal.type === "julia";
    //audio.update({ mean: 50, peak: 30 }); // placeholder for now

    // --- 1. Read real audio ---
    const audioMetrics = audio.getAudioMetrics();

    // --- 2. Feed audio → fractal ---
    const t = performance.now() * 0.001;
    fractal.step(t);
    setJuliaParams(fractal.juliaCX, fractal.juliaCY);

    const fractalMetrics = fractal.getMetrics();

    // --- 3. Blend both worlds (slow feedback) ---
    let mean =
      audioMetrics.energy * 60 +
      fractalMetrics.mean * (isJulia ? 0.03 : 0.015);

    let peak =
      audioMetrics.peak * 40 +
      fractalMetrics.peak * (isJulia ? 0.04 : 0.02);


  mean = clamp(mean, 20, 120);
  peak = clamp(peak, 10, 80);


    // --- 4. Drive audio ---
    audio.update({ mean, peak });

    // --- 5. Drive visuals ---
    smoothEnergy += (audioMetrics.energy - smoothEnergy) * 0.12;
    smoothPeak   += (audioMetrics.peak   - smoothPeak)   * 0.08;

    setAudioMetrics(smoothEnergy, smoothPeak); 
  
  }, 50);

  waves.push({
    x: 0.5,
    y: 0.5,
    radius: 0,
    life: 1,
    depth: 0
  });

  });
  }

}
init();