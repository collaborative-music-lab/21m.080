/**
 * Based on: https://github.com/Sambego/oscilloscope.js
 */
/****************************************



OSCILLOSCOPE


****************************************/
import * as Tone from 'tone';

export const Oscilloscope = function(_target) {
    //var _drawWave, _bufferLength, _dataArray;

    //this.target = document.querySelector(target);
    this.target = document.getElementById(_target)

    // Set the dimensions based on the target container
    this.width = this.target.offsetWidth;
    this.height = this.target.offsetHeight;

    // Create the oscilloscope wave element
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
    const context = Tone.context.rawContext;
    this.audioContext = Tone.context.rawContext;

    // Indicates if the oscilloscope is running
    this.running = true;

    // Is the oscilloscope analyser-node connected to the audio-context' destination
    this.hasAudio = false;

     // Create the oscilloscope analyser-node
    this.input= new Tone.Multiply()
    this.gain = new Tone.Signal(1)
    this.analyserNode = this.audioContext.createAnalyser();
    this.input.connect( this.analyserNode )
    this.gain.connect( this.input.factor )

    this.analyserNode.fftSize = 2048; // Default fftSize
    this.bufferLength = this.analyserNode.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.yScaling = 1; //
    this.xScaling = 2;
    this.zoom = 1.25;
    this.enableTrigger = 1;
    this.threshold = 128;

    //ToDo: get constructor to automatically start the scope
    this.constructor = function(){
        this.start();
        this.running = true;
        console.log('scope started');
    }

    // Set-up the analyser-node which we're going to use to get the oscillation wave
    this.setFftSize = function(val){
        if (Math.log2(val) % 1 !== 0) {
            val = Math.pow(2, Math.floor(Math.log2(val)))
            console.log("FFT size must be a power of two.")
        }
        console.log("Setting FFT size to ", val)
        
        this.analyserNode.fftSize = val;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
    }.bind(this);

    /**
     * Draw the oscillation wave
     */
    this.drawWave = function() {
        var path = 'M';

        this.analyserNode.getByteTimeDomainData(this.dataArray);

        // Find the index of the first positive zero-crossing point
        var firstOverThreshold = 0;
        let _threshold = this.threshold;
        if(Math.abs(this.threshold) <= 1) _threshold  = this.threshold*128 + 127;

        for (var i = 1; i < this.bufferLength; i++) {

            let asign = this.dataArray[i] > _threshold;
            let bsign = this.dataArray[i-1] <= _threshold;
            if (Math.abs(asign + bsign) == 2) {
                firstOverThreshold = i;
                break;
            }
        }

        if ( this.enableTrigger == 0) firstOverThreshold = 0;

        let x = 0;
        let y = this.height / 2;
        path += `${x} ${y}, `;

        const maxValue = Math.max(...this.dataArray);
        const minValue = Math.min(...this.dataArray);

        ////scale y axis. . . not implemented
        // if(this.yScaling > 1) this.yScaling *= 0.99;
        // if(maxValue > this.yScaling) this.yScaling = maxValue;
        // if(Math.abs(minValue) > this.yScaling) this.yScaling = Math.abs(minValue);

        this.xScaling = this.zoom < 0.1 ? 0.2 : this.zoom * 2;

        for (var i = 0; i < this.bufferLength-firstOverThreshold; i++) {
            let val = (255-this.dataArray[i+firstOverThreshold]) * (1/this.yScaling);
            x = (((this.width + (this.width / this.bufferLength)) / this.bufferLength) * (i));
            x = x * this.xScaling;
            y = ((this.height / 2) * (val / 128.0));


            // Check if the x-coordinate is beyond the width of the scope
            if (x > this.width-10) break; // Exit the loop if x exceeds width

            path += `${x} ${y}, `;
        }

        //draw zero point
        // x += 1
        // y = this.height / 2;
        // path += `${x} ${y}, `;

        this.wave.setAttribute('d', path);
        this.wave.setAttribute('stroke', 'black');
        this.wave.setAttribute('stroke-width', '2');
        this.wave.setAttribute('fill', 'none');

        if (this.running) {
            //console.log(this.dataArray)
            window.requestAnimationFrame(this.drawWave);
        }

        this.disconnect = function(){
            this.target.removeChild(this.svg);
        }.bind(this)

        this.connect = function(_target){
            this.target = document.getElementById(_target)
            this.target.appendChild(this.svg);
        }
    }.bind(this);

    /**
     * Start the oscilloscope
     */
    this.start = function() {
        this.running = true;

        window.requestAnimationFrame(this.drawWave);
    }.bind(this);

    this.stop = function(){
        this.running = false;
    }.bind(this)

    this.start();
};



/****************************************

SPECTROSCOPE

****************************************/

export const Spectroscope = function(_target) {
    //var _drawWave, _bufferLength, _dataArray;

    //this.target = document.querySelector(target);
    this.target = document.getElementById(_target)

    // Set the dimensions based on the target container
    this.width = this.target.offsetWidth;
    this.height = this.target.offsetHeight;

    // Create the oscilloscope wave element
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
    const context = Tone.context.rawContext;
    this.audioContext = Tone.context.rawContext;

    // Indicates if the oscilloscope is running
    this.running = false;

    // Is the oscilloscope analyser-node connected to the audio-context' destination
    this.hasAudio = false;

     // Create the oscilloscope analyser-node
    // Create the oscilloscope analyser-node
    this.input= new Tone.Multiply()
    this.gain = new Tone.Signal(0.1)
    this.analyserNode = this.audioContext.createAnalyser();
    this.input.connect( this.analyserNode )
    this.gain.connect( this.input.factor )

    this.analyserNode.fftSize = 4096; // Default fftSize
    this.bufferLength = this.analyserNode.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    this.yScaling = 1;
    this.maxFrequency = 24000;
    this.minFrequency = 0;
    this.xScaling = 2;
    this.binWidth = 24000 / this.analyserNode.frequencyBinCount;

    // Set-up the analyser-node which we're going to use to get the oscillation wave
    this.setFftSize = function(val){
        if (Math.log2(val) % 1 !== 0) {
            val = Math.pow(2, Math.floor(Math.log2(val)))
            console.log("FFT size must be a power of two.")
        }
        console.log("Setting FFT size to ", val)
        
        this.analyserNode.fftSize = val;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.binWidth = 24000 / this.bufferLength;
    }.bind(this);

    /**
     * Draw the oscillation wave
     */
    this.drawWave = function() {
        var path = 'M';

        this.analyserNode.getByteFrequencyData(this.dataArray);

        let x = this.width;
        let y = this.height / 2;

        const maxValue = Math.max(...this.dataArray);
        const minValue = Math.min(...this.dataArray);

        ////scale y axis. . . not implemented
        // if(this.yScaling > 1) this.yScaling *= 0.99;
        // if(maxValue > this.yScaling) this.yScaling = maxValue;
        // if(Math.abs(minValue) > this.yScaling) this.yScaling = Math.abs(minValue);

        x = 0
        y = this.height;

        path += `${x} ${y}, `;
        for (var i = 0 ; i < this.bufferLength; i++) {

            let freqDivider = 24000 / (this.maxFrequency-this.minFrequency)
            let freqOffset = this.minFrequency / this.binWidth

            //To do: get minFrequency working
            //console.log(this.binWidth, freqOffset, freqDivider)

            let val = (255-this.dataArray[i+freqOffset]) * (1/this.yScaling);
            x = (((this.width + (this.width / this.bufferLength)) / this.bufferLength) * (i));
            x = x * freqDivider;
            y = ((this.height / 2) * (val / 128.0));


            // Check if the x-coordinate is beyond the width of the scope
            if (x > this.width) break; // Exit the loop if x exceeds width

            path += `${x} ${y}, `;
        }

        x += 1
        y = this.height;

        path += `${x} ${y}, `;

        this.wave.setAttribute('d', path);
        this.wave.setAttribute('stroke', 'black');
        //this.wave.setAttribute('stroke-width', '2');
        //this.wave.setAttribute('fill', 'none');

        if (this.running) {
            //console.log(this.dataArray)
            window.requestAnimationFrame(this.drawWave);
        }
    }.bind(this);


    /**
     * Start the oscilloscope
     */
    this.start = function() {
        this.running = true;

        window.requestAnimationFrame(this.drawWave);
    }.bind(this);

    this.stop = function(){
        this.running = false;
    }.bind(this)

    this.disconnect = function(){
        this.target.removeChild(this.svg);
    }.bind(this)

    this.connect = function(_target){
        this.target = document.getElementById(_target)
        this.target.appendChild(this.svg);
    }

    this.start();
};

/****************************************

plotTransferFunction

****************************************/

export const PlotTransferFunction2 = function(transferFunction, _target) {
    const target = document.getElementById(_target);
    //const width = target.offsetWidth;
    const width = target.offsetHeight;
    const height = target.offsetHeight;
    const scale = 100; // Scale to map the range -1 to 1 to the canvas size
//
    // Clear previous drawings
    target.innerHTML = '';
//
    // Draw axis
    const axis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    axis.setAttribute("x1", width / 2);
    axis.setAttribute("y1", 0);
    axis.setAttribute("x2", width / 2);
    axis.setAttribute("y2", height);
    axis.setAttribute("stroke", "black");
    target.appendChild(axis);
//
    let previousPoint = null;
//
    // Plot the function by stepping from -1 to 1
    for (let x = -1; x <= 1; x += 0.01) {
        const y = transferFunction(x);
        const targetX = (x + 1) * scale; // shift and scale x to fit in the svg
        const targetY = height - (y + 1) * scale / 2; // scale and invert y to fit in the svg
//
        if (previousPoint) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", previousPoint.x);
            line.setAttribute("y1", previousPoint.y);
            line.setAttribute("x2", targetX);
            line.setAttribute("y2", targetY);
            line.setAttribute("stroke", "red");
            target.appendChild(line);
            console.log(targetX, targetY)
        }
//
        previousPoint = { x: targetX, y: targetY };
    }
}//plotTransfwrFunction


export const PlotTransferFunction3 = function(transferFunction, canvasId) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) {
        console.error('No element with id ' + canvasId + ' found.');
        return;
    }
    
    if (!canvas.getContext) {
        console.error('The element is not a canvas.');
        return;
    }

    if (canvas.getContext) {
        console.log('drawing transfer function on canvas ' + canvasId)
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const scale = 100; // Scale to map the range -1 to 1 to the canvas size

        // Clear previous drawings and fill with a background color
                ctx.fillStyle = 'black'; // Set the background color
                ctx.fillRect(0, 0, width, height); // Fill the canvas with the background color

        // Draw axis
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.strokeStyle = 'black';
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = 'red';

        // Move to the first point
        let x = -1;
        let y = transferFunction(x);
        ctx.moveTo((x + 1) * scale, height - (y + 1) * scale / 2);

        // Plot the function by stepping from -1 to 1
        for (x = -1; x <= 1; x += 0.01) {
            y = transferFunction(x);
            const svgX = (x + 1) * scale; // shift and scale x to fit in the canvas
            const svgY = height - (y + 1) * scale / 2; // scale and invert y to fit in the canvas
            ctx.lineTo(svgX, svgY);
            console.log(svgX, svgY)
        }

        ctx.stroke();
    }
}

export const PlotTransferFunction = function(myFunction, _target) {
    const target = document.getElementById(_target);

    // Set the dimensions based on the target container
    const width = target.offsetWidth; // seems like it might be a typo; consider using target.offsetWidth
    const height = target.offsetHeight;
    const graph_size = height - 10

    // Check if an existing SVG is present and remove it if it is
    const existingSVG = target.querySelector('svg.transfer-function-svg');
    if (existingSVG) {
        target.removeChild(existingSVG);
    }

    // Create the SVG element for the transfer function
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('class', 'transfer-function-svg');

    // Draw border around the graph
    const border = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    border.setAttribute('x', '1');
    border.setAttribute('y', '1');
    border.setAttribute('width', graph_size - 1);
    border.setAttribute('height', graph_size - 1);
    border.setAttribute('stroke', 'black');
    border.setAttribute('fill', 'none');
    svg.appendChild(border);

    // Create the path element for the transfer function
    const path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    path.setAttribute('class', 'transfer-function-path');
    svg.appendChild(path);

    // Append the SVG element to the target container
    target.appendChild(svg);

    // Function to draw the transfer function
    var _path = 'M';
    let range = {min: -1, max: 1};
    let step = (range.max - range.min) / graph_size;
    let x = range.min;

    for (let i = 0; i < graph_size; i++) {
        let y = myFunction(x);
        let svgX = i;  // map x directly to pixel x-coordinate
        let svgY = graph_size / 2 - (y * graph_size/2);  // scale y and invert, adjust scale factor as needed

        _path += `${svgX} ${svgY} `;
        x += step;
    }

    path.setAttribute('d', _path);
    path.setAttribute('stroke', 'black');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');

    // Add labels for -1 and 1 on both the X and Y axes
    function addLabel(text, x, y) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', y);
        label.textContent = text;
        label.setAttribute('font-family', 'sans-serif');
        label.setAttribute('font-size', '10px');
        label.setAttribute('fill', 'black');
        svg.appendChild(label);
    }

     // Add labels for -1 and 1 on both the X and Y axes with optional rotation
    function addLabel(text, x, y, rotation, anchor, valign) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', y);
        label.textContent = text;
        label.setAttribute('font-family', 'sans-serif');
        label.setAttribute('font-size', '10px');
        label.setAttribute('fill', 'black');
        if (rotation) {
            label.setAttribute('transform', `rotate(${rotation} ${x}, ${y})`);
        }
        if (anchor) {
            label.setAttribute('text-anchor', anchor);
        }
        if (valign) {
            label.setAttribute('alignment-baseline', valign);
        }
        svg.appendChild(label);
    }

    addLabel('-1', 5, height - 2, 0, 'start', 'baseline');
    addLabel('input', graph_size / 2, height - 11, 0, 'middle', 'hanging');
    addLabel('1', graph_size - 5, height - 2,0, 'end', 'baseline');
    addLabel('-1', graph_size + 3, graph_size - 5, 90, 'middle', 'baseline');
    addLabel('1', graph_size + 13, 10, 90, 'middle', 'hanging');
    addLabel('output', graph_size + 3, graph_size / 2, 90, 'middle', 'baseline'); // Rotated "output" label
}


