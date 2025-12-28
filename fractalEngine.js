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
    this.maxIter = maxIter;

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

    return iter;
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
    this.scale = 3 * Math.exp(-t * 0.02);
    this.centerX = -0.5 + Math.sin(t * 0.1) * 0.2;
    this.centerY = Math.cos(t * 0.07) * 0.2;

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
