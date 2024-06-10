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

let setFrequency = function(i){
  //'i' is between 0 and numVoices-1
  let freq = fundamental + i*fundamental
  //let freq =  [1,2,3,4,5,6,7,8][i] * fundamental
  return freq
}
//updateVCOs()

let setGain = function(i){
  return 1 / (i*1+1)
}
//updateVCOs()

let updateVCOs = function(){
  for(let i=0;i<numVoices;i++){
    let freq = setFrequency(i)
    let gain = setGain(i)
    vcos[i].frequency.value = freq
    vcas[i].factor.value = gain
  }
}
updateVCOs()

let setFundamental = function(val){
  fundamental = val
  updateVCOs()
}
setFundamental(100)

//set everything up
for(let i=0;i<numVoices;i++){
  vcos[i].start()
  vcos[i].connect( vcas[i] )
  setFrequency()
  setGain()
  vcas[i].connect( output )
  vcas[i].connect( display)
}

//reset phase if necessary
for(let i=0;i<numVoices;i++) vcos[i].phase = Math.random()*360
for(let i=0;i<numVoices;i++) vcos[i].phase = 0

//oscilloscope
display.factor.value = 1/2

let scope = new Oscilloscope('FourierTheorem')
display.connect( scope.input )
scope.setFftSize( 1024*4 )
scope.threshold = -.9

//view the spectroscope
let spectrum = new Spectroscope( "FourierTheorem" )
display.connect( spectrum.input )
spectrum.setFftSize( 128*32)
spectrum.maxFrequency = 2000
