//2:30
import { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { historyField } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';

import p5 from 'p5';
import * as Tone from 'tone';
import Canvas from "./Canvas.js";
import gui_sketch from "./gui.js";
import { Oscilloscope, Spectroscope } from './oscilloscope';
import MidiKeyboard from './midiKeyboard.js';
const midi = require('./Midi.js');
//Save history in browser
const stateFields = { history: historyField };


function Editor(props) {

    window.p5 = p5;
    window.gui_sketch = gui_sketch;
    window.Tone = Tone;
    window.Oscilloscope = Oscilloscope;
    window.Spectroscope = Spectroscope;
    window.gui_sketch = gui_sketch;
    window.setMidiInput = midi.setMidiInput;
    window.setNoteOnHandler = midi.midiHandlerInstance.setNoteOnHandler.bind(midi.midiHandlerInstance);
    window.setNoteOffHandler = midi.midiHandlerInstance.setNoteOffHandler.bind(midi.midiHandlerInstance);
    window.setCCHandler = midi.midiHandlerInstance.setCCHandler.bind(midi.midiHandlerInstance);

    var curLineNum = 0;

    // Save history in browser
    const serializedState = localStorage.getItem(`${props.page}EditorState`);
    const value = localStorage.getItem(`${props.page}Value`) || props.starterCode;

    const [height, setHeight] = useState(false);
    const [code, setCode] = useState(value); //full string of user code
    var vars = {}; //current audioNodes
    var innerScopeVars = {}; //maps vars inside scope to a list of its instances
    window.innerScopeVars = innerScopeVars;
    const [liveMode, setLiveMode] = useState(true); //live mode is on by default
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
        //let p5Code = "";
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
                    if (!state.innerScope) {
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
                    else {
                        innerVars[innerVars.length - 1].push(name);
                        if (!Object.keys(innerScopeVars).includes(name)) {
                            innerScopeVars[name] = [];
                        }
                    }
                    //In case of no assignment, set to var to null
                    let init = declaration.init;
                    if (!init) {
                        string = string.substring(0, end + incr) + " = null" + string.substring(end + incr);
                        incr += length2;
                    }
                    else if (init.body) {
                        let newState = {
                            innerScope: true
                        }
                        innerVars.push([]);
                        c(init.body, newState);
                        //Add vals of innerVar to innerScopeVars
                        handleScopedVars(init.body.end + incr);

                        // let val = string.substring(init.start + incr, init.end + incr);
                        // for (let canvas of canvases) {
                        //     if (val.includes(canvas)) {
                        //         p5Code += `${canvas}.elements[${name}]="${val}"\n`;
                        //     }
                        // }
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
                    innerScope: true
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
                    innerScope: true
                }
                innerVars.push([]);
                c(node.body, newState);
                handleScopedVars(node.end + incr);
            }
        }

        const initialState = {
            innerScope: false
        };

        try {
            walk.recursive(ast, initialState, visitors);
        } catch (error) {
            console.log("Error parsing code: ", error);
        }
        return [string, varNames];
    }

    function evaluate(string) {
        try {
            return eval(string);
            //eval(p5Code);
        } catch (error) {
            console.log("Error Evaluating Code", error);
        }
    }

    function updateVars(varNames) {
        let cleanedCode = removeComments();
        function isAudioNode(node) {
            return node.context || node instanceof AudioContext;
        }
        for (const [key, instances] of Object.entries(innerScopeVars)) {
            if (liveMode && !cleanedCode.includes(key)) {
                for (const instance of instances) {
                    try {
                        instance.stop();
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
            let val = eval(varName)
            if (isAudioNode(val)) {
                vars[varName] = val;
            }
        }

        //Remove all vars that have been deleted from full code
        if (liveMode) {
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
    }

    function traverse(string) {
        const [updatedString, varNames] = updateCode(string);
        evaluate(updatedString);
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

    function evaluateBlock() {
        try {
            const lines = code.split("\n");
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
        if (liveMode) {
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
    const liveClicked = () => {
        setLiveMode(!liveMode);
    }
    const stopClicked = () => {
        clearCanvases();
        for (const key in vars) {
            let variable = vars[key];
            try {
                variable.stop();
            } catch (error) {
                //No action needed
            }
        }

        for (const [key, instances] of Object.entries(innerScopeVars)) {
            for (const instance of instances) {
                try {
                    instance.stop();
                } catch (error) {
                    //val not playing sound
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
    const codeMinClicked = () => {
        setCodeMinimized(!codeMinimized);
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

    const liveCSS = liveMode ? 'button-container active' : 'button-container';

    return (
        <div className="flex-container" >
            {!codeMinimized &&
                <div className="flex-child" >
                    <span className="span-container">
                        <span className="span-container">
                            <button className="button-container" onClick={playClicked}>Run</button>
                            <button className={liveCSS} onClick={liveClicked}>Live</button>
                            <button className="button-container" onClick={stopClicked}>Stop</button>
                        </span>
                        <span className="span-container">
                            <MidiKeyboard />
                            <button className="button-container" onClick={refreshClicked}>Starter Code</button>
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
                <div className="flex-child">
                    <span className="span-container">
                        {codeMinimized &&
                            <button className="button-container" onClick={codeMinClicked}>{"=>"}</button>
                        }
                    </span>
                    {canvases.map((id) => (
                        (!maximized || maximized === id) && (
                            <Canvas key={id} id={id} onMaximize={handleMaximizeCanvas} maxOption={canvases.length > 1} />
                        )
                    ))}
                </div>
            }
        </div>
    );
}

export default Editor;