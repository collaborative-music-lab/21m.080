let vco = new Tone.Oscillator().label('vco').start()
let vca = new Tone.Multiply().label('vca')
let output = new Tone.Multiply(0.02).label('output').toDestination()
vco.connect( vca ), vco.type = "square"
let env = new Tone.Envelope().label('env')
vca.connect( output), env.connect( vca.factor)

setNoteOnHandler( (note,vel)=>{
  vco.frequency.value = Tone.Midi(note).toFrequency()
  env.triggerAttack()
})

setNoteOffHandler( (note,vel)=>{
  env.triggerRelease()
})