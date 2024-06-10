const vco = new Tone.Oscillator({frequency:110, type:"sawtooth"})
const vcf = new Tone.Filter()
const output = new Tone.Multiply(0.05).toDestination()
vco.start()
vco.connect( vcf )
vcf.connect( output )
vcf.frequency.value = 500
vcf.Q.value = 0.9
vcf.rolloff= -24

vcf.frequency.rampTo( 1000, 1)

let scope = new Spectroscope('Filter')
vcf.connect( scope.analyserNode )
scope.start()
scope.maxFrequency = 5000