// audio.js - Immersive sound design for magical spells

class AudioEngine {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.ambientOsc = null;
        this.ambientGain = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        await this.audioCtx.resume(); // Ensure context is running
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.connect(this.audioCtx.destination);
        this.masterGain.gain.value = 0.3;

        // Background ambient sound
        this.ambientOsc = this.audioCtx.createOscillator();
        this.ambientGain = this.audioCtx.createGain();
        this.ambientOsc.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain);
        this.ambientOsc.frequency.value = 110;
        this.ambientOsc.type = 'sine';
        this.ambientGain.gain.value = 0.05;
        this.ambientOsc.start();

        this.isInitialized = true;
    }

    // Background mystical hum
    updateAmbient(intensity = 0.05) {
        if (!this.isInitialized) return;
        this.ambientGain.gain.exponentialRampToValueAtTime(
            Math.max(0.001, intensity),
            this.audioCtx.currentTime + 0.1
        );
    }

    // Spell-specific sound effects
    playSpellSound(spell, phase) {
        if (!this.isInitialized) return;
        const now = this.audioCtx.currentTime;

        switch(spell) {
            case 'circle':
                this.playWaterSound(phase, now);
                break;
            case 'zigzag':
                this.playLightningSound(phase, now);
                break;
            case 'spiral':
                this.playFireSound(phase, now);
                break;
            case 'line':
                this.playEarthSound(phase, now);
                break;
        }
    }

    playWaterSound(phase, now) {
        if (phase === 'active') {
            // Flowing water tones
            const osc1 = this.audioCtx.createOscillator();
            const osc2 = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc1.frequency.setValueAtTime(220, now); // A3
            osc2.frequency.setValueAtTime(330, now); // E4
            osc1.type = 'sine';
            osc2.type = 'triangle';

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.masterGain);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

            osc1.frequency.exponentialRampToValueAtTime(440, now + 1.5);
            osc2.frequency.exponentialRampToValueAtTime(660, now + 1.5);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 1.5);
            osc2.stop(now + 1.5);
        }
    }

    playLightningSound(phase, now) {
        if (phase === 'active') {
            // Crackling electricity
            for (let i = 0; i < 5; i++) {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const filter = this.audioCtx.createBiquadFilter();

                osc.frequency.setValueAtTime(800 + Math.random() * 1200, now + i * 0.1);
                osc.type = 'sawtooth';
                filter.type = 'highpass';
                filter.frequency.value = 1000;

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);

                gain.gain.setValueAtTime(0.15, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);

                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.2);
            }
        }
    }

    playFireSound(phase, now) {
        if (phase === 'active') {
            // Roaring fire
            const noise = this.createNoiseBuffer();
            const source = this.audioCtx.createBufferSource();
            const gain = this.audioCtx.createGain();
            const filter = this.audioCtx.createBiquadFilter();

            source.buffer = noise;
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, now);
            filter.frequency.exponentialRampToValueAtTime(800, now + 2);

            source.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2);

            source.start(now);
            source.stop(now + 2);
        }
    }

    playEarthSound(phase, now) {
        if (phase === 'active') {
            // Rumbling earth
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.frequency.setValueAtTime(60, now); // Low C
            osc.type = 'sawtooth';

            osc.connect(gain);
            gain.connect(this.masterGain);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

            osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);

            osc.start(now);
            osc.stop(now + 1.5);
        }
    }

    createNoiseBuffer() {
        const bufferSize = this.audioCtx.sampleRate * 2;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }
}

export const audioEngine = new AudioEngine();