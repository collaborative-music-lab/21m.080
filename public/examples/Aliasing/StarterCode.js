//initialize audio objects
let carrier = new Tone.Oscillator(200).start()
let modulator = new Tone.Oscillator(10000).start()
let modulator2 = new Tone.Oscillator(200).start()
let amp_mod = new Tone.Multiply()
let amp_mod2 = new Tone.Multiply()
let output = new Tone.Multiply(1/100).toDestination()
carrier.connect( amp_mod ), modulator.connect( amp_mod2 )
amp_mod2.connect( amp_mod.factor ), modulator2.connect( amp_mod2.factor )
amp_mod.connect(output)

let gui = new p5( sketch, Aliasing)
let car_knob = gui.Knob({
  label:'carrier',
  mapto: carrier.frequency,
  min: 0, max: 24000, y:80
})
let mod_knob = gui.Knob({
  label:'mod',
  mapto: modulator.frequency,
  min: 0, max: 24000, y:80
})
let mod2_knob = gui.Knob({
  label:'mod2',
  mapto: modulator2.frequency,
  min: 0, max: 24000, y:80
})

//visual monitor to see frequencies
let spectrum = new Spectroscope('Aliasing')
amp_mod.connect( spectrum.input )
spectrum.maxFrequency = 24000

//you can scale output value here if you need to
output.factor.value = 1/100

//turn output volume to 0 if you don't want to hear the audio
output.factor.value = 0.05
