let vco = new Tone.Oscillator({type:'square'}).start()
  let vcf = new Tone.Filter({rolloff:-24})
let vca = new Tone.Multiply()
let output = new Tone.Multiply(0.05).toDestination()
let env = new Tone.Envelope()
let cutoff = new Tone.Signal()
let vcf_env_depth = new Tone.Multiply()
vco.connect( vcf), vcf.connect( vca), vca.connect(output)
env.connect( vca.factor )
vcf.frequency.value = 1500, vcf.Q.value = 10
env.decay = .2, env.sustain = .2
                         
let pitches = [60, 63, 60, 65, 58, 55, 67, 63];
const sequence = new Tone.Sequence(
  (time, note) => {
    // Trigger the envelope and set VCO frequency
    env.triggerAttackRelease('8n', time); // Assuming 8n duration for each note
    vco.frequency.setValueAtTime(Tone.Midi(note-12).toFrequency(), time);
  },
  pitches, // Sequence of note names
  '8n' // Time interval between each note
);

sequence.stop()
sequence.start()
Tone.Transport.start();
