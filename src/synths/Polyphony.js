
/********************
 * polyphony
 ********************/

import p5 from 'p5';
import * as Tone from 'tone';
import { MonophonicTemplate } from './MonophonicTemplate';

export class Polyphony extends MonophonicTemplate{
	constructor(voice,num=8, gui= null){
		super()
        this.gui = gui
        this.name = voice.name
		this.numVoices = num
		//audio
		this.voice = []
		for(let i=0;i<this.numVoices;i++) this.voice.push(new voice)
		this.output = new Tone.Multiply(1/this.numVoices)
		this.hpf = new Tone.Filter({type:'highpass', rolloff:-12, Q:0, cutoff:50})
		for(let i=0;i<this.numVoices;i++) this.voice[i].output.connect( this.hpf)
		this.hpf.connect(this.output)

	    //voice tracking
		this.prevNote = 0
		this.v = 0
		this.voiceCounter = 0
		this.activeNotes = []
		this.noteOrder = []
		this.voiceOrder = []
		for (let i = 0; i < this.numVoices; i++) {
			this.activeNotes.push(-1)
			if (i === 0) {this.noteOrder.push(this.numVoices - 1)}
			else {this.noteOrder.push(i - 1)}
		}
	}

	/**************** 
	 * trigger methods
	***************/
	triggerAttack = function(val, vel=100, time=null){
		this.v = this.getNewVoice(val)
		if(time) this.voice[this.v].triggerAttack(val,vel,time) //midinote,velocity,time
		else this.voice[this.v].triggerAttack(val,vel) 
	}

	triggerRelease = function(val, time=null){
		if (this.activeNotes[val] !== null){
			this.v = this.getActiveVoice(val)
			if(time) this.voice[this.v].triggerRelease(time) //midinote,velocity,time
			else this.voice[this.v].triggerRelease() 
			this.activeNotes[val] = null;  // Mark voice as free
		}
	}

	triggerAttackRelease = function(val, vel=100, dur=0.01, time=null){
		this.v = this.getNewVoice(val)
		//val = Tone.Midi(val).toFrequency()
		if(time){
			this.voice[this.v].triggerAttackRelease(val, vel, dur, time)
		} else{
			this.voice[this.v].triggerAttackRelease(val, vel, dur)
		}
		//this.v = this.getActiveVoice(val)
		// setTimeout((val)=>{
		// 	console.log('time', val)
		// 	this.freeVoice(this.getActiveVoice(val))
		// },this.voice[0].env.attack + dur + this.voice[0].env.release )
	}

	/**
     * Set the ADSR values for the envelope
     * @param {number} a - Attack time
     * @param {number} d - Decay time
     * @param {number} s - Sustain level
     * @param {number} r - Release time
     * @returns {void}
     * @example synth.setADSR(0.01, 0.1, 0.5, 0.1)
     */
    setADSR(a, d, s, r) {
    	for(let i=0;i<this.numVoices;i++){
    		if (this.voice[i].env) {
	            this.voice[i].env.attack = a>0.001 ? a : 0.001
	            this.voice[i].env.decay = d>0.01 ? d : 0.01
	            this.voice[i].env.sustain = Math.abs(s)<1 ? s : 1
	            this.voice[i].env.release = r>0.01 ? r : 0.01
        	}
    	}
    }

    /**
     * Set the ADSR values for the filter envelope
     * @param {number} a - Attack time
     * @param {number} d - Decay time
     * @param {number} s - Sustain level
     * @param {number} r - Release time
     * @returns {void}
     * @example synth.setFilterADSR(0.01, 0.1, 0.5, 0.1)
     */ 
    setFilterADSR(a, d, s, r) {
    	for(let i=0;i<this.numVoices;i++){
	        if (this.voice[i].vcf_env) {
	            this.voice[i].vcf_env.attack = a>0.001 ? a : 0.001
	            this.voice[i].vcf_env.decay = d>0.01 ? d : 0.01
	            this.voice[i].vcf_env.sustain = Math.abs(s)<1 ? s : 1
	            this.voice[i].vcf_env.release = r>0.01 ? r : 0.01
	        }
	    }
    }

	//used to convert monophonic guis to polyphonic
	// convertAssignmentToSuperSet(fn) {
	//     // Convert the input function to a string
	//     const fnString = fn.toString();

	//     // Use a regular expression to match the pattern `this.<property> = <expression>;`
	//     // This regex will match properties of different depths: this.obj.prop, this.obj.prop.sub.value, etc.
	//     const regex = /this\.([\w\d_\.]+)\s*=\s*(.+?);/g;

	//     // Replace all matches with `this.super.set('property', value)`
	//     let convertedFnString = fnString.replace(regex, (match, property, value) => {
	//         return `this.voice[0].super.set('${property}', ${value});`;
	//     });
	//     //convertedFnString = convertedFnString + '; console.log(this.super)'

	//     // Convert the modified function string back into a function
	//     return new Function('return ' + convertedFnString)();

	// }

	//  convertAssignmentToSuperSet(fn, selfRef) {
	//  	// Intercept the callback function and use selfRef.set instead of this.super.set
	//     return function(x) {
	//         fn.call({
	//             super: {
	//                 set: (property, value) => selfRef.set(property, value)
	//             },
	//             octaveMapping: (...args) => selfRef.octaveMapping(...args)  // Forward other methods if needed
	//         }, x);
	//     };
	// }
	convertAssignmentToSuperSet(fn, selfRef) {
    return function(x) {
        const context = {
            super: {
                set: (property, value) => {
                    console.log(`Calling selfRef.set(${property}, ${value})`);
                    selfRef.set(property, value);
                }
            },
            // Forward other methods from selfRef if needed, such as octaveMapping
            octaveMapping: (...args) => selfRef.octaveMapping(...args)
        };

        // Call the original function 'fn' with this custom context
        return fn.call(context, x);
    };
}

	// Function to generate the parameter string from an assignment
	generateParamString(assignment) {
		const fnString = assignment.toString();
		console.log('param', fnString)
	    const regex = /this\.([\w\d_\.]+)\s*=\s*(.+?);/;
	    const match = fnString.match(regex);
	    console.log(match)
	    if (match) {
	        return match[1];  // Return the 'pitchshift.value' part
	    }
	    return null;
	}

	// Function to retrieve the value expression from an assignment
	retrieveValueExpression(assignment) {
		const fnString = assignment.toString();
		console.log('val', fnString)
	    const regex = /this\.([\w\d_\.]+)\s*=\s*(.+?);/;
	    const match = fnString.match(regex);
	    if (match) {
	        return match[2];  // Return the 'this.octaveMapping(x)' part
	    }
	    return null;
	}


	//
	initGui(selfRef, gui){
		this.voice[0].super = selfRef
		this.voice[0].initGui(gui)
		let elements = this.voice[0].gui_elements
		
		for(let i=0;i<elements.length;i++){
			let element = elements[i]
			if(element.callback !== null){
				console.log(this, element.callback)
				const param = this.generateParamString(element.callback)
				const val = this.retrieveValueExpression(element.callback)
				//element.callback = this.convertAssignmentToSuperSet(element.callback, this.voice[0].super)
				element.callback = x=>this.set(param, val)
				console.log(element.callback)
				console.log('\n')
			}
		}	
	}

	// Get a free voice or steal an old voice
  getNewVoice(noteNum) {
    // First, check if the note is already playing
    let existingVoice = this.getActiveVoice(noteNum);
    if (existingVoice !== -1) {
      // If the note is already playing, release the voice
      this.triggerRelease(existingVoice);
    }

    // Check if there are any free voices
    for (let i = 0; i < this.numVoices; i++) {
      if (this.activeNotes[i] === null) {
        // Assign the voice to the new note
        this.assignVoice(i, noteNum);
        return i;
      }
    }

    // If no free voices, steal the oldest voice
    let voiceToSteal = this.voiceOrder.shift();
    this.triggerRelease(voiceToSteal); // Release the oldest note
    this.assignVoice(voiceToSteal, noteNum);
    return voiceToSteal;
  }

  // Assigns a voice to a note and marks it as active
  assignVoice(voiceIndex, noteNum) {
    this.activeNotes[voiceIndex] = noteNum;
    this.voiceOrder.push(voiceIndex);  // Add this voice to the order of played voices
    this.triggerAttack(voiceIndex, noteNum); // Trigger the note
  }

  // Finds the voice currently playing the note, or returns -1 if not found
  getActiveVoice(noteNum) {
    return this.activeNotes.indexOf(noteNum);  // Find the voice playing the note
  }

	//SET PARAMETERS

	set(param, value, time = null) {
		console.log('set', param, value)
		// return
		let keys = param.split('.');
		//console.log('keys', keys)
		for (let i = 0; i < this.numVoices; i++) {
			let target = this.voice[i];
			for (let j = 0; j < keys.length - 1; j++) {
				//console.log(target[keys[j]])
				if (target[keys[j]] === undefined) {
					console.error(`Parameter ${keys[j]} does not exist on voice ${i}`);
					return;
				}
			target = target[keys[j]];
			}
			const lastKey = keys[keys.length - 1];
			if (target[lastKey] !== undefined) {
			if (target[lastKey]?.value !== undefined) {
				if(time === null) target[lastKey].value = value;
				else target.linearRampToValueAtTime(value, time+.1)
			} else {
				target[lastKey] = value;
			}
			} else {
				console.error(`Parameter ${lastKey} does not exist on voice ${i}`);
			}
		}//for
	}//set

	loadPreset(name) {
		//for(let i=0;i<this.numVoices;i++) this.voice[i].loadPreset(name)
		this.voice[0].loadPreset(name)
	}

	listPresets() {
        this.voice[0].listPresets();
    }

	savePreset(name) {
		this.voice[0].savePreset(name)
	};

    // Function to download the updated presets data
	downloadPresets() {
		this.voice[0].downloadPresets()
	};

	panic = function(){
		for(let i=0;i<this.numVoices;i++){
			this.voice[this.v].triggerRelease()
			this.activeNotes[i]  = -1
		}
	}

}