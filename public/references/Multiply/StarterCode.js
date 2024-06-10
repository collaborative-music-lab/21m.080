let vco = new Tone.Oscillator().start()
let modulator = new Tone.Oscillator().start()
let vca = new Tone.Multiply(0.5)
let output = new Tone.Multiply(0.05).toDestination()
vco.connect( vca ), vca.connect( output )
vco.frequency.value = 500
modulator.frequency.rampTo( 400, 5)

vca.factor.value = .1
vca.factor.rampTo( .0, .75 )
modulator.connect( vca.factor )

let scope = new Oscilloscope('Multiply')
vca.connect( scope.analyserNode )
scope.start()
scope.threshold = .4