const { ButtonStyle, ButtonBuilder, ActionRowBuilder, time, TextInputStyle } = require("discord.js");
const Embed = require("./Embed");
const { Colores } = require("../resources");
const Collector = require("./Collector");
const { EndReasons } = require("./Enums");
const Modal = require("./Modal");

const ms = require("ms");

/**
 * Taken from [tutmonda](https://github.com/Jleguim/tutmonda-project) 💜
*/
class InteractivePages {
    /**
     * 
     * @param {{title: string, author_icon: string, color: string, thumbnail: string, description: string, addon: string, footer: string, footer_icon: string}} structure The base for the embed
     * @param {Map<Id, values>} items Mapped by Id's, the {x.y} used on the 'addon', 'y' would be the values inside the key
     * @param {Number} itemsNum The number of items that will be in one page.
     */
    /**
     * @example 
    let items = new Map();

    for (const item of array) {
        let name = item.name;
        let foo = item.foo;
        let bar = item.bar ?? "Bar";
        let id = item.id;

        items.set(id, {
            name,
            foo,
            bar,
            id
        })
    }

    const interactive = new InteractivePages({
        title: "Titulo",
        footer: `Comentario | Página {ACTUAL} de {TOTAL}`,
        color: "#fff",
        thumbnail: interaction.guild.iconURL(),
        description: `Una descripción que no cambiará.`,
        addon: `**— {name}**
**▸ Foo**: {foo}
**▸ Bar**: {bar}
**▸ ID**: {id}\n\n`
    }, items, 3);

    return await interactive.init(interaction)*/
    constructor(structure, items, itemsNum = 3, options) {
        this.base = structure;
        this.options = options;
        this.#prepareBase();

        if (!this.base.addon) throw "addon can not be undefined nor can be an empty string";

        this.items = items;
        this.itemsPerPage = itemsNum;

        this.pages = new Map();
        this.pageToPush = [];

        this.#generatePages();
        this.#createFirstEmbed();
    }

    #prepareBase() {
        this.base.title = this.base.title ?? null;
        this.base.author_icon = this.base.author_icon ?? null;
        this.base.color = this.base.color ?? Colores.nocolor;
        this.base.description = this.base.description ?? "";
        this.base.footer = this.base.footer ?? `Página {ACTUAL} de {TOTAL}`;
        this.base.footer_icon = this.base.footer_icon ?? null;
        this.base.thumbnail = this.base.thumbnail ?? null;
    }

    #generatePages() {
        if (this.items.size === 0) return this.pages.set(1, ["..."])

        let i = 0;
        let pag_actual = 1;
        let fin = this.itemsPerPage * pag_actual - 1; // el index del ultimo item a mostrar

        if (this.items.size <= fin) {
            fin = this.items.size - 1;
        }

        this.items.forEach(value => {
            if (value.hasOwnProperty("showable") && !value.showable) return;
            if (i > fin) {
                this.pages.set(pag_actual, this.pageToPush)

                this.pageToPush = [];
                pag_actual++;

                if (this.items.size <= fin) fin = this.items.size - 1;
                i = 0;
            }

            // regex
            const regx = new RegExp("\{(.*?)\}", "g");
            let addonMatch = this.base.addon.match(regx) // sacar todo lo que esté dentro de {}

            let originaladdon = this.base.addon;

            addonMatch.forEach(a => {
                let info = a.match(new RegExp("(?<=\{).+?(?=\})", "g"))[0] // sacar lo que está dentro de los {}

                let toReplace = value[info] ?? "🤷";

                if (toReplace instanceof Date) toReplace = time(toReplace);

                let replaced = this.base.addon.replace(a, toReplace) // reemplazar lo que está entre {} con lo que está dentro de estos en los parámetros de value
                this.base.addon = replaced;
            })


            this.pageToPush.push(this.base.addon)
            i++;

            this.base.addon = originaladdon; // wow
        })

        this.pages.set(pag_actual, this.pageToPush)
    }

    #createFirstEmbed() {
        let pag = this.options?.pag;

        if (pag > this.pages.size || pag < 1 || !pag) pag = 1;

        this.pag = pag;

        let embed = new Embed()
            .defAuthor({ text: this.base.title, icon: this.base.author_icon })
            .defColor(this.base.color)
            .defDesc(`${this.base.description}\n\n${this.pages.get(this.pag).join("")}`)
            .defFooter({ text: this.base.footer.replace(new RegExp("{ACTUAL}", "g"), this.pag).replace(new RegExp("{TOTAL}", "g"), `${this.pages.size}`), icon: this.base.icon_footer });

        if (this.base.thumbnail) embed.defThumbnail(this.base.thumbnail);
        this.firstEmbed = embed;
        return embed;
    }

    async init(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("back")
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId("stop")
                    .setEmoji("🛑")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("jump")
                    .setEmoji("🔢")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("next")
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary)
            )

        const leftI = 0;
        const rightI = row.components.length - 1;

        // no tiene más de una pagina
        if (this.pages.size === 1) row.components.forEach(c => {
            if (c.data.custom_id != "stop") c.setDisabled()
        });

        // deshabilitar numpad si tiene menos de 3 pag
        if (this.pages.size < 3) row.components.find(x => x.data.custom_id === "jump").setDisabled(true);

        if (this.pag != 1) row.components[leftI].setDisabled(false)
        if (this.pag === this.pages.size) row.components[rightI].setDisabled(true)

        try {
            var msg = await interaction.editReply({ content: "", components: [row], embeds: [this.firstEmbed] });
        } catch (err) {
            console.error("🔴 %s", err);
            return;
        }

        const filter = async i => {
            return i.user.id === interaction.user.id &&
                (i.customId === "back" || i.customId === "next" || i.customId === "stop" || i.customId === "jump") &&
                i.message.id === msg.id;
        }

        const collector = new Collector(interaction, { filter }, false, false).onEnd(() => {
            row.components.forEach(c => c.setDisabled());
            interaction.editReply({ components: [row] });
        }).raw();

        let pagn = this.pag;

        collector.on("collect", async i => {
            if (i.customId === "jump") {
                try {
                    await new Modal(i)
                        .defId("jumpPage")
                        .defTitle("Salta a un página")
                        .addInput(
                            { id: "pag", label: "Página", placeholder: "Escribe un número entero positivo", style: TextInputStyle.Short }
                        )
                        .show()

                    let r = await i.awaitModalSubmit({ filter: (inter) => inter.customId === "jumpPage" && inter.user.id === i.user.id, time: ms("1m") });

                    await r.deferUpdate();
                    const { pag } = new Modal(r).read();

                    let num = Math.floor(Number(pag));

                    if (isNaN(num) || num <= 0) pagn = 1;
                    else if (num > this.pages.size) pagn = this.pages.size;
                    else pagn = num;
                } catch (err) {
                    console.error("🔴 %s", err);
                }
            } else {
                if (!i.deferred) await i.deferUpdate();
            }

            if (i.customId === "stop") return collector.stop(EndReasons.StoppedByUser)
            if (i.customId === "back") pagn--;
            else if (i.customId === "next") pagn++;

            if (pagn === 1) row.components[0].setDisabled();
            else row.components[leftI].setDisabled(false);

            if (pagn === this.pages.size) row.components[rightI].setDisabled();
            else row.components[rightI].setDisabled(false);
            try {
                let embed = new Embed()
                    .defAuthor({ text: this.base.title, icon: this.base.author_icon })
                    .defColor(this.base.color)
                    .defDesc(`${this.base.description}\n\n${this.pages.get(pagn).join("")}`)
                    .defFooter({ text: this.base.footer.replace(new RegExp("{ACTUAL}", "g"), `${pagn}`).replace(new RegExp("{TOTAL}", "g"), `${this.pages.size}`), icon: this.base.icon_footer });

                if (this.base.thumbnail) embed.defThumbnail(this.base.thumbnail);

                await interaction.editReply({ embeds: [embed], components: [row] });
            } catch (err) {
                console.error("🔴 %s", err);
            }

        });
    }
}

module.exports = InteractivePages;