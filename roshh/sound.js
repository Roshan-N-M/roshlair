/**
 * GuitarSynth - A Web Audio API based Electric Guitar Synthesizer.
 * Synthesizes a raw, distorted rock/metal guitar sound using waveshaping, detuned oscillators,
 * cabinet modeling filters, and precise amplitude envelopes.
 */
class GuitarSynth {
    constructor() {
        this.ctx = null;
        // Generate a standard distortion curve
        this.distortionCurve = this.makeDistortionCurve(100);
        this.activeNodes = [];
    }

    /**
     * Lazy-initializer for AudioContext to bypass browser autoplay blocks
     */
    init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            } else {
                console.warn("Web Audio API is not supported in this browser.");
                return false;
            }
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return true;
    }

    /**
     * Generates a waveshaper distortion curve mapping input signal to saturated output
     * @param {number} amount - Amount of distortion (high-gain)
     */
    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            // Sigmoid-like wave distortion formula
            curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    /**
     * Plays a single guitar note/frequency with simulated distortion and cabinet roll-off.
     * @param {number} frequency - Frequency of the note in Hz
     * @param {number} duration - Play duration in seconds
     * @param {number} gainVal - Volume velocity scaling (0 to 1)
     */
    playNote(frequency, duration = 1.5, gainVal = 0.5) {
        if (!this.init()) return;

        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Create main gain node for this voice
        const voiceGain = ctx.createGain();
        voiceGain.gain.setValueAtTime(0, now);
        
        // Attack: Instant pluck strike
        voiceGain.gain.linearRampToValueAtTime(gainVal, now + 0.005);
        // Decay to sustain level
        voiceGain.gain.exponentialRampToValueAtTime(gainVal * 0.4, now + 0.15);
        // Release: Slow fade out
        voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // Core sound: Use two detuned sawtooth/triangle oscillators to simulate double-tracking/chorus
        const oscSaw = ctx.createOscillator();
        oscSaw.type = 'sawtooth';
        oscSaw.frequency.setValueAtTime(frequency, now);

        const oscTri = ctx.createOscillator();
        oscTri.type = 'triangle';
        // Detuned slightly sharp to broaden the stereo field/adds metal thickness
        oscTri.frequency.setValueAtTime(frequency * 1.008, now);

        // A small sub-octave oscillator for low end chugging if the note is low
        let subOsc = null;
        if (frequency < 150) {
            subOsc = ctx.createOscillator();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(frequency / 2, now);
            const subGain = ctx.createGain();
            subGain.gain.setValueAtTime(0.15, now);
            subOsc.connect(subGain);
            subGain.connect(voiceGain);
        }

        // Apply waveshaper distortion to the combined signals
        const distortion = ctx.createWaveshaper();
        distortion.curve = this.distortionCurve;
        distortion.oversample = '4x';

        // Pre-amp EQ filter: boost mid/highs before distortion to make it bite
        const preEQ = ctx.createBiquadFilter();
        preEQ.type = 'peaking';
        preEQ.frequency.setValueAtTime(1000, now);
        preEQ.gain.setValueAtTime(6, now);
        preEQ.Q.setValueAtTime(1.0, now);

        // Post-amp cabinet simulation low-pass: electric guitars roll off sharply around 4-5 kHz
        const cabFilter = ctx.createBiquadFilter();
        cabFilter.type = 'lowpass';
        cabFilter.frequency.setValueAtTime(3200, now);
        cabFilter.Q.setValueAtTime(1.2, now);

        // Mid range presence: push the sound forward
        const presence = ctx.createBiquadFilter();
        presence.type = 'peaking';
        presence.frequency.setValueAtTime(1800, now);
        presence.gain.setValueAtTime(3, now);
        presence.Q.setValueAtTime(0.8, now);

        // Connect synthesis signal chain
        oscSaw.connect(voiceGain);
        oscTri.connect(voiceGain);
        
        voiceGain.connect(preEQ);
        preEQ.connect(distortion);
        distortion.connect(cabFilter);
        cabFilter.connect(presence);
        presence.connect(ctx.destination);

        // Start oscillators
        oscSaw.start(now);
        oscTri.start(now);
        if (subOsc) subOsc.start(now);

        // Schedule stop
        oscSaw.stop(now + duration);
        oscTri.stop(now + duration);
        if (subOsc) subOsc.stop(now + duration);

        // Clean track of active nodes to avoid memory leak / dangling nodes
        const noteHandle = { oscSaw, oscTri, subOsc, voiceGain, presence };
        this.activeNodes.push(noteHandle);

        setTimeout(() => {
            const index = this.activeNodes.indexOf(noteHandle);
            if (index > -1) {
                this.activeNodes.splice(index, 1);
            }
        }, duration * 1000 + 100);
    }

    /**
     * Helper to play notes by guitar fret and string.
     * Guitar standard tuning (open strings from 6 to 1):
     * 6th String (E2): 82.41 Hz
     * 5th String (A2): 110.00 Hz
     * 4th String (D3): 146.83 Hz
     * 3rd String (G3): 196.00 Hz
     * 2nd String (B3): 246.94 Hz
     * 1st String (E4): 329.63 Hz
     * 
     * Fret formula: F = F0 * 2^(fret / 12)
     */
    playGuitarNote(stringIndex, fret) {
        const baseFreqs = [
            329.63, // 1st string (High E)
            246.94, // 2nd string (B)
            196.00, // 3rd string (G)
            146.83, // 4th string (D)
            110.00, // 5th string (A)
            82.41   // 6th string (Low E)
        ];

        // Validate index (0-5, where 0 is 1st string and 5 is 6th string)
        const baseFreq = baseFreqs[stringIndex];
        if (!baseFreq) return;

        // Calculate frequency based on fret
        const frequency = baseFreq * Math.pow(2, fret / 12);
        
        // Lower strings ring out a bit longer, higher ones are snappier
        const duration = 1.8 - (stringIndex * 0.15);
        const volume = 0.5 + (fret * 0.01); // slightly louder on higher frets

        this.playNote(frequency, duration, volume);
    }
}

// Global instance to be used by the page UI
const guitar = new GuitarSynth();
