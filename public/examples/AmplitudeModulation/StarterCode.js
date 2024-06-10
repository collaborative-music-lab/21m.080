//create audio objects
const carrier  = new Tone.Oscillator().start()
const modulator = new Tone.Oscillator().start()
const mod_amp = new Tone.Multiply()
const car_amp = new Tone.Multiply()
const vca = new Tone.Multiply(1)
const output = new Tone.Multiply(0.02).toDestination()

//oscillator type is 'sine' by default - try 'square'
carrier.type = 'sine'

//make connections
carrier.connect( car_amp )
modulator.connect( mod_amp )
mod_amp.connect( car_amp.factor )
car_amp.connect( vca)
vca.connect( output)

//resulting sidebands are Fc +/- Fm
carrier.frequency.value = 200
modulator.frequency.value = 600
//amplitude of sidebands is mod_amp.factor/2
mod_amp.factor.rampTo( .25 * 1, 2)
car_amp.factor.value = .25
vca.factor.value = .5

let spectrum = new Spectroscope('AmplitudeModulation')
car_amp.connect( spectrum.input)
spectrum.maxFrequency = 22050