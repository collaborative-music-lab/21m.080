class KickDrum{
  constructor(freq=60,decay=.4,tone=.2) {
    this.vco = new Tone.Oscillator().start()
    this.shaperGain = new Tone.Multiply(tone)
    this.waveShaper = new Tone.WaveShaper((x)=>{
      return Math.tanh(x*16) *.9
    })
    this.vca = new Tone.Multiply()
    this.output = new Tone.Multiply(.5)
    //
    this.pitch_env = new Tone.Envelope()
    this.pitch_env_depth = new Tone.Multiply()
    this.frequency = new Tone.Signal(freq)
    this.env = new Tone.Envelope()
    //
    this.vco.connect( this.vca)
    this.vca.connect( this.shaperGain)
    this.shaperGain.connect( this.waveShaper)
    this.waveShaper.connect( this.output)
    //
    this.pitch_env.connect( this.pitch_env_depth)
    this.pitch_env_depth.connect( this.vco.frequency)
    this.frequency.connect( this.vco.frequency)
    this.env.connect(this.vca.factor)
    //
    this.env.decay = decay
    this.env.release = decay
    this.env.sustain = 0
    this.env.attack = .03
    //
    this.pitch_env.attack = 0.00
    this.pitch_env.decay = 1
    this.pitch_env.sustain = 0
    this.pitch_env.release = .1
  }
  trigger = function(time){
    if(time){
      this.env.triggerAttackRelease(0.01, time)
      this.pitch_env.triggerAttackRelease(0.01,time)
    }else {
      this.env.triggerAttackRelease(0.01)
      this.pitch_env.triggerAttackRelease(0.01)
    }
  }
}

class HiHat{
  constructor(freq=4000,openDecay=.5,closeDecay = .1) {
    this.closedDecay = closeDecay
    this.openDecay = openDecay
    this.curDecay = closeDecay
    this.noise = new Tone.Noise().start()
    this.vcf = new Tone.Filter({type: 'highpass', Q: 0})
    this.vca = new Tone.Multiply()
    this.output = new Tone.Multiply(1)
    //
    this.cutoff = new Tone.Signal(freq)
    this.env = new Tone.Envelope()
    //
    this.noise.connect( this.vcf)
    this.vcf.connect( this.vca)
    this.vca.connect( this.output)
    this.cutoff.connect( this.vcf.frequency)
    //
    this.cutoff.connect( this.vcf.frequency)
    this.env.connect(this.vca.factor)
    //
    this.env.decay = 0
    this.env.release = closeDecay
    this.env.sustain = 0
    this.env.attack = 0
  }
  trigger = function(type,time){
    this.curDecay = (type == 'open') ? this.openDecay : this.closedDecay  
    this.env.release = this.curDecay
    if(time){
      this.env.triggerAttackRelease(0.01, time)
      }
    else {
      this.env.triggerAttackRelease(0.01)
    }
  }
  triggerOpen = function(time){
    this.env.release = this.openDecay
    if(time){
      this.env.triggerAttackRelease(0.01, time)
      }
    else {
      this.env.triggerAttackRelease(0.01)
    }
  }
  triggerClosed = function(time){
    this.env.release = this.closedDecay
    if(time){
      this.env.triggerAttackRelease(0.01, time)
      }
    else {
      this.env.triggerAttackRelease(0.01)
    }
  }
}

let kick = new KickDrum()
let output = new Tone.Multiply(0.1).toDestination()
kick.output.connect(output)

let hat = new HiHat()
hat.output.connect(output)
kick.frequency.value = 80



kick.pitch_env_depth.factor.value = 100

console.log( kick.pitch_env.get())


let gui = new p5(sketch, Drums)
//
let kick_pitch_knob = gui.Knob({
  label: 'kick pitch',
  mapto: kick.frequency,
  min: 40, max: 120, curve: 2
})
let kick_decay_knob = gui.Knob({
  label: 'kick decay',
  callback: function(x){kick.env.release = x},
  min: .1, max: 2, curve: 2
})
let tone_knob = gui.Knob({
  label: 'kick tone',
  mapto: kick.shaperGain,
  max: 1, curve: 2
})

let kick_drop_knob = gui.Knob({
  label: 'kick drop',
  mapto: kick.pitch_env_depth.factor,
  min: 50, max: 2000, curve: 2
})
let kick_pitch_decay_knob = gui.Knob({
  label: 'kick pitch decay ',
  callback: function(x){kick.pitch_env.release = x},
  min: .0, max: 1, curve: 2
})

let hat_closed_day_knob = gui.Knob({
  label: 'hh closed',
  callback: function(x){hat.closedDecay = x},
  min: .01, max: 1, curve: 2, value: .1,
  accentColor: [200,0,0]
})
let hat_open_day_knob = gui.Knob({
  label: 'hh open',
  callback: function(x){hat.openDecay = x},
  min: .01, max: 1, curve: 2, value: .5,
  accentColor: [200,0,0]
})

// let scope = new Oscilloscope('Canvas2')
// kick.waveShaper.connect(scope.input)
// scope.setFftSize(1024*32)

// let spectrum = new Spectroscope('Canvas3')
// kick.waveShaper.connect( spectrum.input)
// spectrum.maxFrequency = 2000

let index = 0
let seq = new Tone.Sequence((time,note)=>{
  if( index == 0 )kick.trigger(time)
  if( index == 7) hat.triggerOpen(time)
  else hat.triggerClosed(time)
  index = (index+1)%8
},[0],'8n')
seq.start()
Tone.Transport.start()

//seq.stop()
