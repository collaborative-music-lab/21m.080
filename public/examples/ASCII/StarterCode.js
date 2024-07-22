let vco = new Tone.Oscillator().start()
let vca = new Tone.Multiply()
let output = new Tone.Multiply(0.02).toDestination()
vco.connect( vca ), vco.type = "square"
let env = new Tone.Envelope()
vca.connect( output), env.connect( vca.factor)

setNoteOnHandler( (note,vel)=>{
  vco.frequency.value = Tone.Midi(note).toFrequency()
  env.triggerAttack()
})

setNoteOffHandler( (note,vel)=>{
  env.triggerRelease()
})