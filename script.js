const canvas = document.getElementById("flowFieldCanvas");
const debugcanvas = document.getElementById("debugCanvas");
const ctx = canvas.getContext('2d');
const debugctx = debugcanvas.getContext('2d');

var rendering = true;
var debug = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
debugcanvas.width = window.innerWidth;
debugcanvas.height = window.innerHeight;

// Canvas settings
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;
// Canvas settings
debugctx.fillStyle = 'white';
debugctx.strokeStyle = 'white';
debugctx.lineWidth = 1;

class Particle {

  constructor(effect) {
    /**
     * Each individual Particle that moves around on our flow field.
     * 
     * @param {Effect} effect The orchestrating class that runs the whole Flow Field system.
     * @param {Number} x The starting abscissa of the particle, randomized over the whole width of the screen.
     * @param {Number} y The starting ordinate of the particle, randomized over the whole width of the screen.
     * @param {Number} speedX The speed of the particle over the X axis. It is determined at runtime by the cell the particle is over at a given time.
     * @param {Number} speedY The speed of the particle over the Y axis. It is determined at runtime by the cell the particle is over at a given time.
     * @param {Number} speedModifier A modifier for the speed of the particle, which is also randomized, in order to have particles going at different speeds.
     * @param {Array} history An array containing all previous positions of the particle. Used to display its trail.
     * @param {Number} maxHistoryLength Maximum length of the history array. Determines the length of the trail.
     * @param {Number} timer A timer used to determine when the particle should be reset.
     */
    this.effect = effect;
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.speedX;
    this.speedY;
    this.speedModifier = Math.floor(Math.random() * 3 + 1);
    this.history = [{x: this.x, y: this.y}];
    this.maxHistoryLength = Math.floor(Math.random() * 200 + 10);
    this.timer = this.maxHistoryLength * 2;

    this.colors = ['#4c026b', '#730d9e', "#9622c7", "#b44ae0", "#cd72f2"];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  draw(context) {
    /**
     * The function called each frame to draw the particle on the canvas.
     * 
     * @param {CanvasRenderingContext2D} context Object used to draw on the canvas.
     */
    context.beginPath();
    context.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 0; i < this.history.length; i++) {
      context.lineTo(this.history[i].x, this.history[i].y);
    }
    context.strokeStyle = this.color;
    context.stroke();
  }

  update() {
    /**
     * Function updating the position of the Particle over time. It's called each frame, after drawing the Particle.
     */

    // The timer is used to re-initialize the position of the particle after some time has passed.
    this.timer -= 1;
    if (this.timer >= 1) {
      // Calculating index to find the position of the Particle on the Flow Field.
      let x = Math.floor(this.x / this.effect.cellSize);
      let y = Math.floor(this.y / this.effect.cellSize);

      // Pass if the particle is out of the canvas
      if (x < 0 || x >= this.effect.cols || y < 0 || y >= this.effect.rows) {
        return;
      }
  
      // Change the speed of the Particle according to the Vectors of the close nodes, and the inherit speedModifier of the Particle.
      let interpolatedValues = this.effect.getInterpolation(this);
      this.speedX = interpolatedValues.x;
      this.speedY = interpolatedValues.y;
      this.x += this.speedX * this.speedModifier;
      this.y += this.speedY * this.speedModifier;
  
      // Add the current position to the history of the particle, and remove the oldest known position if the trail is too long.
      this.history.push({x: this.x, y: this.y});
      if (this.history.length > this.maxHistoryLength) {
        this.history.shift();
      }
    } else if (this.history.length > 1) {
      this.history.shift()
    } else {
      this.reset()
    }
  }

  reset() {
    /**
     * Resets the position of the Particle to a new random point in the 2D space, the history to an empty array and the timer to it's original value.
     */
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.history = [{x: this.x, y: this.y}];
    this.timer = this.maxHistoryLength * 2;
  }
}

class Effect {

  constructor(canvas, debugcanvas) {
    /**
     * @param {Number} width Width of the screen and canvas.
     * @param {Number} height Height of the screen and canvas.
     * @param {Array} particles An array containing every particle on the screen.
     * @param {Number} numberOfParticles The total number of particles on the screen.
     * @param {Number} cellSize The size of each individual cells.
     * @param {Number} rows The number of rows of the Flow Field. Computed from the size of the cells and the size of the screen.
     * @param {Number} cols The number of cols of the Flow Field. Computed from the size of the cells and the size of the screen.
     * @param {Array} flowField This array hold every Vector2D for each cell of the Flow Field.
     * @param {Number} zoomOut The zoom to apply on the pattern displayed (It's trigonometry stuff).
     * @param {Number} curve Modifies the curves the trajectories will follow (Also trigonometry stuff).
     */
    this.canvas = canvas;
    this.debugcanvas = debugcanvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.particles = [];
    this.numberOfParticles = 1000;
    this.cellSize = 30;
    this.rows;
    this.cols;
    this.flowField = [];
    this.zoomOut = 0.11;
    this.curve = 0.6;
    this.incr = 0.1;
    this.debug = false;
    this.perlin = new Perlin(this.width, this.height);

    this.init();

    window.addEventListener('resize', e => {
      this.resize(e.target.innerWidth, e.target.innerHeight);
    })
  }

  init() {
    // Create Flow Field
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);
    this.flowField = [];
    let yoff = 0;
    for (let y = 0; y <= this.rows; y++) {
      let arr = [];
      let xoff = 0;
      for (let x = 0; x <= this.cols; x++) {
        // let cell = {x: Math.cos(x * this.zoomOut) * this.curve, y: Math.sin(y * this.zoomOut) * this.curve};
        let angle = this.perlin.noise(xoff, yoff) * Math.PI * 2;
        let cell = {x: Math.cos(angle), y: Math.sin(angle)};
        cell.xpos = x * this.cellSize;
        cell.ypos = y * this.cellSize;
        arr.push(cell);
        xoff += this.incr;
      }
      this.flowField.push(arr);
      yoff += this.incr;
    }
    
    // Create particles
    this.particles = []
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  drawGrid(context) {
    context.save();
    context.strokeStyle = 'red';
    context.lineWidth = 0.7;
    for (let c = 0; c <= this.cols; c++) {
      context.beginPath();
      context.moveTo(this.cellSize * c, 0);
      context.lineTo(this.cellSize * c, this.height);
      context.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      context.beginPath();
      context.moveTo(0, this.cellSize * r);
      context.lineTo(this.width, this.cellSize * r);
      context.stroke();
    }
    context.restore();
  }

  drawVectors(context) {
    context.save();
    context.strokeStyle = 'white';
    context.lineWidth = 0.7;
    this.flowField.forEach(row => {
      row.forEach(cell => {
        context.beginPath();
        context.moveTo(cell.xpos, cell.ypos);
        context.lineTo(cell.xpos + cell.x * 10, cell.ypos + cell.y * 10);
        context.stroke();

      })
    })
    context.restore();
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.debugcanvas.width = width;
    this.debugcanvas.height = height;
    this.width = width;
    this.height = width;
    this.init();
  }

  bilinearInterp(x, a, b, c, d, axis='x') {
    let row0 = (b.xpos - x.x) / (b.xpos - a.xpos) * a[axis] + (x.x - a.xpos) / (b.xpos - a.xpos) * b[axis];
    let row1 = (b.xpos - x.x) / (b.xpos - a.xpos) * c[axis] + (x.x - a.xpos) / (b.xpos - a.xpos) * d[axis];

    return (c.ypos - x.y) / (c.ypos - a.ypos) * row0 + (x.y - a.ypos) / (c.ypos - a.ypos) * row1
  }

  getInterpolation(particle) {
    let topleft_node_x = ~~(particle.x / this.cellSize);
    let topleft_node_y = ~~(particle.y / this.cellSize);
    //interpolate
    let x_value = this.bilinearInterp(
      particle,
      this.flowField[topleft_node_y][topleft_node_x],
      this.flowField[topleft_node_y][topleft_node_x + 1],
      this.flowField[topleft_node_y + 1][topleft_node_x],
      this.flowField[topleft_node_y + 1][topleft_node_x + 1],
      'x'
    );
    let y_value = this.bilinearInterp(
      particle,
      this.flowField[topleft_node_y][topleft_node_x],
      this.flowField[topleft_node_y][topleft_node_x + 1],
      this.flowField[topleft_node_y + 1][topleft_node_x],
      this.flowField[topleft_node_y + 1][topleft_node_x + 1],
      'y'
    );
    return {x: x_value, y: y_value};
  }

  render(context) {
    /**
     * Called each frame. For each particle in the particles array, draw them on canvas then update their position.
     * 
     * @param {CanvasRenderingContext2D} context Object used to draw on the canvas.
     */
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();
    })
  }

  reset(context) {
    context.clearRect(0, 0, this.width, this.height);
    this.perlin.init(this.width, this.height);
    this.init();
  }

  drawDebug(context) {
    this.debug = !this.debug;
    context.clearRect(0, 0, this.width, this.height);
    if (this.debug) {
      this.drawGrid(context);
      this.drawVectors(context);
    }
  }
}

function animate() {
  /**
   * This function is the main loop of the program. It clears the whole canvas, render every object then loop again.
   */
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.render(ctx);
  if (rendering)
    requestAnimationFrame(animate);
}

window.addEventListener('keydown', e => {
  if (e.key === 'd') {
    effect.drawDebug(debugctx);
  } else if (e.key === 'p') {
    rendering = !rendering;
    if (rendering) {
      animate();
    }
  } else if (e.key === 'r') {
    effect.reset(ctx);
  }
})

const effect = new Effect(canvas, debugcanvas);
animate();

document.getElementById("pauseButton").addEventListener("click", e => {
  rendering = !rendering;
  if (rendering) {
    animate();
  }
})
document.getElementById("resetButton").addEventListener("click", e => {
  effect.reset(ctx);
})
document.getElementById("debugButton").addEventListener("click", e => {
  effect.drawDebug(debugctx);
})