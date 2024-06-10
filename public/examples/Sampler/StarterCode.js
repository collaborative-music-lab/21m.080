const sampler = new Tone.Sampler({
	urls: {
		C4: "vocal.mp3"
	},
	baseUrl: "/m080/audio/"
})
const output = new Tone.Multiply(0.1).toDestination()
sampler.connect( output )

let curNote = 0
setNoteOnHandler( (note,vel)=>{
  curNote = Tone.Midi(note).toFrequency()
  sampler.triggerAttack( curNote)
  console.log(note, curNote)
})

setNoteOffHandler( (note,vel)=>{
  curNote = Tone.Midi(note).toFrequency()
  sampler.triggerRelease(curNote)
})