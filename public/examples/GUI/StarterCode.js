let vco = new Tone.Oscillator().start()
let vcf = new Tone.Filter()
let vca = new Tone.Multiply()
let output = new Tone.Multiply(0.1).toDestination()
vco.connect(vcf), vcf.connect( vca ), vca.connect( output )
let env = new Tone.Envelope()
env.connect(vca.factor)

const gui = new p5( sketch, GUI )
gui.setFont('value', 'Monaco')// 'label','value', or 'text'
gui.setColor('border', [200,190,200])//'border','accent','text'
gui.setColor('accent', [55,195,95])

let freq_knob = gui.Knob({
  label:'freq',
  mapto: vco.frequency,
  x: 12, y: 30, size:2,
  min:20, max: 500, curve: 2
})
freq_knob.set( 300 )

let vcf_fader = gui.Slider({
  label:'cutoff',
  mapto: vcf.frequency,
  x: 30, y: 80, size: 5,
  min:50, max: 5000, curve: 2,
  orientation: 'horizontal'
})
vcf_fader.set(1000)

let wave_radio = gui.Radio({
  label:'waveform',
  radioOptions: ['sine','sawtooth','square','triangle'],
  callback: function(x){ vco.type = x},
  size: 1,
  x: 50, y:20,
  horizontal: false
})
wave_radio.set('square')

let rolloff_radio =  gui.RadioButton({
  label:'rolloff',
  radioOptions: [-12,-24,-48],
  callback: function(x){vcf.rolloff = x},
  x: 50, y:52,size:1, orientation:'horizontal'
})
rolloff_radio.set('-48')

let enable_toggle =  gui.Toggle({
  label:'enable',
  mapto: vca.factor,
  x: 88, y:30
})

let env_trigger = gui.Button({
  label:'trig',
  callback: function(){ env.triggerAttackRelease(0.1)},
  size: 1.5, border: 20,
  borderColor: [255,0,0],
  x:88, y:85
})

let exampleName =  gui.Text({
  label: 'GUI Example', x:13, y:5, size:2,
  border: 2, borderRadius: 3
})
gui.setFont('text','Georgia')

let lineA = gui.Line(0,65,100,65,{
  border:4, color: 'accent'
})
let lineB = gui.Line(27,0,27,100)
let lineC = gui.Line(75,0,75,100) 