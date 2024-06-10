const sampler = new Tone.Sampler({
	urls: {
		C4: "kalimba.mp3"
	},
	baseUrl: "/m080/audio/"
})

const sampler2 = new Tone.Sampler({
	urls: {
		C4: "kalimba.mp3"
	},
	baseUrl: "/m080/audio/"
})
const output = new Tone.Multiply(0.1).toDestination()
const verb = new Tone.Convolver('./audio/plate_reverb.mp3')
const verb_lvl = new Tone.Multiply(0.1)
verb.connect(output), verb_lvl.connect( verb )

const panner = new Tone.Panner3D()
sampler.connect(panner)
sampler.connect( verb_lvl)
panner.connect(output)

const panner2 = new Tone.Panner3D()
sampler2.connect(panner2)
sampler2.connect( verb_lvl)
panner2.connect(output)

panner.panningModel = 'HRTF'
panner2.panningModel = 'HRTF'

panner.positionZ.value = 2
panner2.positionZ.value = 2

//console.log(sampler.get())

let gui = new p5(gui_sketch, Panner3D)

let knobX = gui.Knob({
  label:'voice 1 x', 
  mapto: 'panner.positionX'
})
knobX.min = -2
knobX.max = 2
knobX.size = 1
knobX.x = 20
knobX.y = 70

let knobY = gui.Knob({
  label:'voice 1 y', 
  mapto: 'panner.positionZ'
})
knobY.min = -2
knobY.max = 2
knobY.size = 1
knobY.x = 10
knobY.y = 30

let knobY2 = gui.Knob({
  label:'voice 2 y', 
  mapto: 'panner2.positionZ'
})
knobY2.min = -2
knobY2.max = 2
knobY2.size = 1
knobY2.x = 90
knobY2.y = 30

let knobX2 = gui.Knob({
  label:'voice 2 x', 
  mapto: 'panner2.positionX'
})
knobX2.min = -2
knobX2.max = 2
knobX2.size = 1
knobX2.x = 80
knobX2.y = 70

let x_pos = 0
let y_pos =0
let x2 = 0
let y2 = 0
let offset = 0
let seq = [0,2,4,2,5,7,2,9,10,7,12,7]
seq = seq.map(x=>x+48)
let index = 0
let index2 = 0
let play = function(){
  x_pos += .1
  x2+=.17
  y_pos += .05
  y2 += .067
  knobX.value = (Math.sin(x_pos)+1)/2
  knobY.value = (Math.sin(y_pos)+1)/2
  knobX2.value = (Math.sin(x2)+1)/2
  knobY2.value = (Math.sin(y2)+1)/2
  let pitch = Tone.Midi(seq[index]).toFrequency()
  let pitch2 = Tone.Midi(seq[index2]-5).toFrequency()
  sampler.triggerAttackRelease(pitch)
  sampler2.triggerAttackRelease(pitch2)
  index = Math.floor(index+1 + offset)%seq.length
  index2 = Math.floor(index+1.5 + offset)%seq.length
  offset += 0.3
  //console.log(panner2.positionX.value)
}
let mySeq = setInterval(play, 200)

//clearInterval(mySeq)