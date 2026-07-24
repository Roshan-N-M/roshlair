/**
 * Chinese Dragon WebGL/Canvas Animation Engine
 * Creates a majestic glowing crimson & molten gold energy dragon
 * gracefully looping around the hero section with particle fire trails.
 */

class ChineseDragonEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.segmentsCount = 50;
        this.segments = [];
        this.particles = [];
        this.embers = [];
        this.smokePuffs = [];

        this.time = 0;
        this.breathTimer = 0;
        this.isBreathing = false;
        this.breathDuration = 0;

        // Accessibility preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reducedMotion = mediaQuery.matches;
        mediaQuery.addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
        });

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Initialize dragon segments
        const startX = this.width / 2;
        const startY = this.height / 2;

        for (let i = 0; i < this.segmentsCount; i++) {
            // Taper body radius from head to tail
            let radius = 22;
            if (i === 0) radius = 26; // Head
            else if (i < 10) radius = 24 - i * 0.5;
            else if (i > 35) radius = Math.max(4, 19 - (i - 35) * 1.0);

            this.segments.push({
                x: startX - i * 14,
                y: startY,
                z: 1,
                angle: 0,
                radius: radius,
                index: i
            });
        }

        // Initialize ambient floating embers
        const emberCount = this.reducedMotion ? 15 : 45;
        for (let i = 0; i < emberCount; i++) {
            this.embers.push(this.createAmbientEmber(true));
        }

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = this.canvas.getBoundingClientRect();
        
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }

    createAmbientEmber(randomY = false) {
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : this.height + 20,
            size: Math.random() * 3.5 + 1,
            speedX: (Math.random() - 0.5) * 0.6,
            speedY: -(Math.random() * 0.8 + 0.4),
            alpha: Math.random() * 0.7 + 0.3,
            color: Math.random() > 0.4 ? '#ff9d00' : (Math.random() > 0.5 ? '#ff2323' : '#ffd700'),
            pulse: Math.random() * Math.PI * 2
        };
    }

    spawnTrailParticle(x, y, isGold = false) {
        if (this.reducedMotion && Math.random() > 0.3) return;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;

        this.particles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.3,
            size: Math.random() * 4 + 1.5,
            maxLife: Math.random() * 40 + 20,
            life: 0,
            color: isGold ? '#ffd700' : (Math.random() > 0.5 ? '#ff3b3b' : '#ff9d00')
        });
    }

    spawnFireBreath(headX, headY, headAngle) {
        const particleCount = this.reducedMotion ? 3 : 8;
        for (let i = 0; i < particleCount; i++) {
            const spread = (Math.random() - 0.5) * 0.55;
            const speed = Math.random() * 5 + 3.5;

            this.particles.push({
                x: headX + Math.cos(headAngle) * 30,
                y: headY + Math.sin(headAngle) * 30,
                vx: Math.cos(headAngle + spread) * speed,
                vy: Math.sin(headAngle + spread) * speed,
                size: Math.random() * 7 + 3,
                maxLife: Math.random() * 30 + 15,
                life: 0,
                color: Math.random() > 0.3 ? '#ffd700' : '#ff3b3b',
                isBreath: true
            });
        }

        // Add small smoke puff
        if (Math.random() > 0.6) {
            this.smokePuffs.push({
                x: headX + Math.cos(headAngle) * 40,
                y: headY + Math.sin(headAngle) * 40,
                radius: Math.random() * 8 + 6,
                maxLife: 45,
                life: 0,
                growth: Math.random() * 0.4 + 0.3,
                alpha: 0.35
            });
        }
    }

    update() {
        const speedFactor = this.reducedMotion ? 0.25 : 1.0;
        this.time += 0.007 * speedFactor;

        const CX = this.width / 2;
        const CY = this.height / 2;
        const RX = Math.min(this.width * 0.38, 550);
        const RY = Math.min(this.height * 0.34, 260);

        // Smooth flight trajectory looping around hero section
        const t = this.time;
        const headTargetX = CX + Math.sin(t * 0.8) * RX + Math.cos(t * 1.6) * (RX * 0.3);
        const headTargetY = CY + Math.sin(t * 1.6) * RY + Math.sin(t * 0.8) * (RY * 0.25);
        
        // Z Depth undulation (1 = in front, 0.7 = behind)
        const currentZ = 0.85 + 0.3 * Math.sin(t * 1.2);

        // Head positioning
        const head = this.segments[0];
        const dx = headTargetX - head.x;
        const dy = headTargetY - head.y;
        head.angle = Math.atan2(dy, dx);
        head.x += dx * (0.12 * speedFactor);
        head.y += dy * (0.12 * speedFactor);
        head.z = currentZ;

        // Fire breath timer logic
        this.breathTimer += 0.016 * speedFactor;
        if (this.breathTimer > 7 && !this.isBreathing) {
            this.isBreathing = true;
            this.breathDuration = 0;
        }

        if (this.isBreathing) {
            this.breathDuration += 0.016 * speedFactor;
            this.spawnFireBreath(head.x, head.y, head.angle);
            if (this.breathDuration > 1.8) {
                this.isBreathing = false;
                this.breathTimer = 0;
            }
        }

        // Kinematic tail chain updating
        for (let i = 1; i < this.segmentsCount; i++) {
            const prev = this.segments[i - 1];
            const seg = this.segments[i];

            // Serpentine undulation wave along spine
            const waveAmplitude = (1 - i / this.segmentsCount) * 16;
            const wave = Math.sin(t * 5.5 - i * 0.22) * waveAmplitude;

            const segDx = prev.x - seg.x;
            const segDy = prev.y - seg.y;
            const segAngle = Math.atan2(segDx, segDy);
            seg.angle = segAngle;

            const spacing = 13.5;
            const targetX = prev.x - Math.cos(segAngle) * spacing + Math.cos(segAngle + Math.PI / 2) * wave;
            const targetY = prev.y - Math.sin(segAngle) * spacing + Math.sin(segAngle + Math.PI / 2) * wave;

            seg.x += (targetX - seg.x) * (0.4 * speedFactor);
            seg.y += (targetY - seg.y) * (0.4 * speedFactor);
            seg.z = prev.z;

            // Spawn ember trail particles from random body segments
            if (i % 6 === 0 && Math.random() > 0.6) {
                this.spawnTrailParticle(seg.x, seg.y, i < 15);
            }
        }

        // Update ambient embers
        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            e.y += e.speedY * speedFactor;
            e.x += (e.speedX + Math.sin(t * 2 + e.pulse) * 0.3) * speedFactor;
            e.pulse += 0.03;

            if (e.y < -10 || e.x < -10 || e.x > this.width + 10) {
                this.embers[i] = this.createAmbientEmber(false);
            }
        }

        // Update trail particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life++;
            p.x += p.vx * speedFactor;
            p.y += p.vy * speedFactor;
            p.vy += 0.04 * speedFactor; // slight gravity

            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }

        // Update smoke puffs
        for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
            const s = this.smokePuffs[i];
            s.life++;
            s.radius += s.growth;
            s.alpha = 0.35 * (1 - s.life / s.maxLife);

            if (s.life >= s.maxLife) {
                this.smokePuffs.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Ambient Drifting Embers
        this.drawEmbers();

        // Smoke Puffs
        this.drawSmoke();

        // Draw Dragon with glowing composite blending
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        // Draw segments from tail to head for proper layering
        for (let i = this.segmentsCount - 1; i >= 0; i--) {
            const seg = this.segments[i];

            if (i === 0) {
                this.drawDragonHead(seg);
            } else {
                this.drawBodySegment(seg, i);
            }

            // Draw dragon legs/claws at designated segments
            if (i === 10 || i === 18 || i === 28 || i === 36) {
                const side = (i === 10 || i === 28) ? 1 : -1;
                this.drawDragonClaw(seg, side, i);
            }
        }

        // Draw trail & fire breath particles
        this.drawParticles();

        this.ctx.restore();
    }

    drawEmbers() {
        this.ctx.save();
        for (const e of this.embers) {
            this.ctx.globalAlpha = e.alpha * (0.6 + 0.4 * Math.sin(e.pulse));
            this.ctx.fillStyle = e.color;
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawSmoke() {
        this.ctx.save();
        for (const s of this.smokePuffs) {
            this.ctx.globalAlpha = s.alpha;
            const grad = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
            grad.addColorStop(0, 'rgba(255, 60, 30, 0.4)');
            grad.addColorStop(0.6, 'rgba(180, 20, 20, 0.2)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawDragonHead(head) {
        this.ctx.save();
        this.ctx.translate(head.x, head.y);
        this.ctx.rotate(head.angle);

        const r = head.radius;

        // Head Snout & Skull Gradient
        const headGrad = this.ctx.createRadialGradient(5, 0, 2, 0, 0, r * 1.6);
        headGrad.addColorStop(0, '#ffd700');   // Molten Gold Core
        headGrad.addColorStop(0.4, '#ff2323'); // Crimson Energy
        headGrad.addColorStop(1, '#900000');   // Dark Red Outline

        // Snout shape
        this.ctx.fillStyle = headGrad;
        this.ctx.beginPath();
        this.ctx.moveTo(r * 1.5, 0);
        this.ctx.quadraticCurveTo(r * 0.8, -r * 0.9, -r * 0.8, -r * 0.7);
        this.ctx.lineTo(-r * 1.2, r * 0.7);
        this.ctx.quadraticCurveTo(r * 0.8, r * 0.9, r * 1.5, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Antler Horns (Molten Gold & Crimson)
        this.drawAntlerHorns(r);

        // Dragon Barbels (Mustache Whiskers)
        this.drawBarbels(r);

        // Glowing Bright Red Eyes
        const eyeColor = this.isBreathing ? '#ffffff' : '#ff1e1e';
        const eyeGlowRadius = this.isBreathing ? 14 : 9;

        // Left & Right Eyes
        [-0.45, 0.45].forEach(side => {
            const eyeY = side * r * 0.55;
            const eyeX = r * 0.3;

            // Outer Radial Glow
            const eyeGrad = this.ctx.createRadialGradient(eyeX, eyeY, 1, eyeX, eyeY, eyeGlowRadius);
            eyeGrad.addColorStop(0, '#ffffff');
            eyeGrad.addColorStop(0.3, eyeColor);
            eyeGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');

            this.ctx.fillStyle = eyeGrad;
            this.ctx.beginPath();
            this.ctx.arc(eyeX, eyeY, eyeGlowRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner slit pupil
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.ellipse(eyeX + 1, eyeY, 3, 1.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Jaw Fire Glow when breathing
        if (this.isBreathing) {
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(r * 1.2, 0, 12, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawAntlerHorns(r) {
        this.ctx.lineWidth = 3.5;
        this.ctx.strokeStyle = '#ffd700';

        [-1, 1].forEach(side => {
            this.ctx.beginPath();
            this.ctx.moveTo(-r * 0.5, side * r * 0.5);
            this.ctx.quadraticCurveTo(-r * 1.5, side * r * 1.3, -r * 2.2, side * r * 1.6);
            this.ctx.moveTo(-r * 1.2, side * r * 1.0);
            this.ctx.lineTo(-r * 1.7, side * r * 0.6);
            this.ctx.stroke();
        });
    }

    drawBarbels(r) {
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
        const wave = Math.sin(this.time * 8) * 8;

        [-1, 1].forEach(side => {
            this.ctx.beginPath();
            this.ctx.moveTo(r * 1.1, side * r * 0.4);
            this.ctx.quadraticCurveTo(r * 2.0, side * r * 1.2 + wave, r * 2.8, side * r * 0.6 - wave);
            this.ctx.stroke();
        });
    }

    drawBodySegment(seg, i) {
        this.ctx.save();
        this.ctx.translate(seg.x, seg.y);
        this.ctx.rotate(seg.angle);

        const r = seg.radius;
        const alpha = Math.min(0.85, 0.45 + (1 - i / this.segmentsCount) * 0.4);

        // Segment Radial Gradient
        const segGrad = this.ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.2);
        segGrad.addColorStop(0, '#ffd700');                              // Molten Gold Core
        segGrad.addColorStop(0.45, `rgba(255, 30, 30, ${alpha})`);       // Crimson Glow
        segGrad.addColorStop(1, `rgba(255, 100, 0, 0.05)`);              // Translucent Edge

        this.ctx.fillStyle = segGrad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();

        // Fiery Spine Mane / Fins along body
        if (i % 2 === 0 && i < 42) {
            const finLen = Math.max(4, 16 * (1 - i / this.segmentsCount));
            this.ctx.fillStyle = '#ff9d00';
            this.ctx.beginPath();
            this.ctx.moveTo(-r * 0.3, -r);
            this.ctx.lineTo(0, -r - finLen);
            this.ctx.lineTo(r * 0.3, -r);
            this.ctx.closePath();
            this.ctx.fill();
        }

        // Tail Plume at the very end
        if (i >= this.segmentsCount - 5) {
            const plumeSize = (this.segmentsCount - i) * 6;
            const plumeGrad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, plumeSize);
            plumeGrad.addColorStop(0, '#ffd700');
            plumeGrad.addColorStop(0.5, '#ff2323');
            plumeGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');

            this.ctx.fillStyle = plumeGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, plumeSize, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawDragonClaw(seg, side, segIndex) {
        this.ctx.save();
        this.ctx.translate(seg.x, seg.y);
        this.ctx.rotate(seg.angle);

        const legLength = 24;
        const wave = Math.sin(this.time * 6 + segIndex) * 6;

        this.ctx.strokeStyle = '#ff3b3b';
        this.ctx.lineWidth = 3.5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, side * seg.radius * 0.8);
        this.ctx.quadraticCurveTo(10, side * (seg.radius + legLength * 0.5) + wave, 18, side * (seg.radius + legLength) + wave);
        this.ctx.stroke();

        // 3 Golden Claws
        this.ctx.fillStyle = '#ffd700';
        [-4, 0, 4].forEach(offset => {
            this.ctx.beginPath();
            this.ctx.arc(18 + offset, side * (seg.radius + legLength) + wave + offset * 0.5, 2.5, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    drawParticles() {
        for (const p of this.particles) {
            const alpha = 1 - p.life / p.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = p.color;

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(this.animate);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChineseDragonEngine('chinese-dragon-canvas');
});
