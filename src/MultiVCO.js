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
        this.frequency = new Tone.Signal(1)
        this.output = new Tone.Multiply(1/this.numInputs)

        this.freqScalars= []
        this.gainStages = []
        this.vco = []

        for(this.i=0;this.i<this.numInputs;this.i++) {
            this.freqScalars.push(new Tone.Multiply(pitchshift[this.i]))
            if (vcos[this.i] === 'noise') {
                this.vco.push(new Tone.Noise("white").start())
            }
            else {
                this.vco.push(new Tone.Oscillator({type:vcos[this.i]}).start())
            }
            this.gainStages.push(new Tone.Multiply(1))
            this.frequency.connect(this.freqScalars[this.i])
            if (vcos[this.i] !== 'noise') {
                this.freqScalars[this.i].connect(this.vco[this.i].frequency)
            }
            this.vco[this.i].connect(this.gainStages[this.i])
            this.gainStages[this.i].connect(this.output)
        }
    }
    setPitchshift(index, shift) {
        if (index >= this.numInputs || index < 0) {
            console.log("Index out of range")
        }
        else {
            this.freqScalars[index].factor = shift
        }
    }

    setGain(index, level) {
        if (index >= this.numInputs || index < 0) {
            console.log("Index out of range")
        }
        else {
            this.gainStages[index].factor = level
        }
    }

    connect(destination) {
        if (destination.input) {
            this.output.connect(destination.input);
        } else {
            this.output.connect(destination);
        }
    }

    disconnect(destination) {
        if (destination.input) {
            this.output.disconnect(destination.input);
        } else {
            this.output.disconnect(destination);
        }
    }
}