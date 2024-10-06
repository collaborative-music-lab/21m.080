/*
Daisies
Polyphonic Subtractive Synthesizer

Daisy:
* 2 OmniOscillators(vco_1, vco_2)->shape->waveShapers->mixer->vcf->hpf->panner->vca
* frequency->frequency_scalar->(detuneSig for vco_2)->vco_1.frequency
* frequencyCV->frequency_scalar.factor
* cutoff control: cutoff, cutoff_vc, keyTracking, vcf_env_depth
* lfo->vca_lfo_depth-<output.factor, pitch_lfo_depth->
* lfo->pitch_lfo_depth->frequency_scalar.factor
* env->velocity_depth(Multiply)->vca.factor
* velocity(Signal)->velocity_depth.factor
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
-  setFilterEnvDepth = function(val){this.voiceSettings["vcf_env_depth.factor"] =  val }
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
- vcf_env_depth: setFilterEnvDepth = function(val){this.voiceSettings["vcf_env_depth.factor"] =  val }
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
import DaisiesPresets from './synthPresets/DaisiesPresets.json';
import { MonophonicTemplate } from './MonophonicTemplate';

export class Daisy extends MonophonicTemplate{
	constructor(){
		super()
		this.presets = DaisiesPresets
		this.name = 'Daisy'
		
		this.frequency = new Tone.Signal(100)
		this.frequencyCV = new Tone.Signal()
		this.frequency_scalar = new Tone.Multiply(1)
		this.detune_scalar = new Tone.Multiply(1)
		this.vco_1 = new Tone.Oscillator({type:"square"}).start()
		this.vco_2 = new Tone.Oscillator({type:"square"}).start()
		this.frequency.connect(this.frequency_scalar)
		this.frequencyCV.connect(this.frequency_scalar.factor)
		this.frequency_scalar.connect(this.vco_1.frequency)
		this.frequency_scalar.connect(this.detune_scalar)
		this.detune_scalar.connect(this.vco_2.frequency)

		this.crossfade = new Tone.CrossFade()
		this.vco_1.connect( this.crossfade.a)
		this.vco_2.connect( this.crossfade.b)

		this.vcf = new Tone.Filter({type:'lowpass', rolloff:-24, Q:0, cutoff:3000})
		this.crossfade.connect(this.vcf)

		this.vca = new Tone.Multiply()
		this.lfo_vca = new Tone.Multiply(1)
		this.lfo_vca_constant = new Tone.Signal(1)
		this.panner = new Tone.Panner(0)
		this.output = new Tone.Multiply(.25)
		this.vcf.connect(this.lfo_vca)
		this.lfo_vca.connect(this.vca)
		this.lfo_vca_constant.connect(this.lfo_vca.factor)
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
		this.cutoffSig = new Tone.Signal(1000)
		this.cutoffSig.connect(this.vcf.frequency)
		this.cutoffCV = new Tone.Signal()
		this.cutoffCV.connect(this.vcf.frequency)
		this.keyTracking = new Tone.Multiply(.1)
		this.frequency.connect(this.keyTracking)
		this.keyTracking.connect(this.vcf.frequency)
		this.vcf_env = new Tone.Envelope()
		this.vcf_env_depth = new Tone.Multiply()
		this.vcf_env.connect(this.vcf_env_depth)
		this.vcf_env_depth.connect(this.vcf.frequency)

		this.lfo = new Tone.Oscillator(.5).start()
		this.vca_constant = new Tone.Signal(1)
		this.amp_lfo_depth = new Tone.Multiply(0)
		this.lfo.connect(this.amp_lfo_depth)
		this.amp_lfo_depth.connect(this.lfo_vca.factor)
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

  //TRIGGER METHODS
  triggerAttack = function(val, vel=100, time=null){
  	let freq = Tone.Midi(val).toFrequency()
  	vel = vel/127
    if(time){
      this.frequency.setValueAtTime(freq,time)
      this.env.triggerAttack(time)
      this.vcf_env.triggerAttack(time)
      this.velocity.setValueAtTime(Math.pow(vel,2),time)
    } else{
      this.frequency.value = freq
      this.env.triggerAttack()
      this.vcf_env.triggerAttack()
      this.velocity.value =Math.pow(vel,2) 
    }
  }
  triggerRelease = function(val, time=null){
    if(time){
      this.env.triggerRelease(time)
      this.vcf_env.triggerRelease(time)
    } else{
      this.env.triggerRelease()
      this.vcf_env.triggerRelease()
    }
  }
  triggerAttackRelease = function(val, vel=100, dur=0.01, time=null){
    val = Tone.Midi(val).toFrequency()
    vel = vel/127
    if(time){
      this.frequency.setValueAtTime(val,time)
      this.env.triggerAttackRelease(dur,time)
      this.vcf_env.triggerAttackRelease(dur,time)
      this.velocity.setValueAtTime(Math.pow(vel,2),time)
    } else{
      this.frequency.value = val
      this.env.triggerAttackRelease(dur)
      this.vcf_env.triggerAttackRelease(dur)
      this.velocity.value =Math.pow(vel,2) 
    }
  }//attackRelease

  initGui(gui, x=10,	y=10){
  	// if(this.gui_elements.length > 0){
  	// 	console.log("initGui is called when a synth is created.\n Call synth.showGui() to see it.")
  	// 	return;
  	// }
  	this.gui = gui
  	this.x = x
  	this.y = y
  	this.vco_mix = this.createKnob('vco_mix', 5, 5, 0, 1, 0.75, [200,50,0],x=>this.crossfade.fade.value= x);
  	this.detune = this.createKnob('detune', 15, 5, 1, 2, 0.75, [200,50,0],x=>this.detune_scalar.factor.value = x);
  	this.cutoff = this.createKnob('cutoff', 25, 5, 0, 10000, 0.75, [200,50,0],x=>this.cutoffSig.value = x);
  	this.vcf_env_knob = this.createKnob('vcf env', 35, 5, 0, 5000, 0.75, [200,50,0],x=>this.vcf_env_depth.factor.value = x);
  	this.vcf_Q_knob = this.createKnob('Q', 45, 5, 0, 20, 0.75, [200,50,0],x=>this.vcf.Q.value = x);
  	this.keyTracking_knob = this.createKnob('key vcf', 55, 5, 0, 1, 0.75, [200,50,0],x=>this.keyTracking.factor.value = x);
  	//this.highpass_knob = this.createKnob('hpf', 65, 5, 10, 3000, 0.75, [200,50,0],x=>this.setHighpass(x);
  	this.attack_knob = this.createKnob('a', 5, 45, 0.005, .5, 0.5, [200,50,0],x=>this.env.attack = x);
  	this.decay_knob = this.createKnob('d', 15, 45, 0.01, 10, 0.5, [200,50,0],x=>this.env.decay = x);
  	this.sustain_knob = this.createKnob('s', 25, 45, 0, 1, 0.5, [200,50,0],x=>this.env.sustain = x);
  	this.release_knob = this.createKnob('r', 35, 45, 0, 20, 0.5, [200,50,0],x=>this.env.release = x);
  	this.vcf_attack_knob = this.createKnob('a', 5, 75, 0.005, .5, 0.5, [200,50,0],x=>this.vcf_env.attack = x);
  	this.vcf_decay_knob = this.createKnob('d', 15, 75, 0.01, 10, 0.5, [200,50,0],x=>this.vcf_env.decay = x);
  	this.vcf_sustain_knob = this.createKnob('s', 25, 75, 0, 1, 0.5, [200,50,0],x=>this.vcf_env.sustain = x);
  	this.vcf_release_knob = this.createKnob('r', 35, 75 , 0, 20, 0.5, [200,50,0],x=>this.vcf_env.release = x);
  	this.lfo_freq_knob = this.createKnob('lfo', 45, 65, 0, 20, 0.5, [200,50,0],x=>this.lfo.frequency.value = x);
  	this.lfo_vibrato = this.createKnob('vibrato', 55, 65, 0, .1, 0.5, [200,50,0],x=>this.pitch_lfo_depth.factor.value = x);
  	this.lfo_tremolo = this.createKnob('tremolo', 65, 65, 0, 1, 0.5, [200,50,0],x=>this.amp_lfo_depth.factor.value = x);
  	
  	//this.pan_knob = this.createKnob('pan', 75, 5, 0, 1, 0.5, [200,50,0],x=>{this.panner.pan.value = Math.sin(i/8*Math.PI*2)*x});


  	this.gui_elements = [ this.vco_mix, this.detune, this.cutoff, this.vcf_env_knob, this.vcf_Q_knob, this.keyTracking_knob, 
  		//this.highpass_knob, 
  		this.attack_knob, this.decay_knob, this.sustain_knob, this.release_knob, this.vcf_attack_knob, this.vcf_decay_knob, this.vcf_sustain_knob, this.vcf_release_knob, this.lfo_freq_knob, this.lfo_vibrato, this.lfo_tremolo
  		//, this.pan_knob
  		];
  }
}

/********************
 * polyphony
 ********************/

export class Daisies extends MonophonicTemplate{
  constructor(gui = null, num = 8){
		super()
    this.gui = gui
    this.name = "Daisies"
		this.presets = DaisiesPresets
    console.log(this.name, " loaded, available preset: ", this.presets)
		this.numVoices = num
		this.slop = .01

	//audio
    this.voice = []
    for(let i=0;i<this.numVoices;i++) this.voice.push(new Daisy())
    this.output = new Tone.Multiply(1/this.numVoices)
  	this.hpf = new Tone.Filter({type:'highpass', rolloff:-12, Q:0, cutoff:50})
    for(let i=0;i<this.numVoices;i++) this.voice[i].output.connect( this.hpf)
    this.hpf.connect(this.output)

    //control
    this.decay_cv = 0
		this.adsr = [.01,.5,.5,2]
		this.vcf_adsr = [.01,.5,.5,2]
		this.voiceSettings = {
					//vco
					"vco_1.type": "square",
					"vco_2.type": "square",
					"detune_scalar.factor": 0,
					"pitch_lfo_depth.factor": 0,
	        //vcf
	        "vcf_env_depth.factor": 0,
	        "keyTracking.factor": 0,
	        "panner.pan": 0,
	        "keyTracking.factor": 0,
	        //vca
	        "lfo.frequency": 0,
	        "vca_lfo_depth.factor": 0,
	        "velocity": 1
	    }
    //voice tracking
    this.prevNote = 0
    this.v = 0
    this.voiceCounter = 0
    this.activeNotes = [-1,-1,-1,-1, -1,-1,-1,-1]
    this.noteOrder = [7,0,1,2,3,4,5,6]
    this.x = 0
    this.y = 0

    if (this.gui !== null) {
        console.log('gui');
        this.hideGui();
        setTimeout(()=>{this.loadPreset('default')}, 500);
    }
  }

  /**************** 
   * trigger methods
  ***************/
  triggerAttack = function(val, vel=100, time=null){
    this.v = this.getNewVoice(val)
    if (time) this.voice[this.v].triggerAttack(val,vel,time)
		else this.voice[this.v].triggerAttack(val,vel)

  }
  triggerRelease = function(val, time=null){
    this.v = this.getActiveVoice(val)
    if(this.v < 0) return
    if(time){
      this.voice[this.v].triggerRelease(time)
    } else{
      this.voice[this.v].triggerRelease()
    }
  }
  triggerAttackRelease = function(val, vel=100, dur=0.01, time=null){
    this.v = this.getNewVoice(val)
    val = val + Math.random()*this.slop - this.slop/2
    if (time) this.voice[this.v].triggerAttackRelease(val,vel, dur, time) 
    else this.voice[this.v].triggerAttackRelease(val,vel,dur)

    // if (time) {
    //   this.updateVoiceParameters(this.v, { val }, time);
    // } else {
    //   this.updateVoiceParameters(this.v, { val });
    // }
  }//attackRelease

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

  set(param, value) {
  	//console.log('set', param, value)
  	let keys = param.split('.');
  	//console.log('keys', keys)
    for (let i = 0; i < this.numVoices; i++) {
      let target = this.voice[i];

      for (let j = 0; j < keys.length - 1; j++) {
        if (target[keys[j]] === undefined) {
          console.error(`Parameter ${keys[j]} does not exist on voice ${i}`);
          return;
        }
        target = target[keys[j]];
      }
      
      const lastKey = keys[keys.length - 1];
      
      if (target[lastKey] !== undefined) {
        if (target[lastKey]?.value !== undefined) {
          target[lastKey].value = value;
        } else {
          target[lastKey] = value;
        }
      } else {
        console.error(`Parameter ${lastKey} does not exist on voice ${i}`);
      }
    }//for
  }//set

  getNewVoice(num) {

	  //if note is already playing free it
	  for (let i = 0; i < this.numVoices; i++) {
	  	if(this.activeNotes[i] == num ) this.triggerRelease(num)	
	  }
		//look for free voice
		let envStates = []
	  for (let i = 0; i < this.numVoices; i++) {
	  	const curEnv = this.voice[i].env.value
	  	if(curEnv == 0){
	  		//console.log('new voice ', i)
        return i;
	  	}
	  	envStates.push( curEnv )

    let assignedVoice = envStates.reduce((minIndex, currentValue, currentIndex, array) => {
        return currentValue < array[minIndex] ? currentIndex : minIndex;
    }, 0);
    //console.log('stolen ', assignedVoice, envStates)

    this.voice[assignedVoice].env.cancel()
    //console.log('stole voice ', assignedVoice)
    return assignedVoice;
  }
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

  setHighpass = function(val){this.hpf.frequency.value = val }

  setVcoMix = function(val){
		for(let i=0;i<this.numVoices;i++) {
			this.voice[i].crossfade.fade.value = val 
		}
  }

  //envelopes
	//moved setADSR and setFilterADSR to parent class
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
  initGui(gui, x=10,	y=10){
  	if(this.gui_elements.length > 0){
  		console.log("initGui is called when a synth is created.\n Call synth.showGui() to see it.")
  		return;
  	}
  	this.gui = gui
  	this.x = x
  	this.y = y
  	this.vco_mix = this.createKnob('vco_mix', 5, 5, 0, 1, 0.75, [200,50,0],x=>this.set('crossfade.fade',x));
  	this.detune = this.createKnob('detune', 15, 5, 1, 2, 0.75, [200,50,0],x=>this.set('detune_scalar',x));
  	this.cutoff = this.createKnob('cutoff', 25, 5, 0, 10000, 0.75, [200,50,0],x=>this.set('cutoffSig',x));
  	this.vcf_env_knob = this.createKnob('vcf env', 35, 5, 0, 5000, 0.75, [200,50,0],x=>this.set('vcf_env_depth.factor',x));
  	this.vcf_Q_knob = this.createKnob('Q', 45, 5, 0, 20, 0.75, [200,50,0],x=>this.set('vcf.Q',x));
  	this.keyTracking_knob = this.createKnob('key vcf', 55, 5, 0, 1, 0.75, [200,50,0],x=>this.set('keyTracking.factor',x));
  	this.highpass_knob = this.createKnob('hpf', 65, 5, 10, 3000, 0.75, [200,50,0],x=>this.setHighpass(x));
  	this.attack_knob = this.createKnob('a', 5, 45, 0.005, .5, 0.5, [200,50,0],x=>this.set('env.attack',x));
  	this.decay_knob = this.createKnob('d', 15, 45, 0.01, 10, 0.5, [200,50,0],x=>this.set('env.decay',x));
  	this.sustain_knob = this.createKnob('s', 25, 45, 0, 1, 0.5, [200,50,0],x=>this.set('env.sustain',x));
  	this.release_knob = this.createKnob('r', 35, 45, 0, 20, 0.5, [200,50,0],x=>this.set('env.release',x));
  	this.vcf_attack_knob = this.createKnob('a', 5, 75, 0.005, .5, 0.5, [200,50,0],x=>this.set('vcf_env.attack',x));
  	this.vcf_decay_knob = this.createKnob('d', 15, 75, 0.01, 10, 0.5, [200,50,0],x=>this.set('vcf_env.decay',x));
  	this.vcf_sustain_knob = this.createKnob('s', 25, 75, 0, 1, 0.5, [200,50,0],x=>this.set('vcf_env.sustain',x));
  	this.vcf_release_knob = this.createKnob('r', 35, 75 , 0, 20, 0.5, [200,50,0],x=>this.set('vcf_env.release',x));
  	this.lfo_freq_knob = this.createKnob('lfo', 45, 65, 0, 20, 0.5, [200,50,0],x=>this.set('lfo.frequency',x));
  	this.lfo_vibrato = this.createKnob('vibrato', 55, 65, 0, .1, 0.5, [200,50,0],x=>this.set('pitch_lfo_depth.factor',x));
  	this.lfo_tremolo = this.createKnob('tremolo', 65, 65, 0, 1, 0.5, [200,50,0],x=>this.set('amp_lfo_depth.factor',x));
  	
  	this.pan_knob = this.createKnob('pan', 75, 5, 0, 1, 0.5, [200,50,0],x=>{for(let i=0;i<this.numVoices;i++) this.voice[i].panner.pan.value = Math.sin(i/this.numVoices*Math.PI*2)*x});


  	this.gui_elements = [ this.vco_mix, this.detune, this.cutoff, this.vcf_env_knob, this.vcf_Q_knob, this.keyTracking_knob, this.highpass_knob, this.attack_knob, this.decay_knob, this.sustain_knob, this.release_knob, this.vcf_attack_knob, this.vcf_decay_knob, this.vcf_sustain_knob, this.vcf_release_knob, this.lfo_freq_knob, this.lfo_vibrato, this.lfo_tremolo, this.pan_knob];
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

  get() {
	  // Store the properties as strings so we can print both the name and the value
	  const props = [
	    "this.voice[0].frequency.value",
	    "this.voice[0].detune_scalar.value",
	    "this.voice[0].crossfade.fade.value",
	    "this.voice[0].cutoff.value",
	    "this.voice[0].vcf.Q.value",
	    "this.voice[0].vcf_env_depth.factor.value",
	    "this.voice[0].velocity_depth.factor.value",
	    "this.voice[0].keyTracking.factor.value",
	    "this.voice[0].vca_lfo_depth.factor.value",
	    "this.voice[0].pitch_lfo_depth.factor.value",
	    "this.voice[0].pwm_lfo_depth.factor.value",
	    "this.voice[0].vcf.Q.value",
	    "this.voice[0].vcf_env_depth.factor.value",
	    "this.voice[0].lfo.frequency.value",
	    "this.voice[0].keyTracking.factor.value"
	  ];

	  // Iterate over the props array
	  for (let prop of props) {
	    // Extract and print the property name, removing 'this.voice[0].'
	    const propName = prop.replace("this.voice[0].", "");
	    
	    // Use eval to access the actual value of the property
	    const propValue = eval(prop);

	    // Print the property name and value
	    console.log(`${propName}: ${propValue}`);
	  }
	}

}

// class audioElement{
// 	constructor(toneCOnstrucor,tone_params,gui_type,gui_params){
// 		this.main = new 	ToneConstructor()
// 		this.mainCV = new Tone.Multiply().connect(this.main.frequency)
// 		this.secondCV = new Tone.Multiply().connect(this.main.frequency)
// 		this.threeCV = new Tone.Multiply().connect(this.main.frequency)

// 		createtoneelement
// 		createguielement
// 		linkelements		
// 	}
// }

//let i = new audioElement('Tone.Filter',{frequency:100},'gui.Knob',{x,y,min,max})