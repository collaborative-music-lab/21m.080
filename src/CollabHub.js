/*
React web client library for Collab-Hub https://www.collab-hub.io
Modified by Artem Laptiev

Original p5.ch - p5 library for Collab-Hub - https://github.com/Collab-Hub-io/p5.CollabHub
Created by Nick Hwang, Anthony T. Marasco, Eric Sheffield
Version v0.1.0 alpha | June 18, 2022
*/

import { io } from "socket.io-client";

class CollabHubClient {

    constructor() {
        this.socket = io("https://ch-server.herokuapp.com/hub");
        this.controls = {};
        this.handlers = {};
        this.username = undefined;

        // Setup event listeners
        this.initializeSocketEvents();
    }

    initializeSocketEvents() {

        // chat and user management

        this.socket.on("connected", () => {
            // TODO server-side, return the username on connection
            console.info("Connected to Collab-Hub server.");
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
            console.info(incoming.message);
        });

        this.socket.on("chat", (incoming) => {
            // TODO HACK checking messages to receive my user name
            if (incoming.chat === "Connected with id: " + this.socket.id) {
                this.username = incoming.id;
                console.info("My user name is: " + incoming.id);
            }
            console.log(`${incoming.id}: "${incoming.chat}"`);
        });

        this.socket.on("otherUsers", (incoming) => {
            let userList = "";
            let iterations = incoming.users.length;
            for (let u of incoming.users) {
                userList += --iterations ? `${u}, ` : u;
            }
            console.info(`Connected users: ${userList}`);
        });

        // controls

        this.socket.on("control", (incoming) => {
            if (incoming.from !== this.username) {
                let newHeader = incoming.header,
                    newValues = incoming.values;
                this.controls[newHeader] = newValues;
                if (newHeader in this.handlers) {
                    this.handlers[newHeader](incoming.from);
                }
                console.log(incoming);
            }
        });

        this.socket.on("availableControls", (incoming) => {
            console.info("Available controls:");
            for (let e of incoming.controls) {
                delete e.observers;
                delete e.mode;
                console.log(e);
            }
        }); 

        this.socket.on("observedControls", (incoming) => {
            console.info("Observed controls:");
            for (let e of incoming.controls) {
                delete e.observers;
                delete e.mode;
                console.log(e);
            }
        });

        this.socket.on("myControls", (incoming) => {
            console.info("My controls:");
            for (let e of incoming.controls) {
                delete e.observers;
                delete e.mode;
                console.log(e);
            }
        });

        // events

        this.socket.on("event", (incoming) => {
            if (incoming.from !== this.username) { // TODO HACK ignore events from self
                let newHeader = incoming.header;
                if (newHeader in this.handlers) {
                    this.handlers[newHeader](incoming.from);
                }
                console.log("Incoming event", incoming);
            }
        });

        this.socket.on("availableEvents", (incoming) => {
            console.info("Available events:");
            for (let e of incoming.events) {
                delete e.observers;
                delete e.mode;
                console.log(e);
            }
        });

        this.socket.on("observedEvents", (incoming) => {
            console.info("Observed events:");
            for (let e of incoming.events) {
                delete e.observers;
                delete e.mode;
                console.log(e);
            }
        });

        this.socket.on("myEvents", (incoming) => {
            console.info("My events:");
            for (let e of incoming.events) {
                delete e.observers;
                delete e.mode;
                console.log(e);
            }
        });

        // rooms

        this.socket.on("availableRoomsList", (incoming) => {
            let roomList = "";
            let iterations = incoming.rooms.length;
            for (let r of incoming.rooms) {
                roomList += --iterations ? `${r}, ` : r;
            }
            console.info(`Available rooms: ${roomList}`);
        });

    }

    // sending data

    control(...args) {
        let mode = args[0] === "publish" || args[0] === "pub" ? "publish" : "push",
            header = mode === "publish" ? args[1] : args[0],
            values = mode === "publish" ? args[2] : args[1],
            target = mode === "publish" ? args[3] ? args[3] : "all" : args[2] ? args[2] : "all";
        const outgoing = {
            mode: mode,
            header: header,
            values: values,
            target: target
        };
        this.socket.emit("control", outgoing);
    }

    event(...args) {
        let mode = args[0] === "publish" || args[0] === "pub" ? "publish" : "push",
            header = mode === "publish" ? args[1] : args[0],
            target = mode === "publish" ? args[2] ? args[2] : "all" : args[1] ? args[1] : "all";
        const outgoing = {
            mode: mode,
            header: header,
            target: target
        };
        this.socket.emit("event", outgoing);
    }

    chat(m, t) {
        const outgoing = {
            chat: m
        };
        t ? outgoing.target = t : outgoing.target = "all";
        this.socket.emit("chat", outgoing);
    }

    username(u) {
        this.socket.emit("addUsername", { username: u });
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
        let outgoing = { room: roomName };
        this.socket.emit("joinRoom", outgoing);
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
  


export default CollabHubClient;