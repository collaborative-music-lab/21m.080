// MonophonicTemplate.js

import * as Tone from 'tone';
import {parsePitchStringSequence, parsePitchStringBeat,getChord, pitchNameToMidi, intervalToMidi} from '../Theory'
import { ArrayVisualizer } from '../visualizers/VisualizeArray';


/**
 * Represents a Monophonic Synth
 * 
 * Base class for synths. Includes:
- methods for loading and saving presets
- connect/disconnect
- setting ADSR values for env and vcf_env objects
- show/hide gui, and custom createKnob function

## Working with presets
- all synths can load presets saved in the synth/synthPresets folder.

To add preset functionality to a synth:
- create the preset file `synths/synthPresets/yourSynthPresets.json' j
    - your preset file needs an open/close brace {} in it

- make sure to:
    - import your presets and assign to this.presets 
    - name your synth correctly in its constructor
    - pass the gui into the synth constructor
    - add this optional code to the end of the constructor to load
        default preset:
    if (this.gui !== null) {
        this.initGui()
        this.hideGui();
        setTimeout(()=>{this.loadPreset('default')}, 500);
    }

When saving presets you will need to manually download and copy
the preset file into synth/synthPresets/

 * @constructor
 */
export class MonophonicTemplate {
    constructor() {
        this.presets = null;
        this.gui_elements = [];
        this.poly_ref = null
        this.super = null
        this.frequency = new Tone.Signal();
        this.env = new Tone.Envelope();
        this.type = 'Synth'
        this.name = ""
        this.presetsData = null

        //for .sequence()
        //this.loop = new Tone.Loop(time => {},this.subdivision)
        this.enable = new Array(10).fill(1)
        this.octave = new Array(10).fill(0)
        this.sustain = new Array(10).fill(.1)
        
        this.seq = []
        this.subdivision = []
        this.velocity = new Array(10).fill(100)
        this.loop = new Array(10).fill(null)
        for(let i=0;i<10;i++) {
            this.seq.push([0])
            this.subdivision.push('8n')
        }

        this.callback = i=>{}
        this.callbackLoop = new Tone.Loop((time)=>{
            this.index = Math.floor(Tone.Transport.ticks / Tone.Time('16n').toTicks());
            this.callback(this.index)
        },'16n').start()

        this.seqToDraw = 0
        this.drawing = new ArrayVisualizer(this,this.seq[0], 'Canvas1', .2);
        this.drawingLoop = new Tone.Loop(time=>{
            if(this.drawing.enabled === true ) {
                this.drawing.startVisualFrame()
                if(!Array.isArray(this.seqToDraw)){
                    if(this.seq[this.seqToDraw].length > 0){
                        const index = Math.floor(Tone.Transport.ticks / Tone.Time(this.subdivision[this.seqToDraw]).toTicks());
                        this.drawing.visualize(this.seq[this.seqToDraw], index)
                    }
                } else{
                    this.seqToDraw.forEach(num=>{
                        if(this.seq[num].length > 0){
                            const index = Math.floor(Tone.Transport.ticks / Tone.Time(this.subdivision[num]).toTicks());
                            this.drawing.visualize(this.seq[num], index)
                        }
                    })
                }
            }
        }, '16n').start()
    }

    /**
     * Load a preset by name
     * @param {string} name - Name of the preset to load
     * @returns {void}
     * @example synth.loadPreset('default')
     */
    loadPreset(name) {
        const presetData = this.presets[name];
        if (presetData) {
            console.log("Loading preset ", name);
            for (let id in presetData) {
                try{
                    for (let element of Object.values(this.gui.elements)) {
                        if (element.id === id) {
                            if(element.type !== 'momentary') element.set(presetData[id]);
                        }
                    }
                }
                catch(e){
                    console.log(e)
                }
                //console.log(id)
            }
        } else {
            console.log("No preset of name ", name);
        }
    }

    /**
     * Console log all available presets
     * @returns {void}
     * @example synth.listPresets()
     */
    listPresets() {
        console.log("Synth presets", this.presets);
    }

    /**
     * Trigger the attack phase of the envelope
     * @param {number} val - MIDI note value
     * @param {number} vel - MIDI velocity value
     * @param {number} time - Time to trigger the attack
     * @returns {void}
     * @example synth.triggerAttack(60, 100, Tone.now())
     */
    triggerAttack(val, vel = 100, time = null) {
        vel = vel / 127;
        if (time) {
            this.frequency.setValueAtTime(Tone.Midi(val).toFrequency(), time);
            this.env.triggerAttack(time);
        } else {
            this.frequency.value = Tone.Midi(val).toFrequency();
            this.env.triggerAttack();
        }
    }

    /**
     * Trigger the release phase of the envelope
     * @param {number} val - MIDI note value
     * @param {number} time - Time to trigger the release
     * @returns {void}
     * @example synth.triggerRelease(60, Tone.now())
     * @example synth.triggerRelease(60)
     */
    triggerRelease(val, time = null) {
        if (time) this.env.triggerRelease(time);
        else this.env.triggerRelease();
    }

    /**
     * Trigger the attack and release phases of the envelope
     * @param {number} val - MIDI note value
     * @param {number} vel - MIDI velocity value
     * @param {number} dur - Duration of the attack and release
     * @param {number} time - Time to trigger the attack and release
     * @returns {void}
     * @example synth.triggerAttackRelease(60, 100, 0.01, Tone.now())
     * @example synth.triggerAttackRelease(60, 100, 0.01)
     */
    triggerAttackRelease(val, vel = 100, dur = 0.01, time = null) {
        vel = vel / 127;
        if (time) {
            this.frequency.setValueAtTime(Tone.Midi(val).toFrequency(), time);
            this.env.triggerAttackRelease(dur, time);
        } else {
            this.frequency.value = Tone.Midi(val).toFrequency();
            this.env.triggerAttackRelease(dur);
        }
    }

    /**
     * Set the ADSR values for the envelope
     * @param {number} a - Attack time
     * @param {number} d - Decay time
     * @param {number} s - Sustain level
     * @param {number} r - Release time
     * @returns {void}
     * @example synth.setADSR(0.01, 0.1, 0.5, 0.1)
     */
    setADSR(a, d, s, r) {
        if (this.env) {
            this.env.attack = a>0.001 ? a : 0.001
            this.env.decay = d>0.01 ? d : 0.01
            this.env.sustain = Math.abs(s)<1 ? s : 1
            this.env.release = r>0.01 ? r : 0.01
        }
    }

    /**
     * Set the ADSR values for the filter envelope
     * @param {number} a - Attack time
     * @param {number} d - Decay time
     * @param {number} s - Sustain level
     * @param {number} r - Release time
     * @returns {void}
     * @example synth.setFilterADSR(0.01, 0.1, 0.5, 0.1)
     */ 
    setFilterADSR(a, d, s, r) {
        if (this.vcf_env) {
            this.vcf_env.attack = a>0.001 ? a : 0.001
            this.vcf_env.decay = d>0.01 ? d : 0.01
            this.vcf_env.sustain = Math.abs(s)<1 ? s : 1
            this.vcf_env.release = r>0.01 ? r : 0.01
        }
    }

    /**
     * Initialize the GUI
     * @param {object} gui - p5.gui object
     * @param {number} x - X position of the GUI
     * @param {number} y - Y position of the GUI
     * @returns {void}
     * @example 
     * const gui = new p5(sketch, 'Canvas1');
     * synth.initGui(gui, 10, 10)
     */
    initGui(gui, x = 10, y = 10) {
        this.gui = gui;
        this.x = x;
        this.y = y;
        this.gui_elements = [];
    }

    /**
     * Hide the GUI
     * @returns {void}
     */
    hideGui() {
        for (let i = 0; i < this.gui_elements.length; i++) {
            //console.log(this.gui_elements[i])
            this.gui_elements[i].hide = true;
        }
    }

    /**
     * Show the GUI
     * @returns {void}
     */
    showGui() {
        for (let i = 0; i < this.gui_elements.length; i++) this.gui_elements[i].hide = false;
    }

    /**
     * Fast way to create a knob GUI element
     * @param {string} _label - Label for the knob
     * @param {number} _x - X position of the knob
     * @param {number} _y - Y position of the knob
     * @param {number} _min - Minimum value of the knob
     * @param {number} _max - Maximum value of the knob
     * @param {number} _size - Size of the knob
     * @param {string} _accentColor - Accent color of the knob
     * @param {function} callback - Callback function for the knob
     * @returns {object} - p5.gui knob object
     * @example
     * this.createKnob('Attack', 10, 10, 0.01, 1, 100, '#ff0000', (val) => {
     *    this.setADSR(val, this.gui.get('Decay').value(), this.gui.get('Sustain').value(), this.gui.get('Release').value());
     * });
     */
    createKnob(_label, _x, _y, _min, _max, _size, _accentColor, callback) {
        return this.gui.Knob({
            label: _label, min: _min, max: _max, size: _size, accentColor: _accentColor,
            x: _x + this.x, y: _y + this.y,
            callback: callback,
            showLabel: 1, showValue: 1, // Assuming these are common settings
            curve: 2, // Adjust as needed
            border: 2 // Adjust as needed
        });
    }

    /**
     * Connects to Tone.js destination
     * @param {object} destination - Tone.js destination object
     * @returns {void}
     * @example 
     * const amp = new Tone.Gain(0.5).toDestination();
     * synth.connect(amp)
     */
    connect(destination) {
        if (destination.input) {
            this.output.connect(destination.input);
        } else {
            this.output.connect(destination);
        }
    }

    /**
     * Disconnects from Tone.js destination
     * @param {object} destination - Tone.js destination object
     * @returns {void}
     * @example
     * const amp = new Tone.Gain(0.5).toDestination();
     * synth.connect(amp)
     * synth.disconnect(amp)
     */
    disconnect(destination) {
        if (destination.input) {
            this.output.disconnect(destination.input);
        } else {
            this.output.disconnect(destination);
        }
    }

    /**
     * Save a preset by name
     * @param {string} name - Name of the preset to save
     * @returns {void}
     * @example synth.savePreset('default')
     */
	savePreset = (name) => {
	    const preset = {};
	    for (let element of Object.values(this.gui.elements)) {
	        preset[element.id] = element.value;
	    }

	    // Update the presetsData in memory
	    //console.log(this.presets);
	    if (!this.presets[name]) {
	        this.presets[name] = {};
	    }
	    this.presets[name] = preset;

	    console.log(`Preset saved under ${this.name}/${name}`);
	};

    /**
     * Download the presets data as a JSON file
     * @returns {void}
     * @example synth.downloadPresets()
     */
	downloadPresets = () => {
	    this.presetsData = this.presets;
	    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.presetsData, null, 2));
	    const downloadAnchorNode = document.createElement('a');
	    downloadAnchorNode.setAttribute("href", dataStr);
	    downloadAnchorNode.setAttribute("download", `${this.name}Presets.json`);
	    document.body.appendChild(downloadAnchorNode);
	    downloadAnchorNode.click();
	    downloadAnchorNode.remove();
	};

    /**
     * Sequences the provided array of notes and initializes a Tone.Loop with the given subdivision.
     *
     * @param {string} arr - The sequence of notes as a string.
     * @param {string} [subdivision] - The rhythmic subdivision for the loop (e.g., '16n', '8n').
     * @param {string} num (default 0) - the sequence number. Up to 10 sequences per instance.
     */
    sequence(arr, subdivision = '8n', num = 0) {

        this.seq[num] = parsePitchStringSequence(arr)

        this.createLoop(subdivision, num)

    }

    /**
     * plays the provided sequence array initializes a Tone.Loop with the given subdivision.
     *
     * @param {string} arr - The sequence of notes as a string.
     * @param {number} iterations - The the number of times to play the sequence
     * @param {string} [subdivision] - The rhythmic subdivision for the loop (e.g., '16n', '8n').
     * @param {string} num (default 0) - the sequence number. Up to 10 sequences per instance.
     */
    setSeq(arr, subdivision = '8n', num = 0){
        this.seq[num] = parsePitchStringSequence(arr)

        if (subdivision) this.setSubdivision(subdivision, num) 
    }

    play(iterations = 1, arr = null, subdivision = '8n', num = 0) {

        if(arr) this.seq[num] = parsePitchStringSequence(arr)
        if (subdivision) this.setSubdivision(subdivision, num)

        this.createLoop(subdivision, num, iterations)
        this.loop[num].start()
    }

    createLoop(subdivision, num, iterations = 'Infinity'){
        // Create a Tone.Loop
        if (this.loop[num] === null) {
            this.loop[num] = new Tone.Loop(time => {
                this.index = Math.floor(Tone.Transport.ticks / Tone.Time(this.subdivision[num]).toTicks());
                if(this.enable[num] === 0) return
                
                //if(num == 0) this.callback(this.index)
                let curBeat = this.seq[num][this.index%this.seq[num].length];
                curBeat = this.checkForRandomElement(num,curBeat)
                //console.log(curBeat)
                const event = parsePitchStringBeat(curBeat, time)
                //console.log(event[0])
                //console.log(num,this.index, event, this.seq[num])
                for (const val of event)  this.parseNoteString(val, time, num)

            }, '4n').start(0);

            // Start the Transport
            Tone.Transport.start();
        }
        this.loop.iterations = iterations

        if (subdivision) {
            this.setSubdivision(subdivision, num)
        }

        this.start(num)
    }

    checkForRandomElement(num, curBeat) {
    // If curBeat is a number, return it directly
    if (typeof curBeat === 'number') {
        return curBeat;
    }

    // If curBeat is a string and contains '?', we need to replace it
    if (typeof curBeat === 'string' && curBeat.includes('?')) {
        // Assuming `this.seq` is the context where sequences are stored
        let validElements = [];

        // Iterate through each element in seq[num] to build validElements
        this.seq[num].forEach(item => {
            if (typeof item === 'string') {
                if (/^[a-zA-Z0-9]$/.test(item)) {
                    // If it's a single number or letter, add it
                    validElements.push(item);
                } else if (/^\?$/.test(item)) {
                    // If it's a single '?', skip it
                    return;
                } else if (/^\[.*\]$/.test(item)) {
                    // If it's a bracketed string, extract letters and numbers and add them individually
                    let insideBrackets = item.replace(/\[|\]/g, '');  // Remove brackets
                    insideBrackets.split(' ').forEach(el => {
                        if (/^[a-zA-Z0-9]$/.test(el)) {
                            validElements.push(el);  // Add valid individual items
                        }
                    });
                }
            }
        });

        // Function to get a random non-? element
        function getRandomElement() {
            return validElements[Math.floor(Math.random() * validElements.length)];
        }

        // Replace each '?' with a random valid element
        curBeat = curBeat.replace(/\?/g, () => getRandomElement());
    }

    return curBeat;
}



        /**
     * Starts the loop for the synthesizer.
     */
    start(num = 'all') {
        if(num === 'all'){
            for(let i=0;i<10;i++) this.enable[i] = 1
            this.drawingLoop.start()
        }
        else this.enable[num] = 1
    }

    /**
     * Stops the loop for the synthesizer.
     */
    stop(num = 'all') {
        if(num === 'all'){
            for(let i=0;i<10;i++) this.enable[i] = 0
            this.drawingLoop.stop()
        }
        else this.enable[num] = 0
    }

    expr(func, len=32, subdivision = '16n', num = 0) {
        const arr = Array.from({ length: len }, (_, i) => func(i))

        this.seq[num] = arr.map(element => {
            return typeof element === 'string' ? element : element//.toString();
        });

        //console.log(this.seq[num])
        this.createLoop(subdivision, num)
    }

    /**
     * Sets the velocity for a loop
     * 
     * @param {string} velocity - MIDI velocity valur
     */
    setVelocity(velocity=100, num = 'all') {
        
        if(num === 'all'){
            this.velocity = new Array(10).fill(velocity)
        } else {
            this.velocity[num] = velocity
        }
    }

    /**
     * Sets the velocity for a loop
     * 
     * @param {string} velocity - MIDI velocity valur
     */
    setSustain(val=.1, num = 'all') {
        if(val<=0) return
        if(num === 'all'){
            this.sustain = new Array(10).fill(val)
        } else {
            this.sustain[num] = val
        }
    }

    /**
     * Sets the velocity for a loop
     * 
     * @param {string} velocity - MIDI velocity valur
     */
    setOctave(val=0, num = 'all') {
        val = val < -4 ? -4 : val > 4 ? 4 : val
        if(num === 'all'){
            this.octave = new Array(10).fill(val)
        } else {
            this.octave[num] = val
        }
    }

    /**
     * Sets the subdivision for the loop and adjusts the playback rate accordingly.
     * 
     * @param {string} sub - The subdivision to set (e.g., '16n', '8n', '4n', '2n').
     */
    setSubdivision(sub='8n', num = 'all') {
        // this.loop.subdivision = sub;
        
        if(num === 'all'){
            this.subdivision = new Array(10).fill(sub)
            for(let i=0;i<10;i++){
                if(this.loop[i] !== null) {
                    this.setOneSub(sub,i)
                }
            }
        } else {
            if(this.loop[num] !== null) this.setOneSub(sub,num)
        }
    }

    setOneSub(sub,num){
        this.subdivision[num] = sub;
        switch (sub) {
            case '32n':
                this.loop[num].playbackRate = 16;
                break;
            case '32n':
                this.loop[num].playbackRate = 8;
                break;
            case '16n':
                this.loop[num].playbackRate = 4;
                break;
            case '8n':
                this.loop[num].playbackRate = 2;
                break;
            case '4n':
                this.loop[num].playbackRate = 1;
                break;
            case '2n':
                this.loop[num].playbackRate = 0.5;
                break;
            case '1n':
                this.loop[num].playbackRate = 0.25;
                break;
        }
    }


    parseNoteString(val, time, num){
        //console.log(val)
        if(val[0] === ".") return
        
        const usesPitchNames = /^[a-ac-zA-Z]$/.test(val[0][0]);

        let note = ''
        //console.log(val[0], usesPitchNames)
        if( usesPitchNames ) note =  pitchNameToMidi(val[0])
        else note = intervalToMidi(val[0])
        const div = val[1]
        if(note < 0) return
        //console.log(note, this.velocity[num], this.sustain)
        try{
            this.triggerAttackRelease(note + this.octave[num]*12, this.velocity[num], this.sustain[num], time + div * (Tone.Time(this.subdivision[num])));
        } catch(e){
            console.log('invalid note', note + this.octave[num]*12, this.velocity[num], this.sustain[num])
        }
    }

    //visualizations

    draw(arr = this.drawing.array, target = this.drawing.target, ratio = this.drawing.ratio ){
        this.drawing = new ArrayVisualizer(arr, target, ratio)
    }
}
