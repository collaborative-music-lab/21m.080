//A: create audio objects
const carrier = new Tone.Oscillator().label('carrier').start()
const modulator = new Tone.Oscillator().label('modulator').start()
const vca = new Tone.Multiply(.5).label('vca')
const output = new Tone.Multiply(0.05).label('output').toDestination()
const freq = new Tone.Signal().label('freq')
const harmonicity = new Tone.Multiply().label('harmonicity')
const index_of_mod = new Tone.Multiply().label('index_of_mod')
const mod_amp = new Tone.Multiply().label('mod_amp')

//B: create initial connections
carrier.connect( vca), vca.connect( output)
modulator.connect( mod_amp ), mod_amp.connect( carrier.frequency)
freq.connect( carrier.frequency), freq.connect( harmonicity)
// monitor the frequency spectrum
let spectrum = new Spectroscope('FrequencyModulation')
carrier.connect( spectrum.analyserNode)
spectrum.start()
spectrum.maxFrequency = 24000

//C: set Fc, Fm, and modulation depth directly
freq.value = 300
modulator.frequency.value = 100
mod_amp.factor.value = 100


//D: connect harmonicity and index controls
harmonicity.connect( modulator.frequency )
harmonicity.connect( index_of_mod)
index_of_mod.connect( mod_amp.factor ) 

//E: main FM controls
freq.value = 300
harmonicity.factor.value = 1
index_of_mod.factor.value = 0

//F: create envelopes for FM and VCA
let index_env = new Tone.Envelope().label('index_env')
const index_env_depth = new Tone.Multiply(2).label('index_env_depth')
index_env.connect( index_env_depth), index_env_depth.connect(index_of_mod.factor)
//vca env
let vca_env = new Tone.Envelope().label('vca_env')
const vca_env_depth = new Tone.Multiply(.5).label('vca_env_depth')
vca_env.connect( vca_env_depth), vca_env_depth.connect(vca.factor)

//G: envelope controls
vca_env.decay = 2, vca_env.release = 10
index_env.decay = .3, index_env.release = 1
index_env.triggerAttackRelease(0.1)
vca_env.triggerAttackRelease(0.1)
index_env_depth.factor.value = 14

//H:simple sequencer
let index = 0
let sequence = [100,200,150,125,150,200]
let newNote = function(){
  freq.value = sequence[index]
  index += 1
  if(index >= sequence.length) index = 0
  index_env.triggerAttackRelease(0.1)
  vca_env.triggerAttackRelease(0.1)
}
let mySeq = setInterval( newNote, 600)