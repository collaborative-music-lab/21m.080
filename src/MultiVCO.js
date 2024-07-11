/*
 *
 * Class to define a multiVCO which can produce multiple waves in series
 * Parameters are frequency, types of waves, and scalars to shift the pitch (0.5 for down an octave, 2 for up an octave)
 * 
*/

import p5 from 'p5';
import * as Tone from 'tone';

export class MultiVCO{
    constructor(vcos = ['triangle','sawtooth','square'], pitchshift = [1,1,1]){
        this.numInputs = vcos.length
        this.frequency = new Tone.Multiply(1)
        this.output = new Tone.Multiply(.1)

        this.freqScalars= []
        this.gainStages = []
        this.vco = []

        for(this.i=0;this.i<this.numInputs;this.i++) {
            this.freqScalars.push(new Tone.Multiply(pitchshift[this.i]))
            this.vco.push(new Tone.Oscillator({type:vcos[this.i]}).start())
            this.gainStages.push(new Tone.Multiply(1))

            this.frequency.connect(this.freqScalars[this.i])
            this.freqScalars[this.i].connect(this.vco[this.i].frequency)
            this.vco[this.i].connect(this.gainStages[this.i])
            this.gainStages[this.i].connect(this.output)
        }
    }
    setPitchshift(index, shift) {
        if (index >= this.numInputs || index < 0) {
            this.freqScalars[index] = shift
        }
        else {
            console.log("Index out of range")
        }
    }

    setGain(index, level) {
        if (index >= this.numInputs || index < 0) {
            this.gainStages[index] = level
        }
        else {
            console.log("Index out of range")
        }
    }

    connect(destination) {
        if (destination.input) {
            this.output.connect(destination.input);
        } else {
            this.output.connect(destination);
        }
    }
}