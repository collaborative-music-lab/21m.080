import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { historyField } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { NoiseVoice, Resonator, ToneWood, DelayOp, Caverns,
        Rumble, Daisies, DatoDuo, ESPSynth, Stripe, Diffuseur, KP, Sympathy,
        Kick} from './synths/index.js';

import {Sequencer} from './Sequencer.js';
import {MultiVCO} from './MultiVCO.js'
import p5 from 'p5';
import * as Tone from 'tone';
import * as Theory from './Theory.js';
//import ml5 from 'ml5';
import Canvas from "./Canvas.js";
import { Oscilloscope, Spectroscope, PlotTransferFunction } from './oscilloscope';
import MidiKeyboard from './MidiKeyboard.js';
import { asciiCallbackInstance } from './AsciiKeyboard.js';
const midi = require('./Midi.js');
const LZString = require('lz-string');


//Save history in browser
const stateFields = { history: historyField };

function Editor(props) {
    window.p5 = p5;
    window.Tone = Tone;
    window.Theory = Theory;
    //window.ml5 = ml5;
    window.Oscilloscope = Oscilloscope;
    window.Spectroscope = Spectroscope;
    window.plotTransferFunction = PlotTransferFunction;

    window.enableAsciiInput = asciiCallbackInstance.enable.bind(asciiCallbackInstance);
    window.disableAsciiInput = asciiCallbackInstance.disable.bind(asciiCallbackInstance);
    window.setAsciiHandler = asciiCallbackInstance.setHandler.bind(asciiCallbackInstance);
    
    window.setMidiInput = midi.setMidiInput;
    window.setNoteOnHandler = midi.midiHandlerInstance.setNoteOnHandler.bind(midi.midiHandlerInstance);
    window.setNoteOffHandler = midi.midiHandlerInstance.setNoteOffHandler.bind(midi.midiHandlerInstance);
    window.setCCHandler = midi.midiHandlerInstance.setCCHandler.bind(midi.midiHandlerInstance);

    //synths
    window.NoiseVoice = NoiseVoice
    window.DatoDuo = DatoDuo
    window.ESPSynth = ESPSynth
    window.Resonator = Resonator
    window.ToneWood = ToneWood
    window.DelayOp = DelayOp
    window.Caverns = Caverns
    window.Rumble = Rumble
    window.Daisies = Daisies
    window.Stripe = Stripe
    window.Diffuseur = Diffuseur
    window.KP = KP
    window.Sympathy = Sympathy
    window.Sequencer = Sequencer
    window.MultiVCO = MultiVCO
    window.Kick = Kick

    var curLineNum = 0;

    // Save history in browser
    const serializedState = localStorage.getItem(`${props.page}EditorState`);
    
    // Decoding the URL
    const URLParams = new URLSearchParams(window.location.search);
    const compressedCode = URLParams.get('code');
    const encodedContent =  LZString.decompressFromEncodedURIComponent(compressedCode);
    //const encodedContent = URLParams.get('code');
    let value;
    if (encodedContent) {
        value = encodedContent;
        // const url = window.location.origin + window.location.pathname;
        // window.location.assign(url);
    } else {
        value = localStorage.getItem(`${props.page}Value`) || props.starterCode;
    }


    //const value = 'let CHANNEL = 3'
    const [height, setHeight] = useState(false);
    const [code, setCode] = useState(value); //full string of user code
    var vars = {}; //current audioNodes
    var innerScopeVars = {}; //maps vars inside scope to a list of its instances
    window.innerScopeVars = innerScopeVars;
    const [refresh, setRefresh] = useState(false);

    const canvases = props.canvases;
    const [codeMinimized, setCodeMinimized] = useState(false);
    const [p5Minimized, setP5Minimized] = useState(false);
    const [maximized, setMaximized] = useState('');

    useEffect(() => {
        const container = document.getElementById('container');
        if (container) {
            setHeight(`${container.clientHeight}px`);
        }
    }, []);

    function removeComments() {
        // Regular expression to match single-line and multi-line comments
        const commentRegex = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;

        // Remove comments from the code using the regular expression
        const cleanedCode = code.replace(commentRegex, '');
        return cleanedCode;
    }

    function updateCode(string) {
        let acorn = require('acorn');
        let walk = require('acorn-walk');
        let ast = null;
        let incr = 0;
        let length1 = 'globalThis.'.length;
        let length2 = " = null".length;
        let varNames = [];
        let innerVars = [];
        let p5Code = "";

        try {
            ast = acorn.parse(string, { ecmaVersion: 'latest' });
        } catch (error) {
            console.log("Error parsing code: ", error);
        }
        function handleScopedVars(end) {
            let scopedVars = innerVars.pop();
            let newStr = "";
            for (let val of scopedVars) {
                newStr += `if(${val}.context || ${val} instanceof AudioContext){innerScopeVars['${val}'].push(${val});} `;
            }
            string = string.substring(0, end - 1) + newStr + string.substring(end - 1);
            incr += newStr.length;
        }

        //Take action when we see a VariableDeclaration Node
        const visitors = {
            VariableDeclaration(node, state, c) {
                //remove kind (let/var/const)
                //console.log('1',string)
                if (!state.innerScope) {
                    let kind = node.kind;
                    string = string.substring(0, node.start + incr) + string.substring(node.start + incr + kind.length);
                    incr -= kind.length;
                }
                //Continue walk to search for identifiers
                for (const declaration of node.declarations) {
                    let name = declaration.id.name;
                    let start = declaration.start;
                    let end = declaration.end;
                    //Add globalThis & push variable names
                    if (!state.innerScope && !state.forLoop) {
                        //console.log('3',string)
                        string = string.substring(0, start + incr) + "globalThis." + string.substring(start + incr);
                        incr += length1;
                        varNames.push(name);
                        if (Object.keys(vars).includes(name)) {
                            try {
                                vars[name].stop();
                            } catch {

                            }
                        }
                    }
                    else if (state.innerScope && (!state.forLoop || state.forOf)) {
                        innerVars[innerVars.length - 1].push(name);
                        if (!Object.keys(innerScopeVars).includes(name)) {
                            innerScopeVars[name] = [];
                        }
                    }
                    //In case of no assignment, set to var to null
                    let init = declaration.init;
                    if (!init && !state.forLoop) {
                        //console.log('5',string)
                        string = string.substring(0, end + incr) + " = null" + string.substring(end + incr);
                        incr += length2;
                    }
                    else if (init) {
                        if (init.body) {
                            let newState = {
                                innerScope: true,
                                forLoop: false
                            }
                            innerVars.push([]);
                            c(init.body, newState);
                            //Add vals of innerVar to innerScopeVars
                            handleScopedVars(init.body.end + incr);
                        }
                    }
                }
            },

            FunctionDeclaration(node, state, c) {
                let name = node.id.name;
                let start = node.start + incr;
                let end = node.id.end + incr;
                let newCode = `globalThis.${name} = function`;
                string = string.substring(0, start) + newCode + string.substring(end);
                incr += newCode.length - (end - start);
                let newState = {
                    innerScope: true,
                    forLoop: false
                }
                innerVars.push([]);
                c(node.body, newState);
                handleScopedVars(node.end + incr);
            },

            ClassDeclaration(node, state, c) {
                let name = node.id.name;
                let start = node.start + incr;
                let end = node.id.end + incr;
                let newCode = `globalThis.${name} = class`;
                string = string.substring(0, start) + newCode + string.substring(end);
                incr += newCode.length - (end - start);
                let newState = {
                    innerScope: true,
                    forLoop: false
                }
                innerVars.push([]);
                c(node.body, newState);
                handleScopedVars(node.end + incr);
            },

            ForStatement(node, state, c) {
                let newState = {
                    innerScope: true,
                    forLoop: true
                }

                c(node.init, newState);
                newState.forLoop = false;
                innerVars.push([]);
                c(node.body, newState);
                handleScopedVars(node.end + incr);
            },

            ForOfStatement(node, state, c) {
                let newState = {
                    innerScope: true,
                    forLoop: true,
                    forOf: true
                }

                innerVars.push([]);
                c(node.left, newState);
                c(node.right, newState);
                handleScopedVars(node.end + incr);

                innerVars.push([]);
                newState.forOf = false;
                newState.forLoop = false;
                c(node.body, newState);
                handleScopedVars(node.end + incr);
            }
        }

        const initialState = {
            innerScope: false,
            forLoop: false
        };

        try {
            walk.recursive(ast, initialState, visitors);
        } catch (error) {
            console.log("Error parsing code: ", error);
        }
        return [string, p5Code, varNames];
    }

    function evaluate(string, p5Code) {
        try {
            //console.log('eval', string, 'p5', p5Code)
            eval(string);
            //eval(p5Code);
        } catch (error) {
            console.log("Error Evaluating Code", error);
        }
    }

    function updateVars(varNames) {
        let cleanedCode = removeComments();
        //console.log(node)
        function isAudioNode(node) {
            try{ return node.context || node instanceof AudioContext;}
            catch(e){console.log(e)}
        }
        for (const [key, instances] of Object.entries(innerScopeVars)) {
            if (!cleanedCode.includes(key)) {
                for (const instance of instances) {
                    try {
                        instance.stop();
                        //console.log('upd')
                    } catch (error) {
                        //not playing
                    }
                }
                delete innerScopeVars[key];
            }
        }
        //REMINDER: Issue may arise from scheduled sounds
        for (const varName of varNames) {
            //Add name, val pairs of ONLY audionodes to vars dictionary 
            let nameOfCurrentVariable = eval(varName)
            if (isAudioNode(nameOfCurrentVariable)) {
                vars[varName] = nameOfCurrentVariable;
            }
        }

        //Remove all vars that have been deleted from full code
        for (const [key, val] of Object.entries(vars)) {
            if (!(key in vars)) {
                if (!(cleanedCode.includes(key.substring(0, key.length - 4)))) {
                    try {
                        val.stop();
                    } catch (error) {
                        //val not playing sound
                    }
                }
                else {
                    vars[key] = val;
                }
            }
        }
    }

    function traverse(string) {
        const [updatedString, p5Code, varNames] = updateCode(string);
        evaluate(updatedString, p5Code);
        updateVars(varNames);
    }

    function evaluateLine() {
        try {
            var line = code.split('\n')[curLineNum - 1];
            traverse(line);
        } catch (error) {
            console.log(error);
        }
    }

    function removedSpaces() {
        let lines = code.split("\n");
        let openBraces = 0;
        let closedBraces = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].replace(/\s/g, "") === '') {
                if (openBraces > closedBraces) {
                    lines[i] = "//";
                }
            }
            else {
                if (lines[i].includes("{")) {
                    openBraces += 1;
                }
                if (lines[i].includes("}")) {
                    closedBraces += 1;
                }
            }
        }
        return lines;
    }

    function evaluateBlock() {
        try {
            //add "//" inside innerscope
            const lines = removedSpaces();
            var linepos = curLineNum - 1;
            var line = lines[linepos];
            while (line !== undefined && line.replace(/\s/g, "") !== '') {
                linepos -= 1;
                line = lines[linepos];
            }
            var start = linepos + 1;
            linepos = curLineNum;
            line = lines[linepos];
            while (line !== undefined && line.replace(/\s/g, "") !== '') {
                linepos += 1;
                line = lines[linepos];
            }
            traverse(lines.slice(start, linepos).join('\n'));
        } catch (error) {
            console.log(error);
        }
    }


    //save history in browser and update code value
    const handleCodeChange = (value, viewUpdate) => {
        if (refresh) {
            setRefresh(false);
        }
        localStorage.setItem(`${props.page}Value`, value);
        setCode(value);
        //viewUpdate.view.dom.clientHeight = document.getElementById('main').clientHeight;
        const state = viewUpdate.state.toJSON(stateFields);
        localStorage.setItem(`${props.page}EditorState`, JSON.stringify(state));
    };

    //Handle Live Mode Key Funcs
    const handleKeyDown = (event) => {
        if (event.altKey && event.shiftKey && event.key === 'Enter') {
            // if (prevLineNum !== curLineNum) {
            //     setRemoveEnter(true);
            // }
            evaluateBlock();
        }
        // else if (event.ctrlKey) {
        //     setPrevLineNum(curLineNum);
        // }
        else if (event.altKey && event.key === 'Enter') {
            evaluateLine();
        }   
    };


    const handleStatistics = (data) => {
        curLineNum = data.line.number;
    }

    //Handle Mode Changes + Play & Stop
    const playClicked = () => {
        stopClicked();
        traverse(code);
    }
    const stopClicked = () => {
        clearCanvases();
        for (const key in vars) {
            let variable = vars[key];
            try {
                variable.stop();
            } catch (error) {
                try {
                    variable.disconnect()
                } catch (error) {
                    //console.log(variable)//No action needed
                }
            }
        }

        for (const [key, instances] of Object.entries(innerScopeVars)) {
            for (const instance of instances) {
                try {
                    instance.stop();
                } catch (error) {
                    try {
                        instance.disconnect()
                    } catch (error) {
                        //console.log(variable)//No action needed
                    }
                }
            }
            innerScopeVars[key] = [];
        }
        vars = {};
    }

    //Handle refresh/max/min buttons
    const refreshClicked = () => {
        setRefresh(true);
        localStorage.setItem(`${props.page}Value`, props.starterCode);
    }

    /******** EXPORT DATA ******/
    function exportCode() {
        const selectedOption = document.getElementById('exportOptions').value;
        //const codeContent = document.getElementById('codeContent').innerText;

        switch (selectedOption) {
            case 'link':
                exportAsLink();
                break;
            case 'textFile':
                exportAsTextFile();
                break;
            case 'webPage':
                exportAsWebPage();
                break;
            default:
                alert('Please select an export option.');
        }
        document.getElementById('exportOptions').value = "default";
    }

    function exportAsLink() {
        const liveCode = localStorage.getItem(`${props.page}Value`);
        const compressedCode = LZString.compressToEncodedURIComponent(liveCode);
        //const encodedCode = btoa(liveCode);
        const url = `${window.location.origin}${window.location.pathname}?code=${compressedCode}`;
        navigator.clipboard.writeText(url);
        console.log('URL copied to clipboard');
    }

    //Export webpage code
    const exportAsTextFile = () => {
        const blob = new Blob([localStorage.getItem(`${props.page}Value`)], { type: 'text/plain' });
        let filename = prompt('Enter the filename:', 'mySynth.txt');
        if (!filename) {
            filename = 'mySynth.txt';  // Default filename if the user cancels the prompt
        }
        console.log(localStorage.getItem(`${props.page}Value`))

        const url = URL.createObjectURL(blob);
        // Create an invisible anchor element
        //console.log(url)
        const a = document.createElement('a');
        a.style.display = 'none';
        // Set the anchor's href attribute to the URL
        a.href = url;
        // Set the anchor's download attribute to specify the filename
        a.download = filename; // Set the default filename
        // Append the anchor element to the document
        //console.log(a)
        document.body.appendChild(a);
        // Simulate a click event on the anchor to trigger the download
        a.click();
        // Remove the anchor element from the document
        document.body.removeChild(a);
        // Revoke the URL to free up resources
        URL.revokeObjectURL(url);
        console.log(`Exporting file with name: ${filename}`);
    };
      //end export dialog support

    function exportAsWebPage(code) {
        alert("exporting as web page will happen, eventually. . . . :-)")
        /*
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Exported Code</title>
            </head>
            <body>
                <pre>${code}</pre>
            </body>
            </html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'code.html';
        a.click();
        */
    }

    /**** RESIZE CANVAS ****/
    const codeMinClicked = () => {
        setCodeMinimized(!codeMinimized);
        for (let id of canvases) {
            try {
                window[id].divResized(codeMinimized ? '-w' : '+w');
            }
            catch {
            }
        }
    }

    const canvasMinClicked = () => {
        setP5Minimized(!p5Minimized);
    }

    const handleMaximizeCanvas = (canvasId) => {
        if (maximized === canvasId) {
            setMaximized('');
        }
        else {
            setMaximized(canvasId);
        }
    };

    const clearCanvases = () => {
        for (const id of canvases) {
            let canvas = document.getElementById(id);
            canvas.innerHTML = "";
        }
    }

    /**** CREATE HTML ******/
    return (
        <div id="flex" className="flex-container" >
            {!codeMinimized &&
                <div className="flex-child" >
                    <span className="span-container">
                        <span className="span-container">
                            <button className="button-container" onClick={playClicked}>Run</button>
                            {/* <button className={liveCSS} onClick={liveClicked}>Live</button>
                            <button className="button-container" onClick={stopClicked}>Stop</button> */}
                            <MidiKeyboard />
                            <button className="button-container" onClick={refreshClicked}>Starter Code</button>
                        </span>
                        <span className="span-container">
                            

                            <select id="exportOptions" onChange={exportCode} defaultValue="default">
                                <option value="default" disabled>Export Code</option>
                                <option value="link">Link to Code</option>
                                <option value="textFile">Text File</option>
                                <option value="webPage">Web Page</option>
                            </select>

                            {!p5Minimized &&
                                <button className="button-container" onClick={codeMinClicked}>-</button>
                            }
                            <button className="button-container" onClick={canvasMinClicked}>{p5Minimized ? '<=' : '+'}</button>
                        </span>
                    </span>
                    <div id="container" >
                        {height !== false &&
                            <CodeMirror
                                id="codemirror"
                                value={refresh ? props.starterCode : value}
                                initialState={
                                    serializedState
                                        ? {
                                            json: JSON.parse(serializedState || ''),
                                            fields: stateFields,
                                        }
                                        : undefined
                                }
                                options={{
                                    mode: 'javascript',
                                }}
                                extensions={[javascript({ jsx: true })]}
                                onChange={handleCodeChange}
                                onKeyDown={handleKeyDown}
                                onStatistics={handleStatistics}
                                height={height}
                            />
                        }
                    </div>
                </div>
            }
            {!p5Minimized &&
                <div id="canvases" className="flex-child">
                    <span className="span-container">
                        {codeMinimized &&
                            <button className="button-container" onClick={codeMinClicked}>{"=>"}</button>
                        }
                    </span>
                    {canvases.map((id) => (
                        <Canvas key={id} id={id} onMaximize={handleMaximizeCanvas} maximized={maximized} canvasLength={canvases.length} />
                    ))}
                </div>
            }

        </div>

    );
}

export default Editor;