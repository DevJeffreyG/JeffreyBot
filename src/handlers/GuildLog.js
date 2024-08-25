const { Client, Events, Guild } = require("discord.js");
const { Log, LogReasons, ChannelModules, Embed } = require("../utils");
const { Colores } = require("../resources");

class GuildLog extends Log {
    /**
     * @param {Client} client 
     * @param {Events} event
     * @param {Array} args
     * @param {String[]} argNames
     */
    constructor(client, event, args, argNames) {
        super(null);

        this.client = client;
        this.event = event;
        this.args = args;
        this.argNames = argNames;

        this.eventInfo = null;


        this.guild = null;
        const notFound = false;
        while (!this.guild && !notFound) {
            this.args.forEach(arg => {
                if (arg.guild instanceof Guild) {
                    this.guild = arg.guild;
                    this.setGuild(this.guild);
                }
            });

            if (this.guild === null) {
                notFound = true;
                console.error("🔴 GUILD NOT FOUND AUTOMATICALLY!");
            }
        }
    }

    async handle() {
        this.#parseInfo();
        this.setReason(LogReasons.Logger)
        this.setTarget(ChannelModules.GuildLogs)

        const embed = new Embed()
            .defTitle(`Se ha ${this.eventInfo.action} ${this.eventInfo.prefix} ${this.eventInfo.type}`)
            .fillDesc(this.#generateDesc())
            .defColor(Colores.verde)
            .defFooter({ timestamp: true });

        try {
            return await this.send({ embed });
        } catch (err) {
            console.error("🔴 %s", err);
        }

    }

    #parseInfo() {
        let action, type, prefix = "un";
        if (this.event.toLowerCase().includes("create")) action = "CREADO";
        else if (this.event.toLowerCase().includes("delete")) action = "BORRADO";
        else if (this.event.toLowerCase().includes("add")) action = "AGREGADO";
        else if (this.event.toLowerCase().includes("remove")) action = "ELIMINADO";
        else action = "ACTUALIZADO";

        const paramType = this.args[0].constructor.name.toLowerCase();

        const transl = {
            "channel": ["CANAL"],
            "automoderation": ["AUTO MODERACION", true],
            "emoji": ["EMOJI"],
            "ban": ["BAN"],
            "member": ["MIEMBRO"],
            "invite": ["INVITACIÓN", true],
            "message": ["MENSAJE"],
            "role": ["ROL"]
        }

        Object.keys(transl).some(e => {
            if (paramType.includes(e)) {
                type = transl[e][0];
                prefix = transl[e][1] ? "una" : "un";
            }
        });

        if (!type) {
            type = "ALGO";
            prefix = "";
        }

        this.eventInfo = {
            action,
            type,
            prefix
        }

        return this;
    }

    /**
     * @returns {String[]}
     */
    #generateDesc() {
        let returnable = [];

        for (const arg of this.args) {
            returnable.push(arg);
        }

        return returnable;
    }

}


module.exports = GuildLog;