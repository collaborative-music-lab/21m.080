/**
 * AnalogDelay.js
 * 
 * Simple approximation of an analog delay
 * 
 * Signal path:
 * input -> hpf -> gain -> waveShaper -> lpf -> delay -> wet -> output
 *               <- <- <- <-  <- <- <- <- <- feedback <-
 * input -> dry -> output
 * 
 * @class
 */
import p5 from 'p5';
import * as Tone from 'tone';
import { DelayOp } from './DelayOp.js';

export class AnalogDelay {
  /**
   * Creates an instance of AnalogDelay.
   * @constructor
   * @param {number} [initialTime=0.1] - Initial delay time in seconds.
   * @param {number} [initialFB=0] - Initial feedback amount.
   */
  constructor(initialTime = 0.1, initialFB = 0) {
    this.input = new Tone.Multiply(1);
    this.hpf = new Tone.Filter({ type: 'highpass', frequency: 20, Q: 0 });
    this.gain = new Tone.Multiply(0.1);
    this.waveShaper = new Tone.WaveShaper((x) => { return x });
    this.lpf = new Tone.Filter({ type: 'lowpass', frequency: 5000, Q: 0, slope: '-24' });
    this.delay = new Tone.Delay(initialTime);
    this.feedback = new Tone.Multiply(initialFB);
    this.wet = new Tone.Multiply(10);
    this.dry = new Tone.Multiply(1);
    this.output = new Tone.Multiply(1);

    // Connecting signal path
    this.input.connect(this.dry);
    this.input.connect(this.hpf);
    this.hpf.connect(this.lpf);
    this.lpf.connect(this.gain);
    this.gain.connect(this.waveShaper);
    this.waveShaper.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.hpf);
    this.delay.connect(this.wet);
    this.wet.connect(this.output);
    this.dry.connect(this.output);
  }

  /**
   * Connect the output to a destination.
   * @param {Tone.Signal | AudioNode} destination - The destination to connect to.
   */
  connect(destination) {
    if (destination.input) {
      this.output.connect(destination.input);
    } else {
      this.output.connect(destination);
    }
  }

  /**
   * Disconnect the output from a destination.
   * @param {Tone.Signal | AudioNode} destination - The destination to disconnect from.
   */
  disconnect(destination) {
    if (destination.input) {
      this.output.disconnect(destination.input);
    } else {
      this.output.disconnect(destination);
    }
  }
}
