let vco = new Tone.Oscillator().start()
let waveFolder = new Tone.WaveShaper()
let foldOutput = new Tone.Multiply()
let vca = new Tone.Multiply(1)
let output = new Tone.Multiply(0.1).toDestination()

vco.connect( waveFolder), waveFolder.connect(foldOutput),
  foldOutput.connect(vca), vca.connect( output)


//we will use this to set the amount of wavefolding
let foldThreshold = 1

//here are some different transfer functions
let linearMap = function(value){return value}
//
let waveFolderA = function(value){
  if (value > foldThreshold) {
      return 2*foldThreshold - value; // Fold above 0.5
  } else if (value < -foldThreshold) {
      return -foldThreshold*2 - value; // Fold below -0.5
  } else {
      return value; // Do not fold
  }
}
let foldSine = function(value){
  return Math.sin(value * Math.PI);
}

//placeholder for current fold function
let foldFunction = linearMap

//this function updates the fold amount
let foldDepth = function(x){
  //foldInput.factor.value = 1/x
  foldOutput.factor.value = x
  foldThreshold = 1/x
  waveFolder.setMap(foldFunction);
}

foldFunction = waveFolderA
foldDepth(1.7)

let scope= new Oscilloscope('Canvas2')
foldOutput.connect( scope.input)

//another wavefolding function
let waveFolderB = function(value) {
    const foldingRange = foldThreshold; // Range within which to fold the signal
    // Calculate the folded value
    const foldedValue = value % (2 * foldingRange); // Modulo operator to wrap around multiple times
    // Apply folding logic
    if (foldedValue > foldingRange) {
        return (2 * foldingRange) - foldedValue; 
    } else if (foldedValue < -foldingRange) {
        return -((2 * foldingRange) + foldedValue); 
    } else {
        return foldedValue;
    }
}

//GUI
let gui = new p5(sketch, Canvas1)
let depth_knob = gui.Knob({
  label: 'depth',
  callback: function(x){foldDepth(x)},
  min:1, max:4
})
