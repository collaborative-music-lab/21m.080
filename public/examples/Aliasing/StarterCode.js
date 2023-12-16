//initialize audio objects
let carrier = new Tone.Oscillator(200).label('carrier').start()
let modulator = new Tone.Oscillator(200).label('modulator').start()
let amp_mod = new Tone.Multiply().label('amp_mod')
let output = new Tone.Multiply(1/100).label('output').toDestination()
carrier.connect( amp_mod ), modulator.connect( amp_mod.factor )
amp_mod.connect( output )
carrier.frequency.value = 12000
modulator.frequency.value = 1000

//visual monitor to see frequencies
let spectrum = new Spectroscope('Aliasing')
amp_mod.connect( spectrum.analyserNode )
spectrum.start()
spectrum.maxFrequency = 24000

//you can scale output value here if you need to
output.factor.value = 1/100

//enter this line of code
//you will see two sidebands go up and down
//notice when you see them hit the sides
//of the spectrum they reflect off
modulator.frequency.rampTo(20000, 10)

//turn output volume to 0 if you don't want to hear the audio
output.factor.value = 0