import { useState, useEffect, useRef } from 'react';
import keyboard from './Icons/keyboard.png';
const midi = require('./Midi.js');
function AsciiKeyboard() {
    const [midiOn, setMidiOn] = useState(false);
    const [notesOn, setNotesOn] = useState(new Set());
    const midiOnRef = useRef(midiOn); // Mutable reference to hold the latest value of midiOn

    let activeKeys = {};
    var octave = 4;

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
    

    /*
    Goal is to have ASCII object which has keydown/up handler
    enable / disable
    converts ASCII to x/y
    export into editor.js

    rename things so I don't go insane
    
    */

    function keyDown(event) {
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
    function keyUp(event) {
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
export default AsciiKeyboard;