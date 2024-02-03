import { initialize, divResized, drawElements, GuiColors, 
    setColor, setFont, setTheme, debug,
    listThemes, updateThemeParameters, getCurrentThemeJSON } from './p5Elements';

export const sketch = (p) => {
    let grey = p.color(220, 229, 234);
    let div;
    p.setColor = setColor;
    p.setFont = setFont;
    p.debug = debug

    //theme functions
    p.setTheme = setTheme
    p.listThemes = listThemes
    p.setThemeParameters = updateThemeParameters
    p.exportTheme = getCurrentThemeJSON


    p.Debug = function(){ p.debug(); }

    p.setup = function () {
        let divID = p.canvas.parentElement.id;
        let div = document.getElementById(p.canvas.parentElement.id);
        // div = document.getElementById(props.id);
        p.initialize(div, grey);
    };

    p.draw = function () {
        p.drawElements();
    };

    p.mousePressed = function () {
        for (const element of Object.values(p.elements)) {
            if (typeof (element) !== 'string') {
                try {
                    element.isPressed();
                } catch (e) {
                    //no pressed function
                }
            }
        }
    }

    p.mouseReleased = function () {
        for (const element of Object.values(p.elements)) {
            if (typeof (element) !== 'string') {
                try {
                    element.isReleased();
                } catch (e) {
                    //no releaed function
                }
            }
        }
    }

    p.mouseClicked = function () {
        for (const element of Object.values(p.elements)) {
            if (typeof (element) !== 'string') {
                try {
                    element.isClicked();
                } catch (e) {
                    //no clicked function
                }
            }
        }
    }

    p.mouseDragged = function () {
        for (const element of Object.values(p.elements)) {
            if (typeof (element) !== 'string') {
                try {
                    element.isDragged();
                } catch (e) {
                    //no clicked function
                }
            }
        }
    }

    p.windowResized = function () {
        p.divResized();
    };
};
