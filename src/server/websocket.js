const Client = require("./websocket/Client");
const { Guilds } = require("mongoose").models;

const Enums = {
    CloseReasons: {
        Existing: "1",
        Exitted: "2",
        NotValid: "3"
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
                const client = server.Clients.get(data.toString());
                if (!client) ws.terminate();

                client.ws.isAlive = true;
            });

            ws.addEventListener("message", async (e) => {
                const message = JSON.parse(e.data);

                switch (message.reason) {
                    case "newConnection":
                        if (server.Clients.get(message.serverId)) {
                            ws.send(JSON.stringify({ message: "Ya existe una conexión con este servidor." }));
                            ws.close(1000, String(Enums.CloseReasons.Existing + "-" + message.serverId));
                        } else {
                            const doc = await Guilds.getWork(message.serverId);
                            const c = new Client(message.serverId, ws).setDoc(doc).verify(message.PIN);

                            if (c.disconnected) {
                                ws.send(JSON.stringify({ message: "No se pudo verificar el PIN para conectarse a este servidor." }));
                                return ws.close(1000, String(Enums.CloseReasons.NotValid + "-" + message.serverId))
                            }

                            server.Clients.set(message.serverId, c)
                            ws.send(JSON.stringify({ message: "Nueva conexión hecha sin problemas." }));
                        }
                        break;
                }
            })

            ws.addEventListener("close", (e) => {
                const splitted = e.reason.split("-");

                if (!splitted[1]) {
                    server.Clients.forEach(async (val) => {
                        if (val.ws.readyState === val.ws.CLOSED) server.Clients.delete(val.guildId);
                    })
                } else server.Clients.delete(splitted[1]);
            })
        })
    },
    Enums
}