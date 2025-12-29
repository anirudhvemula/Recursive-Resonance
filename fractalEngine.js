export class FractalEngine {
  constructor({
    width = 300,
    height = 200,
    maxIter = 100,
    centerX = -0.5,
    centerY = 0,
    scale = 3
  } = {}) {
    this.width = width;
    this.height = height;
    //this.maxIter = maxIter;
    this.maxIter = Math.floor(200 + 80 * Math.log2(3 / this.scale));


    this.centerX = centerX;
    this.centerY = centerY;
    this.scale = scale;

    this.field = new Float32Array(width * height);
  }

  // Core Mandelbrot iteration
  mandelbrot(cx, cy) {
    let x = 0;
    let y = 0;
    let iter = 0;

    while (x * x + y * y <= 4 && iter < this.maxIter) {
      const xt = x * x - y * y + cx;
      y = 2 * x * y + cy;
      x = xt;
      iter++;
    }

    if (iter === this.maxIter) return iter;

    // smooth iteration count
    const logZn = Math.log(x*x + y*y) / 2;
    const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
    return iter + 1 - nu;
  }

  // Generate full field
  generate() {
    let i = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cx =
          this.centerX +
          (x / this.width - 0.5) * this.scale;

        const cy =
          this.centerY +
          (y / this.height - 0.5) * this.scale;

        this.field[i++] = this.mandelbrot(cx, cy);
      }
    }
  }

  // Time evolution
  step(t) {
  const baseScale = 2.5;
  const zoom = 0.75 + 0.25 * Math.sin(t * 0.15);
  this.scale = baseScale * zoom;

  this.maxIter = Math.min(
  420,
  Math.floor(200 + 90 * Math.log2(3 / this.scale))
  );


  this.centerX = -0.5 + Math.sin(t * 0.17) * 0.25;
  this.centerY = Math.cos(t * 0.13) * 0.18;

  this.generate();
}


  getField() {
    return this.field;
  }

  getMetrics() {
    let sum = 0;
    let max = 0;

    for (let i = 0; i < this.field.length; i++) {
      const v = this.field[i];
      sum += v;
      if (v > max) max = v;
    }

    return {
      mean: sum / this.field.length,
      peak: max
    };
  }
}
