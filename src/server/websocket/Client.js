const WebSocket = require("ws").WebSocket;

class Client {
    #interval;
    /**
     * 
     * @param {Number} guildId 
     * @param {WebSocket} ws 
     */
    constructor(guildId, ws) {
        this.guildId = guildId;
        this.ws = ws;
        this.disconnected = false;
        this.heartbeat();
    }

    setDoc(doc) {
        this.doc = doc;
        return this;
    }

    verify(PIN) {
        if(this.doc.data.client.pin != PIN) this.disconnected = true;
        return this;
    }

    send(obj) {
        if(!this.disconnected) this.ws.send(JSON.stringify(obj));
        else throw new Error("Está desconectado")
    }

    heartbeat() {
        this.#interval = setInterval(() => {
            if (this.ws.isAlive === false) {
                clearInterval(this.#interval);
                this.disconnected = true;
                return this.ws.terminate();
            }
            
            this.ws.isAlive = false;

            this.ws.ping(this.guildId);
        }, 10000)
    }
}

module.exports = Client;