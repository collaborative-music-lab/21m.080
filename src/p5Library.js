import p5 from 'p5';

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

export function drawElements(p) {
    p.background(p.backgroundColor ? p.backgroundColor : [255, 255, 255]);
    drawGrid(p);
    for (let element of Object.values(p.elements)) {
        if (typeof (element) === "string") {
            eval(element);
        }
        else {
            element.draw();
        }
    }
}

p5.prototype.drawElements = function () {
    drawElements(this);
};

class Element {
    constructor(p, options) {
        this.p = p;
        this.label = options.label || "myElement";
        this.id = this.label;
        let i = 1;
        while (this.id in p.elements) {
            this.id += i;
            i++;
        }
        this.x = options.x || p.width / 2;
        this.y = options.y || p.height / 2;
        this.size = options.size || .2 * p.width;
        this.min = options.min || 0;
        this.max = options.max || 1;
        this.mapto = options.mapto || null;
        this.callback = options.callback || null;
        this.value = options.value || null;
        p.elements[this.id] = this;
    }

    resize(scaleWidth, scaleHeight) {
        this.x *= scaleWidth;
        this.y *= scaleHeight;
    }

    setTextParams(size = null) {
        this.p.stroke(0);
        this.textSize = size || this.size * .1;
        this.p.textSize(this.textSize);
        this.p.strokeWeight(0.0001 * this.size);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.fill(0);
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setValue() {
        if (this.mapto) {
            try {
                this.mapto.value.rampto(this.value, .1);
            } catch {
                try {
                    this.mapto.value = this.value;
                } catch {
                    try {
                        this.mapto = this.value;
                    } catch (error) {
                        console.log('Error setting Mapto to value: ', error);
                    }
                }
            }
        }
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
        }
    }
}

export class Knob extends Element {
    constructor(p, options) {
        super(p, options);
        this.incr = (this.max - this.min) / 100;
        this.startAngle = 5 * this.p.PI / 8;
        this.endAngle = 3 * this.p.PI / 8 + 2 * this.p.PI;
        this.value = this.mapto ? this.mapto.value : (this.max + this.min) / 2;
        this.dragging = false;
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight);
        if (Math.max(Math.abs(1 - scaleWidth)) > Math.max(Math.abs(1 - scaleHeight))) this.size *= scaleWidth;
        else this.size *= scaleHeight;
    }

    draw() {
        // Calculate the angle based on the knob's value
        let angle = this.p.map(this.value, this.min, this.max, this.startAngle, this.endAngle);

        // Display the label string beneath the knob
        this.setTextParams();
        this.p.text(this.label, this.x, this.y + this.size / 2 + this.textSize);

        // Display the knob value inside the removed part of the knob
        this.p.fill(0);
        this.p.text(this.value.toFixed(2), this.x, this.y + this.size / 2); // Display the value in the center of the knob

        // Draw the knob background
        this.p.noFill();
        let strokeWeight = this.size * .06;
        this.p.strokeWeight(strokeWeight);
        this.p.arc(this.x, this.y, this.size, this.size, this.startAngle, this.endAngle);

        // Draw the knob value indicator as a line
        let indicatorLength = this.size / 2 - strokeWeight // Length of the indicator line
        let indicatorX = this.x + this.p.cos(angle) * indicatorLength;
        let indicatorY = this.y + this.p.sin(angle) * indicatorLength;
        this.p.stroke(255, 0, 0); // Red indicator
        this.p.line(this.x, this.y, indicatorX, indicatorY);

        this.p.mouseDragged = () => {
            let d = this.p.dist(this.x, this.y, this.p.mouseX, this.p.mouseY);
            if (d < this.size / 2 || this.dragging) {
                this.dragging = true;
                if (this.p.movedY < 0 && this.value < this.max) {
                    if (this.value + this.incr > this.max) this.value = this.max;
                    else this.value += this.incr;
                }
                else if (this.p.movedY > 0 && this.value > this.min) {
                    if (this.value - this.incr < this.min) this.value = this.min;
                    else this.value -= this.incr;
                }
                this.setValue();
            }
        }

        this.p.mouseReleased = () => {
            if (this.dragging) this.runCallBack();
            this.dragging = false;
        }
    }
}

p5.prototype.Knob = function (options = {}) {
    return new Knob(this, options);
};

export class Fader extends Element {
    constructor(p, options) {
        super(p, options);
        this.horizontal = options.horizontal === false ? false : true;
        this.value = this.mapto ? this.mapto.value : (this.max + this.min) / 2;
        this.dragging = false;
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight);
        this.size *= this.horizontal ? scaleWidth : scaleHeight;
    }

    draw() {
        let strokeWeight = this.size * .05;
        let thickness = this.size * .1; //Indicator thickness
        let rectThickness = thickness * .95;
        // Display the label string beneath 
        this.setTextParams();
        this.p.text(this.label, this.x + (this.horizontal ? this.size / 2 : thickness / 2), this.y + this.textSize + strokeWeight * 2 + (this.horizontal ? thickness : this.size));

        // Display the value under x & y
        this.p.text(this.value.toFixed(2), this.x + (this.horizontal ? this.size / 2 : thickness / 2), this.y + strokeWeight * 2 + (this.horizontal ? thickness : this.size));

        //Display Actual Fader
        this.p.noFill();
        this.p.stroke(255, 0, 0);
        this.p.strokeWeight(strokeWeight);
        if (this.horizontal) this.p.rect(this.x, this.y, this.size, rectThickness);
        else this.p.rect(this.x, this.y, rectThickness, this.size);

        //Display Indicator
        this.p.fill(0);
        this.p.noStroke();
        this.pos = this.p.map(this.value, this.min, this.max, this.horizontal ? this.x : this.y + this.size - thickness, this.horizontal ? this.x + this.size - thickness : this.y);
        if (this.horizontal) this.p.rect(this.pos, this.y - strokeWeight + .2, thickness, this.size * .18);
        else this.p.rect(this.x - strokeWeight + .2, this.pos, this.size * .18, thickness);

        this.p.mouseDragged = () => {
            let dist1 = this.horizontal ? this.p.mouseX - this.x : this.p.mouseY - this.y;
            let dist2 = this.horizontal ? this.p.mouseY - this.y : this.p.mouseX - this.x - this.size * .08 / 2;
            if ((dist1 >= 0 && dist1 <= (this.horizontal ? this.x : this.y) + this.size - thickness && dist2 >= 0 && dist2 <= this.size * .08) || this.dragging === true) {
                this.dragging = true;
                if (this.horizontal && this.p.mouseX >= this.x - 2 && this.p.mouseX <= this.x + this.size) {
                    this.value = this.p.map(this.p.mouseX, this.x, this.x + this.size - thickness, this.min, this.max);
                }
                else if (!this.horizontal && this.p.mouseY >= this.y - 2 && this.p.mouseY <= this.y + this.size) {
                    this.value = this.p.map(this.p.mouseY, this.y + this.size - thickness, this.y, this.min, this.max);
                }
                if (this.value <= this.min) this.value = this.min;
                else if (this.value >= this.max) this.value = this.max;
                this.setValue();
            }
        }

        this.p.mouseReleased = () => {
            if (this.dragging) this.runCallBack();
            this.dragging = false;
        }

    }
}

p5.prototype.Fader = function (options = {}) {
    return new Fader(this, options);
};

export class Button extends Element {
    constructor(p, options) {
        super(p, options);
        this.callback = options.callback || function () { console.log('Define a callback function'); };
        this.color = this.p.color(200);
        this.mouseDown = false;
    }

    resize(scaleWidth, scaleHeight) {
        super.resize(scaleWidth, scaleHeight);
        this.size *= this.horizontal !== false ? scaleWidth : scaleHeight;
    }

    pressed() {
        this.value = this.max;
        this.color = this.p.color(255, 255, 255);
    }

    released() {
        if (this.mouseDown) {
            this.setValue();
            this.runCallBack();
            this.color = this.p.color(200);
            this.mouseDown = false;
        }
    }

    draw() {
        let height = this.size / 2;
        this.p.fill(this.color);
        this.p.stroke(0);
        this.p.strokeWeight(2);
        this.p.ellipse(this.x, this.y, this.size, height);

        this.setTextParams();
        this.p.text(this.label, this.x, this.y);

        this.p.mousePressed = () => {
            let dist1 = this.p.mouseX - this.size / 2;
            let dist2 = this.p.mouseY - height / 2;
            if (dist1 >= 0 & dist1 <= this.x + this.size && dist2 >= 0 && dist2 <= this.y + this.size * .75) {
                if (!this.mouseDown) {
                    this.pressed();
                    this.mouseDown = true;
                }
            }
        }
        this.p.mouseReleased = () => {
            this.released();
        }
    }
}

p5.prototype.Button = function (options = {}) {
    return new Button(this, options);
};

export class Toggle extends Button {
    constructor(p, options) {
        super(p, options);
        this.state = options.state || false;
        this.callback = options.callback || function () { console.log('Define a callback function with the input being the value (max or min aka. on or off)'); };
    }

    pressed() {
        this.state = !this.state;
        if (this.state) this.value = this.max;
        else this.value = this.min;
        this.color = this.state ? this.p.color(255, 255, 255) : this.p.color(200);
    }

    released() {
        if (this.mouseDown) {
            this.setValue();
            this.runCallBack();
            this.mouseDown = false;
        }
    }

    draw() {
        super.draw();
    }
}

p5.prototype.Toggle = function (options = {}) {
    return new Toggle(this, options);
};

export class RadioButton extends Button {
    constructor(p, options) {
        super(p, options);
        this.radioOptions = options.radioOptions || ['on', 'off'];
        this.horizontal = options.horizontal === false ? false : true;
        //do we want option for none on?
        this.value = this.radioOptions[0]; //default first radioOption
        this.callback = options.callback || function () { console.log('Define a callback function with the input being the current radioOption'); };
    }

    draw() {
        let radioClicked = {};
        let radioSize = this.size / this.radioOptions.length * (this.horizontal ? 1 : 2);
        this.thickness = this.radioSize / (this.horizontal ? 1 : 2);
        for (let i = 0; i < this.radioOptions.length; i++) {
            let option = this.radioOptions[i];
            let x = this.horizontal ? this.x + i * radioSize : this.x;
            let y = this.horizontal ? this.y : this.y + i * radioSize / 2;
            this.p.fill(this.value == option ? this.p.color(255, 255, 255) : this.color);
            this.p.stroke(0);
            this.p.strokeWeight(2);
            this.p.rect(x, y, radioSize, radioSize / 2);

            this.setTextParams(radioSize * .2);
            this.p.text(option, x + radioSize / 2, y + radioSize / 4);
            this.p.text(this.label, this.x + (this.horizontal ? this.size : radioSize) / 2, this.y + 10 + (this.horizontal ? radioSize / 2 : radioSize))
            radioClicked[this.radioOptions[i]] = () => {
                if (this.horizontal) return this.p.mouseX >= x && this.p.mouseX <= x + radioSize
                else return this.p.mouseY >= y && this.p.mouseY <= y + radioSize / 2
            };

            this.p.mouseClicked = () => {
                let inRangeX = this.p.mouseX >= this.x && this.p.mouseX <= this.x + (this.horizontal ? this.size : radioSize);
                let inRangeY = this.p.mouseY >= this.y && this.p.mouseY <= this.y + (this.horizontal ? radioSize / 2 : this.size);
                if (inRangeX && inRangeY) {
                    for (const [option, clicked] of Object.entries(radioClicked)) {
                        if (clicked()) {
                            this.value = option;
                            this.runCallBack();
                            this.setValue();
                            break;
                        }
                    }
                }
            }
        }
    }
}

p5.prototype.RadioButton = function (options = {}) {
    return new RadioButton(this, options);
};