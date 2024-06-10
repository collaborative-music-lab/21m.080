//create an oscillator with a frequency of 440 Hertz
let vco = new Tone.Oscillator(440)
//create an output which has two components
// - the Multiply(0.05) scales the amplitude by 0.05
// - we need this because an amplitude of 1 would be 
// - the maximum volume of your laptop (loud!)
// - toDestination() routes audio to your laptops audio
//   output
let output = new Tone.Multiply(0.05).toDestination()
//you always need to call .start() on oscillators
// - you can also do it when you create an oscillator like this:
//   Tone.Oscillator().start()
vco.start()
//now we need to connect oscillator to the output
vco.connect( output )

//this sinewave will play forever! to stop it call:
vco.stop()

//or you can set the output level like:
output.factor.value = 0.0