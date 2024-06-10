let noise = new Tone.Noise("pink")
let output = new Tone.Multiply( 0.05 ).toDestination()
noise.connect( output )
noise.start()
noise.stop()

noise.type = "white" //or "brown"
noise.playbackRate = 1