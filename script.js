const canvas = document.getElementById("flowFieldCanvas");
const debugcanvas = document.getElementById("debugCanvas");
const ctx = canvas.getContext('2d');
const debugctx = debugcanvas.getContext('2d');

var rendering = true;
var debug = false;

const COLOR_GRADIENTS = [['#4c026b', '#730d9e', "#9622c7", "#b44ae0", "#cd72f2"], // Indigo
                          ['#0042ad', '#184896', '#2167d9', '#4a89f0', '#72a4f7'], // Blue
                          ['#284a2f', '#2b8a3e', '#6cad79', '#069122', '#a4edb2'], // Green
                          ['#c90a1d', '#c9790a', '#c9b90a', '#33c90a', '#0a46c9', '#930ac9', '#c90aa6'], // Rainbow
                          ['#fcba03', '#ab810f', '#e3b842', '#73570a', '#ffdf87'], // Yellow
                          ['#ffc387', '#b85c00', '#f0851a', '#805428', '#ff9326'], // Orange
                          ['#f52c3d', '#ff0016', '#91000d', '#f77c87', '#852931'], // Red
                          ['#fcba03', '#ab810f', '#e3b842', '#73570a', '#ffdf87', '#ffc387', '#b85c00', '#f0851a', '#805428', '#ff9326', '#f52c3d', '#ff0016', '#91000d', '#f77c87', '#852931'], // Sun
                          ['#00fffb', '#03adab', '#41f0ee', '#278c8b', '#78f0ef'], // Light Blue
                        ]

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
    this.color = this.effect.colors[Math.floor(Math.random() * this.effect.colors.length)];
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

  constructor(canvas, ffcontext, debugcontext) {
    /**
     * @param {Number} width Width of the screen and canvas.
     * @param {Number} height Height of the screen and canvas.
     * @param {Array} particles An array containing every particle on the screen.
     * @param {Number} numberOfParticles The total number of particles on the screen.
     * @param {Number} cellSize The size of each individual cells.
     * @param {Number} rows The number of rows of the Flow Field. Computed from the size of the cells and the size of the screen.
     * @param {Number} cols The number of cols of the Flow Field. Computed from the size of the cells and the size of the screen.
     * @param {Array} flowField This array hold every Vector2D for each cell of the Flow Field.
     */
    this.ffcontext = ffcontext;
    this.debugcontext = debugcontext;
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = [];
    this.numberOfParticles = 700;
    this.cellSize = 30;
    this.rows;
    this.cols;
    this.flowField = [];
    // this.zoomOut = 0.11;
    // this.curve = 0.6;
    this.incr = 0.04; // 0.1
    this.debug = false;
    this.colors = COLOR_GRADIENTS[Math.floor(Math.random() * COLOR_GRADIENTS.length)];
    this.perlin = new Perlin(this.width, this.height);

    this.init();
  }

  init() {
    this.generateFlowField();
    this.generateParticles();
  }

  generateFlowField(clear=false) {
    this.rows = Math.floor(this.height / this.cellSize) + 1;
    this.cols = Math.floor(this.width / this.cellSize) + 1;

    if (clear) {
      localStorage.removeItem("flowField");
    }

    this.flowField = JSON.parse(localStorage.getItem("flowField"));

    if (this.flowField === null) {
      console.log('GENERATING FLOW FIELD')
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
    }
    localStorage.setItem("flowField", JSON.stringify(this.flowField));
  }

  generateParticles() {
    // Create particles
    this.particles = [];
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  drawGrid() {
    let debugc = this.debugcontext;
    debugc.save();
    debugc.strokeStyle = 'red';
    debugc.lineWidth = 0.7;
    for (let c = 0; c <= this.cols; c++) {
      debugc.beginPath();
      debugc.moveTo(this.cellSize * c, 0);
      debugc.lineTo(this.cellSize * c, this.height);
      debugc.stroke();
    }
    for (let r = 0; r <= this.rows; r++) {
      debugc.beginPath();
      debugc.moveTo(0, this.cellSize * r);
      debugc.lineTo(this.width, this.cellSize * r);
      debugc.stroke();
    }
    debugc.restore();
  }

  drawVectors() {
    let debugc = this.debugcontext;
    debugc.save();
    debugc.strokeStyle = 'white';
    debugc.lineWidth = 0.7;
    this.flowField.forEach(row => {
      row.forEach(cell => {
        debugc.beginPath();
        debugc.moveTo(cell.xpos, cell.ypos);
        debugc.lineTo(cell.xpos + cell.x * 10, cell.ypos + cell.y * 10);
        debugc.stroke();

      })
    })
    this.debugcontext.restore();
  }

  resize(canvas, debugcanvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    debugcanvas.width = width;
    debugcanvas.height = height;
    this.width = width;
    this.height = height;
    this.generateFlowField(true);
    this.resetRendering();
    this.drawDebug(true);
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

  render() {
    /**
     * Called each frame. For each particle in the particles array, draw them on canvas then update their position.
     * 
     */
    this.particles.forEach(particle => {
      particle.draw(this.ffcontext);
      particle.update();
    })
  }

  resetPerlin() {
    this.perlin.init(this.width, this.height);
    this.generateFlowField(true);
    this.resetRendering();
    this.drawDebug(true);
  }

  resetRendering() {
    this.ffcontext.clearRect(0, 0, this.width, this.height);
    this.particles.forEach(particle => {
      particle.reset();
    });
  }

  drawDebug(forceDraw=false) {
    if (!forceDraw)
      this.debug = !this.debug;
    this.debugcontext.clearRect(0, 0, this.width, this.height);
    if (this.debug) {
      this.drawGrid();
      this.drawVectors();
    }
  }

  changeColors() {
    this.colors = COLOR_GRADIENTS[Math.floor(Math.random() * COLOR_GRADIENTS.length)];
    this.generateParticles();
  }
}

class Chrono {
  constructor() {
    this.lastChrono;
    this.frameRate = 0;
    this.frameRateElement = document.getElementById('frameRate');
    this.second = 0;
  }

  computeChrono(chrono) {
    if (this.lastChrono) {
      let elapsed = chrono - this.lastChrono;
      this.second += elapsed;
      this.frameRate += 1;
    }
    if (this.second >= 1000) {
      this.frameRateElement.innerText = this.frameRate;
      this.second = 0;
      this.frameRate = 0;
    }
    this.lastChrono = chrono;
  }
}

const chrono = new Chrono();

function animate(timestamp) {
  /**
   * This function is the main loop of the program. It clears the whole canvas, render every object then loop again.
   */
  chrono.computeChrono(timestamp);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.render();
  if (rendering)
    requestAnimationFrame(animate);
}

window.addEventListener('keydown', e => {
  if (e.key === 'd') {
    effect.drawDebug();
  } else if (e.key === 'p') {
    rendering = !rendering;
    if (rendering) {
      animate();
    }
  } else if (e.key === 'r' && !e.ctrlKey) {
    effect.resetPerlin(ctx);
  } else if (e.key === 'c') {
    effect.changeColors();
  }
})

const effect = new Effect(canvas, ctx, debugctx);
animate();

window.addEventListener('resize', e => {
  effect.resize(canvas, debugcanvas, e.target.innerWidth, e.target.innerHeight);
})

// Buttons Events
document.getElementById("pauseButton").addEventListener("click", e => {
  rendering = !rendering;
  if (rendering) {
    animate();
  }
})
document.getElementById("resetButton").addEventListener("click", e => {
  effect.resetPerlin(ctx);
})
document.getElementById("debugButton").addEventListener("click", e => {
  effect.drawDebug();
})
document.getElementById("changeColorButton").addEventListener("click", e => {
  effect.changeColors();
})

// Sliders Events
document.getElementById("perlinIncrementInput").addEventListener("input", e => {
  effect.incr = parseFloat(e.target.value);
  effect.resetPerlin();
});
document.getElementById("nbParticlesInput").addEventListener("input", e => {
  effect.numberOfParticles = parseInt(e.target.value, 10);
  effect.generateParticles();
});
document.getElementById("cellSizeSlider").addEventListener("input", e => {
  effect.cellSize = e.target.value;
  effect.generateFlowField(true);
  effect.resetRendering(ctx);
  effect.drawDebug(true);
});