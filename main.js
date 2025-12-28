import { FractalEngine } from "./fractalEngine.js";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

const engine = new FractalEngine({
  width: 300,
  height: 200,
  maxIter: 120
});

let start = performance.now();

function draw() {
  const t = (performance.now() - start) / 1000;
  engine.step(t);

  const img = ctx.createImageData(300, 200);
  const data = engine.getField();

  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    const c = v === engine.maxIter ? 0 : (v * 255) / engine.maxIter;

    img.data[i * 4 + 0] = c;
    img.data[i * 4 + 1] = c;
    img.data[i * 4 + 2] = c;
    img.data[i * 4 + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, 600, 400);

  requestAnimationFrame(draw);
}

draw();
