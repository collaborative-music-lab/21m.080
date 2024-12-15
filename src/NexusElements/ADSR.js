

class ADSR extends Envelope{
    constructor(x = 0, y = 0, width = 500, height = 200, type = "ADSR", points = [[0, 0], [0.25, 1], [0.75, 1], [1, 0]]){
    super(x, y, width, height, type, points);
    this.noNewPoints = true;
    this.points = points
    this.type = "ADSR"
    }


    get points(){
        return this._points
    }

    set points(point_array){
        this._points = point_array;
        this.element.points = point_array
    }
    
}