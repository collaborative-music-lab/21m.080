import * as Tone from 'tone'
export class Sequencer{
  constructor(control = null, values = [], subdivision = '8n', enables = []){
    //console.log('enter construct')
    this.gui = null
    this.subdivision = subdivision
    this.control = control
    this.callback = this.callback = function(i,time){
      console.log('To set custom callback: this.callback = (your function here)')
    }
    this.setCallback(this.control)
    this.values = values
    this.tempVal = values
    this.enables = enables
    this.tempenables = enables
    this.beatsPerBar = 4
    this.subdivisionsPerBeat = 4
    this.enables_index = 0
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
        this.temp_enables_index = this.enables_index
        this.temp_values_index = this.values_index
        this.enables_index = this.index % this.enables.length
        this.values_index = this.index % this.values.length
        
        //console.log(this.values_index)
    //
        if (this.enables.length === 0){
          this.val = this.values[this.values_index]
          //console.log(this.val)
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

                
    //
    }, this.subdivision);
  //console.log("sequencer ready")
}
  setGui(name, gui){
    if(name === 'stepSequence') {this.interface = new stepSequence(this,gui)}
    else if (name === 'circularSequence') {this.interface = new circularSequence(this, gui)}
  }


  start() {
    // Start the loop and the transport
    this.loop.start(0);
    Tone.Transport.start();
  }

  stop() {
    Tone.Transport.stop()
  }

  setCallback(control) {
    if (control == null) {
      return
    }

    else if (control.name === 'Synth'){
      //console.log(true)
      this.callback = function(i, time){
        if (this.val) {
          //console.log(this.control)
          //console.log(this.val)
          this.control.triggerAttackRelease(this.val,100,.01,time)
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



class stepSequence{
  constructor(target, gui){
    this.gui = gui
    this.target = target
    this.initGui()
    this.prevVal = 0
    this.prevEnable = 0
  }
  initGui( x = 10, y = 10) {
    //make your sequencer.gui here
    this.x = x
    this.y = y
    this.enables_array = []
    this.values_array = []

    for( let i=0; i<this.target.enables.length; i++){
      this.enables_array.push(this.createToggle('En'+(i+1).toString(), 10*i, 80, 0.5, [200,50,0],  x => this.target.enables[i] = x))
      this.enables_array[i].set(1)
    }
    
    for( let i=0; i<this.target.values.length; i++){
      this.values_array.push(this.createKnob((i+1), 10*i, 60, 0, 127, 1,  [200,50,0],  x => this.target.values[i] = Math.floor(x)))
    }
    this.playButton = this.createToggle('Pause/Play', 50, 10, 1, [200,50,0], x => this.togglePlay(x))
    this.playButton.set(1)

    this.playText = this.gui.Text({label:"play", x:50,y:20})
  }

  updateGui(values, enables){
    this.values_array[values].accentColor = [0, 250, 0]
    this.values_array[this.prevVal].accentColor = [0, 0, 200]
    this.prevVal = values

    this.enables_array[enables].accentColor = [0, 250, 0]
    this.enables_array[this.prevEnable].accentColor = [0, 0, 200]
    this.prevEnable = enables

  }

  createKnob(_label, _x, _y, _min, _max, _size, _accentColor, callback) {
    //console.log(_label)
    return this.gui.Knob({
      label:_label, min:_min, max:_max, size:_size, accentColor:_accentColor,
      x: _x + this.x, y: _y + this.y,
      callback: callback,
      curve: 1, // Adjust as needed
      border: 4, // Adjust as needed
      showLabel: 0, showValue: 0
    });
  }

  createToggle(_label, _x, _y, _size, _accentColor, callback) {
    //console.log(_label)
    return this.gui.Toggle({
      label:_label, size:_size, accentColor:_accentColor,
      x: _x + this.x, y: _y + this.y,
      callback: callback,
      showLabel: 1, showValue: 1, // Assuming these are common settings
      border: 20, // Adjust as needed
      showLabel: 0, showValue: 0
    });
  }

  togglePlay(x){
    if (x){
      return this.target.start()
    }
    return this.target.stop()
  }
}

class circularSequence extends stepSequence{
  constructor(target, gui){
    super(target, gui)
  }

  initGui(x = 25, y = 25) {
    this.x = x;
    this.y = y;
    this.enables_array = [];
    this.values_array = [];

    const centerX = this.x;
    const centerY = this.y;
    const radius = 100; // Adjust the radius as needed
    const knobRadius = radius + 80; // Knobs on the outside

    const numElements = Math.max(this.target.enables.length, this.target.values.length);
    const angleStep = 2*Math.PI / numElements;

    // Create buttons in the inner circle
    for (let i = 0; i < this.target.enables.length; i++) {
        const angle = i * angleStep;
        const buttonX = centerX + radius * Math.cos(angle)/10;
        const buttonY = centerY + radius * Math.sin(angle)/5;
        
        this.enables_array.push(this.createToggle('En'+(i+1).toString(), buttonX, buttonY, 0.3, [200, 50, 0], x => this.target.enables[i] = x));
        this.enables_array[i].set(1);
    }

    // Create knobs in the outer circle
    for (let i = 0; i < this.target.values.length; i++) {
        const angle = i * angleStep;
        const knobX = centerX + knobRadius * Math.cos(angle)/10;
        const knobY = centerY + knobRadius * Math.sin(angle)/5;

        this.values_array.push(this.createKnob((i + 1), knobX, knobY, 24, 72, 0.8, [200, 50, 0], x => this.target.values[i] = Math.floor(x)));
    }

    // Place the play button in the center
    this.playButton = this.createToggle('Pause/Play', centerX, centerY, 1, [200, 50, 0], x => this.togglePlay(x));
    this.playButton.set(1)
    this.playText = this.gui.Text({label:"play", x:50,y:50, border:1})
  }
}