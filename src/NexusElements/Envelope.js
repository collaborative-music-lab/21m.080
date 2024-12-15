class Envelope extends NexusElement {
    constructor( x = 0, y = 0, width = 500, height = 200,type = "generic") {
        super('Envelope', x, y, width, height);
        this.element.type = type;
        this._points = this.element.points; // Initialize _points with the element's points

        this.noDelete = false;

        // Listen for GUI updates
        this.element.on('change', () => {
            this._points = this.element.points; // Sync _points with the element's points
        });
    }

    get type() {
        return this._type;
    }

    set type(env_type){
        this._type = env_type;
        this.element.type = env_type
    }

    release() {
        if (this.noDelete) {
            console.log("Release: Points deletion is disabled.");
            return; // Skip the deletion logic if noDelete is true
        }
        // Default release logic (deletes points)
        this.element.points = [];  // Or whatever logic is used to release points
        console.log("Release: Points deleted.");
    }

    
    get points(){
        return this._points
    }

    set points(point_array){
        this._points = point_array;
        this.element.points = point_array
    }

    get noNewPoints(){
        return this._noNewPoints
    }

    set noNewPoints(bool){
        this._noNewPoints = bool;
        this.element.settings.noNewPoints = bool
    }

    addPoint(x,y){
        this.element.addPoint(x,y)
    }

    adjustPoint( index, xOffset, yOffset ){
        this.element.adjustPoint( index, xOffset, yOffset )
    }

    destroyPoint( index ){
        this.element.destroyPoint( index )
    }

    movePoint( index, x, y ){
        this.element.movePoint( index, x, y )
    }

    scan( x ){
        this.element.scan( x )
    }

    setPoints( allPoints ){
        this.element.setPoints(allPoints)
    }

    sortPoints(){
        this.element.sortPoints()
    }
}