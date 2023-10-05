const canvas = document.getElementById("flowFieldCanva");
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Canvas settings
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;

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
     * @param {Number} angle Angle of the flow field cell underneath. Used to calculate direction.
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
    this.angle = 0;
    this.timer = this.maxHistoryLength * 2;
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
      let index = y * this.effect.cols + x;
      this.angle = this.effect.flowField[index];
  
      // Change the speed of the Particle according to the angle of the cell it is currently on, and the inherit speedModifier of the Particle.
      this.speedX = Math.cos(this.angle);
      this.speedY = Math.sin(this.angle);
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

  constructor(width, height) {
    /**
     * @param {Number} width Width of the screen and canvas.
     * @param {Number} height Height of the screen and canvas.
     * @param {Array} particles An array containing every particle on the screen.
     * @param {Number} numberOfParticles The total number of particles on the screen.
     * @param {Number} cellSize The size of each individual cells.
     * @param {Number} rows The number of rows of the Flow Field. Computed from the size of the cells and the size of the screen.
     * @param {Number} cols The number of cols of the Flow Field. Computed from the size of the cells and the size of the screen.
     * @param {Array} flowField This array hold every angle for each cell of the Flow Field.
     * @param {Number} zoomOut The zoom to apply on the pattern displayed (It's trigonometry stuff).
     * @param {Number} curve Modifies the curves the trajectories will follow (Also trigonometry stuff).
     */
    this.width = width;
    this.height = height;
    this.particles = [];
    this.numberOfParticles = 500;
    this.cellSize = 10;
    this.rows;
    this.cols;
    this.flowField = [];
    this.zoomOut = 0.3;
    this.curve = 0.2;
    this.init();
  }

  init() {
    // Create Flow Field
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);
    this.flowField = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let angle = (Math.cos(x * this.zoomOut) + Math.sin(y * this.zoomOut)) * this.curve;
        this.flowField.push(angle);
      }
    }
    console.log(this.flowField);

    // Create particles
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
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
}

const effect = new Effect(canvas.width, canvas.height);

function animate() {
  /**
   * This function is the main loop of the program. It clears the whole canvas, render every object then loop again.
   */
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  effect.render(ctx);
  requestAnimationFrame(animate);
}

animate();