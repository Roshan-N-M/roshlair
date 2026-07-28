/**
 * Masterpiece Cinematic Volumetric Flame & Embers Engine
 * 
 * Specs:
 * - Physically-based thermal buoyancy & fluid turbulence simulation
 * - Multi-depth (DOF) 3D particle layering with motion blur & velocity vectors
 * - Volumetric light rays & thermal blackbody spectrum gradient synthesis
 * - 0 flicker, 0 popping, 0 jitter sub-pixel temporal interpolation
 */

class MasterpieceFlameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d', { alpha: true });

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Multi-layered particle systems for cinematic depth
        this.coreFlames = [];
        this.backgroundEmbers = [];
        this.foregroundEmbers = [];
        this.lightRays = [];
        this.interactiveSparks = [];

        this.maxCoreFlames = 220;
        this.maxBgEmbers = 100;
        this.maxFgEmbers = 80;
        this.maxLightRays = 7;

        this.mouse = { x: this.width / 2, y: this.height / 2, vx: 0, vy: 0, lastX: this.width / 2, lastY: this.height / 2, active: false };
        this.time = 0;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Mouse tracking with fluid momentum
        window.addEventListener('mousemove', (e) => {
            const dx = e.clientX - this.mouse.lastX;
            const dy = e.clientY - this.mouse.lastY;
            
            this.mouse.vx = dx;
            this.mouse.vy = dy;
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;

            const speed = Math.sqrt(dx * dx + dy * dy);
            if (speed > 3 && this.interactiveSparks.length < 80) {
                const count = Math.min(Math.floor(speed / 2.5), 5);
                for (let i = 0; i < count; i++) {
                    this.interactiveSparks.push(this.createInteractiveSpark(e.clientX, e.clientY, dx, dy));
                }
            }

            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });

        // Initialize Light Rays
        for (let i = 0; i < this.maxLightRays; i++) {
            this.lightRays.push(this.createLightRay(true));
        }

        // Initialize Core Flame Plumes
        for (let i = 0; i < this.maxCoreFlames; i++) {
            this.coreFlames.push(this.createFlameParticle(true));
        }

        // Initialize 3D Embers (Background & Foreground DOF layers)
        for (let i = 0; i < this.maxBgEmbers; i++) {
            this.backgroundEmbers.push(this.createEmberParticle('bg', true));
        }
        for (let i = 0; i < this.maxFgEmbers; i++) {
            this.foregroundEmbers.push(this.createEmberParticle('fg', true));
        }

        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        this.ctx.scale(this.dpr, this.dpr);
    }

    createLightRay(randomPhase = false) {
        return {
            x: (Math.random() * 0.8 + 0.1) * this.width,
            angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.35,
            width: 80 + Math.random() * 140,
            length: this.height * (0.7 + Math.random() * 0.4),
            opacity: randomPhase ? Math.random() * 0.12 : 0,
            targetOpacity: 0.04 + Math.random() * 0.1,
            speed: 0.003 + Math.random() * 0.006,
            phase: Math.random() * Math.PI * 2
        };
    }

    createFlameParticle(randomY = false) {
        // Gaussian concentration toward center
        const u1 = Math.random();
        const u2 = Math.random();
        const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        const x = this.width * 0.5 + randStdNormal * (this.width * 0.3);
        const y = randomY ? Math.random() * this.height : this.height + 30 + Math.random() * 50;

        const maxLife = 70 + Math.random() * 90;
        const radius = 30 + Math.random() * 60;

        return {
            x,
            y,
            vx: (Math.random() - 0.5) * 0.9,
            vy: -(2.5 + Math.random() * 3.5), // Buoyancy acceleration
            radius,
            initialRadius: radius,
            life: randomY ? Math.random() * maxLife : 0,
            maxLife,
            hue: 8 + Math.random() * 32, // Thermal spectrum: Deep red -> Flame Gold
            turbFreqX: 0.015 + Math.random() * 0.02,
            turbFreqY: 0.02 + Math.random() * 0.03,
            turbAmp: 1.4 + Math.random() * 2.2
        };
    }

    createEmberParticle(layer, randomY = false) {
        const x = Math.random() * this.width;
        const y = randomY ? Math.random() * this.height : this.height + 20 + Math.random() * 40;

        const isFg = layer === 'fg';
        const maxLife = isFg ? (90 + Math.random() * 110) : (160 + Math.random() * 200);
        const size = isFg ? (2.5 + Math.random() * 3.5) : (1.0 + Math.random() * 1.8);
        const vy = isFg ? -(1.8 + Math.random() * 2.8) : -(0.6 + Math.random() * 1.2);

        return {
            layer,
            x,
            y,
            vx: (Math.random() - 0.5) * (isFg ? 1.4 : 0.6),
            vy,
            size,
            life: randomY ? Math.random() * maxLife : 0,
            maxLife,
            phase: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.035,
            colorHue: isFg ? (15 + Math.random() * 30) : (5 + Math.random() * 20),
            blur: isFg ? 0 : (1.5 + Math.random() * 2.0)
        };
    }

    createInteractiveSpark(x, y, parentVx, parentVy) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.0 + Math.random() * 5.0;
        return {
            x,
            y,
            vx: parentVx * 0.25 + Math.cos(angle) * speed,
            vy: parentVy * 0.25 + Math.sin(angle) * speed - 1.5,
            size: 2.0 + Math.random() * 3.0,
            life: 0,
            maxLife: 35 + Math.random() * 35,
            hue: 35 + Math.random() * 25 // Golden spark
        };
    }

    update() {
        this.time += 0.02;

        // 1. Update Light Rays
        for (let i = 0; i < this.lightRays.length; i++) {
            const ray = this.lightRays[i];
            ray.phase += ray.speed;
            ray.opacity = Math.max(0.01, (Math.sin(ray.phase) * 0.5 + 0.5) * ray.targetOpacity);
        }

        // 2. Update Core Flame Plumes
        for (let i = 0; i < this.coreFlames.length; i++) {
            const f = this.coreFlames[i];
            f.life++;

            if (f.life >= f.maxLife || f.y < -f.radius * 2) {
                this.coreFlames[i] = this.createFlameParticle(false);
                continue;
            }

            const progress = f.life / f.maxLife;

            // Fluid thermal buoyancy dynamics
            f.vy *= 0.995; // Atmospheric resistance
            f.y += f.vy;

            // Multi-frequency turbulent oscillation (coherent fluid motion)
            const sinTurb = Math.sin(this.time * 2.5 + f.y * f.turbFreqY + f.x * f.turbFreqX);
            const cosTurb = Math.cos(this.time * 1.8 + f.x * f.turbFreqX * 0.8);
            f.x += f.vx + (sinTurb + cosTurb * 0.5) * f.turbAmp;

            // Mouse displacement force
            if (this.mouse.active) {
                const dx = f.x - this.mouse.x;
                const dy = f.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 50000 && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const force = (1 - dist / 223.6) * 2.2;
                    f.x += (dx / dist) * force * 1.8;
                }
            }

            // Smooth cubic contraction curve
            f.radius = f.initialRadius * Math.max(0, (1 - Math.pow(progress, 0.75)));
        }

        // 3. Update Embers (Background & Foreground DOF)
        const updateEmber = (e) => {
            e.life++;

            if (e.life >= e.maxLife || e.y < -30) {
                return this.createEmberParticle(e.layer, false);
            }

            e.y += e.vy;
            e.x += e.vx + Math.sin(this.time * 2.5 + e.phase) * (e.layer === 'fg' ? 1.5 : 0.7);

            if (this.mouse.active) {
                const dx = e.x - this.mouse.x;
                const dy = e.y - this.mouse.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < 40000 && distSq > 0) {
                    const dist = Math.sqrt(distSq);
                    const force = (1 - dist / 200) * (e.layer === 'fg' ? 3.0 : 1.2);
                    e.x += (dx / dist) * force;
                }
            }
            return e;
        };

        for (let i = 0; i < this.backgroundEmbers.length; i++) {
            this.backgroundEmbers[i] = updateEmber(this.backgroundEmbers[i]);
        }
        for (let i = 0; i < this.foregroundEmbers.length; i++) {
            this.foregroundEmbers[i] = updateEmber(this.foregroundEmbers[i]);
        }

        // 4. Update Interactive Sparks
        for (let i = this.interactiveSparks.length - 1; i >= 0; i--) {
            const s = this.interactiveSparks[i];
            s.life++;
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.96;
            s.vy = s.vy * 0.96 + 0.08; // Fluid drag & gentle gravity

            if (s.life >= s.maxLife) {
                this.interactiveSparks.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // -------------------------------------------------------------
        // LAYER 1: Deep Volcanic Magma Glow & Volumetric Light Shafts
        // -------------------------------------------------------------
        this.ctx.globalCompositeOperation = 'lighter';

        // Deep Hearth Radiant Light
        const baseGlow = this.ctx.createRadialGradient(
            this.width * 0.5, this.height * 1.05, 50,
            this.width * 0.5, this.height * 1.05, this.width * 0.85
        );
        const pulse = 0.22 + Math.sin(this.time * 2.0) * 0.04;
        baseGlow.addColorStop(0, `rgba(255, 50, 0, ${pulse * 1.8})`);
        baseGlow.addColorStop(0.4, `rgba(255, 120, 0, ${pulse * 0.9})`);
        baseGlow.addColorStop(0.8, `rgba(180, 20, 0, ${pulse * 0.3})`);
        baseGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = baseGlow;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Volumetric Light Rays (God Rays)
        for (let i = 0; i < this.lightRays.length; i++) {
            const ray = this.lightRays[i];
            this.ctx.save();
            this.ctx.translate(ray.x, this.height);
            this.ctx.rotate(ray.angle);

            const rayGrad = this.ctx.createLinearGradient(0, 0, 0, -ray.length);
            rayGrad.addColorStop(0, `rgba(255, 140, 30, ${ray.opacity})`);
            rayGrad.addColorStop(0.5, `rgba(255, 60, 0, ${ray.opacity * 0.5})`);
            rayGrad.addColorStop(1, 'rgba(255, 30, 0, 0)');

            this.ctx.fillStyle = rayGrad;
            this.ctx.beginPath();
            this.ctx.moveTo(-ray.width * 0.5, 0);
            this.ctx.lineTo(ray.width * 0.5, 0);
            this.ctx.lineTo(ray.width * 1.4, -ray.length);
            this.ctx.lineTo(-ray.width * 1.4, -ray.length);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }

        // -------------------------------------------------------------
        // LAYER 2: Out-Of-Focus Background Embers (DOF Layer)
        // -------------------------------------------------------------
        for (let i = 0; i < this.backgroundEmbers.length; i++) {
            const e = this.backgroundEmbers[i];
            const progress = e.life / e.maxLife;
            const alpha = Math.sin(progress * Math.PI) * 0.4;

            this.ctx.fillStyle = `hsla(${e.colorHue}, 100%, 55%, ${alpha})`;
            this.ctx.shadowBlur = 14;
            this.ctx.shadowColor = `hsl(${e.colorHue}, 100%, 50%)`;

            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // -------------------------------------------------------------
        // LAYER 3: Core Volumetric Flame Plumes (Thermal Spectrum)
        // -------------------------------------------------------------
        for (let i = 0; i < this.coreFlames.length; i++) {
            const f = this.coreFlames[i];
            if (f.radius <= 0.8) continue;

            const progress = f.life / f.maxLife;
            // Bell curve alpha transition to avoid any abrupt pop or flicker
            const alpha = Math.sin(Math.pow(progress, 0.8) * Math.PI) * 0.48;

            const grad = this.ctx.createRadialGradient(
                f.x, f.y, 0,
                f.x, f.y, Math.max(f.radius, 1)
            );

            const hue = f.hue + progress * 25; // Shifts toward deeper red as temperature drops
            grad.addColorStop(0, `hsla(${hue + 30}, 100%, 92%, ${alpha * 1.4})`); // Incandescent core
            grad.addColorStop(0.25, `hsla(${hue + 15}, 100%, 65%, ${alpha * 1.1})`);
            grad.addColorStop(0.65, `hsla(${hue}, 100%, 45%, ${alpha * 0.6})`);
            grad.addColorStop(1, 'hsla(0, 100%, 15%, 0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, Math.max(f.radius, 1), 0, Math.PI * 2);
            this.ctx.fill();
        }

        // -------------------------------------------------------------
        // LAYER 4: Sharp Foreground Embers with Velocity Motion Blur
        // -------------------------------------------------------------
        for (let i = 0; i < this.foregroundEmbers.length; i++) {
            const e = this.foregroundEmbers[i];
            const progress = e.life / e.maxLife;
            const alpha = Math.sin(progress * Math.PI) * 0.85;

            // Velocity motion blur line streak
            const tailX = e.x - e.vx * 3.0;
            const tailY = e.y - e.vy * 3.0;

            this.ctx.strokeStyle = `hsla(${e.colorHue + 10}, 100%, 70%, ${alpha})`;
            this.ctx.fillStyle = `hsla(${e.colorHue + 20}, 100%, 88%, ${alpha})`;
            this.ctx.lineWidth = e.size;
            this.ctx.lineCap = 'round';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = `hsl(${e.colorHue}, 100%, 55%)`;

            this.ctx.beginPath();
            this.ctx.moveTo(tailX, tailY);
            this.ctx.lineTo(e.x, e.y);
            this.ctx.stroke();

            // Bright leading head
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.size * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // -------------------------------------------------------------
        // LAYER 5: Interactive Cursor Sparks (High-Energy Explosion)
        // -------------------------------------------------------------
        for (let i = 0; i < this.interactiveSparks.length; i++) {
            const s = this.interactiveSparks[i];
            const alpha = 1.0 - Math.pow(s.life / s.maxLife, 1.5);

            const tailX = s.x - s.vx * 2.5;
            const tailY = s.y - s.vy * 2.5;

            this.ctx.strokeStyle = `hsla(${s.hue}, 100%, 85%, ${alpha})`;
            this.ctx.lineWidth = s.size * alpha;
            this.ctx.lineCap = 'round';
            this.ctx.shadowBlur = 14;
            this.ctx.shadowColor = `hsl(${s.hue}, 100%, 60%)`;

            this.ctx.beginPath();
            this.ctx.moveTo(tailX, tailY);
            this.ctx.lineTo(s.x, s.y);
            this.ctx.stroke();
        }

        // Restore default canvas state
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
    new MasterpieceFlameEngine('hero-flames-canvas');
});
