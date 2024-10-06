
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
		this.slop = .05

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
		val = val + Math.random()*this.slop - this.slop/2
		if(time) this.voice[this.v].triggerAttack(val,vel,time) //midinote,velocity,time
		else this.voice[this.v].triggerAttack(val,vel) 
	}

	triggerRelease = function(val, time=null){
		if (this.activeNotes[val] !== null){
			this.v = this.getActiveNote(val)
			if(time) this.voice[this.v].triggerRelease(time) //midinote,velocity,time
			else this.voice[this.v].triggerRelease() 
		}
	}

	triggerAttackRelease = function(val, vel=100, dur=0.01, time=null){
		this.v = this.getNewVoice(val)
		val = val + Math.random()*this.slop - this.slop/2
		if(time){
			this.voice[this.v].triggerAttackRelease(val, vel, dur, time)
		} else{
			this.voice[this.v].triggerAttackRelease(val, vel, dur)
		}
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

    /** VOICE MANAGEMENT **/

    // Get a free voice or steal an old voice
  getNewVoice(noteNum) {

    //if note is already playing free it
    const curIndex = this.getActiveNote(noteNum)
    if( curIndex >= 0) this.freeActiveNote( noteNum )

    //look for free voice
		let envStates = []
	  for (let i = 0; i < this.numVoices; i++) {
	  	const curEnv = this.voice[i].env.value
	  	if(curEnv == 0){
	  		//console.log('new voice ', i)
	  		this.setActiveNote(i, noteNum)
        return i;
	  	}

	  //if no free voice
	  envStates.push( curEnv )

    let assignedVoice = envStates.reduce((minIndex, currentValue, currentIndex, array) => {
        return currentValue < array[minIndex] ? currentIndex : minIndex;
    }, 0);
    //console.log('stolen ', assignedVoice, envStates)
    this.voice[assignedVoice].env.cancel()
    this.setActiveNote(assignedVoice, noteNum)
    //console.log('stole voice ', assignedVoice)
    return assignedVoice;
  }
  }

  // Get the index of a specific active note, or -1 if the note is not active
    getActiveNote(midiNote) {
        return this.activeNotes.indexOf(midiNote);
    }

    // Set a new active note (add it to the array)
    setActiveNote(index, midiNote) {
        if (!this.activeNotes.includes(midiNote)) {
            this.activeNotes[index] = midiNote;  // Add only if not already active
        }
    }

    // Free a specific active note (remove it from the array)
    freeActiveNote(midiNote) {
        const noteIndex = this.getActiveNote(midiNote);
        this.voice[noteIndex].triggerRelease()
        if (noteIndex !== -1) {
            this.activeNotes[noteIndex] = -1;  // Remove the note if found
        }
    }

    	//
	initGui(selfRef, gui) {
    this.voice[0].super = selfRef;
    this.voice[0].initGui(gui);
    let elements = this.voice[0].gui_elements;

    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        try {
            if (element.callback !== null) {
                // Extract the parameter and value expression
                const param = this.generateParamString(element.callback);
                const val = this.retrieveValueExpression(element.callback);

                // Modify the callback to apply the value to all voices
                element.callback = (x) => {
                    // Loop through each voice
                    for (let i = 0; i < this.numVoices; i++) {
                        // Access the relevant parameter for each voice
                        let voiceTarget = this.voice[i];
                        let keys = param.split('.');

                        // Traverse through the nested properties to find the final target
                        for (let j = 0; j < keys.length - 1; j++) {
                            if (voiceTarget[keys[j]] === undefined) {
                                console.error(`Parameter ${keys[j]} does not exist on voice ${i}`);
                                return;
                            }
                            voiceTarget = voiceTarget[keys[j]];
                        }
                        if(voiceTarget.name === 'Param' || voiceTarget.name === 'Signal'){
                        	voiceTarget.value = x
                        }
                        else if( voiceTarget.name === 'Envelope'){
                        	voiceTarget = x
                        } else{
                        	console.log('unknown object ', voiceTarget.name)
                        }

                        // // Apply the new value to the last key
                        // const lastKey = keys[keys.length - 1];
                        // if (voiceTarget[lastKey] !== undefined) {
                        // 	val(x)
                        //     //voiceTarget[lastKey] === 'value' ? val(x) : val.value(x);
                        // } else {
                        //     console.error(`Parameter ${lastKey} does not exist on voice ${i}`);
                        // }
                    }
                };
                //console.log(`Updated callback for ${param}`);
            }
        } catch (e) {
            console.log('Invalid GUI element: ', element);
        }
    }
}


	// Function to generate the parameter string from an assignment
	 generateParamString(assignment) {
    const fnString = assignment.toString();
    //console.log('param:', fnString);  // Log the function as a string to inspect its structure

    // Regex to match "this.[something] = [something];"
    const regex = /this\.([\w\d_\.]+)\s*=\s*([\w\d_\.]+)\s*;?/;
    const match = fnString.match(regex);

    //console.log('match:', match);  // Log the match result to debug
    if (match) {
        //console.log('Captured:', match[1]);  // Output: 'cutoff.value' or similar
        return match[1];  // Returns 'cutoff.value'
    } else {
        console.log('No match found');
    }

    return null;
}


	 retrieveValueExpression(assignment) {
    const fnString = assignment.toString();

    // Adjusted regex to capture everything after the = sign, including optional semicolon
    const regex = /this\.([\w\d_\.]+)\s*=\s*(.+);?/;
    const match = fnString.match(regex);

    if (match) {
        // Return the value expression part (everything after '=')
        return match[2].trim();  // Trimming to remove extra spaces if needed
    }

    return null;
}

	//SET PARAMETERS

	set(param, value, time = Tone.now()) {
    console.log('set', param, value);

    // Split the parameter into keys (to access nested properties)
    let keys = param.split('.');

    for (let i = 0; i < this.numVoices; i++) {
        let target = this.voice[i];

        // Traverse through the nested objects based on the keys
        for (let j = 0; j < keys.length - 1; j++) {
            if (target[keys[j]] === undefined) {
                console.error(`Parameter ${keys[j]} does not exist on voice ${i}`);
                return;
            }
            target = target[keys[j]];
        }

        const lastKey = keys[keys.length - 1];

        // Ensure `value` is always treated as a function
        const finalValue = typeof value === 'function' ? value() : value;

        if (target[lastKey] !== undefined) {
            if (target[lastKey]?.value !== undefined) {
                console.log(`Current value: ${target[lastKey].value}, Setting new value: ${finalValue}`);

                if (time === null) {
                    target[lastKey].value = finalValue;  // Set value immediately
                } else {
                    target[lastKey].linearRampToValueAtTime(finalValue, time + 0.1);  // Ramp to value
                }
            } else {
                // If it's not an object with `value`, set directly
                target[lastKey] = finalValue;
            }
        } else {
            console.error(`Parameter ${lastKey} does not exist on voice ${i}`);
        }
    }
}

/**** PRESETS ***/

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