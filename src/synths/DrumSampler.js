/**
 * 
 * player -> vca -> comp -> distortion -> output
 * 
 * each voice has its own env and vca
 * 
 * hihat simulates open and closed:
 * 
 * hihat -> hatVca (for open/closed) -> hihat_vca (overall level) -> comp, etc.
 * openHatEnv -> openHatChoke(vca) -> hatVca.factor
 * closedHatEnv -> hatVca.factor
 * 
 * kick has a dry output pre-comp and distortion
 * 
 * 
 * 
 * 
 * 
 */

import * as Tone from 'tone';
import { DrumTemplate } from './DrumTemplate';
import DrumSamplerPresets from './synthPresets/DrumSamplerPresets.json';


export class DrumSampler extends DrumTemplate{
  constructor(kit = "acoustic", gui=null) {
    super()
    this.gui = gui
    this.gui = gui
    this.presets = DrumSamplerPresets
    this.name = "DrumSampler"
    this.kit = kit
    //
    this.closedHatEnv = new Tone.Envelope({attack:0.0,decay:.5,sustain:0,release:.4})
    this.openHatEnv = new Tone.Envelope({attack:0.0,decay:.01,sustain:1,release:.4})
    this.hatVca = new Tone.Multiply()
    this.openHatChoke = new Tone.Multiply()
    this.comp = new Tone.Compressor(-20,4)
    this.distortion = new Tone.Distortion(.5)
    this.output = new Tone.Multiply(0.8);
    this.dry_kick = new Tone.Multiply(0.5)
    //
    this.kick_vca = new Tone.Multiply(1)
    this.kick = new Tone.Player().connect(this.kick_vca)
    this.snare_vca = new Tone.Multiply(1)
    this.snare = new Tone.Player().connect(this.snare_vca)
    this.hihat_vca = new Tone.Multiply(.9)
    this.hihat = new Tone.Player().connect(this.hihat_vca)
    this.tom_vca = new Tone.Multiply(.8)
    this.tom1 = new Tone.Player().connect(this.tom_vca)
    this.tom2 = new Tone.Player().connect(this.tom_vca)
    this.tom3 = new Tone.Player().connect(this.tom_vca)
    //
    this.kick_vca.connect(this.comp)
    this.snare_vca.connect(this.comp)
    this.hihat_vca.connect(this.hatVca)
    this.tom_vca.connect(this.comp)
    //
    this.kick.connect(this.dry_kick)
    this.comp.connect(this.distortion)
    this.distortion.connect(this.output)
    this.closedHatEnv.connect(this.hatVca.factor)
    this.openHatEnv.connect(this.openHatChoke)
    this.openHatChoke.connect(this.hatVca.factor)
    this.hatVca.connect(this.comp)
    this.dry_kick.connect(this.output)
    //
    this.loadSamples(this.kit)
    this.index = 0;
    this.subdivision = '8n'
    this.hatDecay = .05
    this.loop = new Tone.Loop(time => {},this.subdivision)

    this.initGui()
    this.hideGui()
    this.loadPreset('default')

    if (this.gui !== null) {
            this.initGui()
            this.hideGui();
            this.loadPreset('default');
        }
  }//constructor
  loadSamples(kit){
    this.kit = kit
    this.drumFolders = {
      "4OP-FM": "4OP-FM", "FM": "4OP-FM",
      "Bongos": "Bongos", "Bongo": "Bongos",
      "CR78": "CR78", 
      "KPR77": "KPR77",
      "Kit3": "Kit3", 
      "Kit8": "Kit8", 
      "LINN": "LINN", 
      "R8": "R8",
      "Stark": "Stark", 
      "Techno": "Techno", 
      "TheCheebacabra1": "TheCheebacabra1", "Cheese1": "TheCheebacabra1",
      "TheCheebacabra2": "TheCheebacabra2",  "Cheese2": "TheCheebacabra2",
      "acoustic-kit": "acoustic-kit", "acoustic": "acoustic-kit",
      "breakbeat13": "breakbeat13", 
      "breakbeat8": "breakbeat8", 
      "breakbeat9": "breakbeat9",
    }

     if (this.kit in this.drumFolders) {
      console.log(`Drumsampler loading ${this.kit}`);
    } else {
      console.error(`The kit "${this.kit}" is not available.`);
      return
    }

    this.baseUrl = "https://tonejs.github.io/audio/drum-samples/".concat(this.drumFolders[this.kit]);
    this.urls = {
      "C3": "/kick.mp3",
      "D3": "/snare.mp3",
      "F#3": "/hihat.mp3",
      "F3": "/tom1.mp3",
      "G3": "/tom2.mp3",
      "A3": "/tom3.mp3"
    }
    this.kick.load( this.baseUrl.concat("/kick.mp3") )
    this.snare.load( this.baseUrl.concat("/snare.mp3") )
    this.hihat.load( this.baseUrl.concat("/hihat.mp3") )
    this.tom1.load( this.baseUrl.concat("/tom1.mp3") )
    this.tom2.load( this.baseUrl.concat("/tom2.mp3") )
    this.tom3.load( this.baseUrl.concat("/tom3.mp3") )
  }
  //
  trigger(voice, vel, time) {
    if (this.kick.loaded) {
      if(1){
        switch (voice) {
          case "kick": this.triggerVoice( this.kick,  vel, time ); break;
          case "snare": this.triggerVoice( this.snare, vel, time ); break;
          case "hihat": this.triggerVoice( this.hihat, vel, time ); break;
          case "tom1": this.triggerVoice( this.tom1, vel, time ); break;
          case "tom2": this.triggerVoice( this.tom2, vel, time ); break;
          case "tom3": this.triggerVoice( this.tom3, vel, time ); break;
          default: console.error(`Unknown voice: ${voice}`); break;
        }
      }
    } else {
      console.error("Sampler is not loaded yet.");
    }
  }
  
  sequence(arr, subdivision) {
    arr = arr.replace(/\s/g, ""); // Remove all whitespace

    // Initialize arrays for each drum voice
    if (subdivision) this.subdivision = subdivision;

    //note: we have changed approaches
    //the sequence is not split up at this point
    //instead, it is parsed in the loop
    this.seq = {
        "original": [],
        "kick": [],
        "snare": [],
        "hihat": [],
        "tom1": [],
        "tom2": [],
        "tom3": [],
        "openHat": []
    };
    this.seq.original = arr
    //replace the expression  *@4 with ****
    this.seq.original = this.seq.original.replace(/(.)@(\d+)/g, (match, p1, p2) => {
        // p1 is the character before the @
        // p2 is the number after the @, so repeat p1 p2 times
        return p1.repeat(Number(p2));
    });

    //split original string into an array of strings
    //items within [] are one entry of the array
    const regex = /\[.*?\]|./g;
    this.seq.original.match(regex);
    this.seq.original = this.seq.original.match(regex);

    //console.log(this.seq.original)

    // Create a Tone.Loop
    if (this.loop.state === "stopped") {
        this.loop = new Tone.Loop(time => {
            this.index = Math.floor(Tone.Transport.ticks / Tone.Time(this.subdivision).toTicks());

            let curBeat = this.seq.original[this.index%this.seq.original.length];

            //handle when a beat contains more than one element
            if (curBeat.length>1) {
              if (curBeat.charAt(0) === '[' && curBeat.charAt(curBeat.length - 1) === ']') {
              // Remove the brackets and split by the comma
                curBeat =curBeat.slice(1, -1).split(',');
              }

            curBeat.forEach(arr => {
                const length = arr.length;
                for (let i = 0; i < length; i++) {
                    const val = arr[i];
                    //console.log(this.index%8, arr,val)
                    this.triggerDrum(val, time + i * (Tone.Time(this.subdivision) / length));
                }
            });
          } else { //for beats with only one element
              this.triggerDrum(curBeat, time);
          }
        }, this.subdivision).start(0);

        // Start the Transport
        Tone.Transport.start();
    }
}
  triggerDrum(val, time){
    console.log(val)
    switch(val){
      case '.': break;
      case '0': this.triggerVoice(this.kick,1,time); break; //just because. . . .
      case 'O': this.triggerVoice(this.kick,1,time); break;
      case 'o': this.triggerVoice(this.kick,.5,time); break;
      case 'X': this.triggerVoice(this.snare,1,time); break;
      case 'x': this.triggerVoice(this.snare,.5,time); break;
      case '*': this.triggerVoice(this.hihat,.75,time); break;
      case '^': this.triggerVoice("openHat",1,time); break;
      case '1': this.triggerVoice(this.tom1,1,time); break;
      case '2': this.triggerVoice(this.tom2,1,time); break;
      case '3': this.triggerVoice(this.tom3,1,time); break;
      default: console.log('triggerDrum(), no matching drum voice ', val, '\n')
    }   
  }
  triggerVoice(voice, amplitude, time){
    if( voice === this.hihat) {
      this.closedHatEnv.triggerAttackRelease(.001,time)
      this.openHatChoke.factor.setValueAtTime(0, time)
    }
    else if( voice === "openHat") {
      voice = this.hihat
      this.openHatChoke.factor.setValueAtTime(1, time)
      this.openHatEnv.triggerAttackRelease(10,time)
    }
    if( voice.state === "started" ) voice.stop(time)
    voice.volume.setValueAtTime( Tone.gainToDb(amplitude), time)
    voice.start( time )
  }

  stop(){ this.loop.stop()}

  //drawBeat does'nt really work but is an attempt to draw the 
    //sequence to a canvas using html
  drawBeat (canvasId) {
        const verticalOrder = ['^', '*', '1', '2', '3', 'x', 'X', 'o', 'O'];
        const verticalSpacing = 20; // Vertical spacing between each row
        const horizontalSpacing = 40; // Horizontal spacing between each character
        const canvas = document.getElementById(canvasId);
        const beat = this.seq.original
        canvas.innerHTML = ''; // Clear any existing content

        for (let i = 0; i < beat.length; i++) {
            const element = beat[i];
            const verticalIndex = verticalOrder.indexOf(element);

            if (verticalIndex !== -1) {
                const yPos = verticalIndex * verticalSpacing; // Calculate vertical position
                const xPos = i * horizontalSpacing; // Calculate horizontal position

                const beatElement = document.createElement('div');
                beatElement.className = 'beat';
                beatElement.style.transform = `translate(${xPos}px, ${yPos}px)`;
                beatElement.textContent = element;

                canvas.appendChild(beatElement);
            }
        }
      }

  initGui(x = 10, y = 10) {
      // Set the base positions
      this.x = x;
      this.y = y;
      
      this.enables_array = [];
      this.values_array = [];

      // Create GUI elements for VCA controls (factor controls)
      const kick_vca_knob = this.createKnob('Kick', 0, 40, 0, 1, .5, [200, 50, 0], x => this.kick_vca.factor.value = x);
      const snare_vca_knob = this.createKnob('Snare', 0, 20, 0, 1, .5, [200, 50, 0], x => this.snare_vca.factor.value = x);
      const hat_vca_knob = this.createKnob('Hihat', 0, 0, 0, 1, .5, [200, 50, 0], x => this.hihat_vca.factor.value = x);
      const toms_vca_knob = this.createKnob('Toms', 0, 60, 0, 1, .5, [200, 50, 0], x => this.tom_vca.factor.value = x);
      const output_knob = this.createKnob('Output', 80, 60, 0, 4, 1, [200, 50, 0], x => this.output.factor.value = x);
      const dry_kick_knob = this.createKnob('Dry Kick', 40, 40, 0, 1, .4, [200, 50, 0], x => this.dry_kick.factor.value = x);

      // Create GUI elements for Playback Rate controls
      const kick_rate_knob = this.createKnob('Kick Rate', 20, 40, 0., 2, .4, [200, 50, 0], x => this.kick.playbackRate = x);
      const snare_rate_knob = this.createKnob('Snare Rate', 20, 20, 0., 2, .4, [200, 50, 0], x => this.snare.playbackRate = x);
      const hat_rate_knob = this.createKnob('Hihat Rate', 20, 0, 0., 2, .4, [200, 50, 0], x => this.hihat.playbackRate = x);
      const tom1_rate_knob = this.createKnob('Tom1 Rate', 20, 60, 0., 2, .4, [200, 50, 0], x => this.tom1.playbackRate = x);
      const tom2_rate_knob = this.createKnob('Tom2 Rate', 30, 60, 0., 2, .4, [200, 50, 0], x => this.tom2.playbackRate = x);
      const tom3_rate_knob = this.createKnob('Tom3 Rate', 40, 60, 0., 2, .4, [200, 50, 0], x => this.tom3.playbackRate = x);

      // Create GUI elements for Compressor controls
      const comp_threshold_knob = this.createKnob('Threshold', 60, 20, -60, -5, .5, [200, 50, 0], x => this.comp.threshold.value = x);
      const comp_ratio_knob = this.createKnob('Ratio', 60, 40, 1, 20, .5, [200, 50, 0], x => this.comp.ratio.value = x);

      // Create GUI element for Distortion Amount control
      const distort_knob = this.createKnob('Distort', 60, 60, 0, 1, .5, [200, 50, 0], x => this.distortion.distortion = x);

      // Create GUI element for Hat Decay
      const hihat_decay_knob = this.createKnob('Hat Decay', 40, 0, 0.01, 1, .75, [200, 50, 0], x => this.closedHatEnv.release = x);
  
      const kit_dropdown = this.gui.Dropdown({
        label: 'kit', dropdownOptions: [ "LINN", "Techno", "TheCheebacabra1", "TheCheebacabra2", "acoustic-kit", "breakbeat13", "breakbeat8", "breakbeat9", "4OP-FM", "Bongos", "CR78", "KPR77", "Kit3", "Kit8"],
        // (()=>{
        //   const valuesArray = Object.values(this.drumFolders)
        //   const uniqueValuesArray = [...new Set(valuesArray)];
        //   return uniqueValuesArray})(),
        x: 80, y:10, size:15,
        callback:(x)=>{this.loadSamples(x)}
      })

      // Add all elements to an array for hiding/showing gui
    this.gui_elements = [
        kick_vca_knob, 
        snare_vca_knob, 
        hat_vca_knob, 
        toms_vca_knob, 
        output_knob, 
        dry_kick_knob,
        kick_rate_knob, 
        snare_rate_knob, 
        hat_rate_knob, 
        tom1_rate_knob, 
        tom2_rate_knob, 
        tom3_rate_knob,
        comp_threshold_knob, 
        comp_ratio_knob,
        distort_knob, 
        hihat_decay_knob,
        kit_dropdown
    ];
  }


  createKnob(_label, _x, _y, _min, _max, _size, _accentColor, callback) {
      //console.log(_label)
      return this.gui.Knob({
        label:_label, min:_min, max:_max, size:_size, accentColor:_accentColor,
        x: _x + this.x, y: _y + this.y,
        callback: callback,
        curve: 1, // Adjust as needed
        border: 4, // Adjust as needed
        showLabel: 1, showValue: 1
      });
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