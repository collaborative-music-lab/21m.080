const granularSynth = new Tone.GrainPlayer({
    //url: "https://tonejs.github.io/audio/drum-samples/breakbeat.mp3",
    url: "/m080/audio/120bpm_beat.mp3",
    loop: true,
    grainSize: 0.1,
    overlap: 0.05,
})
//try loading other samples by replacing kalimba
/* available samples are: 
/m080/audio/kalimba.mp3
/m080/audio/120bpm_beat.mp3
/m080/audio/haugharp.mp3
/m080/audio/marimba.mp3
/m080/audio/rhodes.mp3
/m080/audio/ukulele.mp3
/m080/audio/vocal.mp3
*/
const output = new Tone.Multiply(0.1).toDestination()
granularSynth.connect( output )

granularSynth.start();
granularSynth.grainSize = .03;
granularSynth.playbackRate = .5;
granularSynth.overlap = .03;
granularSynth.detune = 0 //cents, 1200=1 octave

//granularSynth.stop()

let scope = new Oscilloscope('GranularSynth')
granularSynth.connect( scope.input )
scope.setFftSize(1028*32)