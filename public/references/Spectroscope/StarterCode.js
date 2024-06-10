let vco = new Tone.Oscillator(440).start()
let output = new Tone.Multiply(0.05).toDestination()
vco.connect( output )

//basic spectroscope setup
//note the argument to Spectroscope(argument) must be a valid html div
let spectrum = new Spectroscope('Spectroscope')
vco.connect( spectrum.analyserNode )
spectrum.start()

//change vco settings and see the output
vco.frequency.value = 220
vco.type = "square"

//oscilloscope options
spectrum.setFftSize( 1024*8 )
spectrum.maxFrequency = 2000
spectrum.stop()