/*
p5Elements.js
created by Kayli Requenez F23

Notes: to add new gui elements, make the following changes:
- in Editor.js: add element to p5Elements elements array (line 32)
- in Canvas.js: add element to import statement on line 2 (import { initialize, divResized, drawElements, Knob, Fader, Button, Toggle, RadioButton } from './p5Library';)
    - also add window.element identifier, similar to lines 6 - 10   
*/


import p5 from 'p5';
import themes from './p5Themes.json';
let activeTheme = themes.themes['default']; // Default theme preset

export function debug(){
    console.log('esy')
    console.log(activeTheme)
}

//************** THEME DEFINITIONS *************/
// Function to list available themes
export function listThemes() {
  return Object.keys(themes.themes);
}

export function setTheme(themeName) {
    if (!themes.themes[themeName]) {
        console.error(`Theme '${themeName}' not found.`);
        return;
  } 
    activeTheme = themes.themes[themeName]; // Default theme preset
    console.log(activeTheme)
    // Update GuiColors with color values from the selected theme
    GuiColors.background = activeTheme.backgroundColor;
    GuiColors.border = activeTheme.borderColor;
    GuiColors.accent = activeTheme.accentColor;
    GuiColors.text = activeTheme.textColor;

    // Update GuiFonts with font values from the selected theme
    GuiFonts.label = activeTheme.labelFont;
    GuiFonts.value = activeTheme.valueFont;
    GuiFonts.text = activeTheme.textFont;
    GuiFonts.textAlt = activeTheme.textAltFont;

    console.log(activeTheme)
}

// Function to update theme parameters
export function updateThemeParameters(parameters) {
  if (activeTheme) {
    // Merge the provided parameters with the active theme
    activeTheme = { ...activeTheme, ...parameters };
  } else {
    console.error(`Active theme '${activeTheme}' not found.`);
  }
}

// Function to get the current theme values in JSON format
export function getCurrentThemeJSON() {
  return JSON.stringify(activeTheme, null, 2);
}

//************** INITIALIZE **************

export function initialize(p, div, backgroundColor) {
    p.div = div;
    p.createCanvas(div.offsetWidth, div.offsetHeight);
    p.width = div.offsetWidth;
    p.height = div.offsetHeight;
    p.elements = {};
    if (backgroundColor) {
        p.backgroundColor = backgroundColor;
        p.background(backgroundColor);
    }
//     console.log( "active theme:",  )
//     activeTheme = 'dark'; // Default theme preset
//     console.log( themes )
//     console.log( themes[ activeTheme ])
//     console.log( themes.activeTheme )
//     console.log( themes.activeTheme.borderWidth )
// }
}

p5.prototype.initialize = function (div, backgroundColor = false) {
    initialize(this, div, backgroundColor);
};

function resizeP5(string, scaleWidth, scaleHeight) {
    var regex = /(\w+)\.(\w+)\((.*?)\)/;
    var match = string.match(regex);

    if (match) {
        // Extract the canvas, function name, and items inside the parentheses
        var canvasName = match[1]
        var functionName = match[2];
        let items = match[3].split(',').map(item => item.trim());

        // New values
        for (let i = 0; i < (functionName === 'arc' ? 4 : items.length); i++) {
            if (functionName === 'circle' && i > 1) {
                items[i] *= (scaleWidth + scaleHeight) / 2;
            }
            else {
                if (i % 2 === 0) {
                    items[i] *= scaleWidth;
                }
                else {
                    items[i] *= scaleHeight;
                }
            }
        }

        // Replace the items with new values
        return string.replace(match[0], canvasName + '.' + functionName + '(' + items.join(', ') + ')');
    }
    return string;
}

export function divResized(p, maxClicked, canvasLength) {
    let prevWidth = p.width;
    let prevHeight = p.height;
    p.resizeCanvas(0, 0);
    let canvasesCont = document.getElementById("canvases");
    let controlsCont = document.getElementById("controls");
    let flexCont = document.getElementById('flex');
    if (maxClicked === '+h') {
        p.height = canvasesCont.offsetHeight - controlsCont.offsetHeight;
        p.width = p.div.offsetWidth;
    }
    else if (maxClicked === '-h') {
        p.height = canvasesCont.offsetHeight / canvasLength - controlsCont.offsetHeight;
        p.width = prevWidth;
    }
    else if (maxClicked === '+w') {
        p.width = flexCont.offsetWidth;
        p.height = p.div.offsetHeight;
    }
    else if (maxClicked === '-w') {
        p.width = flexCont.offsetWidth / 2;
        p.height = prevHeight;
    }
    else {
        p.width = p.div.offsetWidth;
        p.height = p.div.offsetHeight;
    }
    let scaleWidth = p.width / prevWidth;
    let scaleHeight = p.height / prevHeight;
    p.resizeCanvas(p.width, p.height);
    for (let [key, element] of Object.entries(p.elements)) {
        if (typeof (element) === "string") {
            p.elements[key] = resizeP5(element, scaleWidth, scaleHeight);
        }
        else {
            element.resize(scaleWidth, scaleHeight);
        }
    }
    p.drawElements();
};

p5.prototype.divResized = function (maxClicked = false, canvasLength = null) {
    divResized(this, maxClicked, canvasLength);
};

function drawGrid(p) {
    let margin = 10;
    let spacingX = Math.ceil((p.width - 2 * margin) / 3) - 5;
    let spacingY = Math.ceil((p.height - 2 * margin) / 3) - 5;
    p.textSize(12);
    let isBlack = p.red(p.backgroundColor) === 0 && p.green(p.backgroundColor) === 0 && p.blue(p.backgroundColor) === 0;
    p.fill(isBlack ? 255 : 0);
    p.noStroke();
    for (let i = 0; i < 4; i++) {
        let x = margin + i * spacingX;
        let y = margin + i * spacingY;
        p.text(x, x, margin);
        p.text(y, margin, y);
    }
}

let updateCanvas = 1;

//************** DRAWE ELEMENTS //**************

export function drawElements(p) {
    if( updateCanvas > 0 ){
        updateCanvas = 1
        p.background(GuiColors.background);
        //drawGrid(p);
        for (let element of Object.values(p.elements)) {
            if (typeof (element) === "string") {
                //when would this be called?
                eval(element);
            }
            else {
                //draw gui elements
                element.draw();
            }
        }
    }
}

p5.prototype.drawElements = function () {
    drawElements(this);
};

const scaleOutput = function (input, inLow, inHigh, outLow, outHigh, curve) {
    if (curve === undefined) curve = 1;
    let val = (input - inLow) * (1 / (inHigh - inLow));
    val = Math.pow(val, curve);
    return val * (outHigh - outLow) + outLow;
  }


/********************** COLORS & FONTS ***********************/
export const GuiColors = {
    background: [240, 240, 240], // Background color of the GUI
    border: [100, 100, 100], // Border color for elements
    accent: [0, 128, 255], // Highlight or accent color
    text: [0, 0, 0], // Text color
};

export const setColor = function(name, value) {
    if( typeof( name ) == 'string'){
        if (GuiColors.hasOwnProperty(name)) {
            GuiColors[name] = value;
        } else {
            GuiColors[name] = value;
            console.error(`new Color added: ${name}`);
        }
        
    }
    // updateCanvas = 1;
    //p.drawElements();
}

const getColor = function(name) {
    if (GuiColors.hasOwnProperty(name)) {
        return GuiColors[name];
    } else if (Array.isArray(name)){
        return name
    } else {
        console.error(`Invalid color property: ${name}`);
        return [0,0,0]
    }
}

export const GuiFonts = {
    label: 'Helvetica',
    value: 'Courier',
    text: 'Times New Roman',
    textAlt: 'Verdana',
};

export const setFont = function(name, value) {
    if (GuiFonts.hasOwnProperty(name)) {
        GuiFonts[name] = value;
    } else {
        GuiFonts[name] = value;
        console.error(`new font added: ${name}`);
    }
    updateCanvas = 1;
    //p.drawElements();
}

const getFont = function(name) {
    if (GuiFonts.hasOwnProperty(name)) {
        return GuiFonts[name];
    } else if ( typeof(name) == 'string' ) return name;
     console.error(`Invalid font property: ${name}`);
     return 'Courier'
}

/**************************************** ELEMENT ******************************************/
let elementXPosition = 0;
let elementYPosition = 25;
let prevElementSize = 0;
let prevYElementSize = 0;
class Element {
    constructor(p, options) {
        this.p = p;
        this.theme = activeTheme;
        this.label = options.label || "myElement";
        this.id = this.label;
        let i = 1;
        while (this.id in p.elements) {
            this.id += i;
            i++;
        }
        //appearance
        this.style = options.style || 1;
        this.size = options.size || 1;
        this.textSize = options.textSize || 1;
        this.border = options.border || 'theme' || 6;
        this.borderColor = options.borderColor || 'border';
        this.accentColor = options.accentColor || 'accent';
        this.textColor = options.textColor || 'text';
        this.showLabel = options.showLabel ||activeTheme.showLabel || true;
        this.showValue = options.showValue ||activeTheme.showValue || true;
        this.labelFont = options.labelFont || 'label'
        this.valueFont = options.valueFont || 'value'
        this.textFont = options.textFont || 'text'
        this.borderRadius = options.borderRadius ||activeTheme.borderRadius || 0;

        //position
        let currentGap = (prevElementSize+this.size) / 2
        elementXPosition+=(8*currentGap+5);
        if(elementXPosition>(100-this.size*8)){
            elementXPosition = this.size/2*8+5
            elementYPosition += (20*prevYElementSize+10)
            prevYElementSize=this.size
        }
        this.x = options.x || elementXPosition;
        this.y = options.y || elementYPosition;
        prevElementSize = this.size
        prevYElementSize = this.size>prevYElementSize ? this.size : prevYElementSize;
        this.cur_x = (this.x/100)*this.p.width
        this.cur_y = (this.y/100)*this.p.height
        this.cur_size = (this.size/6)*this.p.width
        this.x_box = this.cur_size;
        this.y_box = this.cur_size;

        //parameter values
        this.active = 0;
        this.min = options.min || 0;
        this.max = options.max || 1;
        this.curve = options.curve || 1;
        if(typeof(options.mapto)=='string') this.mapto = eval(options.mapto)
        else this.mapto = options.mapto || null;
        this.callback = options.callback || null;
        this.value = scaleOutput(options.value,this.min,this.max,0,1,1/this.curve) || 0.5;
        p.elements[this.id] = this;

    }

    getParam(param,val){ return val == 'theme' ? activeTheme[param] : val}

    isPressed(){
        // console.log('pressedas', this.label, 
        //     this.p.mouseX.toFixed(1), this.p.mouseY.toFixed(1), 
        //     this.cur_x.toFixed(1), this.cur_y.toFixed(1), 
        //     this.x_box, this.y_box)

        if( this.p.mouseX < (this.cur_x + this.x_box/2) &&
            this.p.mouseX > (this.cur_x - this.x_box/2) &&
            this.p.mouseY > (this.cur_y - this.y_box/2) &&
            this.p.mouseY < (this.cur_y + this.y_box/2) )
        {
            this.active = 1
            console.log('pressedas', this.label, this.p.mouseX.toFixed(1), this.p.mouseY.toFixed(1), this.cur_x.toFixed(1), this.cur_y.toFixed(1), this.x_box, this.y_box)
            console.log(this.cur_y - this.y_box/2, this.cur_y + this.y_box/2)
        }
    }

    isReleased(){
        if( this.active == 1 )  this.active = 0
    }

    resize(scaleWidth, scaleHeight) {
        this.x *= scaleWidth;
        this.y *= scaleHeight;
    }

    drawLabel(x,y){
        this.p.textSize(this.textSize*10);
        this.p.stroke(this.setColor(this.textColor))
        this.p.strokeWeight(0.00001 * this.textSize*20);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.fill(this.setColor(this.textColor));
        this.p.textFont(getFont(this.labelFont))
        this.p.text(this.label, x, y);
    }

    drawValue(x,y){
        let output = scaleOutput(this.value, 0,1, this.min,this.max,this.curve)
        this.p.stroke(this.setColor(this.textColor))
        this.p.textSize(this.textSize*10);
        this.p.strokeWeight(0.00001 * this.textSize*20);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.fill(this.setColor(this.textColor));
        this.p.textFont(getFont(this.valueFont))
        this.p.text(output.toFixed(2), x, y);
    }

    drawText(text,x,y){
        this.p.textSize(this.textSize*10);
        this.p.stroke(this.setColor(this.textColor))
        this.p.strokeWeight(0.00001 * this.textSize*20);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.fill(getColor(this.textColor));
        this.p.textFont(getFont(this.textFont))
        this.p.text(text, x, y);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setColor( arg ){
        if( typeof(arg) == 'string'){
            return getColor( arg )
        }
        else if( Array.isArray(arg) ){
            if( arg.length == 3) return arg
        } 
        console.log(this.label, typeof(arg), 'invalid color')
        return [0,0,0]
    }

    mapValue(value,min,max,curve,destination) {
        let output = scaleOutput(value, 0,1, min,max,curve)
        if (destination) {
            try {
                destination.value.rampto(output, .1);
            } catch {
                try {
                    destination.value = output;
                } catch {
                    try {
                        destination = output;
                    } catch (error) {
                        console.log('Error setting Mapto to value: ', error);
                    }
                }
            }
        } else { console.log(this.label, 'no destination defined')}
    }

    runCallBack() {
        if (this.callback) {
            try {
                this.callback(this.value);
            } catch {
                try {
                    this.callback();
                } catch (error) {
                    console.log('Error with Callback Function: ', error);
                }
            }
        } else { console.log(this.label, 'no callback defined')}
    }

    set(value){
        if(typeof(value) === 'string') this.value = value;
        else{
            this.value = scaleOutput(value,this.min,this.max,0,1,1/this.curve)
            this.mapValue(this.value,this.min,this.max,this.curve,this.mapto);
        }
        this.runCallBack()
    }
}

/**************************************** KNOB ******************************************/
export class Knob extends Element {
    constructor(p, options) {
        super(p, options);
        this.incr = options.incr || 0.01;
        this.degrees = options.degrees || 320;
        this.startAngle = this.p.PI * (4/8 + (360 - this.degrees)/360);
        this.endAngle = this.p.PI * (4/8 - (360 - this.degrees)/360 ) + 2 * this.p.PI;
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight);
        if (Math.max(Math.abs(1 - scaleWidth)) > Math.max(Math.abs(1 - scaleHeight))) this.size *= scaleWidth;
        else this.size *= scaleHeight;
    }

    draw() {
        // Calculate the angle based on the knob's value
        this.startAngle = this.p.PI * (4/8 + (360 - this.degrees)/360);
        this.endAngle = this.p.PI * (4/8 - (360 - this.degrees)/360 ) + 2 * this.p.PI;
        let angle = this.p.map(this.value, 0,1, 0, this.endAngle-this.startAngle);

        this.cur_x = (this.x/100)*this.p.width
        this.cur_y = (this.y/100)*this.p.height
        this.cur_size = (this.size/6)*this.p.width/2
        this.x_box = this.cur_size
        this.y_box = this.cur_size

        let border = this.getParam('border',this.border)

        // clear the previously drawn knob
        // this.p.fill(getColor('background'));
        // let  strokeWeight = this.border;
        // this.p.strokeWeight(strokeWeight);
        // this.p.stroke(getColor('background'));
        // this.p.arc(cur_x, cur_y, cur_size*1.2, cur_size*1.2,0,2*this.p.PI);

        // Display the label string beneath the knob
        if(this.showLabel) this.drawLabel(this.cur_x, this.cur_y + this.cur_size/2 + border  )
        if(this.showValue) this.drawValue(this.cur_x, this.cur_y + this.cur_size/2  + border + this.textSize*10)

        // Draw the inactive knob background
        this.p.noFill();
        this.p.strokeWeight(border);
        this.p.stroke(this.setColor(this.borderColor))
        this.p.arc(this.cur_x, this.cur_y, this.cur_size, this.cur_size, this.p.constrain(this.startAngle + angle + (border/30/this.size/2),this.startAngle,this.endAngle), this.endAngle);

        // Draw the active knob background
        this.p.stroke(this.setColor(this.accentColor));
        this.p.arc(this.cur_x, this.cur_y, this.cur_size, this.cur_size, this.startAngle, this.p.constrain(this.startAngle + angle - (border/30/this.size/2),this.startAngle,this.endAngle));

        // Draw the knob value indicator as a line
        let indicatorLength = this.cur_size / 2 // Length of the indicator line
        let indicatorX = this.cur_x + this.p.cos(this.startAngle+angle) * indicatorLength;
        let indicatorY = this.cur_y + this.p.sin(this.startAngle+angle) * indicatorLength;
        this.p.stroke(this.setColor(this.accentColor));
        this.p.line(this.cur_x, this.cur_y, indicatorX, indicatorY);
    }

    isDragged() {
        if(this.active){
        
            if(this.p.movedY != 0 ){ 
                if( this.p.keyIsDown(this.p.ALT)) this.value -= this.p.movedY * this.incr/10;
                else this.value -= this.p.movedY * this.incr;
            }
            
            if( this.value > 1 ) this.value = 1
            if( this.value < 0 ) this.value = 0
            this.mapValue(this.value,this.min,this.max,this.curve,this.mapto);
            this.runCallBack()
        }
    }
}

p5.prototype.Knob = function (options = {}) {
    return new Knob(this, options);
};

p5.prototype.Dial = function (options = {}) {
    return new Knob(this, options);
};

/**************************************** FADER ******************************************/
export class Fader extends Element {
    constructor(p, options) {
        super(p, options);
        this.incr = options.incr || 0.01;
        this.orientation = options.orientation === 'horizontal'? 'horizontal' : 'vertical';
        this.isHorizontal = this.orientation==='horizontal'
        this.value = this.value || 0.5
        this.dragging = false;
        this.size = options.size || 1
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight);
        this.size *= this.isHorizontal ? scaleWidth : scaleHeight;
    }

    draw() {
        this.isHorizontal = this.orientation==='horizontal'
        this.cur_size = (this.size/6)*this.p.width/2
        let border = this.getParam('border',this.border)
        
        let x_corner = (this.x/100)*this.p.width
        let y_corner = (this.y/100)*this.p.height
        if( this.isHorizontal ) {
            this.x_box = this.cur_size
            this.y_box = border * 3 * this.size
            this.cur_x = (this.x/100)*this.p.width + this.cur_size/2
            this.cur_y = (this.y/100)*this.p.height + border
        }
        else  {
            this.y_box = this.cur_size
            this.x_box = border * 3 * this.size
            this.cur_x = (this.x/100)*this.p.width + border
            this.cur_y = (this.y/100)*this.p.height + this.cur_size/2
        }
        let strokeWeight = border*this.size;
        this.thickness = border // cur_size * .1; //Indicator thickness
        let rectThickness = this.thickness * .95;

        // Display the label string beneath the knob
        //if(this.showLabel) this.drawLabel((this.isHorizontal ? this.cur_x : this.thickness / 2), y_corner + this.textSize*15 + strokeWeight * 2 + (this.isHorizontal ? this.thickness : this.cur_size))
        //if(this.showValue) this.drawValue(this.cur_x + (this.isHorizontal ? this.cur_size / 2 : this.thickness / 2), y_corner + strokeWeight * 2 + (this.isHorizontal ? this.thickness : this.cur_size))
        if(this.showLabel) this.drawLabel(this.cur_x, this.isHorizontal ? this.cur_y+border*3 : this.cur_y+this.cur_size/2+border*3)
        if(this.showValue) this.drawValue(this.cur_x, this.isHorizontal ? this.cur_y+border*5 : this.cur_y+this.cur_size/2+border*5)

        //Display Actual Fader
        this.p.noFill();
        this.p.stroke(this.setColor(this.borderColor))
        this.p.strokeWeight(border*1.5);
        if (this.isHorizontal) this.p.rect(x_corner, y_corner, this.cur_size, border*2);
        else this.p.rect(x_corner, y_corner, border*2, this.cur_size);
        // this.p.stroke(getColor(this.accentColor))
        // if (this.isHorizontal) this.p.rect(this.cur_x, this.cur_y, this.cur_size, border);
        // else this.p.rect(this.cur_x, this.cur_y, rectThickness, this.cur_size);

        //Clear beneath Display Indicator
        this.p.fill(getColor('background') )
        this.p.stroke(this.setColor('background') )
        this.pos = this.p.map(this.value, 0,1, this.isHorizontal ? x_corner : y_corner + this.cur_size - this.thickness, this.isHorizontal ? x_corner + this.cur_size - this.thickness : y_corner);
        let clearSize = border*.25
        if (this.isHorizontal) this.p.rect(this.pos-clearSize, y_corner, this.thickness+clearSize*2, this.thickness*2);
        else this.p.rect(x_corner, this.pos-clearSize, this.thickness*2, this.thickness+clearSize*2);
        //Display indicator
        this.p.fill(this.setColor(this.accentColor));
        this.p.stroke(this.setColor(this.accentColor))
        this.pos = this.p.map(this.value, 0,1, this.isHorizontal ? x_corner : y_corner + this.cur_size - this.thickness, this.isHorizontal ? x_corner + this.cur_size - this.thickness : y_corner);
        if (this.isHorizontal) this.p.rect(this.pos, y_corner, this.thickness, this.thickness*2);
        else this.p.rect(x_corner, this.pos, this.thickness*2, this.thickness);
    }

    isDragged() {
        if( this.active ){
            if (this.isHorizontal){
                if(this.p.movedX != 0 ){ 
                    if( this.p.keyIsDown(this.p.ALT)) this.value += this.p.movedX * this.incr/10;
                    else this.value += this.p.movedX * this.incr / this.size;
                }
            }
            else {
                if(this.p.movedY != 0 ){ 
                    if( this.p.keyIsDown(this.p.ALT)) this.value -= this.p.movedY * this.incr/10;
                    else this.value -= this.p.movedY * this.incr / this.size;
                }
            }
            if( this.value > 1 ) this.value = 1
            if( this.value < 0 ) this.value = 0
            this.mapValue(this.value,this.min,this.max,this.curve,this.mapto);
        }
    }
}

p5.prototype.Fader = function (options = {}) {
    return new Fader(this, options);
};

p5.prototype.Slider = function (options = {}) {
    return new Fader(this, options);
};

/**************************************** PAD ******************************************/
export class Pad extends Element {
    constructor(p, options) {
        super(p, options);
        this.incr = options.incr || 0.01;
        this.valueX = this.valueX || 0.5
        this.valueY = this.valueY || 0.5
        this.dragging = false;
        this.sizeX = options.sizeX || 5
        this.sizeY = options.sizeY || 5
        if(typeof(options.maptoX)=='string') this.maptoX = eval(options.maptoX)
        else this.maptoX = options.maptoX || null;
        if(typeof(options.maptoY)=='string') this.maptoY = eval(options.maptoY)
        else this.maptoY = options.maptoY || null;
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight);
        //this.size *= this.isHorizontal ? scaleWidth : scaleHeight;
    }

    draw() {
        this.cur_size = (this.size/6)*this.p.width/2
        this.cur_sizeX = (this.sizeX/6)*this.p.width/2
        this.cur_sizeY = (this.sizeY/6)*this.p.width/2
        let border = this.getParam('border',this.border)
        
        let x_corner = (this.x/100)*this.p.width-this.cur_sizeX/2
        let y_corner = (this.y/100)*this.p.height-this.cur_sizeY/2

        this.x_box = this.cur_sizeX*2
        this.y_box = this.cur_sizeY*2
        this.cur_x = (this.x/100)*this.p.width + this.cur_sizeX/2
        this.cur_y = (this.y/100)*this.p.height + this.cur_sizeY/2

        //console.log(this.cur_x, this.cur_y, this.x_box,this.y_box)
      
        let strokeWeight = border
        this.thickness = border // cur_size * .1; //Indicator thickness
        let rectThickness = this.thickness * .95;

        //Display Actual Fader
        this.p.fill(this.setColor(this.borderColor));
        this.p.stroke(this.setColor(this.borderColor))
        this.p.strokeWeight(border*1.5);
        this.p.rect(x_corner, y_corner, this.cur_sizeX, this.cur_sizeY);
        
        //Display indicator
        this.p.fill(this.setColor(this.accentColor));
        this.p.stroke(this.setColor(this.accentColor))
        let indicatorX = x_corner + this.valueX *  (this.cur_sizeX - 0*border)
        let indicatorY = y_corner + this.valueY * ( this.cur_sizeY - 0*border)
        //this.pos = this.p.map(this.value, 0,1,  x_corner  + this.cur_size - this.thickness, this.isHorizontal ? x_corner + this.cur_size - this.thickness : y_corner);
        this.p.circle(indicatorX, indicatorY, (this.cur_sizeX+this.cur_sizeY)/30)    
   
        // Display the label and values
        if(this.showLabel) this.drawLabel(this.cur_x,  y_corner + this.sizeY)
        //if(this.showValue) this.drawValue(this.cur_x, this.isHorizontal ? this.cur_y+border*5 : this.cur_y+this.cur_size/2+border*5)

    }

    isDragged() {
        if( this.active ){
            if(this.p.movedX != 0 ){ 
                if( this.p.keyIsDown(this.p.ALT)) this.valueX += this.p.movedX * this.incr/10;
                else this.valueX += this.p.movedX * this.incr / this.sizeX;
            }

            if(this.p.movedY != 0 ){ 
                if( this.p.keyIsDown(this.p.ALT)) this.valueY += this.p.movedY * this.incr/10;
                else this.valueY += this.p.movedY * this.incr / this.sizeY;
            }

            if( this.valueX > 1 ) this.valueX = 1
            if( this.valueX < 0 ) this.valueX = 0
            this.mapValue(this.valueX,this.min,this.max,this.curve,this.maptoX);

            if( this.valueY > 1 ) this.valueY = 1
            if( this.valueY < 0 ) this.valueY = 0
            this.mapValue(this.valueY,this.min,this.max,this.curve,this.maptoY);

            console.log(this.valueX, this.valueY)
        }
    }
}

p5.prototype.Pad = function (options = {}) {
    return new Pad(this, options);
};

/**************************************** BUTTON ******************************************/
export class Button extends Element {
    constructor(p, options) {
        super(p, options);
        this.value = options.value || 0
        this.callback = options.callback || function () { console.log('Define a callback function'); };
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight)
        this.size *= this.horizontal !== false ? scaleWidth : scaleHeight;
    }

    draw() {
        this.cur_x = (this.x/100)*this.p.width
        this.cur_y = (this.y/100)*this.p.height
        this.cur_size = (this.size/6)*this.p.width/2
        this.x_box = this.cur_size
        this.y_box = this.cur_size
        let border = this.getParam('border',this.border)

        if( this.value ){            
            this.p.noFill()
            this.p.stroke(this.setColor(this.accentColor));
            this.p.strokeWeight(border);
            this.p.ellipse(this.cur_x, this.cur_y, this.cur_size, this.cur_size);
        }
        else{
            this.p.noFill()
            this.p.stroke(this.setColor(this.borderColor));
            this.p.strokeWeight(border/2);
            this.p.ellipse(this.cur_x, this.cur_y, this.cur_size, this.cur_size);
        }

        // Display the label string inside the button
        if(this.showLabel) this.drawLabel(this.cur_x, this.cur_y)//if(this.showValue) this.drawValue(this.cur_x, this.cur_y+6*(2+this.size*2.5) )
    }

    isPressed(){
        if( this.p.mouseX < (this.cur_x + this.x_box/2) &&
            this.p.mouseX > (this.cur_x - this.x_box/2) &&
            this.p.mouseY > (this.cur_y - this.y_box/2) &&
            this.p.mouseY < (this.cur_y + this.y_box/2) )
        {
            this.active = 1
            this.value = 1
            this.mapValue(this.value,this.min,this.max,this.curve,this.mapto);
            this.runCallBack();
        }
    }

    isReleased(){
        if( this.active == 1 )  {
            this.active = 0
            this.value = 0
        }
    }
}

p5.prototype.Button = function (options = {}) {
    return new Button(this, options);
};

/**************************************** TOGGLE ******************************************/
export class Toggle extends Button {
    constructor(p, options) {
        super(p, options);
        this.state = options.state || false;
        this.callback = options.callback || function () { console.log('Define a callback function with the input being the value (max or min aka. on or off)'); };
    }

    isPressed(){
        if( this.p.mouseX < (this.cur_x + this.x_box/2) &&
            this.p.mouseX > (this.cur_x - this.x_box/2) &&
            this.p.mouseY > (this.cur_y - this.y_box/2) &&
            this.p.mouseY < (this.cur_y + this.y_box/2) )
        {
            this.active = 1
            this.value = this.value ? 0 : 1
            this.mapValue(this.value,this.min,this.max,this.curve,this.mapto);
            this.runCallBack();
        }
    }

    isReleased(){
        if( this.active == 1 )  {
            this.active = 0
        }
    }
}

p5.prototype.Toggle = function (options = {}) {
    return new Toggle(this, options);
};

/**************************************** RADIO BUTTON ******************************************/
export class RadioButton extends Button {
    constructor(p, options) {
        super(p, options);
        this.radioOptions = options.radioOptions || ['on', 'off'];
        this.orientation = options.orientation || 'vertical';
        this.isHorizontal = this.orientation==='horizontal'
        this.value = options.value || this.radioOptions[0]; //default first radioOption
        this.callback = options.callback || function () { console.log('Define a callback function with the input being the current radioOption'); };
        this.radioHeight = this.cur_size / 2;
        this.radioWidth = this.cur_size * 2;
        this.border = options.border ||activeTheme.radioBorder || 2
    }

    draw() {
        this.radioClicked = {};

        this.isHorizontal = this.orientation==='horizontal'
        this.cur_size = (this.size/6)*this.p.width/2
        
        this.radioHeight = this.cur_size / 2;
        this.radioWidth = this.cur_size * 2;
        let border = this.getParam('border',this.border)


        //calculate widest radioOption for radioButton width
        let textWidth = 0 
        for (let i = 0; i < this.radioOptions.length; i++){
            let width = this.p.textWidth(this.radioOptions[i]);
            if( width > textWidth) textWidth = width
        }
        this.cur_size = textWidth
        this.radioWidth = this.cur_size * 1.5;

        if( this.isHorizontal ) {
            this.cur_x = (this.x/100)*this.p.width
            this.cur_y = (this.y/100)*this.p.height

            this.x_corner = this.cur_x - this.radioWidth * this.radioOptions.length / 2
            this.y_corner = this.cur_y - this.radioHeight/2

            this.x_box = this.radioWidth * this.radioOptions.length
            this.y_box = this.radioHeight    
        }
        else  {
            this.cur_x = (this.x/100)*this.p.width
            this.cur_y = (this.y/100)*this.p.height

            this.x_corner = this.cur_x - this.radioWidth/2
            this.y_corner = this.cur_y - this.radioHeight * this.radioOptions.length / 2 

            this.y_box = this.radioHeight * this.radioOptions.length
            this.x_box = this.radioWidth
        }
        
        if(this.showLabel) this.drawLabel(this.cur_x, 
            this.isHorizontal ? this.cur_y+this.radioHeight : this.cur_y+this.radioHeight*(this.radioOptions.length / 2 + 0.5 ) 
            )

        for (let i = 0; i < this.radioOptions.length; i++) {
            let option = this.radioOptions[i];
            let x = this.isHorizontal ? this.x_corner + i * this.radioWidth : this.x_corner;
            let y = this.isHorizontal ? this.y_corner : this.y_corner + this.radioHeight * i;

            this.p.fill(this.value == option ? this.setColor(this.accentColor) : this.setColor(this.borderColor));
            this.p.stroke(0);
            this.p.strokeWeight(border);
            this.p.rect(x, y, this.radioWidth, this.radioHeight);

            this.drawText(option,  x+this.radioWidth/2,  y + this.radioHeight/2 )
             this.radioClicked[this.radioOptions[i]] = () => {
                if (this.isHorizontal) return this.p.mouseX >= x && this.p.mouseX <= x + this.radioSize
                else return this.p.mouseY >= y && this.p.mouseY <= y + this.radioSize / 2
            };
        }
    }


    isPressed() {
        if( this.p.mouseX < (this.cur_x + this.x_box/2) &&
            this.p.mouseX > (this.cur_x - this.x_box/2) &&
            this.p.mouseY > (this.cur_y - this.y_box/2) &&
            this.p.mouseY < (this.cur_y + this.y_box/2) )
        {
            
            if( this.isHorizontal){
                let position = (this.cur_x + this.x_box/2) -  this.p.mouseX
                position = Math.floor(position / this.radioWidth)
                position = this.radioOptions.length - position - 1
                this.value = this.radioOptions[position]
            } else{
                let position = (this.cur_y + this.y_box/2) - this.p.mouseY 
                position = Math.floor(position / this.radioHeight)
                position = this.radioOptions.length - position - 1
                this.value = this.radioOptions[position]
            }
            this.active = 1

            this.runCallBack();
            this.mapValue();
        }
    }

    isReleased() {
        //so super isReleased not called
    }
}

p5.prototype.RadioButton = function (options = {}) {
    return new RadioButton(this, options);
};

p5.prototype.Radio = function (options = {}) {
    return new RadioButton(this, options);
};

/**************************************** LINES ******************************************/
export class Line extends Element {
    constructor(p, x1,y1,x2,y2, options) {
        super(p, options);
        this.x1 = x1 || 0
        this.x2 = x2 || 0
        this.y1 = y1 || 0
        this.y2 = y2 || 0
        this.showLabel = options.showLabel || 'false'
        this.border = options.border || 2
        this.color = options.color ||activeTheme.lineColor || 'border'
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight)
        this.size *= this.horizontal !== false ? scaleWidth : scaleHeight;
    }

    draw() {
        let x1 = (this.x1/100)*this.p.width
        let x2 = (this.x2/100)*this.p.width
        let y1 = (this.y1/100)*this.p.height
        let y2 = (this.y2/100)*this.p.height
        let border = this.getParam('border',this.border)

        this.p.fill(this.setColor(this.color));
        this.p.stroke(this.setColor(this.color));
        this.p.strokeWeight(border*2);
        this.p.line(x1,y1,x2,y2)
    }

    isPressed() {}
    pressed() { }
    isReleased() {}
}

p5.prototype.Line = function (x1,y1,x2,y2, options = {}) {
    return new Line(this, x1,y1,x2,y2, options);
};

/**************************************** TEXT ******************************************/
export class Text extends Element {
    constructor(p, options) {
        super(p, options);
        this.border = options.border || activeTheme['border'] || 0
        this.textSize = options.size || activeTheme['textSize'] || options.textSize || 1
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight)
        this.size *= this.horizontal !== false ? scaleWidth : scaleHeight;
    }

    draw() {
        this.cur_x = (this.x/100)*this.p.width
        this.cur_y = (this.y/100)*this.p.height
        this.cur_size = (this.size/6)*this.p.width/2
        let border = this.getParam('border',this.border)
        let borderRadius = this.getParam('borderRadius',this.borderRadius)

        this.drawText(this.label,this.cur_x, this.cur_y)
        
        if(border > 0 ){
            let textWidthValue = this.p.textWidth(this.label);
            let textHeightValue = this.p.textAscent() + this.p.textDescent();
            this.p.noFill()
            this.p.stroke(this.setColor(this.borderColor));
            this.p.strokeWeight(border);
            this.p.rect(this.cur_x-textWidthValue/2-2-borderRadius/2,this.cur_y-textHeightValue/2-1,
                textWidthValue+4+borderRadius, textHeightValue+1,
                borderRadius,borderRadius)
        }
    }

    isPressed() {}
    pressed() {}
    isReleased() {}
}

p5.prototype.Text = function (options = {}) {
    return new Text(this, options);
};