/*
KP

Karplus-Strong synthesis
* input->gain->convolver->waveShaper->output

methods:
- load(url) loads an IR
- filterIR: applies a lowpass to the IR, destructive
- highpassIR: applies a highpass to the IR, destructive
- stretchIR: stretches the IR
- ampIR: amplifies the IR into a softclipper

properties:
- gain.factor.value
*/

import p5 from 'p5';
import * as Tone from 'tone';
import { NoiseVoice } from './NoiseVoice.js';
import { Resonator } from './Resonator.js';

class Voice{
	constructor(color = [200,200,200]){
      this.impulse = new Tone.Noise().start()
      this.hpf = new Tone.Filter({frequency: 200, type:'highpass', Q: 0})
      this.lpf = new Tone.Filter({frequency: 1000, type:'lowpass', Q: 0})
      this.dry = new Tone.Multiply(0.5)
      this.wet = new Tone.Multiply(0.5)
      this.vca= new Tone.Multiply(1)
      this.delay = new Tone.LowpassCombFilter({resonance:.95,dampening:10000})
      //control
      this.env = new Tone.Envelope()
      this.cutoffSignal = new Tone.Signal(1000)
      this.bandwidthSignal = new Tone.Signal(500)
      this.hpfBandWidthNegate = new Tone.Negate()
      this.hpf_env_depth = new Tone.Multiply()
      this.lpf_env_depth = new Tone.Multiply()
      this.delayTime = new Tone.Signal(.1)
      this.output = new Tone.Multiply(1)
      //connections
      this.impulse.connect(this.hpf)
      this.hpf.connect(this.lpf)
      this.lpf.connect(this.vca)
      this.vca.connect(this.dry)
      this.dry.connect(this.output)
      this.vca.connect(this.wet)
      this.wet.connect(this.delay)
      this.delay.connect(this.output)
      this.env.connect(this.vca.factor)
      this.delayTime.connect( this.delay.delayTime)
      //filter cutoffs
      this.cutoffSignal.connect( this.hpf.frequency)
      this.cutoffSignal.connect( this.lpf.frequency)
      this.env.connect(this.hpf_env_depth.factor)
      this.env.connect(this.hpf_env_depth.factor)
      this.hpf_env_depth.connect( this.hpf.frequency)
      this.lpf_env_depth.connect( this.lpf.frequency)
      this.bandwidthSignal.connect( this.lpf.frequency)
      this.bandwidthSignal.connect(this.hpfBandWidthNegate)
      this.hpfBandWidthNegate.connect(this.hpf.frequency)
	}
  cutoff = function(val,time=null){
    if(time)this.cutoffSignal.setValueAtTime(val, time)
    else this.cutoffSignal.value = val  
  }
  bandwidth = function(val, time){
    if(time) this.bandwidthSignal.setValueAtTime(val, time)
    else this.bandwidthSignal.value = val
  }
  frequency = function(val,time=null){
    if(time){
    	this.delayTime.setValueAtTime(1/val, time)
    }
    else {
    	this.delayTime.value = 1/val
    }
  }
  triggerAttack = function(val, time=null){
    if(time){
      this.env.triggerAttack(time)
      this.frequency(val, time)
    } else{
      this.env.triggerAttack()
      this.frequency(val)
    }
  }
  triggerRelease = function(val, time=null){
    if(time) this.env.triggerRelease(time)
    else this.env.triggerRelease()
  }
  triggerAttackRelease = function(val, dur=0.01, time=null){
    if(time){
      this.env.triggerAttackRelease(dur, time)
      this.frequency(val, time)
    } else{
      this.env.triggerAttackRelease(dur)
      this.frequency(val)
    }
  }//attackRelease
}

export class KP {
  constructor(num = 8, color = [200,200,200]){
    this.numVoices = num
    this.voice = []
    for(let i=0;i<this.numVoices;i++) this.voice.push(new Voice())
    this.output = new Tone.Multiply(0.15)
    for(let i=0;i<this.numVoices;i++) this.voice[i].output.connect( this.output)
    this.prevNote = 0
    this.v = 0
    this.voiceCounter = 0
    this.activeNotes = [-1,-1,-1,-1, -1,-1,-1,-1]
    this.noteOrder = [7,0,1,2,3,4,5,6]
  }
  // //trigger methods
  triggerAttack = function(val, time=null){
    this.v = this.getNewVoice(val)
    if(time){
      this.voice[this.v].triggerAttack(val,time)
    } else{
      this.voice[this.v].triggerAttack(val)
    }
  }
  triggerRelease = function(val, time=null){
    this.v = this.getActiveVoice(val)
    if(this.v < 0) return
    if(time){
      this.voice[this.v].triggerRelease(time)
    } else{
      this.voice[this.v].triggerRelease()
    }
  }
  triggerAttackRelease = function(val, dur=0.01, time=null){
    this.v = this.getNewVoice(val)
    if(time){
      this.voice[this.v].triggerAttackRelease(dur, time)
    } else{
      this.voice[this.v].triggerAttackRelease(dur)
    }
  }//attackRelease
  // //voice management
  getNewVoice(num) {
      //keep track of the order notes are played 
      this.prevNote = this.noteOrder.pop();
      this.noteOrder.push(num);
      //look for free notes
      for(let i=0;i<this.numVoices;i++){
          if(this.activeNotes[(i+this.voiceCounter)%this.numVoices]<0){
              this.activeNotes[(i+this.voiceCounter)%this.numVoices] = num;
              this.voiceCounter = (i+this.voiceCounter)%this.numVoices
              return (i+this.voiceCounter++)%this.numVoices;
            //this.voiceCounter updates AFTER return
          }
      }
      //if no inactive voice
      for(let i=0;i<this.numVoices;i++){
          if(this.activeNotes[i] == this.prevNote) {
              this.activeNotes[i] = num;
              this.voiceCounter = i
              return i;
          }
      }
      return this.voiceCounter++;  //safety
  }//getNewVoice
  getActiveVoice= function(num){    
    for(let i=0;i<this.numVoices;i++){
      if(this.activeNotes[i]==num){
        this.activeNotes[i] = -1
        return i
      }
    }
    return -1
  }//getActiveVoice
  panic = function(){
    for(let i=0;i<this.numVoices;i++){
      this.voice[i].triggerRelease()
      this.activeNotes[i]  = -1
    }
  }
  // //setters
  setResonance = function(val){
    for(let i=0;i<this.numVoices;i++) this.voice[i].delay.resonance.value = val
  }
  setDamping = function(val){
    for(let i=0;i<this.numVoices;i++) this.voice[i].delay.dampening = val
  }
  setFilterFreq = function(val){
    for(let i=0;i<this.numVoices;i++) this.voice[i].vcf.frequency.value = val
  }
  setFilterQ = function(val){
    for(let i=0;i<this.numVoices;i++) this.voice[i].vcf.Q.value = val
  }
  setEnv = function(a,d,s,r){
    for(let i=0;i<this.numVoices;i++) {
      this.voice[i].env.attack = a
      this.voice[i].env.decay = d
      this.voice[i].env.sustain = s
      this.voice[i].env.release = r
    }
  }
}