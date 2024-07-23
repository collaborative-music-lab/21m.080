/*
React web client library for Collab-Hub https://www.collab-hub.io
Modified by Artem Laptiev

Original p5.ch - p5 library for Collab-Hub - https://github.com/Collab-Hub-io/p5.CollabHub
Created by Nick Hwang, Anthony T. Marasco, Eric Sheffield
Version v0.1.0 alpha | June 18, 2022
*/

import { io } from "socket.io-client";

export class CollabHubClient {

    constructor() {
        this.socket = io("https://ch-server.herokuapp.com/hub");
        this.controls = {};
        this.handlers = {};
        this.username = undefined;
        this.roomJoined = undefined;

        // Callbacks
        this.controlsCallback = (incoming) => {};
        this.eventsCallback = (incoming) => {};
        this.chatCallback = (incoming) => {};

        // Setup event listeners
        this.initializeSocketEvents();
    }

    initializeSocketEvents() {

        // chat and user management

        this.socket.on("connected", () => {
            // TODO server-side, return the username on connection
            console.info("Connected to Collab-Hub server (Join a room w/ ch.joinRoom(x)!).");
            this.socket.emit();

            // TODO HACK sending chat message to receive my user name
            // TODO fix on server-side, don't send the controls/events back to the user who sent it
            const outgoing = {
                chat: "Connected with id: " + this.socket.id,
                target: "all"
            };
            this.socket.emit("chat", outgoing);

            // ALTERNATIVELY, just request username from server
            // socket.emit("addUsername", { "username": u });
        });

        this.socket.on("serverMessage", (incoming) => {
            // console.info(incoming.message);
        });

        this.socket.on("chat", (incoming) => {
            // TODO HACK checking messages to receive my user name
            if (incoming.chat === "Connected with id: " + this.socket.id) {
                this.username = incoming.id;
                // console.info("My user name is: " + incoming.id);
            }
            // console.log(`${incoming.id}: "${incoming.chat}"`);
            this.chatCallback(incoming);
        });

        this.socket.on("otherUsers", (incoming) => {
            let userList = "";
            let iterations = incoming.users.length;
            for (let u of incoming.users) {
                userList += --iterations ? `${u}, ` : u;
            }
            // console.info(`Connected users: ${userList}`);
        });

        // controls

        this.socket.on("control", (incoming) => {
            if (this.roomJoined) {                      // Kind of HACK, ignore controls before joining a room
                if (incoming.from !== this.username) {  // TODO HACK ignore controls from self
                    let newHeader = incoming.header,
                        newValues = incoming.values;
                    this.controls[newHeader] = newValues;
                    if (newHeader in this.handlers) {
                        this.handlers[newHeader](incoming);
                    }
                    // console.log(incoming);
                }

                this.controlsCallback(incoming);
            }
        });

        this.socket.on("availableControls", (incoming) => {
            // console.info("Available controls:");
            for (let e of incoming.controls) {
                delete e.observers;
                delete e.mode;
                // console.log(e);
            }
        }); 

        this.socket.on("observedControls", (incoming) => {
            // console.info("Observed controls:");
            for (let e of incoming.controls) {
                delete e.observers;
                delete e.mode;
                // console.log(e);
            }
        });

        this.socket.on("myControls", (incoming) => {
            // console.info("My controls:");
            for (let e of incoming.controls) {
                delete e.observers;
                delete e.mode;
                // console.log(e);
            }
        });

        // events

        this.socket.on("event", (incoming) => {
            if (this.roomJoined) {                      // Kind of HACK, ignore events before joining a room
                if (incoming.from !== this.username) {  // TODO HACK ignore events from self
                    let newHeader = incoming.header;
                    if (newHeader in this.handlers) {
                        this.handlers[newHeader](incoming);
                    }
                    // console.log("Incoming event", incoming);
                }

                this.eventsCallback(incoming);
            }
        });

        this.socket.on("availableEvents", (incoming) => {
            // console.info("Available events:");
            for (let e of incoming.events) {
                delete e.observers;
                delete e.mode;
                // console.log(e);
            }
        });

        this.socket.on("observedEvents", (incoming) => {
            // console.info("Observed events:");
            for (let e of incoming.events) {
                delete e.observers;
                delete e.mode;
                // console.log(e);
            }
        });

        this.socket.on("myEvents", (incoming) => {
            // console.info("My events:");
            for (let e of incoming.events) {
                delete e.observers;
                delete e.mode;
                // console.log(e);
            }
        });

        // rooms

        this.socket.on("availableRoomsList", (incoming) => {
            let roomList = "";
            let iterations = incoming.rooms.length;
            for (let r of incoming.rooms) {
                roomList += --iterations ? `${r}, ` : r;
            }
            // console.info(`Available rooms: ${roomList}`);
        });

    }

    // callbacks

    setControlsCallback(f) { this.controlsCallback = f; }
    setEventsCallback(f) { this.eventsCallback = f; }
    setChatCallback(f) { this.chatCallback = f; }

    // sending data

    control(...args) {
        if (this.roomJoined) {
            let mode = args[0] === "publish" || args[0] === "pub" ? "publish" : "push",
                header = mode === "publish" ? args[1] : args[0],
                values = mode === "publish" ? args[2] : args[1],
                target = mode === "publish" ? args[3] ? args[3] : this.roomJoined : args[2] ? args[2] : this.roomJoined;
            const outgoing = {
                mode: mode,
                header: header,
                values: values,
                target: target
            };
            this.socket.emit("control", outgoing);
        } else {
            console.info("Join a room to send controls.");
        }
    }

    event(...args) {
        if (this.roomJoined) {
            let mode = args[0] === "publish" || args[0] === "pub" ? "publish" : "push",
                header = mode === "publish" ? args[1] : args[0],
                target = mode === "publish" ? args[2] ? args[2] : this.roomJoined : args[1] ? args[1] : this.roomJoined;
            const outgoing = {
                mode: mode,
                header: header,
                target: target
            };
            this.socket.emit("event", outgoing);
        } else {
            console.info("Join a room to send events.");
        }
    }

    chat(m, t) {
        if (this.roomJoined) {
            const outgoing = {
                chat: m
            };
            t ? outgoing.target = t : outgoing.target = this.roomJoined;
            this.socket.emit("chat", outgoing);
        } else {
            console.info("Join a room to chat.");
        }
    }

    setUsername(u) {
        this.socket.emit("addUsername", { username: u });
        this.username = u;
    }

    // requesting/using data

    getControl(h) {
        let data = h in this.controls ? this.controls[h] : 0;
        return data;
    }

    on(h, f) {
        this.handlers[h] = f;
    }

    getUsers() {
        this.socket.emit("otherUsers");
    }

    // room management

    joinRoom(roomName) {
        if (this.roomJoined) {
            this.leaveRoom(this.roomJoined);
        }

        let outgoing = { room: roomName };
        this.socket.emit("joinRoom", outgoing);

        this.roomJoined = roomName;     // room joined, can start receiving controls/events
    }

    leaveRoom(roomName) {
        let outgoing = { room: roomName };
        this.socket.emit("leaveRoom", outgoing);
    }

    getRooms() {
        this.socket.emit("getAvailableRooms");
    }

    // control management

    observeControl(header) {
        let outgoing = { header: header };
        this.socket.emit("observeControl", outgoing);
    }

    unobserveControl(header) {
        let outgoing = { header: header };
        this.socket.emit("unobserveControl", outgoing);
    }

    observeAllControls(bool) {
        let outgoing = { observe: bool };
        this.socket.emit("observeAllControl", outgoing);
        this.socket.emit("getMyControls");
    }

    clearControl(header) {
        let outgoing = { header: header };
        this.socket.emit("clearControl", outgoing);
        this.socket.emit("getMyControls");
    }

    // event management

    observeEvent(header) {
        let outgoing = { header: header };
        this.socket.emit("observeEvent", outgoing);
    }

    unobserveEvent(header) {
        let outgoing = { header: header };
        this.socket.emit("unobserveEvent", outgoing);
    }

    observeAllEvents(bool) {
        let outgoing = { observe: bool };
        this.socket.emit("observeAllEvents", outgoing);
        this.socket.emit("getMyEvents");
    }

    clearEvent(header) {
        let outgoing = { header: header };
        this.socket.emit("clearEvent", outgoing);
        this.socket.emit("getMyEvents");
    }
  }  


export class CollabHubTracker {
    constructor(collabHubClient) {
        this.ch = collabHubClient;
        this.recentControls = {};
        this.recentEvents = [];
        this.recentChat = [];

        this.controlsTimeOut = 300000;
        this.eventsTimeOut = 4000;
        this.chatTimeOut = 60000;
        this.chatMaxDisplay = 20;

        // set callbacks
        this.ch.setControlsCallback(this.handleControl.bind(this));
        this.ch.setEventsCallback(this.handleEvent.bind(this));
        this.ch.setChatCallback(this.handleChat.bind(this));

        // start tracking
        this.update();
        setInterval(this.update.bind(this), 1000);
    }


    update() {
        // clean old data
        for (let key in this.recentControls) {
            if (Date.now() - this.recentControls[key].time > this.controlsTimeOut) {
                delete this.recentControls[key];
            }
        }

        this.recentEvents.forEach((event, index) => {
            if (Date.now() - event.time > this.eventsTimeOut) {
                this.recentEvents.splice(index, 1);
            }
        })

        this.recentChat.forEach((message, index) => {
            if (Date.now() - message.time > this.chatTimeOut) {
                this.recentChat.splice(index, 1);
            }
        })
    }

    handleChat(incoming) {
        this.recentChat.push({
            message: incoming.chat,
            from: incoming.id,
        });
        if (this.recentChat.length > this.chatMaxDisplay) {
            this.recentChat.shift();
        }
        // console.log('CHAT: ', this.recentChat);
    }

    handleControl(incoming) {
        this.recentControls[incoming.header] = {
            value: incoming.values,
            from: incoming.from,
            time: Date.now()
        };
        // console.log('CONTROLS: ', this.recentControls);
    }

    handleEvent(incoming) {
        this.recentEvents.unshift({
            header: incoming.header,
            from: incoming.from,
            time: Date.now()
        });
        // console.log('EVENTS: ', this.recentEvents);
    }
  }


  export const CollabHubDisplay = function(_target) {

    // this.ch = window.chClient;

    //this.target = document.querySelector(target);
    const target = document.getElementById(_target)

    // Set the dimensions based on the target container
    const width = target.offsetWidth;
    const height = target.offsetHeight;

    // Create the canvas
    const html = '<div><div style="margin-bottom: 5px;"><input type="text" id="roomName" name="roomName" placeholder="Enter room"></input><button id="joinRoomButton">Join Room</button><input type="text" id="newUserName" name="newUserName" placeholder="Enter new username" style="margin-left: 5px;"></input><button id="changeUserName">Change username</button></div><div class="collab-container"><div class="collab-item" id="collab-controls"> </div><div class="collab-item" id="collab-events"> </div><div class="collab-item"> <div class="collab-chat-container"><div id="collab-chat"></div><div class="collab-chat-input"><input type="text" id="newChatMessage" name="newChatMessage" placeholder="New message"></input><button id="sendChatMessage">Send</button></div></div></div></div></div>';

    // Append the canvas element to the target container
    target.innerHTML = html;

    function updateControls() {
        const controlsContainer = document.getElementById('collab-controls');

        if (!controlsContainer) return;
        
        // Get the current displayed controls
        const displayedControls = controlsContainer.querySelectorAll('.control');
    
        // Check for new controls to add or existing controls to update
        Object.keys(window.chTracker.recentControls).forEach(key => {
        let { value, from, time } = window.chTracker.recentControls[key];
        
        // if value is a float, round to 2 decimal places
        if (typeof value === 'number') {
            value = Math.round(value * 100) / 100;
        }
    
        const controlId = `controls-${key}`;
        const existingControl = document.getElementById(controlId);
        
        if (existingControl) {
            // Update the value if it has changed
            const valueElement = existingControl.querySelector('.value');
            const fromElement = existingControl.querySelector('.from');
            if (valueElement.innerText != value || fromElement.innerText != `(${from})`) {
            valueElement.innerText = value;
            fromElement.innerText = `(${from})`;
            
            // Change text weight to bold
            existingControl.style.fontWeight = 'bold';
            setTimeout(() => {
                existingControl.style.fontWeight = 'normal';
            }, 2000); // Change back to normal after 2 seconds
            }
        } else {
            // Add new control
            const controlElement = document.createElement('div');
            controlElement.className = 'property control hidden'; // Initially hidden for fade-in effect
            controlElement.id = controlId;
            controlElement.innerHTML = `
            <span class="name">${key}:</span>
            <span class="value">${value}</span>
            <span class="from">(${from})</span>
            `;
            controlsContainer.appendChild(controlElement);
    
            // Trigger reflow to enable transition
        //   controlElement.offsetHeight;
    
            // Fade in the element
            controlElement.classList.remove('hidden');
    
            // Change text weight to bold
            controlElement.style.fontWeight = 'bold';
            setTimeout(() => {
            controlElement.style.fontWeight = 'normal';
            }, 2000); // Change back to normal after 2 seconds
        }
        });
    
        // Check for controls to remove
        displayedControls.forEach(control => {
        const key = control.id.replace('controls-', '');
        if (!window.chTracker.recentControls[key]) {
            // Fade out and remove the element
            control.classList.add('hidden');
            setTimeout(() => {
            control.remove();
            }, 300); // Adjust timing to match your transition duration
        }
        });
    }
    
    
    function updateEvents() {
        const eventsContainer = document.getElementById('collab-events');

        if (!eventsContainer) return;
        
        // Get the current displayed events
        const displayedEvents = eventsContainer.querySelectorAll('.event');
    
        // Check for new events to add or existing events to update
        window.chTracker.recentEvents.forEach((event, index) => {
        let { header, time, from } = event;
        
        const eventId = `events-${index}`;
        const existingEvent = document.getElementById(eventId);
        
        if (existingEvent) {
            // Update the value if it has changed
            const headerElement = existingEvent.querySelector('.header');
            const fromElement = existingEvent.querySelector('.from');
            if (headerElement.innerText != header || fromElement.innerText != `(${from})`) {
            headerElement.innerText = header;
            fromElement.innerText = `(${from})`;
            
            // Change text weight to bold
            existingEvent.style.fontWeight = 'bold';
            setTimeout(() => {
                existingEvent.style.fontWeight = 'normal';
            }, 2000); // Change back to normal after 2 seconds
            }
        } else {
            // Add new event
            const eventElement = document.createElement('div');
            eventElement.className = 'property event hidden'; // Initially hidden for fade-in effect
            eventElement.id = eventId;
            eventElement.innerHTML = `
            <span class="header">${header}</span>
            <span class="from">(${from})</span>
            `;
            eventsContainer.appendChild(eventElement);
    
            // Trigger reflow to enable transition
        //   eventElement.offsetHeight;
    
            // Fade in the element
            eventElement.classList.remove('hidden');
    
            // Change text weight to bold
            eventElement.style.fontWeight = 'bold';
            setTimeout(() => {
            eventElement.style.fontWeight = 'normal';
            }, 2000); // Change back to normal after 2 seconds
        }
        });
    
        // Check for events to remove
        displayedEvents.forEach(event => {
        const key = event.id.replace('events-', '');
        if (!window.chTracker.recentEvents[key]) {
            // Fade out and remove the element
            event.classList.add('hidden');
            setTimeout(() => {
            event.remove();
            }, 300); // Adjust timing to match your transition duration
        }
        });
    }
    
    // sample window.chTracker.reventChat:
    // {
    //   "message"
    //   "from"
    // }
    function updateChat() {
        const chatContainer = document.getElementById('collab-chat');

        if (!chatContainer) return;
        
        // Get the current displayed chat
        const displayedChat = chatContainer.querySelectorAll('.chat');
    
        // Check for new chat to add or existing chat to update
        window.chTracker.recentChat.forEach((chat, index) => {
        let { message, from } = chat;
        
        const chatId = `chat-${index}`;
        const existingChat = document.getElementById(chatId);
        
        if (!existingChat) {
            // Add new chat
            const chatElement = document.createElement('div');
            chatElement.className = 'property chat hidden'; // Initially hidden for fade-in effect
            chatElement.id = chatId;
            chatElement.innerHTML = `
            <span class="message"><span style="font-weight: bold;">${from}:</span> ${message}</span>
            `;
            chatContainer.appendChild(chatElement);
    
            // Trigger reflow to enable transition
        //   chatElement.offsetHeight;
    
            // Fade in the element
            chatElement.classList.remove('hidden');
        }
        });
    
        // Check for chat to remove
        displayedChat.forEach(chat => {
        const key = chat.id.replace('chat-', '');
        if (!window.chTracker.recentChat[key]) {
            // Fade out and remove the element
            chat.classList.add('hidden');
            setTimeout(() => {
            chat.remove();
            }, 300); // Adjust timing to match your transition duration
        }
        });
    }
    
    
    // Initial display of controls
    updateControls();
    updateEvents();
    updateChat();
    
    // Example: Simulate update or deletion of properties in a loop
    setInterval(() => {
        // Update controls display
        updateControls();
        updateEvents();
        updateChat();
    }, 100); // Repeat every 0.5 seconds
    
    
    // send message handler
    document.getElementById('sendChatMessage').addEventListener('click', () => {
    let newChatMessageEl = document.getElementById('newChatMessage')
    window.chClient.chat(newChatMessageEl.value)
    newChatMessageEl.placeholder = 'New message'
    newChatMessageEl.value = ''
    });
    
    // join room handler
    document.getElementById('joinRoomButton').addEventListener('click', () => {
    let roomNameEl = document.getElementById('roomName')
    window.chClient.joinRoom(roomNameEl.value)
    roomNameEl.placeholder = 'Joined ' + roomNameEl.value
    roomNameEl.value = ''
    });
    
    // change username handler
    document.getElementById('changeUserName').addEventListener('click', () => {
    let newUserNameEl = document.getElementById('newUserName')
    window.chClient.setUsername(newUserNameEl.value)
    newUserNameEl.placeholder = 'New user: ' + newUserNameEl.value
    newUserNameEl.value = ''
    });

}