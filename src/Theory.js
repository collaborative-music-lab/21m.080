/* Theory.js

Implements a system for specifying chord and progressions 
as Roman numerals.

Includes the classes 'chord', and 'progression'

*/

let tonic = 'C';
let keyType = 'major';
let octave = 4;
let voicing = 'closed'
let previousChord = [];

const voicings = {
  "closed": [0,1,2,3],
  "open": [0,2,3,1],
  "drop2": [-2,0,1,3],
  "drop3": [-3,0,1,2]
}

export function setVoicing(name){
  if (voicings.hasOwnProperty(name)) voicing = name 
  else console.log('invalid voicing name ', name)
console.log('current voicing: ', voicing)
}

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

export function setTonic(val) {
  const noteRegex = /[A-Ga-g][#b]?/; // Regular expression to detect musical notes including sharps and flats
  const numberRegex = /\d+/; // Regular expression to detect numbers

  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const enharmonicMap = {
    'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'C#': 'C#', 'D#': 'D#', 'F#': 'F#', 'G#': 'G#', 'A#': 'A#'
  };

  if (typeof val === 'string') {
    const noteMatch = val.match(noteRegex);
    const numberMatch = val.match(numberRegex);

    if (noteMatch) {
      tonic = noteMatch[0]; // Set the tonic and convert to uppercase
      keyType = noteMatch[0] === noteMatch[0].toUpperCase() ? 'major' : 'minor'; // Set the key type based on case
    }

    if (numberMatch) {
      octave = parseInt(numberMatch[0], 10); // Set the octave
    }
  } else if (typeof val === 'number') {
    octave = Math.floor(val / 12) - 1; // Calculate the octave from the MIDI number
    const noteIndex = val % 12;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    tonic = notes[noteIndex]; // Set the tonic based on the note index
    //keyType = 'major'; // Default to major when using MIDI number
  }

  console.log(`Tonic: ${tonic}, Key Type: ${keyType}, Octave: ${octave}`);
}

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
  // Add more chord qualities and extensions as needed
};


//takes a roman number chord and returns an array of intervals
//interval array is based on key and current octave
export function getChord(name){
  const romanNumeralMatch = name.match(/[iIvVb#]+/);
  const suffix = name.replace(/[iIvVb#]+/, '');

  //error case
  const romanNumeral = romanNumeralMatch[0];
  if (!romanNumeralMatch) romanNumeral = 'i';
  //console.log(romanNumeral, suffix, MajorScaleDegrees[romanNumeral])
  
  let degree = 0
  //get interval to tonic based on chord name
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
  const romanNumeralMatch2 = name.match(/[iIvV]+/);
  let type = getChordType(romanNumeralMatch2[0], suffix);
  let chord = chordIntervals[type].map(x=>x+degree+octave*12)
  //console.log(chord)
  // Adjust the chord tones based on the voicing type
  chord = applyVoicing(chord);

  //console.log(chord, previousChord)
  // Adjust the chord tones to be as close as possible to the previous chord
  if (previousChord.length > 0) {
    chord = minimizeMovement(chord, previousChord);
  }
  //console.log("post", chord)
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
  
  //previousChord.push(...previousChord.splice(0, (-steps % len + len) % len))
  //console.log(newChord)
  previousChord = newChord
}


function getChordType(romanNumeral, suffix) {
  //console.log(romanNumeral,suffix)
  if (suffix.includes('Maj7')) {
    return romanNumeral === romanNumeral.toUpperCase() ? 'major7' : 'minorMaj7';
  }
  if (suffix.includes('7')) {
    return romanNumeral === romanNumeral.toUpperCase() ? 'dominant7' : 'minor7';
  }
  if (suffix.includes('dim7'))  return 'diminished7';
  if (suffix.includes('dim'))  return 'diminished';
  if (suffix.includes('2')) return 'major9';

  return romanNumeral === romanNumeral.toUpperCase() ? 'major' : 'minor';
}

function applyVoicing(chord) {
  // Apply different voicings (closed, drop2, drop3, etc.)
  let voicedChord = Array(chord.length)
  
  //get current voicing and make sure it is long enough
  let cVoicing = voicings[voicing]
  while(cVoicing.length < chord.length) cVoicing.push(cVoicing.length)
  cVoicing = cVoicing.filter(x=> Math.abs(x)<chord.length)

  for(let i=0;i<chord.length;i++){
    let index = cVoicing[i]
    let note = index
    voicedChord[i] = chord[Math.abs(note)]
    if(i>0 && cVoicing[i] < cVoicing[i-1]) voicedChord[i]+=12
    if(index < 0) voicedChord[i] -= 12
  }
  return voicedChord
}

function minimizeMovement(chord, previousChord) {
  const lowerOctave = chord.map(note => note - 12);
  const upperOctave = chord.map(note => note + 12);
  chord = lowerOctave.concat(chord).concat(upperOctave)
  //console.log(chord)
  let distance = 100
  let lowNote = 0
  for(let i=0;i<chord.length;i++){
    const curDistance = Math.abs(chord[i]-previousChord[0])
    if(curDistance<distance){
      distance = curDistance
      lowNote = i
    }
  }
  let newVoicing = Array.from({length:chord.length/3},(x,i)=>chord[i+lowNote])
  for(let i=1;i<newVoicing.length;i++){
    if(newVoicing[i]<newVoicing[i-1])newVoicing[i]+=12
  }
  //console.log('new', newVoicing)
  return newVoicing
}


// export class Chord {
//   constructor(romanNumeral) {
//     this.romanNumeral = romanNumeral;
//     this.quality = this.getQuality(romanNumeral);
//     this.tonic = this.gettonic(romanNumeral);
//     this.intervals = chordIntervals[this.quality];
//   }

//   getQuality(romanNumeral) {
//     // Determine the chord quality based on the Roman numeral
//     if (romanNumeral.includes('Maj7')) return 'major7';
//     if (romanNumeral.includes('7')) return 'dominant7';
//     if (romanNumeral.includes('dim7')) return 'diminished7';
//     if (romanNumeral.includes('dim')) return 'diminished';
//     if (romanNumeral.includes('2')) return 'add9';
//     if (romanNumeral.toUpperCase() === romanNumeral) return 'major';
//     if (romanNumeral.toLowerCase() === romanNumeral) return 'minor';
//     if (romanNumeral.includes('m')) return 'minor';
//     return 'major';
//   }

//   gettonic(romanNumeral) {

//     let degree = []
//     if (tonic === tonic.toUpperCase()) degree =  MajorScaleDegrees[romanNumeral.replace(/[^a-zA-Z]/g, '')];
//     else degree =  MinorScaleDegrees[romanNumeral.replace(/[^a-zA-Z]/g, '')];
//     return (this.getNoteFromDegree(degree, tonic) + 12) % 12;
//   }

//   getNoteFromDegree(degree, key) {
//     // Map scale degrees to notes in the given key
//     const keyMap = {
//       'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7,
//       'G#': 8, 'A': 9, 'A#': 10, 'B': 11
//     };
//     return (keyMap[key] + degree) % 12;
//   }

//   getChordTones() {
//     // Generate the chord tones based on the root and intervals
//     return this.intervals.map(interval => (this.tonic + interval) % 12);
//   }
// }

// // Example usage:
// let chord = new Chord('V7', 'C');
// console.log(chord.getChordTones()); // Output: [7, 11, 2, 5]

// export function genVoicing(prevVoicing, chord) {
//   const intervals = chord.intervals;
//   let newVoicing = [];
  
//   // Get the lowest note of the previous voicing
//   const lowestNote = Math.min(...prevVoicing);
  
//   // Generate the new voicing based on the lowest note and intervals
//   for (let interval of intervals) {
//     newVoicing.push(lowestNote + interval);
//   }
  
//   // Ensure good voice leading by keeping the new voicing close to the previous one
//   for (let i = 0; i < newVoicing.length; i++) {
//     while (newVoicing[i] < prevVoicing[i] - 12) {
//       newVoicing[i] += 12;
//     }
//     while (newVoicing[i] > prevVoicing[i] + 12) {
//       newVoicing[i] -= 12;
//     }
//   }
  
//   return newVoicing;
// }

// export class Progression {
//   constructor(progressions) {
//     this.progressions = progressions.split(',').map(chord => chord.trim());
//     this.voicingType = 'closedVoicing';
//     this.currentVoicing = [];
//     this.currentBeat = 0;
//   }

//   get(beat) {
//     this.currentBeat = beat;
//     const chordSymbol = this.progressions[beat % this.progressions.length];
//     return new Chord(chordSymbol); // Assuming C major key for simplicity
//   }

//   set voicing(type) {
//     this.voicingType = type;
//   }
//
//   shiftVoicing(amount) {
//     const newVoicings = this.progressions.map((chordSymbol, index) => {
//       const chord = new Chord(chordSymbol, 'C'); // Assuming C major key for simplicity
//       if (index === 0) {
//         this.currentVoicing = chord.getChordTones();
//       } else {
//         this.currentVoicing = genVoicing(this.currentVoicing, chord);
//       }
//       return this.currentVoicing;
//     });

//     this.currentVoicing = newVoicings.map(voicing => voicing.map(note => note + amount));
//   }
// }


// // Example usage:
// let previousVoicing = [60, 64, 67]; // C major triad in root position
// let chord = new Chord('V7', 'C');
// let newVoicing = genVoicing(previousVoicing, chord);
// console.log(newVoicing);
