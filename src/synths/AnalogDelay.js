/**
 * AnalogDelay.js
 * 
 * Simple approximation of an analog delay
 * 
 * Signal path:
 * input -> hpf -> gain -> waveShaper -> lpf -> delay -> wet -> output
 *                                         <- feedback <-
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
    this.highpass = new Tone.Filter({ type: 'highpass', frequency: 20, Q: 0 });
    this.ws_input = new Tone.Multiply(0.125);
    this.waveShaper = new Tone.WaveShaper((x) => { return Math.tanh(x) });
    this.vcf = new Tone.Filter({ type: 'lowpass', frequency: 5000, Q: 0, slope: '-12' });
    this.vcfR = new Tone.Filter({ type: 'lowpass', frequency: 5000, Q: 0, slope: '-12' });
    this.delay = new Tone.Delay(initialTime);
    this.delayR = new Tone.Delay(initialTime);
    this.feedbackMult = new Tone.Multiply(initialFB);
    this.feedbackMultR = new Tone.Multiply(initialFB);
    this.merge = new Tone.Merge(2)
    this.wetSig = new Tone.Multiply(1);
    this.drySig = new Tone.Multiply(0);
    this.output = new Tone.Multiply(1);

    // Connecting signal path
    this.input.connect(this.drySig);
    this.input.connect(this.highpass);
    this.highpass.connect(this.ws_input);
    this.ws_input.connect(this.waveShaper);
    this.waveShaper.connect(this.vcf);
    this.waveShaper.connect(this.vcfR);
    this.vcf.connect(this.delay);
    this.vcfR.connect(this.delayR);
    this.delay.connect(this.feedbackMult);
    this.delayR.connect(this.feedbackMultR);
    this.feedbackMult.connect(this.vcf);
    this.feedbackMultR.connect(this.vcfR);
    this.delay.connect(this.merge,0,0);
    this.delayR.connect(this.merge,0,1);
    this.merge.connect(this.wetSig);
    this.wetSig.connect(this.output);
    this.drySig.connect(this.output);

    this.lfo = new Tone.Oscillator(2).start()
    this.lfoDepth = new Tone.Multiply()
    this.lfo.connect(this.lfoDepth)
    this.lfoDepth.connect(this.delay.delayTime)
    this.lfoDepth.connect(this.delayR.delayTime)
  }

  set time (value) {
    this.delay.delayTime.value = value
    this.delayR.delayTime.value = value*1.5
  }
  set feedback (value) { this.feedbackMult.factor.value = value; this.feedbackMultR.factor.value = value;}
  set damping (value) {this.vcf.frequency.value = value; this.vcf.frequency.value = value*0.9;}
  set hpf (value) { this.highpass.frequency.value = value}
  set dry (value) { this.drySig.factor.value = value}
  set wet (value) { this.wetSig.factor.value = value}
  set gain (value) { this.ws_input.factor.value = value}
  set amp (value) { this.output.factor.value = value}

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
