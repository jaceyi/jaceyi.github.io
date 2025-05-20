// 枫叶飘落动画实现
class Leaf {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.reset();
  }

  reset() {
    // Set initial position at top right
    this.x = Math.random() * this.canvas.width * 0.2 + this.canvas.width * 0.8;
    this.y = Math.random() * this.canvas.height * 0.2 - 100;

    // Leaf size
    this.size = Math.random() * 30 + 20;

    // Rotation angle and speed
    this.angle = Math.random() * Math.PI * 2;
    this.rotationSpeed = Math.random() * 0.02 - 0.01;

    // Falling speed
    this.speedX = Math.random() * 1 - 2;
    this.speedY = Math.random() * 2 + 1;

    // Swing motion
    this.swing = Math.random() * 0.1;
    this.swingSpeed = Math.random() * 0.05 + 0.02;
    this.swingOffset = Math.random() * Math.PI * 4;
  }

  update() {
    // Update position
    this.x += this.speedX;
    this.y += this.speedY + Math.sin(this.swingOffset) * this.swing;

    // Update rotation
    this.angle += this.rotationSpeed;
    this.swingOffset += this.swingSpeed;

    // Reset if leaf goes off screen
    if (this.y > this.canvas.height + this.size || this.x < 0) {
      this.reset();
    }
  }

  draw() {
    this.ctx.save();
    this.ctx.translate(this.x, this.y);
    this.ctx.rotate(this.angle);

    this.ctx.drawImage(
      Leaf.image,
      -this.size / 2,
      -this.size / 2,
      this.size,
      this.size
    );

    this.ctx.restore();
  }
}

class LeafAnimation {
  constructor(canvasId, leafCount = 5) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.leaves = [];
    this.leafCount = leafCount;

    // Set canvas size
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());

    // Create leaves
    this.createLeaves();

    // Start animation
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
  }

  createLeaves() {
    for (let i = 0; i < this.leafCount; i++) {
      this.leaves.push(new Leaf(this.canvas));
    }
  }

  animate() {
    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update and draw all leaves
    this.leaves.forEach((leaf) => {
      leaf.update();
      leaf.draw();
    });

    // Continue animation loop
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize animation when page loads
window.addEventListener("DOMContentLoaded", () => {
  // Create 4-6 leaves
  const img = new Image();
  img.src = "/static/images/leaf.png";
  img.onload = () => {
    Leaf.image = img;
    const leafCount = Math.floor(Math.random() * 5) + 5;
    new LeafAnimation("leafCanvas", leafCount);
  };
});
