class XYPad extends NexusElement {
    constructor(x = 0, y = 0, width = 150, height = 300) {
        // Pass the type "Dial" to the parent constructor
        super('Position', x, y, width, height);
    }
    get maxX() {
        return this._maxX;
    }
    set maxX(value) {
        this._maxX = value;
        this.element.maxX = value;
    }

    get minX() {
        return this._minX;
    }
    set minX(value) {
        this._minX = value;
        this.element.minX = value;
    }

    get maxY() {
        return this._maxY;
    }
    set maxY(value) {
        this._maxY = value;
        this.element.maxY = value;
    }

    get minY() {
        return this._minY;
    }
    set minY(value) {
        this._minY = value;
        this.element.minY = value;
    }

    get stepX(){
        return this._stepX
    }

    set stepX(value){
        this._stepX = value;
        this.element.stepX = value
    }

    get stepY(){
        return this._stepY
    }

    set stepY(value){
        this._stepY = value;
        this.element.stepY = value
    }

    get xVal(){
        return this._xVal
    }

    set xVal(value){
        this._xVal = value;
        this.element.x = value
    }

    get yVal(){
        return this._yVal
    }

    set yVal(value){
        this._yVal = value;
        this.element.y = value
    }

}