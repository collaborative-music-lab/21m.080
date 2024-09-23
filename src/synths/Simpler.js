/*
 * Simple Sampler
 *
 * 
*/

import p5 from 'p5';
import * as Tone from 'tone';
import SimplerPresets from './synthPresets/SimplerPresets.json';
import { MonophonicTemplate } from './MonophonicTemplate';

export class Simpler extends MonophonicTemplate {
    constructor (file) {
        super()
        // this.gui = gui
        this.presets = SimplerPresets
        this.name = "Simpler"
        
        //audio objects
        this.sampler = null
        this.vcf = new Tone.Filter()
        this.vca = new Tone.Multiply(1)
        this.output = new Tone.Multiply(1)
        this.cutoff = new Tone.Signal(10000)

        //vcf setup
        this.cutoff.connect(this.vcf.frequency)
        this.vcf.frequency.value = 10000
        this.vcf.rolloff = -12
        this.vcf.Q.value = 1

        //Set up filter envelope
        this.env = new Tone.Envelope()
        this.vcfEnvDepth = new Tone.Signal()
        this.env.connect(this.vcfEnvDepth)
        this.vcfEnvDepth.connect(this.vcf.frequency)

        //connect vcf to vca
        this.vcf.connect(this.vca)
        this.vca.connect(this.output)

        this.loadSample(file)

        this.volume = -6
        this.release = .01
        this.sample = ''
    }

    /**
   * Load a specific sample.
   * @param {string} file - The name of the sample to load.
   */
  loadSample(file){
    //clear all previously playing notes
    if(this.sampler) {
        this.sampler.dispose()
        this.sampler.releaseAll()
    }

    this.sampleFiles = {
      bell: ['C4', 'berklee/bell_1.mp3'],
      bell1:   ['C4', 'berklee/bell_1a.mp3'],
      bell2:   ['C4', 'berklee/bell_2a.mp3'],
      bell3:   ['C4', 'berklee/bell_mallet_2.mp3'],
      horn:['C4', 'berklee/casiohorn2.mp3'],
      chotone:  ['C4', 'berklee/chotone_c4_!.mp3'],
      voice: ['C4', 'berklee/femalevoice_aa_Db4.mp3'],
      kalimba: ['C4', 'berklee/Kalimba_1.mp3'],
      dreamyPiano: ['A5', 'salamander/A5.mp3'],
      softPiano: ['A4', 'salamander/A4.mp3'],
      piano: [45, 'salamander/A3.mp3'],
      casio:['C4', 'casio/C2.mp3']
    }

    if (file in this.sampleFiles) {
      console.log(`Simpler loading ${file}`);
      this.sample = file
    } else {
      console.error(`The sample "${file}" is not available.`);
      return
    }

    this.baseUrl = "https://tonejs.github.io/audio/"
    const url = this.sampleFiles[this.sample][1]
    const note = this.sampleFiles[this.sample][0]
    console.log(note, url)
    this.sampler = new Tone.Sampler({
        urls:{
            [60]: this.baseUrl.concat(url)
        }
    }).connect(this.vcf)
  }

    //envelopes
    triggerAttack (freq, amp=100, time=null){ 
        this.sampler.release = this.release
        freq = Tone.Midi(freq).toFrequency()
        amp = amp/127
        if(time){
            this.sampler.triggerAttack(freq, time, amp)
            //this.vca.factor.setValueAtTime(amp, time)
        } else{
            this.sampler.triggerAttack(freq)
            //this.vca.factor.value = amp
        }
        this.sampler.volume.value = this.volume
    }

    triggerRelease (freq, time=null){
        freq = Tone.Midi(freq).toFrequency()
        if(time) {
            this.sampler.triggerRelease(freq, time)
        }
        else {
            this.sampler.triggerRelease(freq)
        }
        this.sampler.release = this.release
    }

    triggerAttackRelease (freq, amp, dur=0.01, time=null){ 
        this.sampler.release = this.release 
        freq = Tone.Midi(freq).toFrequency()
        amp = amp/127
        if(time){
            this.sampler.triggerAttackRelease(freq, dur, time, amp)
            //this.vca.factor.setValueAtTime(amp, time)
        } else{
            this.sampler.triggerAttackRelease(freq, dur)
            //this.vca.factor.value = amp
        }
        this.sampler.volume.value = this.volume
    }//attackRelease

    connect(destination) {
        if (destination.input) {
            this.output.connect(destination.input);
        } else {
            this.output.connect(destination);
        }
    }

    //parameter setters
    setADSR(a,d,s,r){
        this.sampler.attack = a>0.001 ? a : 0.001
        //this.env.decay = d>0.01 ? d : 0.01
        //this.env.sustain = Math.abs(s)<1 ? s : 1
        this.sampler.release = r>0.01 ? r : 0.01
    }
}