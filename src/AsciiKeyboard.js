class AsciiCallback {
    constructor() {
        this.asciiOn = false;
        this.handler = (key, upOrDown) => {
            console.log('Default Handler:', key, upOrDown);
        };
        this.activeKeys = {};
        
        // Bind the event handlers
        this.keyDown = this.keyDown.bind(this);
        this.keyUp = this.keyUp.bind(this);
    }

    keyDown(event) {
        if (!this.asciiOn) return;

        const keyCode = event.keyCode;
        if (!this.activeKeys[keyCode]) {
            this.activeKeys[keyCode] = true;
            this.handler(keyCode, 'down');
        }
    }

    keyUp(event) {
        if (!this.asciiOn) return;

        const keyCode = event.keyCode;
        if (this.activeKeys[keyCode]) {
            this.activeKeys[keyCode] = false;
            this.handler(keyCode, 'up');
        }
    }

    enable() {
        if (!this.asciiOn) {
            this.asciiOn = true;
            document.addEventListener('keydown', this.keyDown);
            document.addEventListener('keyup', this.keyUp);
        }
    }

    disable() {
        if (this.asciiOn) {
            this.asciiOn = false;
            document.removeEventListener('keydown', this.keyDown);
            document.removeEventListener('keyup', this.keyUp);
        }
    }

    setHandler(newHandler) {
        this.handler = newHandler;
    }
}

export const asciiCallbackInstance = new AsciiCallback();

