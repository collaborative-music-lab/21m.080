/*
DatoDuo
Monophonic subtractive synth
Modeled after the DatoDuo
*/

import p5 from 'p5';
import * as Tone from 'tone';

export class DatoDuo {
  constructor (gui = null) {
    this.gui = gui

    this.player = 'synth' //synth or seq
    this.isGlide = false

    this.masterFrequency = new Tone.Signal()
    this.tonePitchshift = new Tone.Multiply()
    this.sawPitchshift = new Tone.Multiply()
    this.pulseWav = new Tone.PulseOscillator().start()
    this.sawWav = new Tone.Oscillator({type:'sawtooth'}).start()
    this.toneMixer = new Tone.Multiply()
    this.sawMixer = new Tone.Multiply()
    this.cutoffSig = new Tone.Signal()
    this.filterEnvelope = new Tone.Envelope()
    this.filterDepth = new Tone.Multiply()
    this.filterMultiplier = new Tone.Multiply()
    this.filter = new Tone.Filter()
    this.velocity = new Tone.Signal()
    this.ampEnvelope = new Tone.Envelope()
    this.amp = new Tone.Multiply()
    this.output = new Tone.Multiply(0.05).toDestination()

    //this.scope = new Oscilloscope('Canvas3')

    //connect the initial signal to multipliers for pitch shift
    //connect those to the oscillators
    this.masterFrequency.connect(this.tonePitchshift)
    this.tonePitchshift.connect(this.pulseWav.frequency)
    this.masterFrequency.connect(this.sawPitchshift)
    this.sawPitchshift.connect(this.sawWav.frequency)

    this.masterFrequency.value = 500;
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
    this.filterEnvelope.connect(this.filterDepth)
    this.cutoffSig.connect(this.filter.frequency)
    this.filterDepth.connect(this.filter.frequency)

    this.cutoffSig.value = 1500
    this.filterDepth.factor.value = 5000
    this.filterEnvelope.attack = 0.1
    this.filterEnvelope.decay = 0.1
    this.filterEnvelope.sustain = 1
    this.filterEnvelope.release = 0.2
    this.filter.rolloff = -24
    this.filter.Q.value = 1

    //Connect the ASDR (VCA)
    this.filter.connect(this.amp)

    this.ampEnvelope.connect(this.amp.factor)
    this.ampEnvelope.attack = 0.3
    this.ampEnvelope.delay = 0.1
    this.ampEnvelope.sustain = 1
    this.ampEnvelope.release = 0.9

    //effects chain

    this.dist = new Tone.Distortion(0.9)
    this.crusher = new Tone.BitCrusher(2)
    this.delay = new Tone.FeedbackDelay()


    this.distgain = new Tone.Multiply(1)
    this.crushgain = new Tone.Multiply(1)
    this.delaygain = new Tone.Multiply(1)
    this.delayFilter = new Tone.Filter()
    this.lfo = new Tone.LFO("8n", 1000, 4000)

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
  }

  //envelopes
  triggerAttack (freq, amp, time=null){
    if(time){
      this.ampEnvelope.triggerAttack(time)
      this.filterEnvelope.triggerAttack(time)
      this.masterFrequency.setValueAtTime(freq, time)
      this.velocity.rampTo(amp,.03)
    } else{
      this.ampEnvelope.triggerAttack()
      this.filterEnvelope.triggerAttack()
      this.masterFrequency.value = freq
      this.velocity.rampTo(amp,.03)
    }
  }
  triggerRelease (time=null){
    if(time) {
      this.ampEnvelope.triggerRelease(time)
      this.filterEnvelope.triggerRelease(time)
    }
    else {
      this.ampEnvelope.triggerRelease()
      this.filterEnvelope.triggerRelease()
    }
  }
  triggerAttackRelease (freq, amp, dur=0.01, time=null){
    if(time){
      this.ampEnvelope.triggerAttackRelease(dur, time)
      this.filterEnvelope.triggerAttackRelease(dur, time)
      this.masterFrequency.setValueAtTime(freq, time)
      this.velocity.rampTo(amp,.03)
    } else{
      this.ampEnvelope.triggerAttackRelease(dur)
      this.filterEnvelope.triggerAttackRelease(dur)
      this.masterFrequency.value = freq
      this.velocity.rampTo(amp,.03)
    }
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
    this.ampEnvelope.attack = a>0.001 ? a : 0.001
    this.ampEnvelope.decay = d>0.01 ? d : 0.01
    this.ampEnvelope.sustain = Math.abs(s)<1 ? s : 1
    this.ampEnvelope.release = r>0.01 ? r : 0.01
  }
  setFilterADSR(a,d,s,r){
    this.filterEnvelope.attack = a>0.001 ? a : 0.001
    this.filterEnvelope.decay = d>0.01 ? d : 0.01
    this.filterEnvelope.sustain = Math.abs(s)<1 ? s : 1
    this.filterEnvelope.release = r>0.01 ? r : 0.01
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

  initgui() {
    this.distortion_toggle =  this.gui.Toggle({
      label:'Accent',
      mapto: this.dist.wet,
      x: 85, y:10, size: 0.8,
      link: 'dist'
    })
    this.distortion_toggle.accentColor = [51,145,219]
    this.dist.wet.value = 0

    this.crusher_toggle =  this.gui.Toggle({
      label:'bitcrusher',
      mapto: this.crusher.wet,
      x: 90, y:25, size: 0.8,
      link: 'crusher'
    })
    this.crusher_toggle.accentColor = [46,152,99]
    this.crusher.wet.value = 0

    this.glide_toggle =  this.gui.Toggle({
      label:'Glide',
      callback: (x)=>{this.isGlide = x}, //IDK how to implemement this in class
      x: 15, y:10, size: 0.8,
      link: 'glide'
    })
    this.glide_toggle.accentColor = [51,145,219]

    this.delay_knob = this.gui.Knob({
      label:'Delay Control',
      callback: (x)=>{this.delayControl(x)},
      x: 10, y: 25, size:0.8,
      min:0.001, max: 1, curve: 1,
      //showValue: false,
      link: 'delayknob'
    })
    this.delay_knob.accentColor = [49,48,55]
    this.delay_knob.set( 0.0001 )

    this.delayControl = function(x) {
      this.delay.feedback.value = stepper(x, 0 , 1 , [[0,0], [0.02, 0], [0.8,0.6], [1,1]])
      this.delay.wet.value = stepper(x , 0, 1, [[0,0], [0.02, 0], [0.04, 1], [1,1]])
      this.delaygain.factor.value = stepper(x , 0, 1, [[0,0], [0.02, 0], [0.04, 0.3], [0.4, 0.5], [1,1]])
      this.lfo.amplitude.value = stepper(x , 0, 1, [[0,0], [0.5, 0], [0.7, 0.5], [1,1]])
    }

    this.wave_fader = this.gui.Slider({
      label:'wave',
      //mapto: pulseWav.width,
      x: 39, y: 5, size: 2,
      min:0, max: 1,
      callback: (x)=>{this.pulseWav.width.value = stepper(x, 0, 1, [[0,0], [0.4, 0.6], [1,1]])},
      orientation: 'vertical',
      //showValue: false, 
      link: 'wave'
    })
    this.wave_fader.accentColor = [247, 5, 5]
    this.wave_fader.borderColor = [20, 20, 20]
    this.wave_fader.set(0.5)

    this.freq_fader = this.gui.Slider({
      label:'freq',
      callback: (x)=>{this.cutoffSig.value = stepper(x, 500, 2000, [[0,0], [0.6, 0.8], [1,1]])},
      x: 49, y: 5, size: 2,
      min:500, max: 2000, 
      orientation: 'vertical',
      //showValue: false,
      link: 'freq'
    })
    this.freq_fader.accentColor = [247, 5, 5]
    this.freq_fader.borderColor = [20, 20, 20]
    this.freq_fader.set(1250)

    this.release_fader = this.gui.Slider({
      label:'release',
      callback: (x)=>{ this.filterEnvelope.release = stepper(x, 0.0001, 2, [[0,0], [0.8, 0.5], [1,1]])},
      x: 59, y: 5, size: 2,
      min:0.0001, max: 2,
      orientation: 'vertical',
      //showValue: false,
      link: 'release'
    })
    this.release_fader.accentColor = [247, 5, 5]
    this.release_fader.borderColor = [20, 20, 20]
    this.release_fader.set(1)

    this.resonance_knob = this.gui.Knob({
      label:'res',
      callback: (x)=>{ this.filter.Q.value = x},
      x: 49.5, y: 43, size:.25,
      min:0.99999, max: 30, curve: 2,
      //showValue: false,
      link: 'res'
    })
    this.resonance_knob.accentColor = [49,48,55]
    this.resonance_knob.set( 1 )

    this.detune_knob = this.gui.Knob({
      label:'detune',
      mapto: this.tonePitchshift.factor,
      x: 22, y: 25, size:.25,
      min:0.99999, max: 2, curve: 1,
      //showValue: false,
      link: 'detune'
    })
    this.detune_knob.accentColor = [49,48,55]
    this.detune_knob.set( 1 )

    this.speaker_knob = this.gui.Knob({
      label:'gain',
      mapto: this.output.factor,
      x: 78, y: 25, size:.25,
      min:0, max: 0.1, curve: 2,
      //showValue: false,
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
      callback: function(){ this.kickPlayer.start()},
      size: 1, border: 20,
      x:30, y:40, size: 1,
      link: 'kick'
    })
    this.kick_trigger.accentColor = [20,20,20]

    this.snare_trigger = this.gui.Button({
      label:'snare',
      callback: function(){ this.snarePlayer.start()},
      size: 1, border: 20,
      x:70, y:40, size: 1,
      link: 'snare',
    })
    this.snare_trigger.accentColor = [20,20,20]

    /*
    * Helper function for creating a custom curve for this.gui elements
    *
    * input : input of the stepper function
    * min: minimmum value of the element
    * max: maximmum value of the element
    * steps: array of arrays in format [[0,0], [a,b], .... [1,1]] where each point is a step in the curve
    * 
    * x values are how much the this.gui element is turned
    * y values are the level the elements are at internally
    */

    function stepper(input, min, max, steps) {
      let range = max - min
      let rawval = (input - min) / range
      const gui_values = []
      const internal_values = []
      for (let i = 0; i < steps.length ; i++) {
        gui_values.push(steps[i][0])
        internal_values.push(steps[i][1])
      }
      let index = 0
      while(index < gui_values.length) {
        if (rawval < gui_values[index]) {
          let slope = (internal_values[index] - internal_values[index - 1])/(gui_values[index] - gui_values[index-1])
          let rawCurved = internal_values[index-1] + slope * (rawval - gui_values[index - 1]) 
          let realCurved = (rawCurved * range) + min
          //console.log('input value', input)
          //console.log('curved value', realCurved)
          return realCurved
        }
        index++
      }
      return max
    }
  }
}

