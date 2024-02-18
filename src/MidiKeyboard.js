import { useState, useEffect, useRef } from 'react';
import keyboard from './Icons/keyboard.png';
const midi = require('./Midi.js');
function MidiKeyboard() {
    const [midiOn, setMidiOn] = useState(false);
    const [notesOn, setNotesOn] = useState(new Set());
    const midiOnRef = useRef(midiOn); // Mutable reference to hold the latest value of midiOn

    let activeKeys = {};
    var octave = 4;
    var keyToNote = {
        90: { "midi": 60, "pitch": "C" },     // Z
        83: { "midi": 61, "pitch": "C#/Db" }, // S
        88: { "midi": 62, "pitch": "D" },     // X
        68: { "midi": 63, "pitch": "D#/Eb" }, // D
        67: { "midi": 64, "pitch": "E" },     // C
        86: { "midi": 65, "pitch": "F" },     // V
        71: { "midi": 66, "pitch": "F#/Gb" }, // G
        66: { "midi": 67, "pitch": "G" },     // B
        72: { "midi": 68, "pitch": "G#/Ab" }, // H
        78: { "midi": 69, "pitch": "A" },     // N
        74: { "midi": 70, "pitch": "A#/Bb" }, // J
        77: { "midi": 71, "pitch": "B" },     // M
        188: { "midi": 72, "pitch": "C" },     // , (or < depending on keyboard)
        76: { "midi": 73, "pitch": "C#/Db" }, // L
        190: { "midi": 74, "pitch": "D" },     // . (or > depending on keyboard)
        186: { "midi": 75, "pitch": "D#/Eb" }, // ; (or : depending on keyboard)
        191: { "midi": 76, "pitch": "E" }      // / (or ? depending on keyboard)
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Cleanup: Remove the event listeners when the component unmounts
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    },[]);

    // Update the mutable reference whenever midiOn changes
    useEffect(() => {
        midiOnRef.current = midiOn;
    }, [midiOn]);
    

    function handleKeyDown(event) {
        const midiOn = midiOnRef.current;
        if( midiOn ){
            const keyCode = event.keyCode;
            if (!activeKeys[keyCode]) {
                activeKeys[keyCode] = true;
                try {
                    let note = keyToNote[keyCode];
                    let midiNote = note["midi"] + (octave - 4) * 12;
                    if (midiNote <= 127) {
                        setNotesOn(new Set(notesOn).add(midiNote));
                        midi.midiHandlerInstance.handleNoteOn(midiNote, 100);
                    }
                } catch (error) {
                    if (keyCode === 37) {
                        decreaseOctave();
                    } else if (keyCode === 39) {
                        increaseOctave();
                    }
                    //console.log(octave)
                }
            }
        }
    }
    function handleKeyUp(event) {
        const midiOn = midiOnRef.current;
        if( midiOn ){
            const keyCode = event.keyCode;
            activeKeys[keyCode] = false;
            try {
                let note = keyToNote[keyCode];
                let midiNote = note["midi"] + (octave - 4) * 12;
                if (midiNote <= 127) {
                    setNotesOn(new Set(notesOn).delete(midiNote));
                    midi.midiHandlerInstance.handleNoteOff(midiNote, 0);
                }
            } catch (error) {
            }
        }
    }

    function increaseOctave() {
        if (octave < 7) {
            octave++;
        }
    }
    function decreaseOctave() {
        if (octave > 1) {
            octave--;
        }
    }
    const midiClicked = () => {
        setMidiOn(midiOn === false ? true : false);          
    }
    const keyboardCSS = midiOn ? 'icon active' : 'icon inactive';
    return (
        <div className='span-container'>
            {Array.from(notesOn).map((midiNote) => (
                <div key={midiNote}>{midiNote}</div>
            ))}
            <button className="invisible-button" onClick={midiClicked} >
                <img className={keyboardCSS} src={keyboard} alt="Keyboard" />
            </button>
        </div>
    );
}
export default MidiKeyboard;