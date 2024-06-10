let vcos = []
let vcas = []
const numVoices = 8
let fundamental = 100
const output = new Tone.Multiply(0.02).toDestination()
const display = new Tone.Multiply(1)
//create vcos and vcas
for(let i=0;i<numVoices;i++){
  vcos.push( new Tone.Oscillator() )
  vcas.push( new Tone.Multiply(1) )
}
//set everything up
for(let i=0;i<numVoices;i++){
  vcos[i].start()
  vcos[i].connect( vcas[i] )
  vcos[i].frequency.value = fundamental * (i+1)
  vcas[i].connect( output )
  vcas[i].connect( display)
}
for(let i=0;i<numVoices;i++) vcas[i].factor.value = 1/Math.pow(i*2+1,1)

for(let i=0;i<numVoices;i++) vcos[i].phase = 0

//oscilloscope
display.factor.value = 1/2

let scope = new Oscilloscope('FourierTheorem')
display.connect( scope.analyserNode )
scope.start()
scope.setFftSize( 1024*4 )

//stop the oscilloscope
//and view the spectroscope
scope.stop()
let spectrum = new Spectroscope( "FourierTheorem" )
display.connect( spectrum.analyserNode )
spectrum.start()
spectrum.setFftSize( 128*32)