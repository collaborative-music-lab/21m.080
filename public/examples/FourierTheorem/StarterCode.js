const vco = new Tone.Oscillator().start()
const output = new Tone.Multiply(0.02).toDestination()
const display = new Tone.Multiply(1)
vco.connect(output), vco.connect(display)

//VCO properties
vco.frequency.value = 100
vco.partials = [1,1/2,1/3,1/4,1/5,1/6]

//freely set the harmonic amplitudes
let partials = []
let numPartials = 16
for(let i=0;i<numPartials;i++){ //i is the harmonic number
  partials.push(1/(i+1) * (i%2==0)) //generates the amplitude
}
vco.partials = partials

//oscilloscope
display.factor.value = 1/2
let scope = new Oscilloscope('FourierTheorem')
display.connect( scope.input )
scope.setFftSize( 1024*4 )
scope.threshold = -.2

//view the spectroscope
let spectrum = new Spectroscope( "FourierTheorem" )
display.connect( spectrum.input )
spectrum.setFftSize( 128*32)
spectrum.maxFrequency = 2000
