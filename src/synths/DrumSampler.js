import * as Tone from 'tone';

export class DrumSampler {
  constructor(kit = "acoustic") {
    this.kit = kit
    this.hatEnv = new Tone.Envelope({attack:0.0,decay:.01,sustain:1,release:.4})
    this.hatVca = new Tone.Multiply()
    this.comp = new Tone.Compressor(-20,4)
    this.distortion = new Tone.Distortion(.5)
    this.output = new Tone.Multiply(0.8);
    this.dry_kick = new Tone.Multiply(0.5)
    //
    this.kick = new Tone.Player().connect(this.comp)
    this.snare = new Tone.Player().connect(this.comp)
    this.hihat = new Tone.Player().connect(this.hatVca)
    this.tom1 = new Tone.Player().connect(this.comp)
    this.tom2 = new Tone.Player().connect(this.comp)
    this.tom3 = new Tone.Player().connect(this.comp)
    //
    this.kick.connect(this.dry_kick)
    this.comp.connect(this.distortion)
    this.distortion.connect(this.output)
    this.hatEnv.connect(this.hatVca.factor)
    this.hatVca.connect(this.comp)
    this.dry_kick.connect(this.output)
    //
    //
    this.loadSamples(this.kit)
    this.index = 0;
    this.subdivision = '4n'
    this.hatDecay = .05
    this.loop = new Tone.Loop(time => {},this.subdivision)
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

  triggerVoice(voice, amplitude, time){
    if( voice == this.hihat) this.hatEnv.triggerAttackRelease(this.hatDecay,time)
    else if( voice === "openHat") {
      voice = this.hihat
      this.hatEnv.triggerAttackRelease(10,time)
    }
    if( voice.state == "started" ) voice.stop(time)
  	voice.volume.value = Tone.gainToDb(amplitude)
    voice.start( time )
  }

  /**
   * Sequences the drum voices based on the input string or object, subdivision, and the initial sequence.
   * Rewrites the current sequence by default.
   * @param {string|object} input Input string or object to append to the initial sequence of the drum voices.
   * @param {string} subdivision Subdivision of the sequence.
   * @param {object} init Initial sequence of the drum voices. Empty by default.
   * @returns 
   */
  sequence(input, subdivision, init={
    "kick" : [],
    "snare" : [],
    "hihat" : [],
    "tom1" : [],
    "tom2" : [],
    "tom3" : [],
    "openHat" : []
  }) {
    // Initialize arrays for each drum voice
    this.seq = init
    if(subdivision) this.subdivision = subdivision

    // String input parsing
    if (typeof input === "string") {
      // Remove all spaces from the input string
      let str_arr = input.replaceAll(" ","")

      // Parse the input string
      for (this.i=0; this.i<str_arr.length; this.i++) {
        if(str_arr[this.i] === 'O') {this.seq['kick'].push(1)} else if(str_arr[this.i] === 'o') {this.seq['kick'].push(.5)} else this.seq['kick'].push(0)
        if(str_arr[this.i] === 'X') {this.seq['snare'].push(1)}  else if(str_arr[this.i] === 'x') {this.seq['snare'].push(.5)} else this.seq['snare'].push(0)
        if(str_arr[this.i] === '*') {this.seq['hihat'].push(1)} else this.seq['hihat'].push(0)
        if(str_arr[this.i] === '1') {this.seq['tom1'].push(1)} else this.seq['tom1'].push(0)
        if(str_arr[this.i] === '2') {this.seq['tom2'].push(1)} else this.seq['tom2'].push(0)
        if(str_arr[this.i] === '3') {this.seq['tom3'].push(1)} else this.seq['tom3'].push(0)
        if(str_arr[this.i] === '^') {this.seq['openHat'].push(1)} else this.seq['openHat'].push(0)
      }
    } else if (typeof input === "object") {
      // Object input parsing
      
      // get the input length
      let len = 0
      for (const [name, arr] of Object.entries(input)) {
        if (name in this.seq) {
          len = arr.length
          break;
        }
      }

      // append the input to the sequence
      for (const [name, arr] of Object.entries(this.seq)) {
        if (name in input) {
          this.seq[name].push.apply(arr, input[name]);
        } else {
          this.seq[name].push.apply(arr, Array(len).fill(0));
        }
      }
    } else {
      console.error("Invalid input type. Please provide a string or an object.")
      return;
    }
    
    // Create a Tone.Loop if stopped
    if( this.loop.state === "stopped"){
      this.loop = new Tone.Loop(time => {
        this.index = Math.floor(Tone.Transport.ticks / Tone.Time(this.subdivision).toTicks());

        // Iterate over the sequence and trigger the voices
        for (const [name, arr] of Object.entries(this.seq)){
          if (arr) {
            const val = arr[this.index % arr.length]
            if( name === "kick" && val > 0) this.triggerVoice( this.kick, val, time)
            else if( name === "snare" && val > 0 ) this.triggerVoice( this.snare, val, time)
            else if( name === "hihat"&& val > 0 ) this.triggerVoice( this.hihat, val, time)
            else if( name === "tom1" && val > 0) this.triggerVoice( this.tom1, val, time)
            else if( name === "tom2" && val > 0) this.triggerVoice( this.tom2, val, time)
            else if( name === "tom3" && val > 0) this.triggerVoice( this.tom3, val, time)
            else if( name === "openHat" && val > 0) this.triggerVoice( "openHat", val, time)
          }
        }
      }, this.subdivision).start(0);

      // Start the Transport
      Tone.Transport.start();
    }

    console.log(this.seq)
  }

  /**
   * Updates the current sequence with the input object. Doesn't rewrite the non-provided voices patterns.
   * @param {object} input  Object input to update the current sequence.
   * @returns 
   */
  update(input) {
    if (typeof input !== "object") {
      console.error("Invalid input type. Can only update seq using objects.")
      return;
    }

    let seq = this.seq
    // update the sequence from input
    for (const [name, arr] of Object.entries(input)) {
      if (name in this.seq) {
        seq[name] = arr
      }
    }
    this.seq = seq
    console.log(this.seq)
  }

  /**
   * Appends the input to the current sequence
   * @param {string|object} input Input string or object to append to the current sequence.
   */
  append(input){
    this.sequence(input, null, this.seq);
  }

  stop(){ this.loop.stop()}

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