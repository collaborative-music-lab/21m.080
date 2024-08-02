/*
DatoDuo
Monophonic subtractive synth
Modeled after the DatoDuo
*/

import p5 from 'p5';
import * as Tone from 'tone';

import {stepper} from  '../Utilities.js'
import DatoDuoPresets from './synthPresets/DatoDuoPresets.json';
import { MonophonicTemplate } from './MonophonicTemplate';


export class DatoDuo extends MonophonicTemplate {
  constructor (gui = null) {
    super()
    this.gui = gui
    this.presets = DatoDuoPresets
    this.isGlide = false
    this.name = "DatoDuo"
    console.log(this.name, " loaded, available preset: ", DatoDuoPresets)

    this.frequency = new Tone.Signal()
    this.tonePitchshift = new Tone.Multiply()
    this.sawPitchshift = new Tone.Multiply()
    this.pulseWav = new Tone.PulseOscillator().start()
    this.sawWav = new Tone.Oscillator({type:'sawtooth'}).start()
    this.toneMixer = new Tone.Multiply()
    this.sawMixer = new Tone.Multiply()
    this.cutoffSig = new Tone.Signal()
    this.vcf_env = new Tone.Envelope()
    this.filterDepth = new Tone.Multiply()
    this.filterMultiplier = new Tone.Multiply()
    this.filter = new Tone.Filter()
    this.velocity = new Tone.Signal()
    this.env = new Tone.Envelope()
    this.amp = new Tone.Multiply()
    this.output = new Tone.Multiply(0.05).toDestination()

    //this.scope = new Oscilloscope('Canvas3')

    //connect the initial signal to multipliers for pitch shift
    //connect those to the oscillators
    this.frequency.connect(this.tonePitchshift)
    this.tonePitchshift.connect(this.pulseWav.frequency)
    this.frequency.connect(this.sawPitchshift)
    this.sawPitchshift.connect(this.sawWav.frequency)
    this.rampTime = .01

    this.frequency.value = 500;
    this.tonePitchshift.factor.value = 1;
    this.sawPitchshift.factor.value = 1;

    //connect the oscillators to a mixer and add them together
    this.pulseWav.connect(this.toneMixer)
    this.toneMixer.connect(this.filter)
    this.sawWav.connect(this.sawMixer)
    this.sawMixer.connect(this.filter)

    this.toneMixer.factor.value = 1
    this.sawMixer.factor.value = 1

    //Connect the filter (VCF)
    this.vcf_env.connect(this.filterDepth)
    this.cutoffSig.connect(this.filter.frequency)
    this.filterDepth.connect(this.filter.frequency)

    this.cutoffSig.value = 1500
    this.filterDepth.factor.value = 5000
    this.vcf_env.attack = 0.02
    this.vcf_env.decay = 0.1
    this.vcf_env.sustain = .5
    this.vcf_env.release = 0.2
    this.filter.rolloff = -24
    this.filter.Q.value = 1

    //Connect the ASDR (VCA)
    this.filter.connect(this.amp)

    this.env.connect(this.amp.factor)
    this.env.attack = 0.01
    this.env.delay = 0.1
    this.env.sustain = 0
    this.env.release = 0.9

    //effects chain

    this.dist = new Tone.Distortion(0.9)
    this.crusher = new Tone.BitCrusher(2)
    this.delay = new Tone.FeedbackDelay()


    this.distgain = new Tone.Multiply(1)
    this.crushgain = new Tone.Multiply(1)
    this.delaygain = new Tone.Multiply(1)
    this.delayFilter = new Tone.Filter()
    this.lfo = new Tone.LFO("8n", 400, 2000)

    this.distout = new Tone.Add()
    this.crushout = new Tone.Add()
    this.delayout = new Tone.Add()

    //distortion
    this.amp.connect(this.distout)
    this.amp.connect(this.distgain)
    this.distgain.connect(this.dist)
    this.dist.connect(this.distout)

    //bitcrusher
    this.distout.connect(this.crushout)
    this.distout.connect(this.crushgain)
    this.crushgain.connect(this.crusher)
    this.crusher.connect(this.crushout)

    //delay
    this.crushout.connect(this.delayout)
    this.crushout.connect(this.delaygain)
    this.delaygain.connect(this.delay)
    this.delay.connect(this.delayFilter)
    this.lfo.connect(this.delayFilter.frequency)
    this.delayFilter.connect(this.delayout)
    this.delayout.connect(this.output)

    if (this.gui !== null) {
        this.initGui()
        this.hideGui();
        setTimeout(()=>{this.loadPreset('default')}, 500);
    }
  }

  //envelopes
  triggerAttack (freq, amp, time=null){
    amp = amp/127
    freq = Tone.Midi(freq).toFrequency()
    if(time){
      this.env.triggerAttack(time)
      this.vcf_env.triggerAttack(time)
      if (this.isGlide) {
        this.frequency.linearRampToValueAtTime(freq,this.rampTime+ time)
      }
      else {
        this.frequency.setValueAtTime(freq, time)
      }
      this.velocity.rampTo(amp,.03)
    } else{
      this.env.triggerAttack()
      this.vcf_env.triggerAttack()
      this.frequency.value = freq
      this.velocity.rampTo(amp,.03)
    }
  }
  triggerRelease (time=null){
    if(time) {
      this.env.triggerRelease(time)
      this.vcf_env.triggerRelease(time)
    }
    else {
      this.env.triggerRelease()
      this.vcf_env.triggerRelease()
    }
  }
  // Override triggerAttackRelease method
    triggerAttackRelease(freq, amp, dur = 0.01, time = null) {
        amp = amp / 127;
        freq = Tone.Midi(freq).toFrequency();
        if (time) {
            this.env.triggerAttackRelease(dur, time);
            this.vcf_env.triggerAttackRelease(dur, time);
            if (this.isGlide) {
                this.frequency.linearRampToValueAtTime(freq, this.rampTime + time);
            } else {
                this.frequency.setValueAtTime(freq, time);
            }
        } else {
            this.env.triggerAttackRelease(dur);
            this.vcf_env.triggerAttackRelease(dur);
            if (this.isGlide) {
                this.frequency.exponentialRamp(freq, this.rampTime);
            } else {
                this.frequency.value = freq;
            }
            this.velocity.rampTo(amp, 0.03);
        }
    }//attackRelease


  //parameter setters
  setADSR(a,d,s,r){
    this.env.attack = a>0.001 ? a : 0.001
    this.env.decay = d>0.01 ? d : 0.01
    this.env.sustain = Math.abs(s)<1 ? s : 1
    this.env.release = r>0.01 ? r : 0.01
  }
  setFilterADSR(a,d,s,r){
    this.vcf_env.attack = a>0.001 ? a : 0.001
    this.vcf_env.decay = d>0.01 ? d : 0.01
    this.vcf_env.sustain = Math.abs(s)<1 ? s : 1
    this.vcf_env.release = r>0.01 ? r : 0.01
  }
  setDetune(detune){
    this.sawPitchshift.factor.value = detune
  }
  setPulsewidth(width){
    this.pulseWav.width = width
  }
  setOutputGain(out){
    this.output.factor.value = out
  }


  initGui(gui = this.gui) {
    this.gui = gui

    this.distortion_toggle =  this.gui.Toggle({
      label:'Accent',
      mapto: this.dist.wet,
      x: 85, y:20, size: 0.8,
      link: 'dist'
    })
    this.distortion_toggle.accentColor = [51,145,219]
    this.dist.wet.value = 0

    this.crusher_toggle =  this.gui.Toggle({
      label:'bitcrusher',
      mapto: this.crusher.wet,
      x: 90, y:50, size: 0.8,
      link: 'crusher'
    })
    this.crusher_toggle.accentColor = [46,152,99]
    this.crusher.wet.value = 0

    this.glide_toggle =  this.gui.Toggle({
      label:'Glide',
      callback: (x)=>{this.isGlide = x}, //IDK how to implemement this in class
      x: 15, y:20, size: 0.8,
      link: 'glide'
    })
    this.glide_toggle.accentColor = [51,145,219]

    this.delayControl = function(x) {
      this.delay.feedback.value = stepper(x, 0 , 1 , [[0,0], [0.02, 0], [0.8,0.6], [1,1]])
      this.delay.wet.value = stepper(x , 0, 1, [[0,0], [0.02, 0], [0.04, 1], [1,1]])
      this.delaygain.factor.value = stepper(x , 0, 1, [[0,0], [0.02, 0], [0.04, 0.3], [0.4, 0.5], [1,1]])
      this.lfo.amplitude.value = stepper(x , 0, 1, [[0,0], [0.5, 0], [0.7, 0.5], [1,1]])
    }

    this.delay_knob = this.gui.Knob({
      label:'Delay Control',
      callback: (x)=>{this.delayControl(x)},
      x: 10, y: 50, size:0.8,
      min:0.001, max: 1, curve: 1,
      showValue: false,
      link: 'delayknob'
    })
    this.delay_knob.accentColor = [49,48,55]
    this.delay_knob.set( 0.0001 )

    this.wave_fader = this.gui.Slider({
      label:'wave',
      x: 39, y: 10, size: 2,
      min:0, max: 1,
      callback: (x)=>{this.pulseWav.width.value = stepper(x, 0, 1, [[0,0], [0.4, 0.6], [1,1]])},
      orientation: 'vertical',
      showValue: false, 
      link: 'wave'
    })
    this.wave_fader.accentColor = [247, 5, 5]
    this.wave_fader.borderColor = [20, 20, 20]
    this.wave_fader.set(0.5)

    this.freq_fader = this.gui.Slider({
      label:'freq',
      //callback: (x)=>{this.cutoffSig.value = stepper(x, 200, 1200, [[0,0], [0.6, 0.8], [1,1]])},
      callback: (x)=>{this.filterDepth.value = x},
      mapto: this.cutoffSig,
      x: 49, y: 10, size: 2,
      min:50, max: 2500, curve: 2,
      orientation: 'vertical',
      showValue: false,
      link: 'freq'
    })
    this.freq_fader.accentColor = [247, 5, 5]
    this.freq_fader.borderColor = [20, 20, 20]
    this.freq_fader.set(700)

    this.release_fader = this.gui.Slider({
      label:'release',
      callback: (x)=>{ 
        this.env.decay = stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]])
        this.env.release = stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]])
        this.vcf_env.decay = stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]])
        this.vcf_env.release = stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]])
      },
      x: 59, y: 10, size: 2,
      min:0.1, max: 1.5,
      orientation: 'vertical',
      showValue: false,
      link: 'release'
    })
    this.release_fader.accentColor = [247, 5, 5]
    this.release_fader.borderColor = [20, 20, 20]
    this.release_fader.set(0.8)

    this.resonance_knob = this.gui.Knob({
      label:'res',
      callback: (x)=>{ this.filter.Q.value = x},
      x: 49.5, y: 86, size:.25,
      min:0.99999, max: 30, curve: 2,
      showValue: false,
      link: 'res'
    })
    this.resonance_knob.accentColor = [49,48,55]
    this.resonance_knob.set( 1 )

    this.detune_knob = this.gui.Knob({
      label:'detune',
      mapto: this.tonePitchshift.factor,
      x: 22, y: 50, size:.25,
      min:0.99999, max: 2, curve: 1,
      showValue: false,
      link: 'detune'
    })
    this.detune_knob.accentColor = [49,48,55]
    this.detune_knob.set( 1 )

    this.speaker_knob = this.gui.Knob({
      label:'gain',
      mapto: this.output.factor,
      x: 78, y: 50, size:.25,
      min:0, max: 0.1, curve: 2,
      showValue: false,
      link: 'gain'
    })
    this.speaker_knob.accentColor = [49,48,55]
    this.speaker_knob.set( 0.05 )

    //sampler - beatpads

    this.kick = "audio/drums-003.mp3"
    this.snare = "audio/snare.mp3"
    this.kickPlayer = new Tone.Player(this.kick).toDestination()
    this.snarePlayer = new Tone.Player(this.snare).toDestination()
    this.kickPlayer.playbackRate = 1
    this.snarePlayer.playbackRate = 1

    //trigger playback of the loaded soundfile

    this.kick_trigger = this.gui.Button({
      label:'kick',
      callback: ()=>{ this.kickPlayer.start()},
      size: 1, border: 20,
      x:30, y:80, size: 1,
      link: 'kick'
    })
    this.kick_trigger.accentColor = [20,20,20]

    this.snare_trigger = this.gui.Button({
      label:'snare',
      callback: ()=>{ this.snarePlayer.start()},
      size: 1, border: 20,
      x:70, y:80, size: 1,
      link: 'snare',
    })
    this.snare_trigger.accentColor = [20,20,20]

    this.gui_elements = [this.distortion_toggle, this.crusher_toggle, 
      this.glide_toggle, this.delay_knob, this.wave_fader, 
      this.freq_fader, this.release_fader, this.resonance_knob,
      this.detune_knob, this.speaker_knob, this.kick_trigger,
      this.snare_trigger]

  }


  initPolyGui(superClass, gui) {
    this.gui = gui
    this.super = superClass
    this.distortion_toggle =  this.gui.Toggle({
      label:'Accent',
      callback: (x)=>{this.super.set('dist.wet' , x)},
      x: 85, y:20, size: 0.8,
      link: 'dist'
    })
    this.distortion_toggle.accentColor = [51,145,219]
    this.super.set('dist.wet.value' , 0)

    this.crusher_toggle =  this.gui.Toggle({
      label:'bitcrusher',
      callback: (x)=>{this.super.set('crusher.wet' , x)},
      x: 90, y:50, size: 0.8,
      link: 'crusher'
    })
    this.crusher_toggle.accentColor = [46,152,99]
    this.super.set('crusher.wet.value',  0)

    this.glide_toggle =  this.gui.Toggle({
      label:'Glide',
      callback: (x)=>{this.super.set('isGlide' , x)},
      x: 15, y:20, size: 0.8,
      link: 'glide'
    })
    this.glide_toggle.accentColor = [51,145,219]

    this.delayControl = function(x) {
      this.super.set('delay.feedback.value' , stepper(x, 0 , 1 , [[0,0], [0.02, 0], [0.8,0.6], [1,1]]))
      this.super.set('delay.wet.value' , stepper(x , 0, 1, [[0,0], [0.02, 0], [0.04, 1], [1,1]]))
      this.super.set('delaygain.factor.value' , stepper(x , 0, 1, [[0,0], [0.02, 0], [0.04, 0.3], [0.4, 0.5], [1,1]]))
      this.super.set('lfo.amplitude.value' , stepper(x , 0, 1, [[0,0], [0.5, 0], [0.7, 0.5], [1,1]]))
    }

    this.delay_knob = this.gui.Knob({
      label:'Delay Control',
      callback: (x)=>{this.delayControl(x)},
      x: 10, y: 50, size:0.8,
      min:0.001, max: 1, curve: 1,
      showValue: false,
      link: 'delayknob'
    })
    this.delay_knob.accentColor = [49,48,55]
    this.delay_knob.set( 0.0001 )

    this.wave_fader = this.gui.Slider({
      label:'wave',
      x: 39, y: 10, size: 2,
      min:0, max: 1,
      callback: (x)=>{this.super.set('pulseWav.width.value' , stepper(x, 0, 1, [[0,0], [0.4, 0.6], [1,1]]))},
      orientation: 'vertical',
      showValue: false, 
      link: 'wave'
    })
    this.wave_fader.accentColor = [247, 5, 5]
    this.wave_fader.borderColor = [20, 20, 20]
    this.wave_fader.set(0.5)

    this.freq_fader = this.gui.Slider({
      label:'freq',
      //callback: (x)=>{this.cutoffSig.value = stepper(x, 200, 1200, [[0,0], [0.6, 0.8], [1,1]])},
      callback: (x)=>{this.super.set('filterDepth.value' , x)},
      mapto: this.cutoffSig,
      x: 49, y: 10, size: 2,
      min:50, max: 2500, curve: 2,
      orientation: 'vertical',
      showValue: false,
      link: 'freq'
    })
    this.freq_fader.accentColor = [247, 5, 5]
    this.freq_fader.borderColor = [20, 20, 20]
    this.freq_fader.set(700)

    this.release_fader = this.gui.Slider({
      label:'release',
      callback: (x)=>{ 
        this.super.set('env.decay' , stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]]))
        this.super.set('env.release' , stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]]))
        this.super.set('vcf_env.decay' , stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]]))
        this.super.set('vcf_env.release' , stepper(x, 0.1, 5, [[0,0], [0.8, 0.5], [1,5]]))
      },
      x: 59, y: 10, size: 2,
      min:0.1, max: 1.5,
      orientation: 'vertical',
      showValue: false,
      link: 'release'
    })
    this.release_fader.accentColor = [247, 5, 5]
    this.release_fader.borderColor = [20, 20, 20]
    this.release_fader.set(0.8)

    this.resonance_knob = this.gui.Knob({
      label:'res',
      callback: (x)=>{ this.super.set('filter.Q.value' , x)},
      x: 49.5, y: 86, size:.25,
      min:0.99999, max: 30, curve: 2,
      showValue: false,
      link: 'res'
    })
    this.resonance_knob.accentColor = [49,48,55]
    this.resonance_knob.set( 1 )

    this.detune_knob = this.gui.Knob({
      label:'detune',
      callback: (x)=>{ this.super.set('tonePitchshift.factor' , x)},
      x: 22, y: 50, size:.25,
      min:0.99999, max: 2, curve: 1,
      showValue: false,
      link: 'detune'
    })
    this.detune_knob.accentColor = [49,48,55]
    this.detune_knob.set( 1 )

    this.speaker_knob = this.gui.Knob({
      label:'gain',
      callback: (x)=>{ this.super.set('output.factor' , x)},
      x: 78, y: 50, size:.25,
      min:0, max: 0.1, curve: 2,
      showValue: false,
      link: 'gain'
    })
    this.speaker_knob.accentColor = [49,48,55]
    this.speaker_knob.set( 0.05 )

    //sampler - beatpads

    this.kick = "audio/drums-003.mp3"
    this.snare = "audio/snare.mp3"
    this.kickPlayer = new Tone.Player(this.kick).toDestination()
    this.snarePlayer = new Tone.Player(this.snare).toDestination()
    this.kickPlayer.playbackRate = 1
    this.snarePlayer.playbackRate = 1

    //trigger playback of the loaded soundfile

    this.kick_trigger = this.gui.Button({
      label:'kick',
      callback: ()=>{ this.kickPlayer.start()},
      size: 1, border: 20,
      x:30, y:80, size: 1,
      link: 'kick'
    })
    this.kick_trigger.accentColor = [20,20,20]

    this.snare_trigger = this.gui.Button({
      label:'snare',
      callback: ()=>{ this.snarePlayer.start()},
      size: 1, border: 20,
      x:70, y:80, size: 1,
      link: 'snare',
    })
    this.snare_trigger.accentColor = [20,20,20]
  }
}