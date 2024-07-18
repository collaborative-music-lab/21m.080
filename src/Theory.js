/* Theory.js

Implements a system for specifying chord and progressions 
as Roman numerals.

Includes the classes 'chord', and 'progression'

Variables:
- tonic: tonic as string
- tonicNumber: tonic as MIDI number
- keytype: major or minor depending on tonic capital
- octave: default octave for chords/scales

- progression: chord progression (array of strings ['i','iv','V7','VII7'])
- chords: array of Chord objects

- voicing: default voicing
- voicings[]: array for voicing types [open,closed,drop2,drop3]
- notes[12]: array of alphabet note names
- noteToInterval{}: maps alphabetic names to intervals (with b/#)
-chordIntervals[]: interval patterns for chords, e.g. [0,2,4]
-chordScale[]: scales associated with chords, e.g. '7':[0,2,4,5,7,9,10]
-MajorScaleDegrees[]: 'I': 0, 'bII': 1, etc.
-MinorScaleDegrees[]: 'i': 0, 'bII': 1, etc.

functions:
setProgression(str): progression as single string or array of strings
  - setProgression('i i iv V7') or setProgression('i', 'i', 'iv', 'V7')
setVoicing(str)
export function rotateVoicing(steps)
setTonic(str/num): updates tonic, tonicNumber,octave, keyType
getChordTones(root, quality, scale): returns array of MIDI notes, either triad or 7th
getChord(name, lowNote, voicing) //roman number and returns MIDI note array
getChordType(name): return chord quality, e.b. minorMajor7
function applyVoicing(chord, _voicing)
minimizeMovement(chord, previousChord): shifts chord so lowest note is higher than previousChord[0]
getChordRoot(name): returns midi note of root %12
getInterval(num,scale): returns MIDI note number of scale degree (from 0)

*/

let tonic = 'C';
let tonicNumber = 0; //midi note of tonic, 0-11
let keyType = 'major';
let octave = 4;
let voicing = 'closed'
let previousChord = [];

let progression = ['I']
let pulsePerChord = 16
let progressionChords = []

const voicings = { 
  "closed": [0,2,4,6],
  "open": [0,4,6,9],
  "drop2": [-3,0,2,6],
  "drop3": [-1,0,3,4]
}

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteToInterval = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'E#': 5, 'F': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11,
  };

export const chordIntervals = {
  "major": [0, 4, 7],
  "minor": [0, 3, 7],
  "dominant7": [0, 4, 7, 10],
  "minor7": [0, 3, 7, 10],
  "major7": [0, 4, 7, 11],
  "minorMaj7": [0, 3, 7, 11],
  "diminished": [0, 3, 6],
  "diminished7": [0, 3, 6, 9],
  "add9": [0, 4, 7, 14], // Major triad with added ninth
};

export const chordScales = {
  "major": [0, 2, 4, 5, 7, 9, 11],
  "minor": [0, 2, 3, 5, 7, 8, 10], //aeolian
  "lydianDominant": [0, 2, 4, 6, 7, 9, 10], //lydian dominant?
  "mixolydian": [0,2,4,5,7,9,10], //for V7
  "minor7": [0, 2, 3, 5, 7, 9, 10], //dorian
  "major7": [0, 2, 4, 5, 7, 9, 11],
  "minorMaj7": [0, 2, 3, 5, 7, 9, 11], //melodic minor
  "diminished": [0, 2, 3, 5, 6, 8, 9, 11],
  "diminished7": [0, 2, 3, 5, 6, 8, 9, 11],
  "add9": [0, 2, 4, 5, 7, 9, 11],
  "dorian": [0,2,3,5,7,9,10], //minor natural-6
  "phrygian": [0,1,3,5,7,8,10], //minor flat-2
  "lydian": [0,2,4,6,7,9,11], //major sharp-4
  "locrian": [0,1,3,5,6,8,10], //half-diminished
};

const MajorScaleDegrees = {
  'I': 0, 'bII': 1, 'II': 2, 'bIII': 3,'III': 4, 'IV': 5, '#IV': 6, 
  'bV': 6,'V': 7,'#V': 8, 'bVI': 8,'VI': 9, 'bVII': 10,'VII': 11,
  'i': 0, 'bii': 1, 'ii': 2, 'biii': 3,'iii': 4, 'iv': 5, '#iv': 6, 
  'bv': 6,'v': 7, 'bvi': 8,'vi': 9, 'bvii': 10,'vii': 11 
};
const MinorScaleDegrees = {
  'I': 0, 'bII': 1, 'II': 2, 'III': 3,'#III': 4, 'IV': 5, '#IV': 6, 
  'bV': 6,'V': 7,'#V': 8, 'VI': 8,'#VI': 9, 'VII': 10,'#VII': 11,
  'i': 0, 'bii': 1, 'ii': 2, 'iii': 3,'#iii': 4, 'iv': 5, '#iv': 6, 
  'bv': 6,'v': 7, 'vi': 8,'#vi': 9, 'bvii': 10,'vii': 11
};


export function setVoicing(name){
  if (voicings.hasOwnProperty(name)) voicing = name 
  else console.log('invalid voicing name ', name)
console.log('current voicing: ', voicing)
}

export function setProgression(val){
  let newProgression = []
  let error = -1

  //convert progressions in a single string to an array of strings
  if( val.constructor !== Array ){
    val = val.replaceAll(',', ' ')
    val = val.split(' ')
  }
  //iteratate through array, check for errors
  for(let i=0;i<val.length;i++){
    let chord = val[i]
    try{
      if(val[i] !== ''){ //remove empty strings
        const romanNumeral = chord.match(/[iIvVb#]+/)[0];
        const quality = getChordType(chord);
        if( typeof MajorScaleDegrees[romanNumeral] !== "number") error = i
        if( chordScales[quality].constructor !== Array) error = i
        if( error < 0 ) newProgression.push(chord)
      } 
    } catch{
      console.log("error with element ", val[i])
      error = 0
    }
  }

  if(error < 0) {
    progression = newProgression
    progressionChords = []
    for(let i=0;i<progression.length;i++) progressionChords.push(new Chord(progression[i]))
  }
  else console.log("error in progression element", val[error])
  //console.log(progression)
}

export function getCurChord(index){
  index = index % (pulsePerChord * progression.length)
  return progressionChords[Math.floor( index/pulsePerChord )]
}

//sets the tonic for the key, keytype, and octave
export function setTonic(val) {
  if (typeof val === 'string') {
    const noteRegex = /[A-Ga-g][#b]?/; // Regular expression to detect musical notes including sharps and flats
    const numberRegex = /\d+/; // Regular expression to detect numbers

    const noteMatch = val.match(noteRegex);
    const numberMatch = val.match(numberRegex);

    if (noteMatch) {
      tonic = noteMatch[0].toUpperCase(); // Set the tonic and convert to uppercase
      keyType = noteMatch[0] === noteMatch[0].toUpperCase() ? 'major' : 'minor'; // Set the key type based on case
    }

    if (numberMatch) {
      octave = parseInt(numberMatch[0], 10); // Set the octave
    }
  } else if (typeof val === 'number') {
    octave = Math.floor(val / 12) - 1; // Calculate the octave from the MIDI number
    const noteIndex = val % 12;
    tonic = notes[noteIndex]; // Set the tonic based on the note index
    //keyType = 'major'; // Default to major when using MIDI number
  }

  //set midi note of tonic
  tonicNumber = noteToInterval[tonic]

  console.log(`Tonic: ${tonic}, Number: ${tonicNumber}, Key Type: ${keyType}, Octave: ${octave}`);
}

//takes a roman number chord and returns an array of intervals
//interval array is based on key and current octave
export function getChord(name,  lowNote = null, _voicing = null){
  //get the type of chord based on chord name
  const type = getChordType(name);
  const scale = chordScales[type];
  //console.log(type,scale,progression)

  if(_voicing == null) _voicing = voicing
  //parse chord name
  const romanNumeralMatch = name.match(/[iIvVb#]+/);
  const suffix = name.replace(/[iIvVb#]+/, '');

  //error case
  const romanNumeral = romanNumeralMatch[0];
  //set keyType
  if (!romanNumeralMatch) romanNumeral = keyType == 'major' ? 'I' : 'i'
  //console.log(romanNumeral, suffix, MajorScaleDegrees[romanNumeral])
  
  //get interval to chord root based on chord name
  let degree = 0
  if (keyType == 'major') {
    degree =  MajorScaleDegrees[romanNumeral];
    if(degree == undefined) degree = MinorScaleDegrees[romanNumeral];
  }
  else {
    degree =  MinorScaleDegrees[romanNumeral];
    if(degree == undefined) degree = MajorScaleDegrees[romanNumeral];
  }
  if(degree == undefined) degree = 0

  // Adjust the chord tones based on the voicing type
  let chord = applyVoicing(_voicing, scale);
  //console.log(octave, degree, tonicNumber)
  chord = chord.map(x=>x+octave*12+degree + tonicNumber)

  // Adjust the chord tones to be as close as possible to the previous chord
  if (previousChord.length > 0) {
    if(lowNote){ previousChord[0] = lowNote}
    chord = minimizeMovement(chord, previousChord);
  }
  //console.log("post", chord, lowNote)
  previousChord = chord;
  return chord

}

export function rotateVoicing(steps){
  const len = previousChord.length
  steps = steps % len
  //console.log(steps, previousChord)
  let newChord = Array.from({length:len},(x,i)=>{
    x=previousChord[(i+steps+len)%len]
    if((i+steps)>=len)x+=12
    else if( (i+steps) < 0)x-=12
    return x
  })
  
  previousChord = newChord
}

//returns chord quality
function getChordType(name) {
  const suffix = name.replace(/[iIvVb#]+/, '');
  let majorMinor = name.match(/[iIvV]+/)[0];
  if(!majorMinor) majorMinor = 'I'

  if (suffix.includes('dim'))  return 'diminished';
  else if (suffix.includes('7b5'))  return 'locrian';
  else if (suffix.includes('Maj7')) return majorMinor === majorMinor.toUpperCase() ? 'major7' : 'minorMaj7';
  else if (suffix.includes('7')) return majorMinor === majorMinor.toUpperCase() ? 'mixolydian' : 'minor7';
  else if (suffix.includes('2')) return 'major9';

  return majorMinor === majorMinor.toUpperCase() ? 'major' : 'minor';
}

function applyVoicing(_voicing,scale) {
  //console.log(_voicing, scale)
  // Apply different voicings (closed, drop2, drop3, etc.)
  let cVoicing = voicings[_voicing]
  let voicedChord = Array(cVoicing.length)

  for(let i=0;i<cVoicing.length;i++){
    voicedChord[i] = getInterval(cVoicing[i],scale)
  }
  //console.log(voicedChord)
  return voicedChord
}

function minimizeMovement(chord, previousChord) {
  let distance = Math.abs(chord[0]%12-previousChord[0]%12)
  let lowNote = 0

  for(let i=1;i<chord.length;i++){
    if(Math.abs(chord[i]%12-previousChord[0]%12) < distance){
      distance = Math.abs(chord[i]%12-previousChord[0]%12)
        lowNote = i
    }
  }

  while(chord[lowNote] < previousChord[0]-2)chord = chord.map(x=>x+12)
 
  for(let i=0;i<chord.length;i++){
    if(chord[i] < previousChord[0])chord[i]+=12
  }

  return chord.sort((a, b) => a - b);
}

/****************** 
 * CHORD Class
 * Methods
 * - constructor(name,octave,voicing)
 * - getChordTones(lowNote): gets array of MIDI notes
 * - getInterval(degree): midi note number of scale degree
 * - setChord: set custom chord
 * 
 * Parameters
 * - notes: midi note numbers of current chord degrees
 * - root: midi note
 * - octave
 * - voicing: name 'closed' or interval pattern [0,2,4]
 * - scale: name 'major' or custom e.g. [0,2,4,5,7,9,11]
 *  * ******************/

export class Chord {
  constructor(name, _octave = octave, _voicing = voicing) {
    this.name = name;
    this.octave = _octave;
    this.voicing = _voicing;
    this.root = getChordRoot(name); //integer 0-11
    this.quality = getChordType(name) //'Maj7'
    this.scale = chordScales[this.quality];
    if(this.name == 'V7') this.scale = chordScales['mixolydian']
    this.chordTones = this.getChordTones(this.root,this.quality,this.scale);
    this.length = this.chordTones.length
  }

  getInterval(num, min = 0, max = 127){ 
    num = getInterval(num, this.scale) + this.root + this.octave*12 
    if(num<min) {
      const count = Math.floor((min-num)/12)+1
      for(let i=0;i<count;i++)num += 12
        console.log('min', count)
    }
    else if(num>max) {
      const count = Math.floor((num-max)/12)+1
      for(let i=0;i<count;i++)num -= 12
        console.log('max', count)
    }
    return num
  }

  getChordTones(lowNote) {
    const chordTones = this.getChord(this.name, lowNote, this.voicing)
    //console.log(chordTones)
    return chordTones;
  }

  setChord(customChord) {
    this.notes = customChord;
  }

  applyVoicing(chordTones) {
    const voicingOffsets = voicings[this.voicing];
    return chordTones.map((tone, index) => tone + (voicingOffsets[index] || 0));
  }

  getChord(name,  lowNote = null, _voicing = null){

    if(_voicing == null) _voicing = voicing

    // Adjust the chord tones based on the voicing type
    let chord = applyVoicing(_voicing, this.scale);
    //console.log(octave, this.scale, tonicNumber)
    chord = chord.map(x=> x+ this.octave*12 + this.root + tonicNumber)
    //console.log(chord)
    // Adjust the chord tones to be as close as possible to the previous chord
    if (previousChord.length > 0) {
      if(lowNote){ previousChord[0] = lowNote}
      chord = minimizeMovement(chord, previousChord);
    }
    //console.log("post", chord, lowNote)
    previousChord = chord;
    return chord
  }
}

/************************************
 * Helper functions
 * ************************************/

export function getChordRoot(name){
  //parse chord name
  const romanNumeral = name.match(/[iIvVb#]+/)[0];

  //set keyType
  if (!romanNumeral) {
    console.log('incorrent chord name ${name}')
    return tonicNumber
  }
  let degree = 0
  
  if (keyType == 'major') {
    degree =  MajorScaleDegrees[romanNumeral];
    if(degree == undefined) degree = MinorScaleDegrees[romanNumeral];
    if(degree == undefined) degree = 0
  }
  else {
    degree =  MinorScaleDegrees[romanNumeral];
    if(degree == undefined) degree = MajorScaleDegrees[romanNumeral];
    if(degree == undefined) degree = 0
  }
  if(degree == undefined) degree = 0

  return degree % 12
}

//return midi note numbers for current chord
function getChordTones(root, quality, scale){
  let chord = []
  let len = 3
  if( /\d/.test(quality)) len = 4
  for(let i=0;i<len;i++) chord[i] = scale[i*2]+root
}

function getInterval(num,scale){
  let len = scale.length
  if (typeof num === 'number') {
    let _octave = Math.floor(num/len)
    if(num<0) num = 7+num%7 //check negative numbers
    num = scale[num%len] + _octave*12
    return num
  } else if (typeof num === 'string') {
    //parse num to look for # and b notes
    const match = num.match(/^([^\d]+)?(\d+)$/);

    //get scale degree
    num = Number(match[2])
    let _octave = Math.floor(num/len)
    if(num<0) num = 7+num%7
    num = scale[num%len] + _octave*12

    //apply accidentals
    if(match[1]== '#')num+=1
    else if (match[1] == 'b') num-=1

    return num
  }
  return 0
}