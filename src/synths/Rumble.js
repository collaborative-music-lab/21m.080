/*
Rumble

Three oscillator monosynth
* 3 vcos->mixer->gain->waveShaper->vcf->vca->output
* main pitch input is .frequency.value

methods:
- connect
setADSR(a,d,s,r)
setFilterADSR(a,d,s,r)
setDetune(a,b,c)
setPwmDepth(a,b,c)
setGain(a,b,c)

properties set directly:
frequency.value
velocity.value
cutoff_cv.value
sub_freq.factor
sub_gain.factor
clip.factor (into waveShaper)
vca_lvl.value
cutoff.value
vcf_env_depth.factor
keyTracking.factor
lfo.frequency

properties set using methods:
vco_freq_1, vco_freq_2, vco_freq_3
vco_gain_1, vco_gain_2, vco_gain_3
env and vcf_env ADSR
lfo_pwm_1, lfo_pwm_2, lfo_pwm_3
gain (into waveShaper)

 
*/
import p5 from 'p5';
import * as Tone from 'tone';

export class Rumble {
  constructor(gui = null){
    this.gui = gui
    // Initialize the main frequency control
    this.frequency = new Tone.Signal();

    // Frequency ratios for VCOs
    this.vco_freq_1 = new Tone.Multiply(1);
    this.vco_freq_2 = new Tone.Multiply(1);
    this.vco_freq_3 = new Tone.Multiply(1);
    this.frequency.connect(this.vco_freq_1);
    this.frequency.connect(this.vco_freq_2);
    this.frequency.connect(this.vco_freq_3);

    // VCOs
    this.vco_1 = new Tone.OmniOscillator({type:'pulse'}).start();
    this.vco_2 = new Tone.OmniOscillator({type:'pulse'}).start();
    this.vco_3 = new Tone.OmniOscillator({type:'pulse'}).start();
    this.vco_freq_1.connect(this.vco_1.frequency);
    this.vco_freq_2.connect(this.vco_2.frequency);
    this.vco_freq_3.connect(this.vco_3.frequency);
    this.sub = new Tone.Oscillator().start()
    this.sub_freq = new Tone.Multiply(0.5)
    this.frequency.connect(this.sub_freq)
    this.sub_freq.connect(this.sub.frequency)

    // Mixer
    this.vco_gain_1 = new Tone.Multiply(.25);
    this.vco_gain_2 = new Tone.Multiply(.25);
    this.vco_gain_3 = new Tone.Multiply(.25);
    this.vco_1.connect(this.vco_gain_1);
    this.vco_2.connect(this.vco_gain_2);
    this.vco_3.connect(this.vco_gain_3);
    this.sub_gain = new Tone.Multiply(0)
    this.sub.connect(this.sub_gain)

    this.vcf = new Tone.Filter({type:"lowpass", rolloff:-24});
    this.vco_gain_1.connect(this.vcf);
    this.vco_gain_2.connect(this.vcf);
    this.vco_gain_3.connect(this.vcf);
    this.sub_gain.connect(this.vcf)

    //waveShaper
    this.clip = new Tone.Multiply(0.125)
    // this.vco_gain_1.connect(this.clip);
    // this.vco_gain_2.connect(this.clip);
    // this.vco_gain_3.connect(this.clip);
    // this.sub_gain.connect(this.clip)
    this.waveShaper = new Tone.WaveShaper((x)=>{
      return Math.sin(x*Math.PI*2)
    	//return Math.tanh(x*8)
    })
    this.waveShaper.oversample = "4x"
    this.vcf.connect(this.clip)
    this.clip.connect(this.waveShaper)

    // VCF, VCA, output
    // this.vcf = new Tone.Filter({rolloff:-24});
    this.vca = new Tone.Multiply()
    this.output = new Tone.Multiply(1)
    this.waveShaper.connect(this.vca)
    this.vca.connect(this.output)

    // VCA control
    this.vca_lvl = new Tone.Signal();
    this.vca_lvl.connect(this.vca.factor)
    this.env = new Tone.Envelope();
    this.env_depth = new Tone.Multiply()
    this.env.connect(this.env_depth)
    this.env_depth.connect(this.vca.factor)
    this.velocity = new Tone.Signal(1)
    this.velocity.connect(this.env_depth.factor)

    //vcf control
    this.vcf_env = new Tone.Envelope();
    this.cutoff = new Tone.Signal(1000);
    this.cutoff_cv = new Tone.Signal(0);
    this.vcf_env_depth = new Tone.Multiply(500);
    this.keyTracking = new Tone.Multiply(.1)
    this.vcf_env.connect(this.vcf_env_depth)
    this.vcf_env_depth.connect(this.vcf.frequency)
    this.cutoff.connect(this.vcf.frequency)
    this.cutoff_cv.connect(this.vcf.frequency)
    this.frequency.connect(this.keyTracking)
    this.keyTracking.connect(this.vcf.frequency)

    //LFO
    this.lfo = new Tone.Oscillator(1).start()
    this.lfo_pwm_1 = new Tone.Multiply()
    this.lfo_pwm_2 = new Tone.Multiply()
    this.lfo_pwm_3 = new Tone.Multiply()
    this.lfo.connect(this.lfo_pwm_1)
    this.lfo_pwm_1.connect(this.vco_1.width)
    this.lfo.connect(this.lfo_pwm_2)
    this.lfo_pwm_2.connect(this.vco_2.width)
    this.lfo.connect(this.lfo_pwm_3)
    this.lfo_pwm_3.connect(this.vco_3.width)
  }//constructor

  //envelopes
  triggerAttack (freq, amp, time=null){
    freq = Tone.Midi(freq).toFrequency()
    amp = amp/127
    if(time){
      this.env.triggerAttack(time)
      this.vcf_env.triggerAttack(time)
      this.frequency.setValueAtTime(freq, time)
      this.velocity.rampTo(amp,.03)
    } else{
      this.env.triggerAttack()
      this.vcf_env.triggerAttack()
      this.frequency.value = freq
      this.velocity.rampTo(amp,.03)
    }
  }
  triggerRelease (time=null){
    if(time) {
    	this.env.triggerRelease(time)
    	this.vcf_env.triggerRelease(time)
    }
    else {
      this.env.triggerRelease()
    	this.vcf_env.triggerRelease()
    }
  }
  triggerAttackRelease (freq, amp, dur=0.01, time=null){
    freq = Tone.Midi(freq).toFrequency()
    amp = amp/127
    if(time){
      this.env.triggerAttackRelease(dur, time)
      this.vcf_env.triggerAttackRelease(dur, time)
      this.frequency.setValueAtTime(freq, time)
      this.velocity.rampTo(amp,.03)
    } else{
      this.env.triggerAttackRelease(dur)
      this.vcf_env.triggerAttackRelease(dur)
      this.frequency.value = freq
      this.velocity.rampTo(amp,.03)
    }
  }//attackRelease

  //parameter setters
  setADSR(a,d,s,r){
    this.env.attack = a>0.001 ? a : 0.001
    this.env.decay = d>0.01 ? d : 0.01
    this.env.sustain = Math.abs(s)<1 ? s : 1
    this.env.release = r>0.01 ? r : 0.01
  }
  setFilterADSR(a,d,s,r){
    this.vcf_env.attack = a>0.001 ? a : 0.001
    this.vcf_env.decay = d>0.01 ? d : 0.01
    this.vcf_env.sustain = Math.abs(s)<1 ? s : 1
    this.vcf_env.release = r>0.01 ? r : 0.01
  }
  setDetune(a,b,c){
  	this.vco_freq_1.factor.value = a
  	this.vco_freq_2.factor.value = b
  	this.vco_freq_3.factor.value = c
  }
  setPwmDepth(a,b,c){
  	this.lfo_pwm_1.factor.value = a
  	this.lfo_pwm_2.factor.value = b
  	this.lfo_pwm_3.factor.value = c
  }
  setGain(a,b,c){
  	this.vco_gain_1.factor.value = a
  	this.vco_gain_2.factor.value = b
  	this.vco_gain_3.factor.value = c
  }

  //GUI
  initGui (x=2,y=2,ccolor=[200,200,0], gui = null){
    if(gui) this.gui = gui
    this.x = x
    this.y = y

     // VCO Labels
    const vco_knob_x = [15, 25, 35];
    this.vco1_label = this.createLabel('vco1', vco_knob_x[0], 5);
    this.vco2_label = this.createLabel('vco2', vco_knob_x[1], 5);
    this.vco3_label = this.createLabel('vco3', vco_knob_x[2], 5);

    // Additional Labels
    this.oct_label = this.createLabel('octave', 6, 20, 1.5);
    this.detune_label = this.createLabel('detune', 6, 50, 1.5);
    this.gain_label = this.createLabel('gain', 6, 80, 1.5);

    // VCO Knobs
    // Note: You'll need to adjust callback functions to fit your class methods for setting values
    this.vco1_oct_knob = this.gui.Knob({label:'freq', 
      x:vco_knob_x[0], y:20, min:-2, max:1, size:0.75, accentColor:[200,50,0], border:2,
      callback:(x)=>this.vco_freq_1.value = Math.pow(2,Math.floor(x)) + this.vco1_detune_knob.value  });
    this.vco1_detune_knob = this.gui.Knob({label:'detune', 
      x:vco_knob_x[0], y:50, min:-2, max:1, size:0.75, accentColor:[200,50,0], 
      callback:(x)=>this.vco_freq_1.value = x + Math.pow(2,Math.floor(this.vco1_oct_knob.value))  });
    this.vco1_gain_knob = this.gui.Knob({label:'gain', 
      x:vco_knob_x[0], y:80, min:-2, max:1, size:0.75, accentColor:[200,50,0], 
      mapto: this.vco_gain_1.factor });
    

    this.vco2_oct_knob = this.gui.Knob('freq', vco_knob_x[1], 20, -2, 1, 0.75, [200,50,0], /* callback */);
    this.vco2_detune_knob = this.gui.Knob('detune', vco_knob_x[1], 50, -.2, .2, 0.75, [50,150,100], /* callback */);
    this.vco2_gain_knob = this.gui.Knob('gain', vco_knob_x[1], 80, 0, 1, 0.75, [200,50,0] /* mapto: vco_gain_1.factor */);

    this.vco3_oct_knob = this.gui.Knob('freq', vco_knob_x[2], 20, -2, 1, 0.75, [200,50,0], /* callback */);
    this.vco3_detune_knob = this.gui.Knob('detune', vco_knob_x[2], 50, -.2, .2, 0.75, [50,150,100], /* callback */);
    this.vco3_gain_knob = this.gui.Knob('gain', vco_knob_x[2], 80, 0, 1, 0.75, [200,50,0], /* mapto: vco_gain_1.factor */);


    // VCF and VCA Knobs
    this.vcf_cutoff_knob = this.createKnob('cutoff', 55, 28, 2, 10000, 1.75, [200,0,200], /* mapto: cutoff */);
    this.vcf_res_knob = this.createKnob('Q', 50, 75, 0, 20, 0.75, [200,0,200], /* mapto: vcf.Q */);
    // Repeat for other knobs...
  
	}//gui

	createLabel(label, x, y, size = 1, border = 1, borderRadius = 0.01) {
    return this.gui.Text({
      label, x: x + this.x, y: y + this.y,
      size, border, borderRadius
    });
  }

  createKnob(label, x, y, min, max, size, accentColor, callback) {
    return this.gui.Knob({
      label, min, max, size, accentColor,
      x: x + this.x, y: y + this.y,
      callback: callback,
      showLabel: 0, showValue: 1, // Assuming these are common settings
      curve: 2, // Adjust as needed
      border: 2 // Adjust as needed
    });
  }

  connect(destination) {
    if (destination.input) {
      this.output.connect(destination.input);
    } else {
      this.output.connect(destination);
    }
  }
}
