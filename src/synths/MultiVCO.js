class multiVCO{
    constructor(vcos = ['triangle','sawtooth','square']){
        this.numInputs = vcos.length
        this.vco = []
        this.frequency = new Tone.Signal(200)
        this.freqScalar = []
        this.output = new Tone.Multiply(.5)
        for(this.i=0;this.i<this.numInputs;this.i++) {
            console.log(vcos[this.i])
            this.vco.push(new Tone.Oscillator({type:vcos[this.i]}).start())
            this.freqScalar.push(new Tone.Multiply(1))
            this.frequency.connect(this.freqScalar[this.i])
            this.freqScalar[this.i].connect(this.vco[this.i].frequency)
            this.vco[this.i].connect(this.output)
        }
    }
    setGain(num, type){
        vco[num].type = type
    }
    }