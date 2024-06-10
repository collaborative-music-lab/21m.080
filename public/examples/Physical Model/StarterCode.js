const karplus = new Tone.PluckSynth().toDestination();

karplus.attackNoise = 1   // Between 0.1 and 20. The amount of noise in the attack. 
karplus.dampening = 4000  // Frequency of highpass filter which is attached to the delay line.
karplus.resonance= 0.95   // Between 0 and 1. The resonance of the pluck's delay line.

const output = new Tone.Multiply(0.1).toDestination()
karplus.connect( output )

let curNote = 0
setNoteOnHandler( (note,vel)=>{
  curNote = Tone.Midi(note).toFrequency()
  karplus.triggerAttack( curNote)
})

setNoteOffHandler( (note,vel)=>{
  curNote = Tone.Midi(note).toFrequency()
  karplus.triggerRelease(curNote)
})