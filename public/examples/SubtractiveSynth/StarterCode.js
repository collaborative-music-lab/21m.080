//create audio objects
let vco = new Tone.Oscillator().start()
let vcf = new Tone.Filter()
let vca = new Tone.Multiply()
let output = new Tone.Multiply(0.05).toDestination()
vco.connect( vcf ), vcf.connect( vca ), vca.connect( output )

//set parameters for audio objects
vco.type = "sawtooth"
vcf.frequency.value = 5000
vco.frequency.value = 200
vca.factor.value = .1
vcf.rolloff = -24
vcf.Q.value = 1

//this envelope will control both vcf frequency and vca
let env = new Tone.Envelope()
//you can set ADSR values like below
env.release = 5
env.decay = .01

//check the values of the envelope in the javascript console
console.log(env.get())

//filter_env_depth determines how much the envelope
//changes the filter frequency
let filter_env_depth = new Tone.Multiply()
env.connect( filter_env_depth)
filter_env_depth.factor.value = 2000
filter_env_depth.connect( vcf.frequency )
env.connect( vca.factor )

//cutoff will be used to set the base frequency
//of the filter
let cutoff = new Tone.Signal()
cutoff.connect( vcf.frequency )
cutoff.value = 100

//execute this line of code to trigger the envelope
env.triggerAttackRelease(0.01)

let spectrum = new Spectroscope('SubtractiveSynth')
vcf.connect( spectrum.input )
spectrum.maxFrequency = 20000