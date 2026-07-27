/**
 * Ultra-High-Fidelity Canvas Fire & Flame Embers Animation Engine
 * Renders volcanic flames, rising sparks, heat aura, and ambient fire motion in the Hero Lair background.
 */
class HeroFlamesEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.width = 0;
        this.height = 0;
        this.dpr = window.devicePixelRatio || 1;

        this.particles = [];
        this.embers = [];
        this.maxParticles = 140;
        this.maxEmbers = 90;

        this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0, active: false };
        this.time = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        const hero = this.canvas.closest('.hero') || document.body;
        hero.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.targetX = e.clientX - rect.left;
            this.mouse.targetY = e.clientY - rect.top;
            this.mouse.active = true;
        });

        hero.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });

        // Pre-populate particles & embers
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createFlameParticle(true));
        }

        for (let i = 0; i < this.maxEmbers; i++) {
            this.embers.push(this.createEmberParticle(true));
        }

        this.animate();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
    }

    createFlameParticle(randomY = false) {
        // Spawn along the bottom edge with concentration in center
        const distribution = (Math.random() + Math.random()) / 2; // bell-curve centered
        const x = this.width * (0.1 + distribution * 0.8);
        const y = randomY ? this.height * (0.6 + Math.random() * 0.45) : this.height + Math.random() * 20;

        const maxLife = 50 + Math.random() * 70;
        const radius = 25 + Math.random() * 45;

        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -(1.8 + Math.random() * 2.5),
            radius,
            initialRadius: radius,
            life: randomY ? Math.random() * maxLife : 0,
            maxLife,
            hue: 12 + Math.random() * 28, // 12 (deep red-orange) to 40 (golden orange)
            saturation: 90 + Math.random() * 10,
            lightness: 45 + Math.random() * 25,
            wobbleSpeed: 0.03 + Math.random() * 0.05,
            wobbleAmp: 0.8 + Math.random() * 1.5
        };
    }

    createEmberParticle(randomY = false) {
        const x = Math.random() * this.width;
        const y = randomY ? Math.random() * this.height : this.height + 10 + Math.random() * 20;

        const maxLife = 120 + Math.random() * 160;
        const size = 1.5 + Math.random() * 3.5;

        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.6,
            vy: -(0.7 + Math.random() * 1.6),
            size,
            life: randomY ? Math.random() * maxLife : 0,
            maxLife,
            phase: Math.random() * Math.PI * 2,
            freq: 0.02 + Math.random() * 0.03,
            color: Math.random() > 0.3 ? '#ff6a00' : (Math.random() > 0.5 ? '#ffb700' : '#ff2a00')
        };
    }

    update() {
        this.time += 0.02;

        // Smooth mouse movement interpolation
        if (this.mouse.active) {
            this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
            this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;
        }

        // Update Flame Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.life++;

            if (p.life >= p.maxLife || p.y < -p.radius * 2) {
                this.particles[i] = this.createFlameParticle(false);
                continue;
            }

            const progress = p.life / p.maxLife;

            // Upward movement & horizontal sway
            p.y += p.vy;
            p.x += p.vx + Math.sin(this.time * 2 + p.wobbleSpeed * p.life) * p.wobbleAmp;

            // Mouse wind force effect
            if (this.mouse.active) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 40000 && distSq > 0) { // 200px radius
                    const force = (1 - Math.sqrt(distSq) / 200) * 1.2;
                    p.x += (dx > 0 ? 1 : -1) * force * 1.5;
                }
            }

            // Shrink as particle rises
            p.radius = p.initialRadius * (1 - Math.pow(progress, 0.8));
        }

        // Update Embers
        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            e.life++;

            if (e.life >= e.maxLife || e.y < -10) {
                this.embers[i] = this.createEmberParticle(false);
                continue;
            }

            e.y += e.vy;
            e.x += e.vx + Math.sin(this.time * 3 + e.phase) * 0.8;

            if (this.mouse.active) {
                const dx = e.x - this.mouse.x;
                const dy = e.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 30000 && distSq > 0) {
                    const force = (1 - Math.sqrt(distSq) / 173) * 2;
                    e.x += (dx > 0 ? 1 : -1) * force;
                }
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Set additive glow mode for fire lighting
        this.ctx.globalCompositeOperation = 'lighter';

        // 1. Ambient Fire Glow at bottom center
        const glowGradient = this.ctx.createRadialGradient(
            this.width / 2, this.height, 50,
            this.width / 2, this.height * 0.7, this.width * 0.6
        );
        const pulse = 0.12 + Math.sin(this.time * 3) * 0.03;
        glowGradient.addColorStop(0, `rgba(255, 60, 0, ${pulse * 1.8})`);
        glowGradient.addColorStop(0.4, `rgba(255, 120, 0, ${pulse})`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. Render Main Flame Particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (p.radius <= 0.5) continue;

            const progress = p.life / p.maxLife;
            const alpha = Math.sin(progress * Math.PI) * 0.45; // Smooth fade in and out

            const gradient = this.ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, Math.max(p.radius, 1)
            );

            const coreHue = p.hue + progress * 15; // Shift to redder hue near end of life
            gradient.addColorStop(0, `hsla(${coreHue + 20}, 100%, 75%, ${alpha * 1.2})`);
            gradient.addColorStop(0.3, `hsla(${coreHue}, ${p.saturation}%, ${p.lightness}%, ${alpha})`);
            gradient.addColorStop(0.7, `hsla(${coreHue - 10}, 100%, 35%, ${alpha * 0.5})`);
            gradient.addColorStop(1, 'hsla(0, 100%, 10%, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, Math.max(p.radius, 1), 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 3. Render Sparks & Floating Embers
        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            const progress = e.life / e.maxLife;
            const alpha = (1 - Math.pow(progress, 2)) * (0.5 + Math.sin(this.time * 10 + e.phase) * 0.4);

            this.ctx.fillStyle = e.color;
            this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = e.color;

            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Reset context properties for clean frame rendering
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
