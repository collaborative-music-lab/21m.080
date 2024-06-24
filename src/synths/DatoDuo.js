/*
DatoDuo
Monophonic subtractive synth
Modeled after the DatoDuo
*/

import p5 from 'p5';
import * as Tone from 'tone';

export class DatoDuo {
  constructor (gui = null) {
    //Tone.start()
    //console.log('start');

    this.gui = gui
    this.toneSig = new Tone.Signal()
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
    this.ampEnvelope = new Tone.Envelope()
    this.amp = new Tone.Multiply()
    this.ampDepth = new Tone.Multiply()
    this.dist = new Tone.Distortion(0.9)
    this.crusher = new Tone.BitCrusher(16)
    this.delay = new Tone.FeedbackDelay()
    this.output = new Tone.Multiply(0.05)

    //connect the initial signal to multipliers for pitch shift
    //connect those to the oscillators
    this.toneSig.connect(this.tonePitchshift), this.tonePitchshift.connect(this.pulseWav.frequency)
    this.toneSig.connect(this.sawPitchshift), this.sawPitchshift.connect(this.sawWav.frequency)

    //this.toneSig.value = 500; //do I need this????????
    this.tonePitchshift.factor.value = 1;
    this.sawPitchshift.factor.value = 1;

    //connect the oscillators to a mixer and add them together
    this.pulseWav.connect(this.toneMixer), this.toneMixer.connect(this.filter)
    this.sawWav.connect(this.sawMixer), this.sawMixer.connect(this.filter)

    this.toneMixer.factor.value = 1
    this.sawMixer.factor.value = 1

    //Connect the filter (VCF)
    this.filterEnvelope.connect(this.filterDepth)
    this.cutoffSig.connect(this.filter.frequency)
    this.filterDepth.connect(this.filter.frequency)

    this.cutoffSig.value = 1000
    this.filterDepth.factor.value = 1000
    this.filterEnvelope.attack = 0.2
    this.filterEnvelope.decay = 0.1
    this.filterEnvelope.sustain = 0.4
    this.filterEnvelope.release = 0.2
    this.filter.rolloff = -24
    this.filter.Q.value = 1

    //Connect the ASDR (VCA)
    this.filter.connect(this.amp)


    this.ampEnvelope.connect(this.ampDepth)
    this.velocity = new Tone.Signal(1)
    this.velocity.connect(this.ampDepth.factor)
    this.ampDepth.connect(this.amp.factor)

    this.ampEnvelope.attack = 0.1
    this.ampEnvelope.delay = 0.1
    this.ampEnvelope.sustain = 0.9
    this.ampEnvelope.release = 0.1

    //effects chain

    this.amp.connect(this.dist)
    this.dist.connect(this.crusher)
    this.crusher.connect(this.delay)
    this.delay.connect(this.output)
  }

  //envelopes
  triggerAttack (freq, amp, time=null){
    if(time){
      this.ampEnvelope.triggerAttack(time)
      this.filterEnvelope.triggerAttack(time)
      this.toneSig.setValueAtTime(freq, time)
      this.velocity.rampTo(amp,.03)
    } else{
      this.ampEnvelope.triggerAttack()
      this.filterEnvelope.triggerAttack()
      this.toneSig.value = freq
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
      this.toneSig.setValueAtTime(freq, time)
      this.velocity.rampTo(amp,.03)
    } else{
      this.ampEnvelope.triggerAttackRelease(dur)
      this.filterEnvelope.triggerAttackRelease(dur)
      this.toneSig.value = freq
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

  initGUI(gui) {
    this.distortion_toggle =  gui.Toggle({
      label:'Accent',
      mapto: this.dist.wet,
      x: 85, y:30
    })
    this.distortion_toggle.accentColor = [51,145,219]
    this.dist.wet.value = 0
    
    this.crusher_toggle =  gui.Toggle({
      label:'bitcrusher',
      mapto: this.crusher.bits,
      min:16, max:2,
      x: 90, y:70
    })
    this.crusher_toggle.accentColor = [46,152,99]
    this.crusher.wet.value = 1
    
    this.glide_toggle =  gui.Toggle({
      label:'Glide',
      callback: function(){}, //portamento on sequencer side
      x: 15, y:30
    })
    this.glide_toggle.accentColor = [51,145,219]
    
    this.delay_toggle =  gui.Toggle({
      label:'Delay',
      mapto: this.delay.wet,
      x: 10, y:70
    })
    this.delay_toggle.accentColor = [46,152,99]
    this.delay.wet.value = 0
    
    this.wave_fader = gui.Slider({
      label:'wave',
      mapto: this.pulseWav.width,
      x: 39, y: 5, size: 2,
      min:0, max: 1,
      orientation: 'vertical',
      showValue: false, 
    })
    this.wave_fader.accentColor = [247, 5, 5]
    this.wave_fader.borderColor = [20, 20, 20]
    this.wave_fader.set(0.5)
    
    this.freq_fader = gui.Slider({
      label:'freq',
      callback: function(x){ this.cutoffSig.value = x},
      x: 49, y: 5, size: 2,
      min:500, max: 2000,
      orientation: 'vertical',
      showValue: false
    })
    this.freq_fader.accentColor = [247, 5, 5]
    this.freq_fader.borderColor = [20, 20, 20]
    this.freq_fader.set(1250)
    
    this.release_fader = gui.Slider({
      label:'release',
      callback: function(x){ this.filterEnvelope.release = x},
      x: 59, y: 5, size: 2,
      min:0, max: 5,
      orientation: 'vertical',
      showValue: false
    })
    this.release_fader.accentColor = [247, 5, 5]
    this.release_fader.borderColor = [20, 20, 20]
    this.release_fader.set(2.5)
    
    this.resonance_knob = gui.Knob({
      label:'res',
      callback: function(x){ this.filter.Q.value = x},
      x: 50, y: 84, size:.25,
      min:0.99999, max: 100, curve: 2,
      showValue: false
    })
    this.resonance_knob.accentColor = [49,48,55]
    this.resonance_knob.set( 1 )
    
    this.detune_knob = gui.Knob({
      label:'detune',
      mapto: this.tonePitchshift.factor,
      x: 22, y: 52, size:.25,
      min:0.99999, max: 3, curve: 1,
      showValue: false
    })
    this.detune_knob.accentColor = [49,48,55]
    this.detune_knob.set( 1 )
    
    this.speaker_knob = gui.Knob({
      label:'gain',
      mapto: this.masterOut.factor,
      x: 78, y: 52, size:.25,
      min:0, max: 0.1, curve: 2,
      showValue: false
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
    
    this.kick_trigger = gui.Button({
      label:'kick',
      callback: function(){ this.kickPlayer.start()},
      size: 1, border: 20,
      x:30, y:80
    })
    this.kick_trigger.accentColor = [20,20,20]
    
    this.snare_trigger = gui.Button({
      label:'snare',
      callback: function(){ this.snarePlayer.start()},
      size: 1, border: 20,
      x:70, y:80
    })
    this.snare_trigger.accentColor = [20,20,20]
  }

}

