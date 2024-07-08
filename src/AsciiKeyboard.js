import { useState, useEffect, useRef } from 'react';
import keyboard from './Icons/keyboard.png';
//const midi = require('./Midi.js');
function AsciiKeyboard() {
    const [asciiOn, setAsciiOn] = useState(false);
    const [notesOn, setNotesOn] = useState(new Set());
    const asciiOnRef = useRef(asciiOn); // Mutable reference to hold the latest value of asciiOn

    let activeKeys = {};

    useEffect(() => {
        document.addEventListener('keydown', keyDown);
        document.addEventListener('keyup', keyUp);

        // Cleanup: Remove the event listeners when the component unmounts
        return () => {
            document.removeEventListener('keydown', keyDown);
            document.removeEventListener('keyup', keyUp);
        };
    },[]);

    // Update the mutable reference whenever asciiOn changes
    useEffect(() => {
        asciiOnRef.current = asciiOn;
    }, [asciiOn]);
    

    /*
    Goal is to have ASCII object which has keydown/up handler
    enable / disable
    converts ASCII to x/y
    export into editor.js

    rename things so I don't go insane
    
    */

    function keyDown(event) {
        const asciiOn = asciiOnRef.current;
        if( asciiOn ){
            const keyCode = event.keyCode;
            let note = keyCode
            if (!activeKeys[keyCode]) {
                activeKeys[keyCode] = true;
                try {
                    setNotesOn(new Set(notesOn).add(note));
                    asciiHandlerInstance.asciiHandler(note, 'down');
                } catch (error) {
                    console.log(note)
                }
            }
        }
    }
    function keyUp(event) {
        const asciiOn = asciiOnRef.current;
        if( asciiOn ){
            const keyCode = event.keyCode;
            let note = keyCode
            activeKeys[keyCode] = false;
            try {
                setNotesOn(new Set(notesOn).delete(note));
                asciiHandlerInstance.asciiHandler(note, 'up');
            } catch (error) {
            }
        }
    }

    const enableAsciiKeyboard = () => {
        setAsciiOn(true);          
    }
    //return
    const disableAsciiKeyboard = () => {
        setAsciiOn(false);         
    }
    //return;
}
export default AsciiKeyboard;

class AsciiHandler {
    constructor() {
        this.asciiHandler = (key, upOrDown) => {
            console.log('Default ASCII Handler:', key);
            console.log(`Define your own note ${upOrDown} handler like this:\nsetASCIIHandler(( note, upOrDown) => { <your code here> }) `)
        };
    }

    handleAscii(note, velocity) {
        this.asciiHandler(note, velocity);
    }

    setAsciiHandler(func) {
        this.asciiHandler = func;
    }
}
export const asciiHandlerInstance = new AsciiHandler();