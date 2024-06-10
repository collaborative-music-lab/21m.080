let num_partials = 8
let vcos = []
let vcas = []
let amplitude = new Tone.Multiply(0.5)
let output = new Tone.Multiply(0.05).toDestination()
amplitude.connect( output )

//here we create and setup all of our vcos and vcas
for( let i=0; i<num_partials; i++){
  vcos.push (new Tone.Oscillator() )
  vcas.push( new Tone.Multiply() )
  vcos[i].start()
  vcos[i].connect( vcas[i] )
  vcas[i].connect( amplitude )
}

//now lets set the frequencies and amplitudes
let fundamental = 100 //100Hz fundamental frequency
for( let i=0; i<num_partials; i++){
  let harmonic = i+1// because i starts from 0
  vcos[i].frequency.value = fundamental * harmonic //sets frequency
  vcas[i].factor.value = 1/harmonic //sets amplitude
}

//lets take a look at the waveform using an oscilloscope
let scope = new Oscilloscope('Canvas2')
amplitude.connect( scope.analyserNode )
scope.start()

//we can change the settings of the scope to zoom in/out
//the threshold will affect what how scope detects the 
//beginning of the waveform
scope.setFftSize( 1024 * 4 )
scope.threshold = .0

//or stop the oscilloscope to freeze the waveform
scope.stop()

/*
the waveform looks roughly like a sawtooth
lets try changing the phase of the harmonics
this won't change the sound, but will change how the waveform looks
*/
for( let i=0; i<num_partials; i++) vcos[i].phase = 0

//now lets take a look at the waveform using a spectroscope
let spectroscope = new Spectroscope('Canvas3') //different canvas!
amplitude.connect( spectroscope.analyserNode )
spectroscope.start()

//we can change the settings of the spectroscope
//maxFrequency lets us zoom in to see our 8 harmonics
spectroscope.maxFrequency = 2000

//now lets change our waveform to a squarewave
//by only using odd harmonics
for( let i=0; i<num_partials; i++){
  vcos[i].frequency.value = fundamental * (i*2+1)
  vcas[i].factor.value = 1/(i+1)
}
//note the amplitude of the harmonics is still 1/N