import { midi, onMIDISuccess, onMIDIFailure, setMidiInput, setMidiOutput, getMidiIO,
	handleMidiInput, outputMidiID, midiMap, ccMap, stopMap, mute, muted, toggleMute } from "./midi_control.js";
import { Seq, seqs_dict, checkSeqs, _, stopEverything} from './seq_control.js'
import { makingIf, startTern } from "./algorithm_control.js";
import { createStarterText, starterCode } from  "./starterCode.js"
import {floor, ceil, peak, cos, round, trunc, abs} from './midi_math.js';

//const fs = require('fs'); //for reading text files

//http-server -o index.html -p 8000
export var globalClock = 0;
export var beatsPerMeasure = 4;
var noteOns = [];
export var midiClock = false;
var clockWorker = null;
var tempo = 110;
// var muted = false;
var mapping = false;
export var major = [60, 62, 64, 65, 67, 69, 71];
export var minor = [60, 62, 63, 65, 67, 68, 70];
export var scale = major; //and minor, can add other modes too 

//send note offs when tab is closed
addEventListener("unload", (event) => { stopEverything(); });

// var audioCtx = new (window.AudioContext || window.webkitAudioContext);
// Tone.context = audioCtx;

var context = Tone.context.rawContext

export function setupClock() {
	if (window.Worker) {
		clockWorker = new Worker('clockWorker.js');

		clockWorker.onmessage = (event) => {
			if (!midiClock) {
				onClock();
			}
			const currentTime = event.data;
			// clockElement.textContent = currentTime.toLocaleTimeString();
		};

		clockWorker.postMessage({ type: 'start', interval: 1 / (tempo / 60) * 1000 / 24 });

		//   clockElement.textContent = currentTime.toLocaleTimeString();

		// clockWorker.postMessage('start');
	} else {
		// Fallback for browsers that don't support Web Workers
		console.warn("browser doesn't support internal clock");
		// setInterval(() => {
		//   const currentTime = new Date();
		//   clockElement.textContent = currentTime.toLocaleTimeString();
		// }, 1000);
	}
}

function changeTempo(tempo) {
	var interval = 1 / (tempo / 60) * 1000 / 24;
	clockWorker.postMessage({ type: 'changeInterval', interval: interval });
}

function changeRow(row){
	beatsPerMeasure = row;
	console.log('beats per measure: ' + beatsPerMeasure);
}

//execute on every incoming tick from midi clock
//24 ppqn
function onClock() {
	//start new seqs
	if (globalClock % (24 * beatsPerMeasure) == 0) {
		// console.log(seqsToStart);
		// console.log(seqs);
		for (var key in seqsToStart) {
			if (key in seqs_dict) {
				seqs_dict[key].stop();
			}
			seqs_dict[key] = seqsToStart[key];
			seqs_dict[key].name = key;
			seqs_dict[key].start();
		}
		seqsToStart = {};
	}
	globalClock += 1;
	checkSeqs();
	if (mapping != false & globalClock % 10 == 0) {
		console.log('sending');
		const message = [mapping[0], mapping[1], 1];    // 0x80 note off + channel, midi pitch num, velocity
		var output = midi.outputs.get(outputMidiID);
		output.send(message);
	}
}

document.getElementById("play-button").addEventListener("click", async function () {
	unfreezeEditor();
	if (Tone.Transport.state !== 'started') {
		await Tone.start();
		Tone.Transport.start();
		console.log('started');
	} else {
		Tone.Transport.stop();
	}
});

navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

var seqs = []

function changeTimeSig(timeSig) {
	reset();
}

//for user to access
// function sendMidiMessage(note, velocity, channel) {
// 	sendNote(note, velocity, channel);
// }

var seqsToStart = {}


function checkStringForNonVariable(str){
	for(var i=0;i<str.length;i++) {
		if (str[i]=='(') return true;
		else if (str[i]=='{') return true;
		else if (str[i]=='\t') return true;
		else if (str[i]=='=') return false;
	}
	return false;
}

function isNumber(str){
	return !isNaN(parseInt(str));
}

//replaces all arrays with 0 for regex parsing
function removeArray(str){
	while(str.includes('[')){
		str = str.slice(0, str.indexOf('['))+'0'+str.slice(str.indexOf(']')+1);
	}
	return str;
}

/************************************
 * RUN CODE
 * - main code parser for codemirror
 * ************************************/
var editor = null;
function runCode(code) {
	//alt-x (≈)	generates a musical tie, like _ generates a rest
	code = code.replace("≈", -87654321);
	
	var lines = code.split('\n');
	code = '';

	var seqArrays = {}; //to store the names of each seq's named arrays

	for (var line of lines) {
		if (line[0] === ';') { //sometimes codeMirror begins a line with a semicolon which we need to avoid here
				line = line.slice(1);
			}

		//ignore lines that start with comments
		if (line[0] === '/' && line[1] === '/') line = ''

		//add 'globalThis.' to every variable to ensure that they are globally scoped in node
		//add global.this to all variable definitions
		if (checkStringForNonVariable(line)){//true if there is '(' before '='
			//e.g.'not a variable'
			code += line;
		}
		else if (line.match(/\s*(\w+)\s*=\s*([^;]+)/)) { //is a variable definition, add globalThis
			code += 'globalThis.' + line;
		} else { //not a variable declaration- just add it
			code += line; 
		}

		//check for named inputs to Seq so we can let them be redefined
		//this lets us pass an array to Seq and updates to the array are
		//passed through to the seq
		var inputs = removeArray(line).replace('/','').match(/(\w+)\s*=\s*new\s+Seq\((\w+),?\s*(\w+)?,?\s*\d*\)/);
		if(inputs){
			var seqName = inputs[1]; 
			var notes = isNumber(inputs[2]) ? null : inputs[2]; //set to null if notes is a number (at this point, arrays have been converted to numbers)
			var durs = isNumber(inputs[3]) ? null : inputs[3];
			seqArrays[seqName] = [notes, durs];
		}
		code += ';';  //enable multiple lines to execute at once
	}
	//if the code contains a "startTern", we just want to start the algorithm. Don't execute the code.
	if(code.indexOf('startTern')!==-1){
		startTern();
		return;
	}

	//console.log(code)
	eval(code);


	var assignments = code.match(/(globalThis\.\s+(\w+)\s*=\s*([^;]+))|(globalThis\.(\w+)\s*=\s*([^;]+))/g);
	if (assignments) {
		for (var i = 0; i < assignments.length; i++) {
			var assignment = assignments[i].match(/globalThis\.\s*(\w+)\s*=\s*([^;]+)/);
			if (assignment) {
				var variableName = assignment[1];
				window[variableName] = eval(assignment[1]);
				//if it's a sequencer, add to list
					if (eval(variableName) instanceof Seq) {
						seqsToStart[variableName] = eval(variableName);
						eval(variableName).valsName = seqArrays[variableName][0];
						eval(variableName).dursName = seqArrays[variableName][1];
					}
			}
		}
	}
}

function evaluateBlock() {
	try {
		var positions = [];
		let linepos = editor.getCursor().line;
		var line = editor.getLine(linepos);
		while (line.replace(/\s/g, "") != '') {
			positions.push(linepos);
			linepos = linepos - 1;
			line = editor.getLine(linepos);
			if (line == undefined) {
				break;
			}
		}
		linepos = editor.getCursor().line + 1
		line = editor.getLine(linepos)
		if (line != undefined) {
			while (line.replace(/\s/g, "") != '') {
				positions.push(linepos);
				linepos = linepos + 1;
				line = editor.getLine(linepos);
				if (line == undefined) {
					break;
				}
			}
		}
		positions.sort();
		var codeToRun = ';'
		for (var position of positions) {
			codeToRun += editor.getLine(position) + '\n';
		}
		runCode(codeToRun);
	} catch (e) {
		console.error(e);
	}

}

function evaluateLine() {
	try {
		let pos = editor.getCursor()
		var line = editor.getLine(pos.line)
		runCode(line);
	} catch (e) {
		console.error(e);
	}

}

function evaluateCode() {
	var code = editor.getValue();
	try {
		runCode(code);
	} catch (e) {
		console.error(e);
	}
}

/************************************
 * 
 * INITIALIZE CODEBOX
 * 
 * ************************************/
var editor = null;
export function initializeCodeBox() {
	let starterText = createStarterText(getMidiIO());

	editor = CodeMirror(document.body, {
		extraKeys: {
			'Ctrl-Enter': evaluateLine,
			//'Shift-Enter': evaluateCode,
			'Ctrl-.': stopEverything,
			'Alt-Enter': evaluateBlock,
		},
		//value: instructions + '\n' + midiInputs + '\n' + midiOutputs + '\n' + midiCodeExample + '\n\na = new Seq([1,3,2,4]);\n',
		value: starterText,
		mode: "javascript"
	});
	editor.setSize()
} //initialize codebox

//add stringToAdd to the end of the codebox
export function addToEditor(stringToAdd) {
	var lineCount = editor.lineCount(); // Get the total number of lines
	var lastLine = editor.getLine(lineCount - 1); // Get the content of the last line
	var lastLineEnd = editor.posFromIndex(editor.indexFromPos({ line: lineCount - 1, ch: 0 })) + lastLine.length; // Calculate the end position of the last line

	var newLineContent = stringToAdd; // The content of the new line

	// Add the new line at the end
	editor.replaceRange("\n" + newLineContent, editor.posFromIndex(lastLineEnd));

	// Update line numbers
	editor.refresh();
}

//replace the last line with stringToReplace
export function replaceLastLine(stringToReplace) {
	var lineCount = editor.lineCount(); // Get the total number of lines
	var lastLine = lineCount - 1; // Index of the last line
	var lastLineText = editor.getLine(lastLine); // Get the content of the last line
	var lastLineStart = { line: lastLine, ch: 0 }; // Start position of the last line
	var lastLineEnd = { line: lastLine, ch: lastLineText.length }; // End position of the last line

	// Replace the entire contents of the last line with the new content
	editor.replaceRange(stringToReplace, lastLineStart, lastLineEnd);

	// Update line numbers
	editor.refresh();
}

//Search for stringToReplace in the codebox and replace the last instance of it with newString
export function replaceString(stringToReplace, newString) {
	var cursor = editor.getSearchCursor(stringToReplace);
	var lineNumber = -1;

	while (cursor.findNext()) {
		lineNumber = cursor.from().line;
	}

	if(lineNumber===-1){
		console.warn("couldn't find string");
		return;
	}
	
	var lineText = editor.getLine(lineNumber); // Get the content of the line
	var startOfString = lineText.lastIndexOf(stringToReplace);
	var lineStart = { line: lineNumber, ch: startOfString}; // Start position of the last line
	var lineEnd = { line: lineNumber, ch: startOfString + stringToReplace.length }; // End position of the last line
	// Replace the entire contents of the last line with the new content
	editor.replaceRange(newString, lineStart, lineEnd);

	// Update line numbers
	editor.refresh();
}

export function freezeEditor(){
	editor.setOption("readOnly", "nocursor");
}

export function unfreezeEditor(){
	editor.setOption("readOnly", false);
}

/****************************************



OSCILLOSCOPE


****************************************/

var Oscilloscope = Oscilloscope || function(_target, context) {
    var _drawWave, _bufferLength, _dataArray;

    //this.target = document.querySelector(target);
    this.target = document.getElementById(_target)

    // Set the dimensions based on the target container
    this.width = this.target.offsetWidth;
    this.height = this.target.offsetHeight;

    // Create the oscilloscopt wave element
    this.wave = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    this.wave.setAttribute('class', 'oscilloscope__wave');

    // Create the oscilloscope svg element
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute('width', this.width);
    this.svg.setAttribute('height', this.height);
    this.svg.setAttribute('class', 'oscilloscope__svg');
    this.svg.appendChild(this.wave);

    // Append the svg element to the target container
    this.target.appendChild(this.svg);

    // Add the audio context or create a new one
    this.audioContext = context || new window.AudioContext();

    // Indicates if the oscilloscope is running
    this.running = false;

    // Is the oscilloscope analyser-node connected to the audio-context' destination
    this.hasAudio = false;

    this.analyserNode = this.audioContext.createAnalyser();

    this.analyserNode.fftSize = 128;
    _bufferLength = this.analyserNode.frequencyBinCount;
    _dataArray = new Uint8Array(_bufferLength);

    // Set-up the analyser-node which we're going to use to get the oscillation wave
    this.setFftSize = function(val){
    	this.analyserNode.fftSize = val;
    	_bufferLength = this.analyserNode.frequencyBinCount;
    	_dataArray = new Uint8Array(_bufferLength);
    }
  
    /**
     * Draw the oscillation wave
     */
    _drawWave = function() {
        var path = 'M';

        this.analyserNode.getByteTimeDomainData(_dataArray);

        _dataArray.forEach(function(point, i) {
            path += (((this.width + (this.width / _bufferLength))/ _bufferLength) * i) + ' ' + ((this.height / 2) * (point / 128.0)) + ', ';
        }.bind(this));

        this.wave.setAttribute('d', path);

        if (this.running) {
            window.requestAnimationFrame(_drawWave);
        }
    }.bind(this);

    /**
     * Start the oscilloscope
     */
    this.start = function() {
        this.running = true;

        window.requestAnimationFrame(_drawWave);
    }.bind(this);
};

/**
 * Stop the oscilloscope
 */
Oscilloscope.prototype.stop = function() {
    this.running = false;
};

/**
 * Connect the analyser-node to another audio-node
 * @param  {audioNode} node An audio-node to connect to
 */
Oscilloscope.prototype.connect = function(node) {
    this.analyserNode.connect(node);
};

/**
 * Connect the analyser-node to the audio-context' destination
 */
Oscilloscope.prototype.toggleAudio = function() {
    if (!!this.hasAudio) {
        this.analyserNode.disconnect();
    } else {
        this.analyserNode.connect(this.audioContext.destination);
    }

    this.hasAudio = !this.hasAudio;
};