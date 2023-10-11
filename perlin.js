class Perlin {
  constructor(height, width) {
    this.init(height, width);
  }
  
  init(height, width) {
    this.gradients = {};
    this.perlinNoises = {};
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        this.gradients[[x,y]] = this.randomVector();
      }
    }
  }

  randomVector() {
    let angle = Math.random() * 2 * Math.PI;
    return {x: Math.cos(angle), y: Math.sin(angle)};
  }

  // Function to transition smoothly from 0.0 to 1.0 in the range [0.0, 1.0]
   smoothstep(w) {
    if (w <= 0.0) return 0.0;
    if (w >= 1.0) return 1.0;
    return w * w * (3.0 - 2.0 * w);
  }

  // Function to interpolate smoothly between a0 and a1
  // Weight w should be in the range [0.0, 1.0]
  interpolate(a0, a1, w) {
    return a0 + (a1 - a0) * this.smoothstep(w);
  }

  // Computes the dot product of the distance and gradient vectors.
  dotGridGradient(ix, iy, x, y) {
    // Compute the distance vector
    let dx = x - ix;
    let dy = y - iy;

    // Compute the dot-product
    return (dx * this.gradients[[ix, iy]].x + dy * this.gradients[[ix, iy]].y);
  }

  // Compute Perlin noise at coordinates x, y
  noise(x, y) {

    if ([x,y] in this.perlinNoises)
      return this.perlinNoises[[x,y]]

    // Determine grid cell coordinates
    let x0 = Math.floor(x);
    let x1 = x0 + 1;
    let y0 = Math.floor(y);
    let y1 = y0 + 1;

    // Determine interpolation weights
    // Could also use higher order polynomial/s-curve here
    let sx = x - x0;
    let sy = y - y0;

    // Interpolate between grid point gradients
    let n0 = this.dotGridGradient(x0, y0, x, y);
    let n1 = this.dotGridGradient(x1, y0, x, y);
    let ix0 = this.interpolate(n0, n1, sx);
    n0 = this.dotGridGradient(x0, y1, x, y);
    n1 = this.dotGridGradient(x1, y1, x, y);
    let ix1 = this.interpolate(n0, n1, sx);
    let value = this.interpolate(ix0, ix1, sy);

    this.perlinNoises[[x,y]] = value;

    return value;
  }

}