import * as Tone from 'tone'
export class Sequencer{
  constructor(control = null, values = [], subdivision = '8n', enable = []){
    //console.log('enter construct')
    this.gui = null
    this.subdivision = subdivision
    this.control = control
    this.callback = this.callback = function(){
      console.log('To set custom callback: this.callback = (your function here)')
    }
    this.setCallback(this.control)
    this.values = values
    this.tempVal = values
    this.enable = enable
    this.tempEnable = enable
    this.beatsPerBar = 4
    this.subdivisionsPerBeat = 4
    this.enable_index = 0
    this.values_index = 0
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
      this.temp_enable_index = this.enable_index
      this.temp_values_index = this.values_index
      this.enable_index = this.index % this.enable.length
      this.values_index = this.index % this.values.length
      
      //console.log(this.values_index)
  //
      if (this.enable.length == 0){
        this.val = this.values[this.values_index]
        console.log(this.val)
      }

      else if (this.enable[this.enable_index]){
        //console.log(this.values[this.values_index])
        this.val = this.values[this.values_index]
        console.log(this.val)
        
      }
      else {
        console.log(0)
        this.val = 0
      }
      this.updateGui()
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

  initGui(gui, val_length = null, enable_length = null, x = 10, y = 10) {
    //make your sequencer.gui here
    this.gui = gui
    this.x = x
    this.y = y
    this.enable_array = []
    // if (val_length != null){
    //   for (let i = 0; i << val_length; i ++){
    //     this.values[i] = 60
    //   }
    // if (enable_length != null){
    //   for (let i = 0; i << enable_length; i ++){
    //     this.enable[i] = 1
    //   }
    // }
    
    //}
    for( let i=0; i<this.enable.length; i++){
      this.enable_array.push(this.createToggle('Enable', 10*i, 80, 0.5, [200,50,0],  x => this.enable[i] = x))
    }
    this.value_array = []
    for( let i=0; i<this.values.length; i++){
      this.value_array.push(this.createKnob((i+1), 10*this.i, 50, 0, 127, 0.5,  [200,50,0],  x => this.values[i] = Math.floor(x)))
    }
    this.playButton = this.createToggle('Pause/Play', 50, 10, 1, [200,50,0], x => this.togglePlay(x))
  }

  updateGui(){
    // if (this.values.length != this.tempVal.length){
    //   this.value_array = []
    //   for( this.i=0;this.i<this.values.length;this.i++){
    //     this.value_array.push(this.createKnob((this.i+1), 10*this.i, 50, 0.01, 1, 0.5,  [200,50,0],  x => this.values[this.i] = x))
    //   }
    // }

    // if (this.enable.length != this.tempEnable.length){
    //   this.enable_array = []
    //   for( this.i=0;this.i<this.enable.length;this.i++){
    //     this.enable_array.push(this.createToggle('Enable', 10*this.i, 80, 0.5, [200,50,0],  x => this.enable[this.i] = x))
    //   }
    // }
    this.value_array[this.temp_values_index].accentColor = [250, 50, 0]
    if (this.enable[this.enable_index]){
    this.value_array[this.values_index].accentColor = [0, 250, 0]
    }
    this.temp_values_index = this.values_index
    this.temp_enable_index = this.enable_index
  }

  togglePlay(x){
    if (x){
      return this.start()
    }
    return this.stop()
  }

  createKnob(_label, _x, _y, _min, _max, _size, _accentColor, callback) {
    //console.log(_label)
    return this.gui.Knob({
      label:_label, min:_min, max:_max, size:_size, accentColor:_accentColor,
      x: _x + this.x, y: _y + this.y,
      callback: callback,
      curve: 1, // Adjust as needed
      border: 2 // Adjust as needed
    });
  }

  createToggle(_label, _x, _y, _size, _accentColor, callback) {
    //console.log(_label)
    return this.gui.Toggle({
      label:_label, size:_size, accentColor:_accentColor,
      x: _x + this.x, y: _y + this.y,
      callback: callback,
      showLabel: 1, showValue: 1, // Assuming these are common settings
      border: 2 // Adjust as needed
    });
  }

  setCallback(control) {
    if (control == null) {
      return
    }

    else if (control.name === 'Synth'){
      //console.log(true)
      this.callback = function(){
        if (this.val) {
          //console.log(this.control)
          //console.log(this.val)
          this.control.triggerAttackRelease(this.val)
        }
      }
    }

    else if (control.name === 'Drum'){
      this.callback = function(){
      
      }
    }

    else if (control.name === 'Filter'){
      this.callback = function(){
        this.control.frequency.value = this.val
      }
    }

    else if (control.name === 'Multiply'){
      this.callback = function(){
        this.control.factor.value = this.val
      }
    }

    else if (control.name === 'Envelope'){
      this.callback = function(){
        this.control.decay = this.val
        this.control.release = this.val*1.2
      }
    }

    else if (control.name === 'Oscillator'){
      //console.log(true)
      this.callback = function(){
        if (this.val) {
          this.control.frequency.setValueAtTime(Tone.Midi(this.val).toFrequency(), this.time)
          this.env.triggerAttackRelease(this.subdivision, this.time)
        }
      }
    }

    else if (typeof control === 'function'){
      this.callback = control
    }
  }
} 
// so the idea is make methods that check to see if you should execute a sequence for midi, delay, cutoff
// frequencies, scale degrees, etc., and return a true or false value. Given that true or false the loop
// should execute different things. So the midi method should be