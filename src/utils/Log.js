const { CommandInteraction, GuildChannel, Guild, Message } = require("discord.js");
const Embed = require("./Embed");
const { ChannelModules, Enum, LogReasons } = require("./Enums");
const ErrorEmbed = require("./ErrorEmbed");
const { BadCommandError, InsuficientSetupError } = require("../errors");
const { Guilds } = require("mongoose").models;

class Log {
    #doc;
    #fetched = false;
    #handled = false;

    /**
     * Crea un nuevo Log con la configuración del guild actual
     * @param {CommandInteraction|Message} interaction 
     */
    constructor(interaction = null) {
        this.interaction = interaction;
        this.guild = this.interaction?.guild;
        this.client = this.interaction?.client;

        if (interaction instanceof Message) this.interaction = interaction.channel; // message.channel

        this.target = null;
        this.reason = null;
        this.enabled = true;
    }


    async #fetch() {
        if (this.target === ChannelModules.ClientLogs) return;

        // prepara lo necesario
        if (this.guild) this.#doc = await Guilds.getWork(this.guild.id);

        if (!await this.#reasonWorker()) return;
        if (!this.target || !new Enum(ChannelModules).exists(this.target)) throw new BadCommandError(this.interaction, "INVALID LOG TARGET");

        let configured = this.#doc.getLogChannel(this.target);
        this.channel = configured ? await this.guild.channels.fetch(configured) : null;

        if (!this.channel) throw new InsuficientSetupError(this.interaction, new Enum(ChannelModules).translate(this.target))

        this.#fetched = true;
    }

    async #reasonWorker() {
        if (!this.reason) return true;
        if (!new Enum(LogReasons).exists(this.reason)) throw new BadCommandError(this.interaction, "INVALID REASON")

        if (!this.#doc.moduleIsActive("functions.logs")) {
            this.enabled = false;
            return false;
        }

        // revisar si está el modulo activo
        let isEnabled = false;
        switch (this.reason) {
            case LogReasons.Ticket:
                isEnabled = this.#doc.moduleIsActive("logs.staff.tickets");
                break;
            case LogReasons.Suggestion:
                isEnabled = this.#doc.moduleIsActive("functions.suggestions");
                break;

            case LogReasons.Warn:
                isEnabled = this.#doc.moduleIsActive("logs.moderation.warns");
                break;

            case LogReasons.SoftWarn:
                isEnabled = this.#doc.moduleIsActive("logs.moderation.softwarns");
                break;

            case LogReasons.Pardon:
                isEnabled = this.#doc.moduleIsActive("logs.moderation.pardons");
                break;

            case LogReasons.Ban:
                isEnabled = this.#doc.moduleIsActive("logs.moderation.bans");
                break;

            case LogReasons.TimeOut:
                isEnabled = this.#doc.moduleIsActive("logs.moderation.timeouts");
                break;

            case LogReasons.MsgClear:
                isEnabled = this.#doc.moduleIsActive("logs.moderation.clears");
                break;

            case LogReasons.AutoMod:
                isEnabled = this.#doc.moduleIsActive("logs.moderation.automod");
                break;

            case LogReasons.Settings:
                isEnabled = this.#doc.moduleIsActive("logs.staff.settings");
                break;

            case LogReasons.Error:
                isEnabled = this.#doc.moduleIsActive("logs.staff.errors");
                break;

            case LogReasons.DSSunday:
                isEnabled = this.#doc.moduleIsActive("logs.darkshop.sunday");
                break;
            case LogReasons.AutomatedChange:
                if (this.target === ChannelModules.DarkShopLogs) {
                    isEnabled = this.#doc.moduleIsActive("logs.darkshop.removed_currency");
                } else {
                    isEnabled = this.#doc.moduleIsActive("logs.staff.automated_changes");
                }
                break;
        }

        this.enabled = isEnabled;
        return true
    }

    /**
     * Definir el canal inmediatamente [DEVELOPER]
     * @param {GuildChannel} channel 
     */
    setChannel(channel) {
        this.channel = channel
        return this;
    }

    /**
     * Definir el servidor inmediatamente
     * @param {Guild} guild 
     */
    setGuild(guild) {
        this.guild = guild
        if (!this.interaction) this.interaction = guild
        return this;
    }

    /**
     * 
     * @param {Enum[ChannelModules]} target ChannelModules
     * @returns this
     */
    setTarget(target) {
        this.target = target;
        return this;
    }

    /**
     * 
     * @param {Enum[LogReasons]} reason LogReasons
     * @returns this
     */
    setReason(reason) {
        this.reason = reason;
        return this;
    }

    /**
     * Envía el log al canal configurado dependiendo su tipo
     * @returns {Promise<Message | null>}
     */
    async send(options = { embed: null, content: null, embeds: [], components: [] }) {
        let { content, embeds, components, embed } = options;

        return new Promise(async (res, rej) => {
            try {
                if (!this.#fetched) await this.#fetch()
            } catch (err) {
                rej(err)
            }

            if (!this.enabled) return res(null);

            let msg;

            if (embed) {
                if (embed instanceof Embed) msg = await this.channel?.send({ content, embeds: [embed], components }).catch();
                else if (embed instanceof ErrorEmbed) msg = await embed.send()
            } else msg = await this.channel?.send({ content, embeds, components }).catch(err => {
                this.channel = null;
            });

            if (!msg && this.channel) throw new BadCommandError(this.interaction, "INVALID CONTENT & EMBED");
            else if (msg) this.#handled = true;

            if (this.#handled) return res(msg)
            //console.log({ fetched: this.#fetched, channel: this.channel ? true : false });
            return res(null);
        })

    }

}

module.exports = Log;