/*
Daisies
Polyphonic Subtractive Synthesizer

Daisy:
* 2 OmniOscillators(vco_1, vco_2)->shape->waveShapers->mixer->lpf->hpf->panner->vca
* frequency->frequency_scalar->(detune for vco_2)->vco_1.frequency
* frequencyCV->frequency_scalar.factor
* cutoff control: cutoff, cutoff_vc, keyTracking, lpf_env_depth
* lfo->vca_lfo_depth-<output.factor, pitch_lfo_depth->
* lfo->pitch_lfo_depth->frequency_scalar.factor

Daisies:
* daisy->hpf->output

signal inputs:
- frequency (signal, Hz)
- frequency CV (multiplication factor)
methods:
- connect
- panic()
- setFrequency
- setDetune
-  setResonance
-  setCutoff
-  setCutoffCV
-  setHighpass 
-  setKeyTracking 
-  setFilterEnvDepth = function(val){this.voiceSettings["lpf_env_depth.factor"] =  val }
-  setPanning(val)
-  setPulseWidth (num,val)
-  setVcoGain(num,val)
-  setVcoType(num, type)
-  setLfoFrequency(val)
-  setTremoloDepth(val)
-  setVibratoDepth(val)
- setADSR
- setHighpass(val)

properties:
- 

CC control of:
- setCutoffCV
- setPulseWidth
- setADSR
- setFilterADSR
- setDecayCV
- setHighpass
- setDetune
- setLfoFrequency

Main List of Parameters & how to set them:
- detune: setDetune
- detune_cv_depth.factor: setDetuneCV
- resonance: setResonance
- resonance_cv_depth.factor: setResonanceCV
- cutoff: setCutoff
- cutoff_cv_depth.factor: setCutoffCV
- highpass_freq: setHighpass 
- key_tracking_depth: setKeyTracking 
- vcf_env_depth: setFilterEnvDepth = function(val){this.voiceSettings["lpf_env_depth.factor"] =  val }
- panning: setPanning(val)
- pulse_width[vco_1,vco_2]: setPulseWidth (num,val)
- vco_gain[vco_1,vco_2]: setVcoGain(num,val)
- vco_type[vco_1,vco_2]: setVcoType(num, type)
- lfo_frequency: setLfoFrequency(val)
- lfo_frequency_cv_depth.factor: setLfoFrequencyCV(val)
- lfo_tremolo_cv_depth.factor: setTremoloCV(val)
- lfo_tremolo_depth: setTremoloDepth(val)
- lfo_vibrato_cv_depth.factor: setVibratoCV(val)
- lfo_vibrato_depth: setVibratoDepth(val)
- env

- filter_env: same as env

*/

import p5 from 'p5';
import * as Tone from 'tone';

export class Daisy{
	constructor(color = [200,200,200], gui = null){
	this.gui = gui

	this.frequency = new Tone.Signal(100)
	this.frequencyCV = new Tone.Signal()
	this.frequency_scalar = new Tone.Multiply(1)
	this.detune = new Tone.Multiply(1)
	this.vco_1 = new Tone.Oscillator({type:"square"}).start()
	this.vco_2 = new Tone.Oscillator({type:"square"}).start()
	this.frequency.connect(this.frequency_scalar)
	this.frequencyCV.connect(this.frequency_scalar.factor)
	this.frequency_scalar.connect(this.vco_1.frequency)
	this.frequency_scalar.connect(this.detune)
	this.detune.connect(this.vco_2.frequency)

	this.mixer_1 = new Tone.Multiply(.5)
	this.mixer_2 = new Tone.Multiply(.5)
	this.vco_1.connect( this.mixer_1)
	this.vco_2.connect( this.mixer_2)

	this.lpf = new Tone.Filter({type:'lowpass', rolloff:-24, Q:0, cutoff:3000})
	this.mixer_1.connect(this.lpf)
	this.mixer_2.connect(this.lpf)

	this.vca = new Tone.Multiply()
	this.panner = new Tone.Panner(0)
	this.output = new Tone.Multiply(.25)
	this.lpf.connect(this.vca)
	this.vca.connect(this.panner)
	this.panner.connect(this.output)

	//envelopes
	this.env = new Tone.Envelope()
	this.velocity = new Tone.Signal(1)
	this.velocity_depth = new Tone.Multiply(1)
	this.env.connect(this.velocity_depth)
	this.velocity_depth.connect(this.vca.factor)
	this.velocity.connect(this.velocity_depth.factor)

	//vcf
	this.cutoff = new Tone.Signal(1000)
	this.cutoff.connect(this.lpf.frequency)
	this.cutoffCV = new Tone.Signal()
	this.cutoffCV.connect(this.lpf.frequency)
	this.keyTracking = new Tone.Multiply(.1)
	this.frequency.connect(this.keyTracking)
	this.keyTracking.connect(this.lpf.frequency)
	this.vcf_env = new Tone.Envelope()
	this.lpf_env_depth = new Tone.Multiply()
	this.vcf_env.connect(this.lpf_env_depth)
	this.lpf_env_depth.connect(this.lpf.frequency)

	this.lfo = new Tone.Oscillator(.5).start()
	this.vca_constant = new Tone.Signal(1)
	this.vca_lfo_depth = new Tone.Multiply(0)
	this.lfo.connect(this.vca_lfo_depth)
	this.vca_lfo_depth.connect(this.output.factor)
	this.vca_constant.connect(this.output.factor)
	this.pitch_lfo_depth = new Tone.Multiply(0)
	this.lfo.connect(this.pitch_lfo_depth)
	this.frequency_constant = new Tone.Signal(1)
	this.pitch_lfo_depth.connect(this.frequency_scalar.factor)
	this.frequency_constant.connect(this.frequency_scalar.factor)

	//no PWM to prevent errors when vco is not set to pulse
	this.pwm_lfo_depth = new Tone.Multiply()
	this.lfo.connect(this.pwm_lfo_depth)
	//this.pwm_lfo_depth.connect(this.vco_1.width)
	//this.pwm_lfo_depth.connect(this.vco_2.width)
  }
}

/********************
 * polyphony
 ********************/

export class Daisies {
  constructor(num = 8, gui = null){
	this.gui = gui
	this.numVoices = num
	//audio
    this.voice = []
    for(let i=0;i<this.numVoices;i++) this.voice.push(new Daisy())
    this.output = new Tone.Multiply(0.125)
  	this.hpf = new Tone.Filter({type:'highpass', rolloff:-12, Q:0, cutoff:50})
    for(let i=0;i<this.numVoices;i++) this.voice[i].output.connect( this.hpf)
    this.hpf.connect(this.output)
    //control
    this.decay_cv = 0
	this.adsr = [.01,.5,.5,2]
	this.vcf_adsr = [.01,.5,.5,2]
	this.vco_type = ["pulse","pulse"]
	this.voiceSettings = {
        "detune.factor": 0,
        "lpf_env_depth.factor": 0,
        "panner.pan": 0,
        "keyTracking.factor": 0,
        "lfo.frequency": 0,
        "vca_lfo_depth.factor": 0,
        "pitch_lfo_depth.factor": 0
        //"pwm_lfo_depth.factor": 0,
        //"vco_1.width": 0,
        //"vco_2.width": 0
    }
    //voice tracking
    this.prevNote = 0
    this.v = 0
    this.voiceCounter = 0
    this.activeNotes = [-1,-1,-1,-1, -1,-1,-1,-1]
    this.noteOrder = [7,0,1,2,3,4,5,6]
  }
  /**************** 
   * trigger methods
  ***************/
  triggerAttack = function(val, vel=100, time=null){
    this.v = this.getNewVoice(val)
    if(time){
      this.voice[this.v].frequency.setValueAtTime(Tone.Midi(val).toFrequency(),time)
      this.voice[this.v].env.triggerAttack(time)
      this.voice[this.v].vcf_env.triggerAttack(time)
      this.voice[this.v].velocity.setValueAtTime(Math.pow(vel,2),time)
    } else{
      this.voice[this.v].frequency.value = Tone.Midi(val).toFrequency()
      this.voice[this.v].env.triggerAttack()
      this.voice[this.v].vcf_env.triggerAttack()
      this.voice[this.v].velocity.value =Math.pow(vel,2) 
    }

    if (time) {
      this.updateVoiceParameters(this.v, { val }, time);
    } else {
      this.updateVoiceParameters(this.v, { val });
    }
  }
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
  // //setters
  setFrequency = function(val){for(let i=0;i<this.numVoices;i++) this.voice[i].frequency.value = val}
  setDetune = function(val){this.voiceSettings["detune.factor"] = val}
  setResonance = function(val){for(let i=0;i<this.numVoices;i++) this.voice[i].lpf.Q.value = val}
  setCutoff = function(val){for(let i=0;i<this.numVoices;i++) this.voice[i].cutoff.value = val}
  setCutoffCV = function(val){ for(let i=0;i<this.numVoices;i++) this.voice[i].cutoffCV.value = val}
  setKeyTracking = function(val){this.voiceSettings["keyTracking.factor"] = val }
  setFilterEnvDepth = function(val){this.voiceSettings["lpf_env_depth.factor"] =  val }
  setPanning(val){ this.voiceSettings["panner.pan"] = val }
  setLfoFrequency(val){this.voiceSettings["lfo.frequency"] = val }
  setTremoloDepth(val){this.voiceSettings["vca_lfo_depth.factor"] = val }
  setVibratoDepth(val){this.voiceSettings["pitch_lfo_depth.factor"] = val }
  setPWMDepth(val){this.voiceSettings["pwm_lfo_depth.factor"] = val }

  setHighpass = function(val){this.hpf.frequency.value = val }
  // setPulseWidth = function(num,val){ //
  // 	if(num <0 || num >2 ){ console.log("daisy vcos are 0 and 1"); return;}
	// if(this.vco_type[num] !== 'pulse' ) return;
	// if(num==0 )this.voiceSettings["vco_1.width"] = Math.abs((val-.5)*2) //convert 0.5=50% to 0=50%
	// else if(num==1)this.voiceSettings["vco_2.width"] = Math.abs((val-.5)*2)  
  // }
  setVcoGain = function(num,val){
  	if(num <0 || num >2 ){ console.log("daisy vcos are 0 and 1"); return;}
	for(let i=0;i<this.numVoices;i++) {
		if(num==0)this.voice[i].mixer_1.factor.value = val 
		else this.voice[i].mixer_2.factor.value = val 
	}
  }
  setVcoType = function(num,val){
  	if(num <0 || num >2 ){ console.log("daisy vcos are 0 and 1"); return;}
  	switch(val){
  	case 'saw': case 'sawtooth': case 'ramp': 
  		this.applyVcoType(num, 'sawtooth'); break;
  	case 'square': case 'pwm': 
  		this.applyVcoType(num, 'pulse'); this.setPulseWidth(num,.5); break;
  	case 'pulse':  
  		this.applyVcoType(num, 'pulse'); this.setPulseWidth(num,.2); break;
  	case 'tri': case 'triangle': 
  		this.applyVcoType(num, 'triangle'); break;
  	/*
	vco.type = 'fmsine'
	vco.modulationType = 'sine'
	vco.modulationIndex.value = 20
	vco.harmonicity.value = 5
  	*/
  	}
  }
  applyVcoType = function(num,val){
  	this.vco_type[num] = val
  	if(num==0) this.voice[0].vco_1.type = val 
		else if(num==1) this.voice[1].vco_2.type = val 
  }
  
  //envelopes
  setADSR = function(a,d,s,r){
  	this.adsr = [a,d,s,r]
    this.updateEnv()
  }
  setFilterADSR = function(a,d,s,r){
  	this.vcf_adsr = [a,d,s,r]
    this.updateFilterEnv()
  }
  setDecayCV = function(val){
  	this.decay_cv = val
  	this.updateEnv()
  	this.updateFilterEnv()
  }
  updateEnv(){
  	for(let i=0;i<this.numVoices;i++) {
      this.voice[i].env.attack = this.adsr[0]
      this.voice[i].env.decay = this.adsr[1] + this.decay_cv/2
      this.voice[i].env.sustain = this.adsr[2]
      this.voice[i].env.release = this.adsr[3] + this.decay_cv
    }
  }
  updateFilterEnv(){
  	for(let i=0;i<this.numVoices;i++) {
      this.voice[i].vcf_env.attack = this.vcf_adsr[0] 
      this.voice[i].vcf_env.decay = this.vcf_adsr[1] + this.decay_cv/2
      this.voice[i].vcf_env.sustain = this.vcf_adsr[2]
      this.voice[i].vcf_env.release = this.vcf_adsr[3] + this.decay_cv
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

	updateVoiceParameters(voiceIndex, params, time = null) {
	    const settings = this.voiceSettings;
	    for (let [key, value] of Object.entries(settings)) {
	    	if (key === "panner.pan") value =  this.calcPan(params.val, value)
	        if (time) {
	            const target = this.getNestedProperty(this.voice[voiceIndex], key);
	            if (target && typeof target.setValueAtTime === 'function') {
	                target.setValueAtTime(value, time);
	            }
	        } else {
	            this.setNestedProperty(this.voice[voiceIndex], key, value);
	        }
	    }
	}


	getNestedProperty(obj, path) {
		return path.split('.').reduce((acc, part) => acc && acc[part], obj);
	}

	setNestedProperty(obj, path, value) {
	    const parts = path.split('.');
	    const last = parts.pop();
	    const lastObj = parts.reduce((acc, part) => acc[part], obj); // Navigate to the last object

	    if (lastObj !== undefined && last in lastObj) {
	        if (lastObj[last] instanceof AudioParam || ("value" in lastObj[last])) {
	            // If the property is an AudioParam or has a 'value' property, set it directly
	            lastObj[last].value = value;
	        } else {
	            // Otherwise, set the property directly
	            lastObj[last] = value;
	        }
	    }
	}

  calcPan(note,val){
  	val = Math.sin(note/127*Math.PI*(val-(val/2)))
  	//console.log(note, val )
  	return val
  }
}