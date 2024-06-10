let vco = new Tone.Oscillator(440).start()
let vca = new Tone.Multiply()
let output = new Tone.Multiply(0.05).toDestination()
vco.connect( vca ), vca.connect( output )

let env = new Tone.Envelope()
env.connect( vca.factor )

env.triggerAttackRelease(0.1)
env.attack = .01
env.attackCurve = "exponential" //or "linear"

//show the envelope on the oscilloscope
let scope = new Oscilloscope('Envelope')
env.connect( scope.analyserNode )
scope.start()
scope.setFftSize( 1024 * 32) //big fft size to zoom out and see whole envelope
