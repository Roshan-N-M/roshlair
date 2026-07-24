/**
 * Realistic Chinese Golden Dragon WebGL/Canvas Animation Engine
 * Renders an authentic, highly-detailed Chinese Dragon with golden scales,
 * fiery crimson mane, sharp claws, glowing red eyes, and mystical fire orb
 * seamlessly looping around the hero section.
 */

class RealisticChineseDragonEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.segmentsCount = 65;
        this.segments = [];
        this.particles = [];
        this.embers = [];
        this.smokePuffs = [];

        this.time = 0;
        this.breathTimer = 0;
        this.isBreathing = false;
        this.breathDuration = 0;

        // Load realistic sprite textures
        this.texturesLoaded = false;
        this.headImage = new Image();
        this.headImage.src = 'dragon_head.png';

        this.bodyImage = new Image();
        this.bodyImage.src = 'dragon_body.png';

        let loadedCount = 0;
        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount >= 2) {
                this.texturesLoaded = true;
            }
        };

        this.headImage.onload = checkLoaded;
        this.bodyImage.onload = checkLoaded;
        this.headImage.onerror = () => { this.texturesLoaded = false; };
        this.bodyImage.onerror = () => { this.texturesLoaded = false; };

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
            // Realistic body tapering
            let radius = 24;
            if (i === 0) radius = 30; // Head
            else if (i < 12) radius = 26 - i * 0.4;
            else if (i > 45) radius = Math.max(5, 21 - (i - 45) * 0.9);

            this.segments.push({
                x: startX - i * 13,
                y: startY,
                z: 1,
                angle: 0,
                radius: radius,
                index: i
            });
        }

        // Initialize ambient floating embers
        const emberCount = this.reducedMotion ? 15 : 50;
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
            size: Math.random() * 3.5 + 1.2,
            speedX: (Math.random() - 0.5) * 0.7,
            speedY: -(Math.random() * 0.9 + 0.4),
            alpha: Math.random() * 0.75 + 0.25,
            color: Math.random() > 0.4 ? '#ff9d00' : (Math.random() > 0.5 ? '#ff2323' : '#ffd700'),
            pulse: Math.random() * Math.PI * 2
        };
    }

    spawnTrailParticle(x, y) {
        if (this.reducedMotion && Math.random() > 0.3) return;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.6 + 0.4;

        this.particles.push({
            x: x + (Math.random() - 0.5) * 12,
            y: y + (Math.random() - 0.5) * 12,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.3,
            size: Math.random() * 4.5 + 1.5,
            maxLife: Math.random() * 35 + 20,
            life: 0,
            color: Math.random() > 0.4 ? '#ffd700' : '#ff3b3b'
        });
    }

    spawnFireBreath(headX, headY, headAngle) {
        const particleCount = this.reducedMotion ? 3 : 9;
        for (let i = 0; i < particleCount; i++) {
            const spread = (Math.random() - 0.5) * 0.55;
            const speed = Math.random() * 6 + 4.0;

            this.particles.push({
                x: headX + Math.cos(headAngle) * 35,
                y: headY + Math.sin(headAngle) * 35,
                vx: Math.cos(headAngle + spread) * speed,
                vy: Math.sin(headAngle + spread) * speed,
                size: Math.random() * 8 + 3.5,
                maxLife: Math.random() * 32 + 18,
                life: 0,
                color: Math.random() > 0.25 ? '#ffd700' : '#ff2323'
            });
        }

        if (Math.random() > 0.5) {
            this.smokePuffs.push({
                x: headX + Math.cos(headAngle) * 45,
                y: headY + Math.sin(headAngle) * 45,
                radius: Math.random() * 10 + 6,
                maxLife: 45,
                life: 0,
                growth: Math.random() * 0.45 + 0.3,
                alpha: 0.4
            });
        }
    }

    update() {
        const speedFactor = this.reducedMotion ? 0.25 : 1.0;
        this.time += 0.0065 * speedFactor;

        const CX = this.width / 2;
        const CY = this.height / 2;
        const RX = Math.min(this.width * 0.38, 560);
        const RY = Math.min(this.height * 0.34, 270);

        // Parametric flight path looping elegantly around hero text
        const t = this.time;
        const headTargetX = CX + Math.sin(t * 0.85) * RX + Math.cos(t * 1.7) * (RX * 0.28);
        const headTargetY = CY + Math.sin(t * 1.7) * RY + Math.sin(t * 0.85) * (RY * 0.22);

        // Head positioning & orientation
        const head = this.segments[0];
        const dx = headTargetX - head.x;
        const dy = headTargetY - head.y;
        head.angle = Math.atan2(dy, dx);
        head.x += dx * (0.11 * speedFactor);
        head.y += dy * (0.11 * speedFactor);

        // Fire breath timer
        this.breathTimer += 0.016 * speedFactor;
        if (this.breathTimer > 6.5 && !this.isBreathing) {
            this.isBreathing = true;
            this.breathDuration = 0;
        }

        if (this.isBreathing) {
            this.breathDuration += 0.016 * speedFactor;
            this.spawnFireBreath(head.x, head.y, head.angle);
            if (this.breathDuration > 2.0) {
                this.isBreathing = false;
                this.breathTimer = 0;
            }
        }

        // Kinematic serpent follower updating
        for (let i = 1; i < this.segmentsCount; i++) {
            const prev = this.segments[i - 1];
            const seg = this.segments[i];

            // Serpentine transverse wave
            const waveAmplitude = (1 - i / this.segmentsCount) * 17;
            const wave = Math.sin(t * 5.2 - i * 0.2) * waveAmplitude;

            const segDx = prev.x - seg.x;
            const segDy = prev.y - seg.y;
            const segAngle = Math.atan2(segDx, segDy);
            seg.angle = segAngle;

            const spacing = 12.5;
            const targetX = prev.x - Math.cos(segAngle) * spacing + Math.cos(segAngle + Math.PI / 2) * wave;
            const targetY = prev.y - Math.sin(segAngle) * spacing + Math.sin(segAngle + Math.PI / 2) * wave;

            seg.x += (targetX - seg.x) * (0.42 * speedFactor);
            seg.y += (targetY - seg.y) * (0.42 * speedFactor);

            if (i % 7 === 0 && Math.random() > 0.5) {
                this.spawnTrailParticle(seg.x, seg.y);
            }
        }

        // Ambient embers update
        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            e.y += e.speedY * speedFactor;
            e.x += (e.speedX + Math.sin(t * 2 + e.pulse) * 0.35) * speedFactor;
            e.pulse += 0.03;

            if (e.y < -10 || e.x < -10 || e.x > this.width + 10) {
                this.embers[i] = this.createAmbientEmber(false);
            }
        }

        // Particles update
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life++;
            p.x += p.vx * speedFactor;
            p.y += p.vy * speedFactor;
            p.vy += 0.03 * speedFactor;

            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }

        // Smoke update
        for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
            const s = this.smokePuffs[i];
            s.life++;
            s.radius += s.growth;
            s.alpha = 0.4 * (1 - s.life / s.maxLife);

            if (s.life >= s.maxLife) {
                this.smokePuffs.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Ambient background embers
        this.drawEmbers();

        // Smoke Puffs
        this.drawSmoke();

        // Save canvas state with subtle screen/lighter blending
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-over';

        // Render dragon from tail to head so overlapping scales layer naturally
        for (let i = this.segmentsCount - 1; i >= 0; i--) {
            const seg = this.segments[i];

            if (i === 0) {
                this.drawRealisticHead(seg);
            } else {
                this.drawRealisticBodySegment(seg, i);
            }

            // Draw realistic dragon claws & glowing orb at key body segments
            if (i === 12 || i === 22 || i === 36 || i === 48) {
                const side = (i === 12 || i === 36) ? 1 : -1;
                this.drawRealisticClaw(seg, side, i);
            }
        }

        // Draw glowing particles & fire breath
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

    drawRealisticBodySegment(seg, i) {
        this.ctx.save();
        this.ctx.translate(seg.x, seg.y);
        this.ctx.rotate(seg.angle);

        const r = seg.radius;
        const isTail = i >= this.segmentsCount - 8;

        if (this.texturesLoaded && this.bodyImage.complete) {
            // Render high-definition sprite texture
            const aspect = this.bodyImage.width / this.bodyImage.height;
            const w = r * 2.6;
            const h = w / aspect;
            this.ctx.drawImage(this.bodyImage, -w / 2, -h / 2, w, h);
        } else {
            // Procedural Realistic Golden Scales & Crimson Spine Mane
            // 1. Pale Gold Belly Armor (Underside)
            const bellyGrad = this.ctx.createLinearGradient(0, -r, 0, r);
            bellyGrad.addColorStop(0, '#ffe899');
            bellyGrad.addColorStop(0.5, '#d4a017');
            bellyGrad.addColorStop(1, '#8b6508');

            this.ctx.fillStyle = bellyGrad;
            this.ctx.beginPath();
            this.ctx.ellipse(0, r * 0.2, r * 0.95, r * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // 2. Metallic Golden Scales Body
            const goldScaleGrad = this.ctx.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r * 1.3);
            goldScaleGrad.addColorStop(0, '#fff5b8');      // Highlight
            goldScaleGrad.addColorStop(0.35, '#e6b800');   // Rich Gold
            goldScaleGrad.addColorStop(0.75, '#b37700');   // Deep Bronze
            goldScaleGrad.addColorStop(1, '#5c3300');      // Shadow

            this.ctx.fillStyle = goldScaleGrad;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, r, 0, Math.PI * 2);
            this.ctx.fill();

            // Scale pattern lines
            this.ctx.strokeStyle = 'rgba(100, 50, 0, 0.4)';
            this.ctx.lineWidth = 1.2;
            this.ctx.beginPath();
            this.ctx.arc(-r * 0.2, 0, r * 0.6, -Math.PI * 0.4, Math.PI * 0.4);
            this.ctx.arc(r * 0.2, 0, r * 0.6, Math.PI * 0.6, Math.PI * 1.4);
            this.ctx.stroke();

            // 3. Fiery Crimson Spine Mane (Upper Back)
            if (i % 2 === 0) {
                const maneLen = Math.max(8, 26 * (1 - i / this.segmentsCount));
                const maneGrad = this.ctx.createLinearGradient(0, -r, 0, -r - maneLen);
                maneGrad.addColorStop(0, '#ff1e1e');
                maneGrad.addColorStop(0.6, '#ff8000');
                maneGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');

                this.ctx.fillStyle = maneGrad;
                this.ctx.beginPath();
                this.ctx.moveTo(-r * 0.4, -r * 0.7);
                this.ctx.quadraticCurveTo(-r * 0.2, -r - maneLen, 0, -r - maneLen * 1.2);
                this.ctx.quadraticCurveTo(r * 0.3, -r - maneLen, r * 0.4, -r * 0.7);
                this.ctx.closePath();
                this.ctx.fill();
            }

            // 4. Tail Plume (End of body)
            if (isTail) {
                const plumeSize = (this.segmentsCount - i) * 7.5;
                const plumeGrad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, plumeSize);
                plumeGrad.addColorStop(0, '#ffd700');
                plumeGrad.addColorStop(0.5, '#ff2323');
                plumeGrad.addColorStop(1, 'rgba(255, 100, 0, 0)');

                this.ctx.fillStyle = plumeGrad;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, plumeSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        this.ctx.restore();
    }

    drawRealisticHead(head) {
        this.ctx.save();
        this.ctx.translate(head.x, head.y);
        this.ctx.rotate(head.angle);

        const r = head.radius;

        if (this.texturesLoaded && this.headImage.complete) {
            // Render high-resolution dragon head sprite
            const aspect = this.headImage.width / this.headImage.height;
            const w = r * 3.2;
            const h = w / aspect;
            this.ctx.drawImage(this.headImage, -w / 2, -h / 2, w, h);
        } else {
            // Procedural Realistic Chinese Dragon Head
            // 1. Dragon Skull Base & Jaws
            const headGrad = this.ctx.createRadialGradient(r * 0.4, 0, 2, 0, 0, r * 1.8);
            headGrad.addColorStop(0, '#fff3a8');     // Gold Core
            headGrad.addColorStop(0.4, '#d49b00');   // Rich Golden Scale
            headGrad.addColorStop(0.8, '#a62400');   // Crimson Accent
            headGrad.addColorStop(1, '#4a0800');     // Shadow

            this.ctx.fillStyle = headGrad;

            // Snout Shape
            this.ctx.beginPath();
            this.ctx.moveTo(r * 1.6, 0);
            this.ctx.quadraticCurveTo(r * 1.1, -r * 0.85, -r * 0.7, -r * 0.8);
            this.ctx.lineTo(-r * 1.3, r * 0.8);
            this.ctx.quadraticCurveTo(r * 1.1, r * 0.85, r * 1.6, 0);
            this.ctx.closePath();
            this.ctx.fill();

            // 2. Open Jaw Teeth & Fangs
            this.ctx.fillStyle = '#ffffff';
            [-0.3, 0, 0.3].forEach(offset => {
                this.ctx.beginPath();
                this.ctx.moveTo(r * 1.3, offset * r);
                this.ctx.lineTo(r * 1.5, offset * r + 2);
                this.ctx.lineTo(r * 1.3, offset * r + 4);
                this.ctx.closePath();
                this.ctx.fill();
            });

            // 3. Majestic Golden Antler Horns
            this.drawRealisticHorns(r);

            // 4. Flowing Dragon Whiskers (Barbels)
            this.drawRealisticWhiskers(r);

            // 5. Glowing Ruby Red Eyes
            const eyeColor = this.isBreathing ? '#ffffff' : '#ff1a1a';
            const eyeGlowRadius = this.isBreathing ? 16 : 10;

            [-0.48, 0.48].forEach(side => {
                const eyeY = side * r * 0.55;
                const eyeX = r * 0.35;

                // Eye Radial Glow
                const eyeGrad = this.ctx.createRadialGradient(eyeX, eyeY, 1, eyeX, eyeY, eyeGlowRadius);
                eyeGrad.addColorStop(0, '#ffffff');
                eyeGrad.addColorStop(0.35, eyeColor);
                eyeGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');

                this.ctx.fillStyle = eyeGrad;
                this.ctx.beginPath();
                this.ctx.arc(eyeX, eyeY, eyeGlowRadius, 0, Math.PI * 2);
                this.ctx.fill();

                // Slit Pupil
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.ellipse(eyeX + 1, eyeY, 3.5, 1.8, 0, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        this.ctx.restore();
    }

    drawRealisticHorns(r) {
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = '#ffd700';

        [-1, 1].forEach(side => {
            this.ctx.beginPath();
            this.ctx.moveTo(-r * 0.4, side * r * 0.5);
            this.ctx.quadraticCurveTo(-r * 1.6, side * r * 1.4, -r * 2.5, side * r * 1.8);
            this.ctx.moveTo(-r * 1.3, side * r * 1.1);
            this.ctx.lineTo(-r * 1.9, side * r * 0.7);
            this.ctx.stroke();
        });
    }

    drawRealisticWhiskers(r) {
        this.ctx.lineWidth = 2.2;
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
        const wave = Math.sin(this.time * 7) * 9;

        [-1, 1].forEach(side => {
            this.ctx.beginPath();
            this.ctx.moveTo(r * 1.2, side * r * 0.35);
            this.ctx.quadraticCurveTo(r * 2.2, side * r * 1.4 + wave, r * 3.2, side * r * 0.7 - wave);
            this.ctx.stroke();
        });
    }

    drawRealisticClaw(seg, side, segIndex) {
        this.ctx.save();
        this.ctx.translate(seg.x, seg.y);
        this.ctx.rotate(seg.angle);

        const legLength = 28;
        const wave = Math.sin(this.time * 5.5 + segIndex) * 7;

        // Muscular Leg Stem (Gold & Bronze)
        const legGrad = this.ctx.createLinearGradient(0, 0, 20, side * legLength);
        legGrad.addColorStop(0, '#ffd700');
        legGrad.addColorStop(1, '#8b5a00');

        this.ctx.strokeStyle = legGrad;
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, side * seg.radius * 0.7);
        this.ctx.quadraticCurveTo(12, side * (seg.radius + legLength * 0.6) + wave, 22, side * (seg.radius + legLength) + wave);
        this.ctx.stroke();

        // 4 Sharp Curved Golden Talons (Claws)
        const clawX = 22;
        const clawY = side * (seg.radius + legLength) + wave;

        this.ctx.fillStyle = '#fff5b8';
        this.ctx.strokeStyle = '#d49b00';
        this.ctx.lineWidth = 1.5;

        [-8, -3, 3, 8].forEach(angleOffset => {
            this.ctx.beginPath();
            this.ctx.moveTo(clawX, clawY);
            this.ctx.lineTo(clawX + 9, clawY + angleOffset);
            this.ctx.lineTo(clawX + 4, clawY + angleOffset * 0.5);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        });

        // Mystic Dragon Orb / Pearl (Clutched by claw on segment 36)
        if (segIndex === 36) {
            const orbGrad = this.ctx.createRadialGradient(clawX + 10, clawY, 1, clawX + 10, clawY, 14);
            orbGrad.addColorStop(0, '#ffffff');
            orbGrad.addColorStop(0.3, '#ff00ff');   // Mystic Magenta/Purple
            orbGrad.addColorStop(0.7, '#8800cc');   // Deep Violet
            orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = orbGrad;
            this.ctx.beginPath();
            this.ctx.arc(clawX + 10, clawY, 14, 0, Math.PI * 2);
            this.ctx.fill();
        }

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
    new RealisticChineseDragonEngine('chinese-dragon-canvas');
});
