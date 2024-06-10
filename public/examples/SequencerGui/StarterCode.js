//define our scale, sequence, octave, and index
let pitches = [60,60,60,60, 60,60,60,60]
let scale = [0,2,4,5,7,9,11]
let octave = 4
let index = 0

//convert scale degrees to midi notes
const scaleToMidi = function(degree){
  //if our degree is larger than the length of the scale
  let cur_octave = Math.floor(degree/scale.length)
  degree = degree % scale.length
  return scale[degree] + cur_octave * 12
}

const sequence = new Tone.Sequence( (time, note) => {
  //calculate freq for note
  let pitch = Tone.Midi(pitches[index]+octave*12).toFrequency()
  frequency.setValueAtTime(pitch, time);
  env.triggerAttackRelease(.1, time); 
  //update index
  index = ( index+1 ) % pitches.length
  },
  pitches, // Sequence of note names - ignored
  '8n' // Time interval between each note
);

//we start our sequencer at the very bottom

//create audio objects
let vco1 = new Tone.Oscillator().start()
let vco2 = new Tone.Oscillator().start()
let vcf = new Tone.Filter()
let vca = new Tone.Multiply()
let output = new Tone.Multiply(0.05).toDestination()
vco1.connect( vcf ), vco2.connect( vcf ),
vcf.connect( vca ), vca.connect( output )
//envelope and control values
let cutoff = new Tone.Signal()
let frequency = new Tone.Signal()
let vco2_detune = new Tone.Multiply(1.01)
let env = new Tone.Envelope()
let filter_env_depth = new Tone.Multiply()
frequency.connect( vco1.frequency)
frequency.connect( vco2_detune), vco2_detune.connect(vco2.frequency)
cutoff.connect( vcf.frequency )
env.connect( filter_env_depth)
filter_env_depth.connect( vcf.frequency )
env.connect( vca.factor )

//set parameters for audio objects
vco1.type = "square", vco2.type = "square"
vcf.frequency.value = 5000
vca.factor.value = .1
vcf.rolloff = -24
vcf.Q.value = 1

//GUI
let gui = new p5(sketch, SequencerGui)
let detune_knob = gui.Knob({
  label: 'detune', mapto: vco2_detune.factor,
  min: .5, max:1, curve:1, value: .99,
  accentColor: [20,100,0]
})
let cutoff_knob = gui.Knob({
  label: 'cutoff', mapto: cutoff,
  min: 50, max:5000, curve:2, value: 500
})
let filter_env_knob = gui.Knob({
  label: 'vcf env', mapto: filter_env_depth.factor,
  min: 0, max:5000, curve:2, value: 2000
})
let Q_knob = gui.Knob({
  label: 'Q', mapto: vcf.Q,
  min: 0, max:20, curve:1.5, value: 4
})
let decay_knob = gui.Knob({
  label: 'decay', 
  callback: function(x){
    env.decay = x
    env.release = x*2
  },
  min: 0.02, max:1, curve:2, value: 0.5
})
let octave_knob = gui.Knob({
  label: 'octave',
  callback: function(x){octave = Math.floor(x)},
  min:2, max:6, accentColor:[200,0,0]
})

let seq_knobs = []
let fader_spacing = 8
for( let i=0;i<pitches.length;i++){
  seq_knobs.push(gui.Fader({
    label: (i).toString(),showLabel:0,
    callback: function(x){
      pitches[i]= scaleToMidi(Math.floor(x))
    },
    min:0,max:12, value:Math.random()*12,
    size: 1, x: 10 + i*fader_spacing, y: 60
  }))
}

//start sequence
sequence.start()
//sequence.stop()
Tone.Transport.start()