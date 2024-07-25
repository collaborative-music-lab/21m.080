// MonophonicTemplate.js
/*

Base class for synths. Includes:
- methods for loading and saving presets
- connect/disconnect
- setting ADSR values for env and vcf_env objects
- show/hide gui, and custom createKnob function

For presets:
- all synths can load presets saved in the synth/synthPresets folder.
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
*/

import * as Tone from 'tone';

/**
 * Represents a Monophonic Synth
 * @constructor
 */
export class MonophonicTemplate {
    constructor() {
        this.presets = null;
        this.gui_elements = [];
        this.frequency = new Tone.Signal();
        this.env = new Tone.Envelope();
        this.type = 'Synth'
        this.name = ""
        this.presetsData = null
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
                for (let element of Object.values(this.gui.elements)) {
                    if (element.id === id) {
                        element.set(presetData[id]);
                    }
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
}
