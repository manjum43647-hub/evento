(function() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  const particles = [];
  const particleCount = 40;
  const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#ffecd2'];
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 80 + 40;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.15 + 0.05; this.maxOpacity = this.opacity;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x - this.radius > canvas.width) this.x = -this.radius;
      if (this.x + this.radius < 0) this.x = canvas.width + this.radius;
      if (this.y - this.radius > canvas.height) this.y = -this.radius;
      if (this.y + this.radius < 0) this.y = canvas.height + this.radius;
    }
    draw() {
      ctx.fillStyle = this.color; ctx.globalAlpha = this.opacity;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  for (let i = 0; i < particleCount; i++) particles.push(new Particle());
  let time = 0;
  function animate() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f0c29'); gradient.addColorStop(0.5, '#1a1a2e'); gradient.addColorStop(1, '#0d1b2a');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rg = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height));
    rg.addColorStop(0, 'rgba(102,126,234,0.1)'); rg.addColorStop(1, 'rgba(102,126,234,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, canvas.width, canvas.height);
    time += 0.01;
    particles.forEach((p, idx) => { p.update(); p.opacity = p.maxOpacity + Math.sin(time + idx) * p.maxOpacity * 0.5; p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
})();
