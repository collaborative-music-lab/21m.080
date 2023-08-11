//example of P5.js code in my mode
//https://youtu.be/Su792jEauZg
const gui_sketch = function(my) {

  my.x_size = document.getElementById('gui_div').offsetWidth;
  my.y_size = document.getElementById('gui_div').offsetHeight;
  my.dimRatio = 0.5

  my.setup = function() {
    my.createCanvas(my.x_size, my.y_size);
    
    //slow down draw rate
    my.frameRate(30)

    // COLOR VARS
    whiteColor = color(255);
    blackColor = color(0);
    transparentColor = color(0,0);
    elementColor1 = color(255,40,0);
    elementColor2 = color(220,229,234);
    elementColor3 = color(0,85);
    bgColorShift = 100;

    my.background(elementColor2)
    my.background(bgColorShift)
    bgshift = 2;
    my.noStroke();
    // my.button = createButton('Add Elements');
    // my.button.parent('gui_div'); //'p5 is the name of the div to draw into'
    // my.button.position(10, 14);
    // my.button.size(10, 14);
    // my.button.mousePressed(buttonPress);

    // my.startSeq = createButton('PLAY seq');
    // my.startSeq.parent('gui_div'); //'p5 is the name of the div to draw into'
    // my.startSeq.position(10, 40);
    // my.startSeq.mousePressed(
    //   function() {seq = setInterval( mySeq, 400 )}
    // );
    // my.stopSeq = createButton('STOP seq');
    // my.stopSeq.parent('gui_div'); //'p5 is the name of the div to draw into'
    // my.stopSeq.position(10, 60);
    // my.stopSeq.mousePressed(
    //   function() {clearInterval(seq)}
    // );

    my.angleMode(DEGREES);
    my.textStyle(BOLD);
    my.textAlign (CENTER, CENTER);
    buttonPress();  
  }//setup


  let dragging = false;
  let forceDraw = false;
  let currElement = 0;
  let currKey = 'none';
  
  // UI ELEMENTS DEFAULT VALUES
  let x0 = 50;
  let y0 = 180;
  let r = 40; // knob/button size
  // slider
  let sliderThickness = 15;
  let sliderLength=100;
  // radio
  let boxSize = 30;
  let seqBoxSize = 30;
  let seqUpdateState = 'ON';
  let seqUpdateStarted = false;
  // knob
  let ogY = 0;
  let valueScale = 50/180 // x/180 where x is 1/2 of output range
  let yScale = 0.009; // alters sensitivity of turning the knob
  let ogValue = 0;

  let fillervar = 0;  
  let buttonPress = function() {
    // for testing
    console.log('buton pres')
    my.addElement({type:"radio",label:"radio",mapto:"fillervar"})
    my.addElement({type:"knob",label:"kVOL",mapto:"fillervar"})
    my.addElement({type:"slider",label:"sVOL",mapto:"fillervar"})
    my.addElement({type:"toggle",label:"togl",mapto:"fillervar"})
    my.addElement({type:"momentary",label:"momn",mapto:"fillervar"})
  }

  let addKeyboard = function() {
    my.addElement("keyboard","keyboard");
  }

  my.keyPressed = function() {currKey = keyCode;}
  my.keyReleased = function() {currKey = 'none';}

  my.draw = function() {
    if (dragging == false){
      if (forceDraw == true){
        forceDraw = false;
      } else {
        return;
      }
    } 
    console.log("drawing");
    //settings
    // my.background(elementColor2);
    bgColorShift += bgshift;
    if (bgColorShift > 240){
      bgshift = -2.3;
    } else if(bgColorShift < 70) {
      bgshift = 2.3;
    }
    my.background(bgColorShift);
    
    // draw grid
    push();
    my.strokeWeight(1);
    my.stroke(elementColor3);
    my.fill(elementColor3);
    let yOffset = 100
    for (let i = 0; i < 20; i++) {
      my.line(0,i*yOffset,5,i*yOffset);
    }
    for (let i = 0; i < 20; i++) {
      my.line(i*yOffset,0,i*yOffset,5);
    }
    my.noStroke();
    my.textSize(7);
    my.textStyle(NORMAL);
    my.text('100',yOffset,10)
    my.text('100',12,yOffset)
    pop();


    // ITERATE THRU ALL ELEMENTS and UPDATE THEM IF NEEDED

    my.fill(elementColor1);
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].type == 'knob' || elements[i].type == 'dial'){
        // ADJUST KNOB ANGLE WHILE DRAGGING
        if (dragging && currElement==i) {
          var dy = elements[currElement].y - my.mouseY - ogY;
          var angleY = dy*yScale;
          elements[currElement].value = angleY + ogValue;
          if (elements[currElement].value >= 1) {
            elements[currElement].value = 1;
          }
          else if (elements[currElement].value <= 0) {
            elements[currElement].value = 0;
          }
        }
        // DRAW KNOB
        my.push();
        my.stroke(elementColor3);
        my.fill(transparentColor);  
        my.translate( my.scaleX(elements[i].x), my.scaleY(elements[i].y) );
        my.strokeWeight(3);
        my.arc(0, 0, r*2.3, r*2.3,135,45);
        my.stroke(elementColor1);
        let valueInDegrees = elements[i].value * 270 - 225; // range is -225 to 45 deg
        my.arc(0, 0, r*2.3, r*2.3,135,valueInDegrees+.01  );
        my.strokeWeight(2);

        my.fill (elementColor2);
        my.stroke(elementColor3);
        if (dragging && currElement==i) {
          my.fill (elementColor1);
          my.noStroke();
        }
        my.ellipse(0, 0, r*1.8, r*1.8);
        my.rotate(valueInDegrees);
        my.stroke(elementColor3);
        my.strokeWeight(12);
        my.line(r*.25, 0, r*.6, 0);
        my.pop();

        // LABEL
        my.fill(elementColor3);
        my.noStroke();
        let normalizedValue  = int((elements[i].value + 90) * valueScale) + 50;
        my.text(normalizedValue, elements[i].x, elements[i].y+r+15);
        my.text(elements[i].label, elements[i].x, elements[i].y+r+30);

        // MAP TO CONTROLS
        // volume.gain.value = elements[i].value;
        eval(elements[i].mapto +'= ' + elements[i].value + ';');
      } 
      else if (elements[i].type == 'slider' || elements[i].type == 'fader'){
        // ADJUST SLIDER VAL WHILE DRAGGING
        if (dragging && currElement==i) {
          var dy = elements[currElement].y - my.mouseY - ogY;
          var angleY = dy*.006;
          elements[currElement].value = angleY - ogValue;
          if (elements[currElement].value >= 1) {
            elements[currElement].value = 1;
          }
          else if (elements[currElement].value <= 0) {
            elements[currElement].value = 0;
          }
        }
        my.push(); 
        my.translate(elements[i].x, elements[i].y);
        // full slider line
        my.stroke(elementColor3);
        my.strokeWeight(7);
        my.line(0,sliderLength/2, 0,-sliderLength/2);
        // active slider line
        my.stroke(elementColor1);
        let convertedVal = elements[i].value * sliderLength;
        my.line(0,sliderLength/2,0,sliderLength/2-convertedVal);
        // control point
        my.fill(elementColor2);
        my.strokeWeight(2);
        if (dragging && currElement==i) {
          my.fill(elementColor1);
          my.strokeWeight(4);
        }
        let cpSize = 15;
        my.ellipse(0,(sliderLength/2)-convertedVal,cpSize,cpSize);

        // // label
        my.fill(elementColor3);
        my.noStroke();
        let normalizedValue  = int((elements[i].value + 90) * valueScale) + 50;
        
        my.text(normalizedValue, 0, sliderLength/2+20);
        my.text(elements[i].label, 0, sliderLength/2+35);
        my.pop();

        // MAP TO CONTROLS
        eval(elements[i].mapto +'= ' + elements[i].value + ';');
      } 
      else if (elements[i].type == 'toggle' ){
        // draw element
        my.push();
        my.stroke(elementColor1);
        my.strokeWeight(2);
        // let toggleText = "OFF";
        if (currElement == i){
          currElement = "none";
          elements[i].value = 1 - elements[i].value;
        }
        let textColor = elementColor1;
        if (elements[i].value == 0){
          my.stroke(elementColor1);
          my.strokeWeight(3);
          // toggleText = "ON";
        }
        else if (elements[i].value == 1) {
          my.stroke(elementColor3);
          textColor = elementColor3;
        }
        my.translate(elements[i].x, elements[i].y);
        my.fill(elementColor2);
        my.ellipse(0, 0, r*2, r*2);
        my.fill (textColor);
        my.noStroke();
        let toggleText = elements[i].label;
        my.textSize(85/toggleText.length);
        my.text(toggleText, 0, 1);
        my.pop();

        // MAP TO CONTROLS
        eval(elements[i].mapto +'= ' + elements[i].value + ';');
      }
      else if (elements[i].type == 'momentary' ){
        // draw element
        my.push();
        my.fill(elementColor2);
        my.stroke(elementColor3);
        my.strokeWeight(2);
        let textColor = elementColor3;
        if (currElement == i && dragging){
          my.stroke(elementColor1);
          textColor = elementColor1;
          my.strokeWeight(3);
        }

        my.translate(elements[i].x, elements[i].y);
        my.ellipse(0, 0, r*2, r*2);
        my.fill (textColor);
        my.noStroke();
        let text = elements[i].label;
        my.textSize(85/text.length);
        my.text(text, 0, 1);
        my.pop();

        // MAP TO CONTROLS
        eval(elements[i].mapto +'= ' + elements[i].value + ';');
      }
      else if (elements[i].type == 'radio'){
        // CURRENTLY ASSUMING ONLY 4 OPTIONS
        my.push();
        my.translate(elements[i].x, elements[i].y);
        
        my.fill(elementColor2);
        my.stroke(elementColor1);
        my.rect(-boxSize/2,-2*boxSize,boxSize,boxSize);
        my.rect(-boxSize/2,-boxSize,boxSize,boxSize);
        my.rect(-boxSize/2,0,boxSize,boxSize);
        my.rect(-boxSize/2,boxSize,boxSize,boxSize);
        
        my.textSize(11);
        my.noStroke();
        my.fill(elementColor1);
        my.text("SIN", 0,-1.5*boxSize);
        my.text("SAW", 0,-0.5*boxSize);
        my.text("TRI", 0,0.5*boxSize);
        my.text("SQR", 0,1.5*boxSize);
        // FILL IN ACTIVE BUTTON
        let active = elements[i].value;
        let factor = active - 3;
        my.fill(elementColor1);
        my.rect(-boxSize/2,factor*boxSize,boxSize,boxSize);
        my.fill(elementColor2);
        for (let i = 1; i <= 4; i++) {
          if (active == i) {
            let txts = ["SIN","SAW","TRI","SQR"];
            let txt = txts[i-1];
            my.text(txt, 0,(factor+.5)*boxSize);

          } 
        }
        my.pop();

        // MAP TO CONTROLS
        eval(elements[i].mapto +'= ' + elements[i].value + ';');
      }
      else if (elements[i].type == 'keyboard'){
        // draw element
        my.push();
        my.fill(255);
        my.stroke(elementColor1);
        my.strokeWeight(2);
        // let textColor = elementColor3;
        // if (currElement == i && dragging){
        //   my.stroke(elementColor1);
        //   textColor = elementColor1;
        //   my.strokeWeight(3);
        // }

        my.translate(elements[i].x, elements[i].y);
        let keys = [  '49','50','51','52','53','54','55','56','57','48','189','187'] // 1 thru 0 row of keys
        let xShift = 0;
        //   2 4   7 9 -
        //  1 3 5 6 8 0 +
        let whiteKeys = [1,3,5,6,8,10,12];
        let blackKeys = [2,4,7,9,11];
        for (let j = 0; j < 7; j++) {
          i = whiteKeys[j]-1;
          my.fill(255);
          if (currKey == keys[i]) {
            my.fill(elementColor1);
          }
          xShift = 60*j;
          my.rect(xShift, 60, 60, -140);
        }
        my.translate(40,0)
        for (let j = 0; j < 5; j++) {
          i = blackKeys[j]-1;
          my.fill(0);
          if (currKey == keys[i]) {
            my.fill(elementColor1);
          }
          xShift = 60*(i-j-1);
          my.rect(xShift, 0, 35, -80);
        }
      }
      else if (elements[i].type == 'sequencer'){
        // draw element
        my.translate(20,100);
        my.push();
        my.fill(elementColor2);
        my.stroke(elementColor1);
        let seqBoxSize = 30;
        for (let track =0; track < 4; track++){
          my.push();
          my.fill(elementColor1);
          my.noStroke();
          my.text('TRK',seqBoxSize/2,track*seqBoxSize);
          my.pop();
          for (let step =0; step < 8; step++){
            let x = (step+1)*seqBoxSize;
            let y = track*seqBoxSize;
            if (dragging == true){
              let stepState = elements[i].value[track][step];
              if ((my.mouseX > x && my.mouseX < x+boxSize) && (my.mouseY > y && my.mouseY < y+boxSize)){
                console.log(elements[i].value)
                if (seqUpdateStarted) {
                  let newval = 1;
                  if (seqUpdateState == 'OFF'){
                    newval = 0;
                  }
                  elements[i].value[track][step] = newval;
                  stepState = newval;
                } else {
                  seqUpdateStarted = true;
                  seqUpdateState = 'ON';
                  if (stepState == 1){
                    seqUpdateState = 'OFF';
                  }
                }
                my.fill(elementColor2);
                if (stepState == 1) {
                  my.fill(elementColor1);
                }
              }
            }
            my.rect((step+1)*seqBoxSize,track*seqBoxSize,seqBoxSize);
          }
        }
        my.pop();
      } 
      else if (elements[i].type == 'idk'){
        // draw element
      } 
    }
  }// draw


  my.mousePressed = function() {
    console.log('\click');
    dragging = true; // start dragging
    for (let i = 0; i < elements.length; i++) {
      // if mouse is inside knob
      if (elements[i].type == "knob" || elements[i].type == 'dial'){
        if (dist(my.mouseX, my.mouseY, elements[i].x, elements[i].y) < r) { 
          ogY = y0 - my.mouseY;
          ogValue = elements[i].value;
          currElement = i;
          break
        }
      } 
      else if (elements[i].type == "slider" || elements[i].type == 'fader'){
        if (Math.abs(elements[i].x - my.mouseX) <= (sliderThickness/2)){
          if (Math.abs(elements[i].y - my.mouseY) <= (sliderLength/2+10)){
            ogY = y0 - my.mouseY;
            ogValue = -elements[i].value;
            currElement = i;
          }
        }
      } 
      else if (elements[i].type == "toggle"){
        if (dist(my.mouseX, my.mouseY, elements[i].x, elements[i].y) < r) { 
          currElement = i;
          break
        }
      }
      else if (elements[i].type == "momentary"){
        if (dist(my.mouseX, my.mouseY, elements[i].x, elements[i].y) < r) { 
          currElement = i;
          break
        }
      }
      else if (elements[i].type == "radio"){
        if (Math.abs(elements[i].x - my.mouseX) <= (boxSize/2)){
          if (Math.abs(elements[i].y - my.mouseY) <= (boxSize*2)){
            currElement = i;
            elements[i].value = 1;
          }
          // update active radio button
          let mousePos = my.mouseY - elements[i].y;
          if (-boxSize < mousePos && mousePos <= 0){elements[i].value = 2;}
          else if (0 < mousePos && mousePos <= boxSize){elements[i].value = 3;}
          else if (boxSize < mousePos && mousePos <= (2*boxSize)){elements[i].value = 4;}
        } 
      }
      else if (elements[i].type == "sequencer"){
        if (my.mouseX >= (elements[i].x) && my.mouseX <= (seqBoxSize*9 + elements[i].x)){
          if (my.mouseY >= (elements[i].y) && my.mouseX <= (seqBoxSize*4 + elements[i].y)){
            currElement = i;
          }
        } 
      }
      else {
        currElement = "none";
      }
    }// for loop
    console.log('curE: '+currElement);
  }// mousePressed
    
  
  my.mouseReleased = function() {
    console.log('\nmouse released');
    // Stop dragging
      dragging = false;
  }
  // my.color1 = function(val) {
  //   elementColor1 = color(val)
  // }

  let UserElement = function(type,label,mapto,x,y,minval,maxval,value,size) {
    this.type = type;
    this.label = label;
    this.mapto = mapto;
    this.x = x;
    this.y = y;
    this.minval = minval;
    this.maxval = maxval;
    this.value = value;
    this.size = size;
  }
  

  let elements = [];



  // my.addElement = function(type,label,mapto, {x="_default",y="_default",minval="_default",maxval="_default",value="_default",size="_default"}) {
  my.addElement = function({type,label,mapto, x,y,minval,maxval,value,size}) {
    console.log(elements);
    console.log('?: '+x);
    forceDraw = true; // so that the canvas will update even tho we are not clicking it
    // NEW OR UPDATE EXISTING?
    let update = false;
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].label == label) {
        console.log('UPDATE element');
        update = true;
        // UPDATE VALS
        if (type != undefined) {elements[i].type = type;}
        if (mapto != undefined) {elements[i].mapto = mapto;}
        if (x != undefined) {elements[i].x = x;}
        if (y != undefined) {elements[i].y = y;}
        if (minval != undefined) {elements[i].minval = minval;}
        if (maxval != undefined) {elements[i].maxval = maxval;}
        if (value != undefined) {elements[i].value = value;}
        if (size != undefined) {elements[i].size = size;}
        break
      }
      else {
        console.log('NEW element');
      }
    }

    if (update == false){
      let xGap = 100;
      // default default values
      if (x == undefined) {x = x0 + elements.length*xGap;}
      if (y == undefined) { y = y0;}
      if (minval == undefined) {minval=0;}
      if (maxval == undefined) {maxval=1;}
      if (value == undefined) {value=0.25;}
      if (size == undefined) {size=1;}

      if (type == 'toggle') {
        value = 0;
      } 
      else if (type == 'radio') {
        value = 1;
      }
      else if (type == 'sequencer') {
        // 8 x 4track
        value = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
      }
      // change default initial value based on type of element?
      // maybe also change default range to -1,1 for some elements
      elements.push(new UserElement(type,label,mapto,x,y,minval,maxval,value,size));
      if (type == 'toggle') {
        let toggleText = "OFF";
        my.push();
        my.fill (255,0,0);
        my.translate(x, y);
        my.ellipse(0, 0, r*2, r*2);
        my.fill(0);
        my.text(toggleText, 0, 0);
        my.pop();
      }
    }

    return elements[elements.length - 1];

  }//addElement

  my.removeElement = function(label) {
    console.log('BEFORE');
    console.log(elements);
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].label == label) {
        elements.splice(i,1);
        console.log('AFTER');
        console.log(elements);
        
      }
    }
  }//removeElement

  my.scaleX = function(val){
    return val;
    // return (val/100) * my.x_size;
  }

  my.scaleY = function(val){
    return val;
    return (val/100) * my.x_size * my.dimRatio;
  }

}



var gui = new p5(gui_sketch, document.getElementById('gui_div'));