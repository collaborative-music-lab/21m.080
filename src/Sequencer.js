import * as Tone from 'tone'
export class Sequencer{
  constructor(values = [], control = 0, custom = false, subdivision = '8n', enable = [true]){
    //console.log('enter construct')
    this.gui = null
    this.subdivision = subdivision
    this.control = control
    this.custom = custom
    this.callback = function(){}
    this.values = values
    this.enable = enable
    this.beatsPerBar = 4
    this.subdivisionsPerBeat = 4
    this.timeGrain = this.beatsPerBar * this.subdivisionsPerBeat
    this.env = new Tone.Envelope()
    this.loop =  new Tone.Loop((time) => {
//
    //Index calculations
      //console.log(Tone.Transport.position)
      this.time = time
      this.position = Tone.Transport.position.split(':');
      this.measure = parseInt(this.position[0]);
      this.beat = parseInt(this.position[1])
      this.sub = parseInt(this.position[2])
      this.interval = parseInt(this.subdivision)//parsed int from subdivision
      this.loop.interval = this.subdivision
      this.duration_scaler = this.timeGrain/this.interval
      this.index =(this.measure * this.timeGrain*(1/this.duration_scaler))+(this.beat*this.subdivisionsPerBeat*(1/this.duration_scaler))+Math.floor(this.sub/(this.timeGrain/this.interval))
      //console.log(this.index)
      this.enable_index = this.index % this.enable.length
      this.values_index = this.index % this.values.length
      //console.log(this.values_index)
  //
      if (this.gui){
        this.updateGui()
        }
      if (this.enable[this.enable_index]){
        //console.log(this.values[this.values_index])
        this.val = this.values[this.values_index]
        console.log(this.val)
        
      }
      else {
        console.log(0)
        this.val = 0
      }
      this.setCallback()
      this.callback()

      
  //
  }, this.subdivision);
  //console.log("sequencer ready")
  }
  


  start() {
    // Start the loop and the transport
    this.loop.start(0);
    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop()
  }

  initGui(gui) {
    //make your sequencer.gui here
  }

  updateGui(){
    //should use pre-existing this.gui to update based on changes made to sequence
  }

  setCallback() {
    if (this.control.name === 'Synth'){
      //console.log(true)
      this.callback = function(){
        if (this.val) {
          //console.log(this.control)
          //console.log(this.val)
          this.control.triggerAttackRelease(this.val)
        }
      }
    }

    else if (this.control.name === 'Drum'){
      this.callback = function(){
      
      }
    }

    else if (this.control.name === 'Filter'){
      this.callback = function(){
        this.control.frequency.value = this.val
      }
    }

    else if (this.control.name === 'Multiply'){
      this.callback = function(){
        this.control.factor.value = this.val
      }
    }

    else if (this.control.name === 'Envelope'){
      this.callback = function(){
        this.control.decay = this.val
        this.control.release = this.val*1.2
      }
    }

    else if (this.control.name === 'Oscillator'){
      //console.log(true)
      this.callback = function(){
        if (this.val) {
          this.control.frequency.setValueAtTime(Tone.Midi(this.val).toFrequency(), this.time)
          this.env.triggerAttackRelease(this.subdivision, this.time)
        }
      }
    }

    else if (this.custom){
      this.callback = function(){
        console.log('To set custom callback: this.callback = (your function here)')
      }
    }
  }
} 
// so the idea is make methods that check to see if you should execute a sequence for midi, delay, cutoff
// frequencies, scale degrees, etc., and return a true or false value. Given that true or false the loop
// should execute different things. So the midi method should be