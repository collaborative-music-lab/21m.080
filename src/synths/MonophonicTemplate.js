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

    listPresets() {
        console.log("Synth presets", this.presets);
    }

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

    triggerRelease(val, time = null) {
        if (time) this.env.triggerRelease(time);
        else this.env.triggerRelease();
    }

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

    setADSR(a, d, s, r) {
        if (this.env) {
            this.env.attack = a>0.001 ? a : 0.001
            this.env.decay = d>0.01 ? d : 0.01
            this.env.sustain = Math.abs(s)<1 ? s : 1
            this.env.release = r>0.01 ? r : 0.01
        }
    }

    setFilterADSR(a, d, s, r) {
        if (this.vcf_env) {
            this.vcf_env.attack = a>0.001 ? a : 0.001
            this.vcf_env.decay = d>0.01 ? d : 0.01
            this.vcf_env.sustain = Math.abs(s)<1 ? s : 1
            this.vcf_env.release = r>0.01 ? r : 0.01
        }
    }

    initGui(gui, x = 10, y = 10) {
        this.gui = gui;
        this.x = x;
        this.y = y;
        this.gui_elements = [];
    }

    hideGui() {
        for (let i = 0; i < this.gui_elements.length; i++) {
            //console.log(this.gui_elements[i])
            this.gui_elements[i].hide = true;
        }
    }

    showGui() {
        for (let i = 0; i < this.gui_elements.length; i++) this.gui_elements[i].hide = false;
    }

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

    connect(destination) {
        if (destination.input) {
            this.output.connect(destination.input);
        } else {
            this.output.connect(destination);
        }
    }

    disconnect(destination) {
        if (destination.input) {
            this.output.disconnect(destination.input);
        } else {
            this.output.disconnect(destination);
        }
    }

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

    // Function to download the updated presets data
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
