/**
 * Premium Full-Background Canvas Fire & Flame Animation Engine
 * Renders volcanic flames, floating fire embers, dynamic heat aura, and interactive spark bursts.
 */
class HeroFlamesEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.flames = [];
        this.embers = [];
        this.mouseSparks = [];
        
        this.maxFlames = 180;
        this.maxEmbers = 120;

        this.mouse = { x: this.width / 2, y: this.height / 2, lastX: 0, lastY: 0, active: false };
        this.time = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('mousemove', (e) => {
            const dx = e.clientX - this.mouse.lastX;
            const dy = e.clientY - this.mouse.lastY;
            const speed = Math.sqrt(dx * dx + dy * dy);

            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;

            // Spawn mouse interactive sparks when moving cursor fast
            if (speed > 4 && this.mouseSparks.length < 50) {
                for (let i = 0; i < Math.min(Math.floor(speed / 3), 4); i++) {
                    this.mouseSparks.push(this.createMouseSpark(e.clientX, e.clientY));
                }
            }

            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });

        // Initialize particles
        for (let i = 0; i < this.maxFlames; i++) {
            this.flames.push(this.createFlameParticle(true));
        }

        for (let i = 0; i < this.maxEmbers; i++) {
            this.embers.push(this.createEmberParticle(true));
        }

        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    }

    createFlameParticle(randomY = false) {
        const x = Math.random() * this.width;
        const y = randomY ? Math.random() * this.height : this.height + Math.random() * 40;

        const maxLife = 60 + Math.random() * 80;
        const radius = 35 + Math.random() * 55;

        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 1.2,
            vy: -(2.2 + Math.random() * 3.2),
            radius,
            initialRadius: radius,
            life: randomY ? Math.random() * maxLife : 0,
            maxLife,
            hue: 10 + Math.random() * 35, // Red to Orange-Yellow
            wobbleSpeed: 0.02 + Math.random() * 0.04,
            wobbleAmp: 1.2 + Math.random() * 2.0
        };
    }

    createEmberParticle(randomY = false) {
        const x = Math.random() * this.width;
        const y = randomY ? Math.random() * this.height : this.height + 20 + Math.random() * 40;

        const maxLife = 140 + Math.random() * 180;
        const size = 1.8 + Math.random() * 4.0;

        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(0.8 + Math.random() * 2.2),
            size,
            life: randomY ? Math.random() * maxLife : 0,
            maxLife,
            phase: Math.random() * Math.PI * 2,
            color: Math.random() > 0.4 ? '#ff5500' : (Math.random() > 0.5 ? '#ffaa00' : '#ff1100')
        };
    }

    createMouseSpark(x, y) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4;
        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5, // Bias upward
            size: 2 + Math.random() * 3,
            life: 0,
            maxLife: 30 + Math.random() * 30,
            color: '#ffeeaa'
        };
    }

    update() {
        this.time += 0.025;

        // Update Flame Particles
        for (let i = 0; i < this.flames.length; i++) {
            const f = this.flames[i];
            f.life++;

            if (f.life >= f.maxLife || f.y < -f.radius * 2) {
                this.flames[i] = this.createFlameParticle(false);
                continue;
            }

            const progress = f.life / f.maxLife;

            f.y += f.vy;
            f.x += f.vx + Math.sin(this.time * 2 + f.wobbleSpeed * f.life) * f.wobbleAmp;

            // Interactive repulsion/attraction to cursor
            if (this.mouse.active) {
                const dx = f.x - this.mouse.x;
                const dy = f.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 45000 && distSq > 0) {
                    const force = (1 - Math.sqrt(distSq) / 212) * 2;
                    f.x += (dx > 0 ? 1 : -1) * force;
                }
            }

            f.radius = f.initialRadius * (1 - Math.pow(progress, 0.7));
        }

        // Update Embers
        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            e.life++;

            if (e.life >= e.maxLife || e.y < -20) {
                this.embers[i] = this.createEmberParticle(false);
                continue;
            }

            e.y += e.vy;
            e.x += e.vx + Math.sin(this.time * 3 + e.phase) * 1.2;

            if (this.mouse.active) {
                const dx = e.x - this.mouse.x;
                const dy = e.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 35000 && distSq > 0) {
                    const force = (1 - Math.sqrt(distSq) / 187) * 2.5;
                    e.x += (dx > 0 ? 1 : -1) * force;
                }
            }
        }

        // Update Mouse Sparks
        for (let i = this.mouseSparks.length - 1; i >= 0; i--) {
            const s = this.mouseSparks[i];
            s.life++;
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.05; // Gravity pull

            if (s.life >= s.maxLife) {
                this.mouseSparks.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Enable additive blending for fiery glow
        this.ctx.globalCompositeOperation = 'lighter';

        // 1. Ambient Volcanic Flame Glow at Bottom
        const glow = this.ctx.createRadialGradient(
            this.width / 2, this.height, 100,
            this.width / 2, this.height, this.width * 0.85
        );
        const pulse = 0.18 + Math.sin(this.time * 2.5) * 0.05;
        glow.addColorStop(0, `rgba(255, 45, 0, ${pulse * 2})`);
        glow.addColorStop(0.5, `rgba(255, 120, 0, ${pulse})`);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = glow;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. Render Flame Tendrils
        for (let i = 0; i < this.flames.length; i++) {
            const f = this.flames[i];
            if (f.radius <= 0.5) continue;

            const progress = f.life / f.maxLife;
            const alpha = Math.sin(progress * Math.PI) * 0.45;

            const grad = this.ctx.createRadialGradient(
                f.x, f.y, 0,
                f.x, f.y, Math.max(f.radius, 1)
            );

            const hue = f.hue + progress * 20;
            grad.addColorStop(0, `hsla(${hue + 25}, 100%, 80%, ${alpha * 1.3})`);
            grad.addColorStop(0.35, `hsla(${hue}, 100%, 55%, ${alpha})`);
            grad.addColorStop(0.75, `hsla(${hue - 15}, 90%, 35%, ${alpha * 0.4})`);
            grad.addColorStop(1, 'hsla(0, 100%, 10%, 0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, Math.max(f.radius, 1), 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 3. Render Sparks & Embers
        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            const progress = e.life / e.maxLife;
            const alpha = (1 - Math.pow(progress, 1.8)) * (0.6 + Math.sin(this.time * 8 + e.phase) * 0.4);

            this.ctx.fillStyle = e.color;
            this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = e.color;

            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 4. Render Mouse Sparks
        for (let i = 0; i < this.mouseSparks.length; i++) {
            const s = this.mouseSparks[i];
            const alpha = 1 - (s.life / s.maxLife);

            this.ctx.fillStyle = s.color;
            this.ctx.globalAlpha = Math.max(0, alpha);
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = '#ff9900';

            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Reset composite & alpha for next frame
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    animate() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    new HeroFlamesEngine('hero-flames-canvas');
});
