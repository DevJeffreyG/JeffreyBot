const Client = require("./public/websocket/Client");

const Enums = {
    CloseReasons: {
        Existing: "1",
        Exitted: "2"
    }
}

const Server = require("ws").Server;
module.exports = {
    /**
     * @param {Server} server 
     */
    handler: (server) => {
        server.Clients = new Map();

        server.on("connection", (ws) => {
            ws.isAlive = true;

            console.log("Nuevo cliente!");
            ws.on("pong", (data) => {
                console.log("ponging!", data.toString());
                const client = server.Clients.get(data.toString());
                if (!client) ws.terminate();

                client.ws.isAlive = true;
            });

            ws.addEventListener("message", (e) => {
                const message = JSON.parse(e.data);

                switch (message.reason) {
                    case "newConnection":
                        if (server.Clients.get(message.serverId)) {
                            ws.send(JSON.stringify({ message: "Ya existe una conexión con este servidor." }));
                            ws.close(1000, String(Enums.CloseReasons.Existing + "-" + message.serverId));
                        } else {
                            server.Clients.set(message.serverId, new Client(message.serverId, ws))
                            ws.send(JSON.stringify({ message: "Nueva conexión hecha sin problemas." }))
                        }
                        break;
                }
            })

            ws.addEventListener("close", (e) => {
                const splitted = e.reason.split("-");

                if(!splitted[1]) {
                    server.Clients.forEach((val) => {
                        if(val.ws.readyState === val.ws.CLOSED) server.Clients.delete(val.guildId);
                    })
                } else server.Clients.delete(splitted[1]);
            })
        })
    },
    Enums
}