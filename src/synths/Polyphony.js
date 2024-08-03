
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
		this.v = this.getActiveVoice(val)
		if (this.v != -1) {
			if(time) this.voice[this.v].triggerRelease(time) //midinote,velocity,time
			else this.voice[this.v].triggerRelease() 
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

	//
	initGui(selfRef, gui){
		this.voice[0].initPolyGui(selfRef, gui)
	}

	//VOICE MANAGEMENT
	getNewVoice(num) {
		if (this.voiceCounter >= this.numVoices) {
			this.voiceCounter = 0; // Reset voice counter if it exceeds the number of voices
		}

		//keep track of note order
		this.prevNote = this.noteOrder.shift();
		this.noteOrder.push(num);

		//if note is already playing free it
		for (let i = 0; i < this.numVoices; i++) {
			if(this.activeNotes[i] == num ) this.triggerRelease(num)	
		}

		// //look for free voice
		// for (let i = 0; i < this.numVoices; i++) {
		// 	const index = (i + this.voiceCounter) % this.numVoices;
		// 	if (this.activeNotes[index] < 0) {
		// 		this.activeNotes[index] = num;
		//     	this.voiceCounter = (index + 1) % this.numVoices; // Prepare for the next voice
		//       	//console.log('free voice, assigned to voice', index)
		// 		return index;
		// 	}
		// }

	    this.voiceCounter = (this.voiceCounter + 1) % this.numVoices; // Prepare for the next voice
		this.activeNotes[this.voiceCounter] = num;
		return this.voiceCounter
		
		// Fallback if the above logic didn't return
		//console.log('fallback', this.voiceCounter)
		/*
		const returnValue = this.voiceCounter;
		this.voiceCounter = (this.voiceCounter + 1) % this.numVoices;
		return returnValue;
		*/
		}//getNewVoice

	//returns the voice playing the selected note
	getActiveVoice= function(num){ 
	//console.log(num)   
		for(let i=0;i<this.numVoices;i++){
			if(this.activeNotes[i] == num){
				this.activeNotes[i] = -1
				return i
			}
		}
		return -1
	}//getActiveVoice

	freeVoice = function(num){
		console.log("free ", num)
		this.activeNotes[num] = -1
	}

	//SET PARAMETERS

	set(param, value, time = null) {
		//console.log('set', param, value)
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