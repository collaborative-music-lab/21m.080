//define synth
let rumble = new Rumble()
let out = new Tone.Multiply(0.05).toDestination()
rumble.connect(out)

//create sequencer
let pitches = [60, 63, 60, 65, 58, 55, 67, 63];
let noteOn = [true, true, true, true, true, true, true, true]
let keys = ['a','s','d','f','g','h','j','k']
let noteToggles = []
let index = 0
const sequence = new Tone.Sequence( (time, note) => {
  if (noteOn[index]) {
    rumble.triggerAttackRelease(pitches[index],127,'8n',time);
  }
  index = index+1
  if(index >= pitches.length) index = 0
  },
  pitches,
  '8n'
);

//start the transport
Tone.Transport.start();

//define GUI
const gui  = new p5(sketch, 'Canvas1')

for (let i = 0; i < pitches.length ; i++) {
  noteToggles.push(gui.Toggle({
  label:keys[i],
  callback: (x) => {noteOn[i] = x == 0 ? false : true},
  x: 11 + 11*i, y:65
}))
  noteToggles[i].set(1)
}

let startStop = gui.Toggle({
  label:'play',
  callback: (x) => {x == 0 ? sequence.stop() : sequence.start()},
  x: 50, y:25
})
startStop.set(1)

//define ASCII Handler

//disableAsciiInput()
enableAsciiInput()

setAsciiHandler((note,state)=>{
  if (state === 'down') {
    switch(note){
      case 'a': noteOn[0] == true ? noteToggles[0].set(0): noteToggles[0].set(1); break; 
      case 's': noteOn[1] == true ? noteToggles[1].set(0): noteToggles[1].set(1); break;
      case 'd': noteOn[2] == true ? noteToggles[2].set(0): noteToggles[2].set(1); break;
      case 'f': noteOn[3] == true ? noteToggles[3].set(0): noteToggles[3].set(1); break;
      case 'g': noteOn[4] == true ? noteToggles[4].set(0): noteToggles[4].set(1); break;
      case 'h': noteOn[5] == true ? noteToggles[5].set(0): noteToggles[5].set(1); break;
      case 'j': noteOn[6] == true ? noteToggles[6].set(0): noteToggles[6].set(1); break;
      case 'k': noteOn[7] == true ? noteToggles[7].set(0): noteToggles[7].set(1); break;
    }
  }
})