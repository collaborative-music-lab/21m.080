
/********************
 * polyphony
 ********************/

import p5 from 'p5';
import * as Tone from 'tone';

export class Polyphony{
	constructor(voice,num=8, gui= null){

		this.gui = gui
		this.numVoices = num
		//audio
	    this.voice = []
	    for(let i=0;i<this.numVoices;i++) this.voice.push(new voice)
	    this.output = new Tone.Multiply(0.125)
	  	this.hpf = new Tone.Filter({type:'highpass', rolloff:-12, Q:0, cutoff:50})
	    for(let i=0;i<this.numVoices;i++) this.voice[i].output.connect( this.hpf)
	    this.hpf.connect(this.output)

	    //voice tracking
	    this.prevNote = 0
	    this.v = 0
	    this.voiceCounter = 0
	    //TODO: fix to be variable based on number of voices. . . 
	    this.activeNotes = [-1,-1,-1,-1, -1,-1,-1,-1]
	    this.noteOrder = [7,0,1,2,3,4,5,6]
	  }
	  /**************** 
	   * trigger methods
	  ***************/
	  triggerAttack = function(val, vel=100, time=null){
	    this.v = this.getNewVoice(val)
	    if(time) this.voice[this.v].triggerAttack(val,vel,time) //midinote,velocity,time
	    else this.voice[this.v].triggerAttack(val,vel) 
	  }
	  //TODO: update trigger release and triggerAttackRelease
	  triggerRelease = function(val, time=null){
	    this.v = this.getActiveVoice(val)
	    if(this.v < 0) return
	    if(time){
	      this.voice[this.v].env.triggerRelease(time)
	      this.voice[this.v].vcf_env.triggerRelease(time)
	    } else{
	      this.voice[this.v].env.triggerRelease()
	      this.voice[this.v].vcf_env.triggerRelease()
	    }
	  }
	  triggerAttackRelease = function(val, vel=100, dur=0.01, time=null){
	    this.v = this.getNewVoice(val)
	    val = Tone.Midi(val).toFrequency()
	    if(time){
	      this.voice[this.v].frequency.setValueAtTime(val,time)
	      this.voice[this.v].env.triggerAttackRelease(dur,time)
	      this.voice[this.v].vcf_env.triggerAttackRelease(dur,time)
	      this.voice[this.v].velocity.setValueAtTime(Math.pow(vel,2),time)
	    } else{
	      this.voice[this.v].frequency.value = val
	      this.voice[this.v].env.triggerAttackRelease(dur)
	      this.voice[this.v].vcf_env.triggerAttackRelease(dur)
	      this.voice[this.v].velocity.value =Math.pow(vel,2) 
	    }
	    if (time) {
	      this.updateVoiceParameters(this.v, { val }, time);
	    } else {
	      this.updateVoiceParameters(this.v, { val });
	    }
	  }//attackRelease

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
			//look for free voice
		  for (let i = 0; i < this.numVoices; i++) {
		    const index = (i + this.voiceCounter) % this.numVoices;
		    if (this.activeNotes[index] < 0) {
		      this.activeNotes[index] = num;
		      this.voiceCounter = (index + 1) % this.numVoices; // Prepare for the next voice
		      //console.log('free voice, assigned to voice', index)
		      return index;
		    }
		  }

	    this.voiceCounter = (this.voiceCounter + 1) % this.numVoices; // Prepare for the next voice
	    return this.voiceCounter
		  
		  // Fallback if the above logic didn't return
		  //console.log('fallback', this.voiceCounter)
		  const returnValue = this.voiceCounter;
		  this.voiceCounter = (this.voiceCounter + 1) % this.numVoices;
		  return returnValue;
		}//getNewVoice

		//returns the voice playing the selected note
	  getActiveVoice= function(num){    
	    for(let i=0;i<this.numVoices;i++){
	      if(this.activeNotes[i]==num){
	        this.activeNotes[i] = -1
	        //console.log('voice freed ', i)
	        return i
	      }
	    }
	    return -1
	  }//getActiveVoice

	  panic = function(){
	    for(let i=0;i<this.numVoices;i++){
	      this.voice[i].env.triggerRelease()
	      this.voice[i].vcf_env.triggerRelease()
	      this.activeNotes[i]  = -1
	    }
	  }

	  connect(destination) {
	    if (destination.input) {
	      this.output.connect(destination.input);
	    } else {
	      this.output.connect(destination);
	    }
	  }

		disconnect(destination) {
	    if (destination.input) {
	      this.output.disconnect(destination.input);
	    } else {

	      this.output.disconnect(destination);
	    }
	  }
	}