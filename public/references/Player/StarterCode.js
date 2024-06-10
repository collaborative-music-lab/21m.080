let audioURL = "audio/vocal.mp3"
let output = new Tone.Multiply(0.05).toDestination()
const player = new Tone.Player(audioURL)
player.connect( output )

//trigger playback of the loaded soundfile
player.start()

//try updating the audioURL, and then loading it into the player
audioURL = "audio/kalimba.mp3"
audioURL = "audio/vocal.mp3"
player.load( audioURL)

//playbackRate must be positive
player.playbackRate = 0

player.reverse = 1
player.loop = 1

player.stop()