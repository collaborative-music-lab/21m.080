/*
DatoDuo - polyphonic
Polyphonic subtractive synth
Modeled after the DatoDuo
*/

class PolyExample {
  constructor (gui = null) {
    this.gui = gui
    this.isGlide = false

    this.frequency = new Tone.Signal()
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
    this.frequency.connect(this.tonePitchshift)
    this.tonePitchshift.connect(this.pulseWav.frequency)
    this.frequency.connect(this.sawPitchshift)
    this.sawPitchshift.connect(this.sawWav.frequency)
    this.rampTime = .2

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

    //initialize values
    this.dist.wet.value = 0
    this.crusher.wet.value = 0
    this.delay.feedback.value = 0
    this.delay.wet.value = 0
    this.delaygain.factor.value = 0
    this.lfo.amplitude.value = 0
    this.pulseWav.width.value = 0.5
    this.filterDepth.value = 700
    this.filterEnvelope.release = 0.8
    this.filter.Q.value = 1
  }

  //envelopes
  triggerAttack (freq, amp, time=null){
    freq = Tone.Midi(freq).toFrequency()
    if(time){
      this.ampEnvelope.triggerAttack(time)
      this.filterEnvelope.triggerAttack(time)
      if (this.isGlide) {
        this.frequency.exponentialRampToValueAtTime(freq,this.rampTime, time)
      }
      else {
        this.frequency.setValueAtTime(freq, time)
      }
      this.velocity.rampTo(amp,.03)
    } else{
      this.ampEnvelope.triggerAttack()
      this.filterEnvelope.triggerAttack()
      this.frequency.value = freq
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
    freq = Tone.Midi(freq).toFrequency()
    if(time){
      this.ampEnvelope.triggerAttackRelease(dur, time)
      this.filterEnvelope.triggerAttackRelease(dur, time)
      if (this.isGlide) {
        this.frequency.exponentialRampToValueAtTime(freq,this.rampTime+time)
      }
      else {
        this.frequency.setValueAtTime(freq, time)
      }
      this.velocity.rampTo(amp,.03)
      
    } else{
      this.ampEnvelope.triggerAttackRelease(dur)
      this.filterEnvelope.triggerAttackRelease(dur)
      if (this.isGlide) {
        this.frequency.exponentialRamp(freq, this.rampTime)
      }
      else {
        this.frequency.value = freq
      }
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

  initGui(gui) {
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
      this.delay.feedback.value = x
      this.delay.wet.value = x
      this.delaygain.factor.value = x
      this.lfo.amplitude.value = x
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
      callback: (x)=>{this.pulseWav.width.value = x},
      orientation: 'vertical',
      showValue: false, 
      link: 'wave'
    })
    this.wave_fader.accentColor = [247, 5, 5]
    this.wave_fader.borderColor = [20, 20, 20]
    this.wave_fader.set(0.5)

    this.freq_fader = this.gui.Slider({
      label:'freq',
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
      callback: (x)=>{ this.filterEnvelope.release = x},
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
    this.speaker_knob.set( 0.03 )
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
      this.super.set('delay.feedback.value' , x)
      this.super.set('delay.wet.value' , x)
      this.super.set('delaygain.factor.value' , x)
      this.super.set('lfo.amplitude.value' , x)
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
      callback: (x)=>{this.super.set('pulseWav.width.value' , x)},
      orientation: 'vertical',
      showValue: false, 
      link: 'wave'
    })
    this.wave_fader.accentColor = [247, 5, 5]
    this.wave_fader.borderColor = [20, 20, 20]
    this.wave_fader.set(0.5)

    this.freq_fader = this.gui.Slider({
      label:'freq',
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
      callback: (x)=>{ this.super.set('filterEnvelope.release' , x)},
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
    this.speaker_knob.set( 0.03 )
  }
}

let poly = new Polyphony(PolyExample, 8)
let out  = new Tone.Multiply(0.2).toDestination()
poly.connect(out)

const gui = new p5(sketch, 'Polyphony')

poly.initGui(poly, gui)

setNoteOnHandler( (note,vel)=>{
  poly.triggerAttack(note, vel)
})

setNoteOffHandler( (note,vel)=>{
  poly.triggerRelease(note)
})