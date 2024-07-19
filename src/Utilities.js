/*
    * Helper function for creating a custom curve for this.gui elements
    *
    * input : input of the stepper function
    * min: minimmum value of the element
    * max: maximmum value of the element
    * steps: array of arrays in format [[0,0], [a,b], .... [1,1]] where each point is a step in the curve
    * 
    * x values are how much the this.gui element is turned
    * y values are the level the elements are at internally
    */

export function stepper(input, min, max, steps) {
    let range = max - min
    let rawval = (input - min) / range
    const gui_values = []
    const internal_values = []
    for (let i = 0; i < steps.length ; i++) {
        gui_values.push(steps[i][0])
        internal_values.push(steps[i][1])
    }
    let index = 0
    while(index < gui_values.length) {
        if (rawval < gui_values[index]) {
            let slope = (internal_values[index] - internal_values[index - 1])/(gui_values[index] - gui_values[index-1])
            let rawCurved = internal_values[index-1] + slope * (rawval - gui_values[index - 1]) 
            let realCurved = (rawCurved * range) + min
            //console.log('input value', input)
            //console.log('curved value', realCurved)
            return realCurved
        }
        index++
    }
    return max
}