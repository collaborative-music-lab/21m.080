class foo {
  constructor(numVoices = 4) {
    this.numVoices = numVoices
    this.output = new Tone.Multiply(.25)
    this.i = 0
    this.curNote = 0
    // Create variables for objects
    this.vco = [], this.vcf = []
    this.vca = [], this.env = []
    //create audio objects
    for(this.i=0;this.i<this.numVoices;this.i++) {
      this.vco.push( new Tone.Oscillator({type:'square'}) )
      this.vcf.push( new Tone.Filter({Q:10}) )
      this.vca.push( new Tone.Multiply() )
      this.env.push( new Tone.Envelope({sustain:1}) )
    }
    // Connect audio objects
    for(this.i=0;this.i<this.numVoices;this.i++) {
      this.vco[this.i].connect( this.vcf[this.i] )
      this.vcf[this.i].connect( this.vca[this.i] )
      this.env[this.i].connect( this.vca[this.i].factor )
      this.vca[this.i].connect( this.output )
    }
  }
  start(){
    for(this.i=0;this.i<this.numVoices;this.i++) this.vco[this.i].start()
  }
  playNote(note, velocity = 0.5) {
    this.curNote= (this.curNote+1) % this.numVoices
    this.vco[this.curNote].frequency.value = Tone.Midi(note+48).toFrequency()
    this.vcf[this.curNote].frequency.value = 8*Tone.Midi(note+48).toFrequency()
    this.env[this.curNote].triggerAttackRelease("8n")
  }
  playFreq(freq, velocity = 0.5) {
    this.curNote= (this.curNote+1) % this.numVoices
    this.vco[this.curNote].frequency.value = freq
    this.vcf[this.curNote].frequency.value = 8*freq
    this.env[this.curNote].triggerAttackRelease("8n")
  }
  setAttackRelease(a,r){
    for(this.i=0;this.i<this.numVoices;this.i++) {
      this.env[this.i].attack = a
      this.env[this.i].release = r
    }
  }
}

let output = new Tone.Multiply(.1).toDestination()
let synth = new foo(8)
synth.start()
synth.output.connect( output)
let note = 0
synth.setAttackRelease(.01,8)
note = (note+5)%12
synth.playNote(note)

let fundamental = 100
let octave = 0
let myFreqs = []

let equalTemperament = function(){
  console.log('equal temperament')
  for(let i=0;i<12;i++){
    myFreqs[i] = fundamental * Math.pow(2,i/12)
  }
}

let justRatios = [1,16/15,9/8,6/5,5/4,4/3,45/32,3/2,8/5,5/3,16/9,15/8]
let justTemperament = function(){
  console.log('just temperament')
  for(let i=0;i<12;i++){
    myFreqs[i] = fundamental * justRatios[i]
  }
}

let tableOfFifths = [0,-5,2,-3,4,-1,-6,1,-4,3,-2,5]
let pythagoreanTemperament = function(){
  console.log('pythagorean temperament')
  for(let i=0;i<12;i++){
    myFreqs[i] = Math.pow(3/2,tableOfFifths[i])
    while(myFreqs[i]>2) myFreqs[i] /= 2
    while(myFreqs[i]<1) myFreqs[i] *= 2
    myFreqs[i] *= fundamental
  }
}

//execute one of these functions to change temperaments
equalTemperament()
justTemperament()
pythagoreanTemperament()

//use laptop keyboard to play notes
setNoteOnHandler(( note, vel, ) => {
  octave = Math.floor(note/12)-2
  console.log(note % 12, myFreqs[note%12],octave)
  synth.playFreq(myFreqs[note%12] * Math.pow(2,octave))
}) 
setNoteOffHandler(( note, vel, ) => {})