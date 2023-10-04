const canvas = document.getElementById("flowFieldCanva");
const ctx = canvas.getContext('2d');
const particleSize = 1;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Canvas settings
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
// ctx.lineWidth = 1;

class Particle {

  constructor(effect) {
    this.effect = effect;
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
  }

  draw(context) {
    context.fillRect(this.x, this.y, particleSize, particleSize);
  }
}

class Effect {

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.particles = [];
    this.numberOfParticles = 50;
  }

  init() {
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  render(context) {
    this.particles.forEach(particle => {
      particle.draw(context);
    })
  }
}

const effect = new Effect(canvas.width, canvas.height);
effect.init();
effect.render(ctx);
console.log(effect);