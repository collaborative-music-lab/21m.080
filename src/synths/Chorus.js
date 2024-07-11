/*
DelayOp

Delays
* input->hpf->feedbackDelay->drive->waveShaper->lpf->panner->output
* 
* 

methods:


properties:

- 
*/

import p5 from 'p5';
import * as Tone from 'tone';

export class DelayOp{
    constructor(){
    //signal
    this.output = Tone.Multiply(1);
    }
    connect(destination) {
        if (destination.input) {
            this.output.connect(destination.input);
        } else {
            this.output.connect(destination);
        }   
    }
}