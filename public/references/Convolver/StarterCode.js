//A: create audio objects
const pluck = new Tone.PluckSynth()
const pluck2 = new Tone.PluckSynth()
const dry = new Tone.Multiply()
const wet = new Tone.Multiply()
const gain = new Tone.Multiply(1)
const output = new Tone.Multiply(.1).toDestination()
const hpf = new Tone.Filter({type:'highpass', frequency:100})
const lpf = new Tone.Filter({type:'lowpass', frequency:10000})
let IR = new Tone.Convolver('./audio/plate_reverb.mp3')

//load a new IR here:
// IR.load('./audio/dreadnought_guitar.mp3')
// IR.load('./audio/taylor_guitar.mp3')
// IR.load('./audio/custom_guitar.mp3')
// IR.load('./audio/hall_reverb.mp3')
// IR.load('./audio/marshall_amp.mp3')
// IR.load('./audio/plate_reverb.mp3')
// IR.load('./audio/spring_reverb.mp3')
// IR.load('./audio/telephone.mp3')
// IR.load('./audio/voxAC30_amp.mp3')

//B: create initial connections
pluck.connect( dry ), pluck.connect( wet ) 
pluck2.connect( dry ), pluck2.connect( wet ) 
wet.connect( IR ) , IR.connect( hpf )
hpf.connect( lpf ), lpf.connect( gain ), gain.connect( output )
dry.connect( output )

//simple sequencer
let degree = 0
let major_scale = [0,2,4,5,7,9,11]
let octave = 4
let chord = [0,3,2,4]
let beat = 0
let bar = 0
let newNote = function(){
  degree = Math.floor(Math.random()*3)
  degree = major_scale[(degree + chord[bar])%8]
  degree += octave*12
  //
  pluck.triggerAttackRelease(Tone.Midi(degree).toFrequency())
  pluck2.triggerAttackRelease(Tone.Midi(degree+11.9).toFrequency())
  //
  beat = (beat+1) % 8
  if( beat == 0 ) bar = (bar+1) % 4
}
let mySeq = setInterval( newNote, 150)

//// GUI
let gui = new p5(gui_sketch, Convolver )

let decay_knob = gui.Knob({
  label: 'decay',
  callback: function(x){
    pluck.resonance = x*.98
    pluck2.resonance = x
  },
  min: .9, curve:.5,
  x:15, y:30
})
decay_knob.value = .4


let damp_select = gui.RadioButton({
  label:'damping',
  radioOptions: [200,500,1500,5000],
  callback: function(x){ 
    pluck.dampening = x
    pluck2.dampening = x*1.25
  },
  size: 0.75,
  x:30, y:30
})
damp_select.value = 3

let damp_label = gui.Text({
  label:'damping',
  orientation: 'horizontal',
  x:35, y:30
})

let wet_knob = gui.Knob({
  label: 'wet',
  mapto: 'wet.factor',
  curve:1.5,
  x:55, y: 30
})
wet_knob.value = .3

let dry_knob = gui.Knob({
  label: 'dry',
  mapto: 'dry.factor',
  curve:1.5,
  x:80, y: 30
})
dry_knob.value = 1

let hpf_knob = gui.Knob({
  label: 'hpf',
  mapto: 'hpf.frequency',
  min: 20, max: 1000, curve:2,
  size: .5, x:35, y: 80
})
hpf_knob.value = .1

let lpf_knob = gui.Knob({
  label: 'lpf',
  mapto: 'lpf.frequency',
  min: 150, max: 20000, curve:2,
  size: .5, x:55, y: 80
})
lpf_knob.value = 1

let gain_select = gui.RadioButton({
  label:'wetBoost',
  radioOptions: [1,2,4,8,16],
  mapto: 'gain.factor',
  size: 0.75,
  x:100, y:30
})
gain_select.value = 1

let gain_label = gui.Text({
  label:'gainBoost',
  orientation: 'horizontal',
  x:96, y:30
})