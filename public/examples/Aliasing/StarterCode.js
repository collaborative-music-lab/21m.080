//initialize audio objects
let carrier = new Tone.Oscillator(200).start()
let modulator = new Tone.Oscillator(200).start()
let amp_mod = new Tone.Multiply()
let output = new Tone.Multiply(1/100).toDestination()
carrier.connect( amp_mod ), modulator.connect( amp_mod.factor )
amp_mod.connect( output )
carrier.frequency.value = 5000
modulator.frequency.value = 1000

//visual monitor to see frequencies
let spectrum = new Spectroscope('Aliasing')
amp_mod.connect( spectrum.input )
spectrum.maxFrequency = 24000

//you can scale output value here if you need to
output.factor.value = 1/100

//enter this line of code
//you will see two sidebands go up and down
//notice when you see them hit the sides
//of the spectrum they reflect off
//the resulting frequencies should be:
//    carrier(5000) +/- the modulator frequency
modulator.frequency.rampTo(10000, 10)
modulator.frequency.rampTo(22000, 10)

//turn output volume to 0 if you don't want to hear the audio
output.factor.value = 0.0