import p5 from 'p5';
import * as Tone from 'tone';
import { DrumTemplate } from './DrumTemplate';

class Cymbal extends DrumTemplate {
  constructor(gui = null) {
    this.gui = gui;
    this.name = "Cymbal";

    // Initialize oscillators
    this.oscillators = [];
    this.defaultFrequencies = [893, 2079, 1546];
    this.oscWaveforms = ['sine', 'square', 'triangle', 'sawtooth'];
    for (let i = 0; i < 3; i++) {
      const osc = new Tone.Oscillator({
        type: 'square'
      }).start();
      this.oscillators.push(osc);
    }

    // Initialize noise sources
    this.noises = [];
    this.noiseTypes = ['white', 'pink', 'brown'];
    for (let i = 0; i < 3; i++) {
      const noise = new Tone.Noise('white').start();
      this.noises.push(noise);
    }

    // Mix the oscillators and noise sources
    this.oscMixer = new Tone.Gain(1);
    this.oscillators.forEach(osc => osc.connect(this.oscMixer));
    this.noises.forEach(n => n.connect(this.oscMixer));

    // Create filters and envelopes
    this.lowerBandFilter = new Tone.Filter({ type: 'bandpass', Q: 1 });
    this.lowerBandEnv = new Tone.AmplitudeEnvelope({
      attack: 0.01, decay: 0.4, sustain: 0.0, release: 0.1
    });
    this.lowerBandVCA = new Tone.Gain(1);
    this.lowerBandFilter.chain(this.lowerBandEnv, this.lowerBandVCA);

    this.upperBandFilter = new Tone.Filter({ type: 'bandpass' });
    this.upperBandFilter1 = new Tone.Filter({ type: 'bandpass' });
    this.upperBandFilter2 = new Tone.Filter({ type: 'bandpass' });
    this.upperBandEnv1 = new Tone.AmplitudeEnvelope({
      attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.1
    });
    this.upperBandEnv2 = new Tone.AmplitudeEnvelope({
      attack: 0.01, decay: 0.3, sustain: 0.0, release: 0.1
    });
    this.upperBandVCA1 = new Tone.Gain(1);
    this.upperBandVCA2 = new Tone.Gain(1);
    this.upperBandFilter.connect(this.upperBandFilter1);
    this.upperBandFilter.connect(this.upperBandFilter2);
    this.upperBandFilter1.chain(this.upperBandEnv1, this.upperBandVCA1);
    this.upperBandFilter2.chain(this.upperBandEnv2, this.upperBandVCA2);

    // Connect VCAs to the master output
    this.lowerBandVCA.connect(Tone.Destination);
    this.upperBandVCA1.connect(Tone.Destination);
    this.upperBandVCA2.connect(Tone.Destination);

    // Initialize GUI if provided
    if (this.gui !== null) {
      this.initGui();
    }
  }

  initGui() {
    const gui = this.gui;
    for (let i = 0; i < 3; i++) {
      const osc = this.oscillators[i];
      const freq = gui.Knob({
        label: 'freq ' + i,
        mapto: osc.frequency,
        x: 40 + 8 * i,
        y: 12,
        size: 0.5,
        min: 20,
        max: 2500,
        curve: 2
      });
      freq.set(this.defaultFrequencies[i]);

      const oscWaveform = gui.Radio({
        label: 'waveform ' + i,
        radioOptions: this.oscWaveforms,
        callback: (waveform) => {
          osc.type = waveform;
        },
        size: 1,
        x: 7,
        y: 12 + i * 20,
        horizontal: true
      });
      oscWaveform.set('square');
    }

    for (let i = 0; i < 3; i++) {
      const noise = this.noises[i];
      const noiseType = gui.Radio({
        label: 'noise ' + i,
        radioOptions: this.noiseTypes,
        callback: (type) => {
          noise.type = type;
        },
        size: 1,
        x: 90,
        y: 12 + i * 16,
        horizontal: true
      });
      noiseType.set('white');
    }

    const lowerBandFreq = gui.Knob({
      label: 'low band freq',
      mapto: this.lowerBandFilter.frequency,
      x: 20,
      y: 50,
      size: 0.5,
      min: 100,
      max: 5000,
      curve: 2
    });
    const lowerBandQ = gui.Knob({
      label: 'low band Q',
      mapto: this.lowerBandFilter.Q,
      x: 30,
      y: 50,
      size: 0.5,
      min: 0.5,
      max: 5,
      curve: 2
    });
    lowerBandFreq.set(579);
    lowerBandQ.set(1.45);

    const lowerBandDecay = gui.Knob({
      label: 'low decay',
      mapto: this.lowerBandEnv.decay,
      x: 20,
      y: 70,
      size: 0.5,
      min: 0.01,
      max: 1,
      curve: 2
    });
    lowerBandDecay.set(0.4);
    const lowerBandRelease = gui.Knob({
      label: 'low release',
      mapto: this.lowerBandEnv.release,
      x: 30,
      y: 70,
      size: 0.5,
      min: 0.01,
      max: 1,
      curve: 2
    });
    lowerBandRelease.set(0.1);

    const upperBandFreq = gui.Knob({
      label: 'up band freq',
      mapto: this.upperBandFilter.frequency,
      x: 57,
      y: 50,
      size: 0.5,
      min: 1000,
      max: 10000,
      curve: 2
    });
    const upperBandQ = gui.Knob({
      label: 'up band Q',
      mapto: this.upperBandFilter.Q,
      x: 67,
      y: 50,
      size: 0.5,
      min: 0.5,
      max: 5,
      curve: 2
    });
    upperBandFreq.set(5976);
    upperBandQ.set(1.4);

    const upperBandFreq1 = gui.Knob({
      label: 'up1 band freq',
      mapto: this.upperBandFilter1.frequency,
      x: 45,
      y: 60,
      size: 0.5,
      min: 1000,
      max: 10000,
      curve: 2
    });
    const upperBandFreq2 = gui.Knob({
      label: 'up2 band freq',
      mapto: this.upperBandFilter2.frequency,
      x: 70,
      y: 60,
      size: 0.5,
      min: 1000,
      max: 10000,
      curve: 2
    });
    const upperBandQ1 = gui.Knob({
      label: 'up1 band Q',
      mapto: this.upperBandFilter1.Q,
      x: 55,
      y: 60,
      size: 0.5,
      min: 0.5,
      max: 5,
      curve: 2
    });
    const upperBandQ2 = gui.Knob({
      label: 'up2 band Q',
      mapto: this.upperBandFilter2.Q,
      x: 80,
      y: 60,
      size: 0.5,
      min: 0.5,
      max: 5,
      curve: 2
    });
    upperBandFreq1.set(6795);
    upperBandFreq2.set(8735);
    upperBandQ1.set(1.39);
    upperBandQ2.set(0.67);

    const upperBandDecay1 = gui.Knob({
      label: 'up1 decay',
      mapto: this.upperBandEnv1.decay,
      x: 45,
      y: 70,
      size: 0.5,
      min: 0.01,
      max: 1,
      curve: 2
    });
    const upperBandRelease1 = gui.Knob({
      label: 'up1 release',
      mapto: this.upperBandEnv1.release,
      x: 55,
      y: 70,
      size: 0.5,
      min: 0.01,
      max: 1,
      curve: 2
    });
    const upperBandDecay2 = gui.Knob({
      label: 'up2 decay',
      mapto: this.upperBandEnv2.decay,
      x: 70,
      y: 70,
      size: 0.5,
      min: 0.01,
      max: 1,
      curve: 2
    });
    const upperBandRelease2 = gui.Knob({
      label: 'up2 release',
      mapto: this.upperBandEnv2.release,
      x: 80,
      y: 70,
      size: 0.5,
      min: 0.01,
      max: 1,
      curve: 2
    });
    upperBandDecay1.set(0.2);
    upperBandRelease1.set(0.1);
    upperBandDecay2.set(0.3);
    upperBandRelease2.set(0.1);

    // Trigger button for the cymbal sound
    const triggerButton = gui.Button({
      label: 'trig',
      callback: () => this.triggerCymbal(),
      size: 2,
      border: 20,
      borderColor: [255, 0, 0],
      x: 48,
      y: 36
    });
  }

  triggerCymbal() {
    this.lowerBandEnv.triggerAttackRelease(0.01);
    this.upperBandEnv1.triggerAttackRelease(0.01);
    this.upperBandEnv2.triggerAttackRelease(0.01);
  }
}
