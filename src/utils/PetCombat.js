const { CommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, User, ButtonBuilder, ButtonStyle, AllowedMentionsTypes } = require("discord.js");
const Pet = require("./Pet");
const Collector = require("./Collector");
const Embed = require("./Embed");
const { ProgressBar, Sleep, GetRandomItem, PrettyCurrency } = require("./functions");
const { Colores } = require("../resources");
const { PetAttacksType, ShopTypes } = require("./Enums");
const { FetchError } = require("../errors");

const Chance = require("chance");
const ms = require("ms");
const Item = require("./Item");
const { Users } = require("mongoose").models;

/**
 * Representa una pelea entre mascotas
 */
class PetCombat {
    #interaction;
    #doc;
    #bet = null;
    #player;
    #users = new Map();
    #ended = false;
    #movementNo = 1;
    #components;
    #playing;
    #rival;
    #messages;

    /**
     * @param {CommandInteraction} interaction 
     */
    constructor(interaction) {
        this.#interaction = interaction;
    }

    async build(doc, user, rival) {
        this.#doc = doc;
        this.userDoc = user;
        this.rivalDoc = rival;

        if (this.userDoc.data.pets.length === 0 || this.rivalDoc.data.pets.length === 0)
            throw new FetchError(this.#interaction, "mascotas", [
                "Ambos usuarios deben tener al menos una mascota"
            ])

        return this
    }

    /**
     * Cambia la mascota inicial del usuario antes de iniciar el combate
     * @param {User} user 
     */
    async changePet(user) {
        const playerNo = user.id === this.#interaction.user.id ? 0 : 1;
        let doc = playerNo === 0 ? this.userDoc : this.rivalDoc

        // Seleccionar mascota
        let components = [
            new ActionRowBuilder()
                .setComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("petCombat")
                        .setPlaceholder(`Selecciona tu mascota, ${user.username}`)
                )
        ]

        if ((playerNo === 0 ? this.userDoc.data.pets : this.rivalDoc.data.pets).length != 1) {
            for await (const pet of playerNo === 0 ? this.userDoc.data.pets : this.rivalDoc.data.pets) {
                components[0].components[0].addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(`${pet.name} | 🗡️ ${pet.stats.attack} 🛡️ ${pet.stats.defense}`)
                        .setDescription(`❤️ ${pet.stats.hp} 🍗 ${pet.stats.hunger}`)
                        .setValue(String(pet.id))
                )
            }

            await this.#interaction.editReply({ content: null, embeds: [], components });
            const collector = await new Collector(this.#interaction, {
                filter: (inter) => {
                    return inter.isStringSelectMenu() && inter.customId === "petCombat" && inter.user.id === user.id
                },
                wait: true
            }).raw();

            await collector.deferUpdate();

            this.#users.set(playerNo, {
                user,
                doc,
                pet: await new Pet(this.#interaction, Number(collector.values[0])).build(this.#doc, doc)
            })
        } else { // Tiene una sola mascota
            let p = playerNo === 0 ? this.userDoc.data.pets : this.rivalDoc.data.pets;
            this.#users.set(playerNo, {
                user,
                doc,
                pet: await new Pet(this.#interaction, p[0].id).build(this.#doc, doc)
            })
        }

        this.#interaction.client.petCombats.set(user.id, this.#users.get(playerNo));
    }

    async #updateDocs() {
        for await (const n of [0, 1]) {
            let get = this.#users.get(n)
            const { user_id, guild_id } = get.doc
            this.#users.set(n, Object.assign(get, {
                doc: await Users.getWork({ user_id, guild_id })
            }))

            console.log(this.#users.get(n));
        }
    }

    // ------------------- COMBAT -----------------------
    #togglePlayer() {
        this.#player = this.#player === 0 ? 1 : 0;
        return this;
    }
    #rivalNo() {
        return this.#player === 0 ? 1 : 0
    }

    /**
     * Combate contra una persona
     * @param {Number} bet La apuesta del combate
     */
    async start(bet) {
        this.#bet = bet;
        this.#player = new Chance().bool() ? 0 : 1;

        await this.#interaction.editReply({
            content: this.#users.get(this.#player).user.toString(),
            embeds: [
                new Embed()
                    .defDesc(`# Empieza ${this.#users.get(this.#player).user.username}`)
                    .defColor(Colores.nocolor)
            ],
            components: []
        })

        await Sleep(2000);

        while (!this.#ended) {
            try {
                await this.#turn()
            } catch (err) {
                await this.#interaction.followUp({
                    content: `## ${this.#interaction.client.Emojis.Check} Gana el combate **${this.#rival.user}**.\n## ${this.#interaction.client.Emojis.Error} ${this.#playing.user} tardó demasiado en jugar.`,
                    allowedMentions: {
                        users: [this.#rival.user.id]
                    }
                })

                this.pet.changeHp(-this.pet.hp);
                await this.pet.save();
            }
        }
    }

    async endgame() {
        let player1 = this.#users.get(0);
        let player2 = this.#users.get(1);

        let embed = new Embed();

        if (player1.pet.wasDefeated && player2.pet.wasDefeated) { // ambas perdieron
            embed
                .defTitle("🏳️ Fue un empate")
                .defDesc(`## Ambos quedaron en **0 HP** ‼️
${this.#bet ? `### A cada uno se le regresan ${PrettyCurrency(this.#interaction.guild, this.#bet)}` : ``}
### No cambiaron las métricas de victorias o derrotas`)
                .defColor(Colores.nocolor);
            player1.pet.changeHp(1);
            player2.pet.changeHp(1);
        } else if (player1.pet.wasDefeated) { // perdio el retador
            embed
                .defTitle(`🏆 Gana ${player2.user.username}`)
                .defDesc(`## 💔 ${player1.pet.name} se quedó en **0 HP**.
${this.#bet ? `### — Se le dan ${PrettyCurrency(this.#interaction.guild, this.#bet)} al ganador.` : ``}`)
                .defColor(Colores.verde);

            player1.pet.changeHp(1);
            player1.pet.defeats++;
            player2.pet.wins++;
            if (this.#bet) {
                player2.doc.addCurrency(this.#bet, false);
                player1.doc.economy.global.currency -= this.#bet;
            }
        } else { // perdio el retado
            embed
                .defTitle(`🏆 Gana ${player1.user.username}`)
                .defDesc(`## 💔 ${player2.pet.name} se quedó en **0 HP**.
${this.#bet ? `### — Se le dan ${PrettyCurrency(this.#interaction.guild, this.#bet)} al ganador.` : ``}`)
                .defColor(Colores.verde);

            player2.pet.changeHp(1);
            player2.pet.defeats++;
            player1.pet.wins++;

            if (this.#bet) {
                player1.doc.addCurrency(this.#bet, false);
                player2.doc.economy.global.currency -= this.#bet;
            }
        }

        await this.#interaction.editReply({ embeds: [embed], components: [], content: null })

        this.#interaction.client.petCombats.delete(player1.user.id)
        this.#interaction.client.petCombats.delete(player2.user.id)

        // actualizar la base de datos
        await player1.pet.save();
        await player2.pet.save();
    }

    async #turn() {
        this.#playing = this.#users.get(this.#player);
        this.#rival = this.#users.get(this.#rivalNo());
        this.pet = this.#playing.pet;
        this.rivalpet = this.#rival.pet;
        this.#messages = [];

        this.pet.inCombat = true;
        this.rivalpet.inCombat = true;

        if (this.#movementNo === 1) {
            await this.pet.save()
            await this.rivalpet.save()
        }

        if (this.pet.wasDefeated || this.rivalpet.wasDefeated) {
            this.#ended = true;
            this.pet.inCombat = false;
            this.rivalpet.inCombat = false;
            return await this.endgame()
        }

        // Mostrar Embed con botones de turno
        this.#components = [
            new ActionRowBuilder()
                .setComponents(
                    new ButtonBuilder()
                        .setCustomId("petAttack")
                        .setLabel("Ataque")
                        .setEmoji("🗡️")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("petDefense")
                        .setLabel("Defensa")
                        .setEmoji("🛡️")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("petItem")
                        .setLabel("Item")
                        .setDisabled(this.#playing.doc.data.inventory.filter(x => x.shopType === ShopTypes.PetShop).length === 0)
                        .setEmoji("🥫")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("petFlee")
                        .setLabel("Relevo")
                        .setEmoji("🏃")
                        .setDisabled(this.#playing.doc.data.pets.length === 1)
                        .setStyle(ButtonStyle.Secondary)
                ),
            new ActionRowBuilder()
                .setComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("petSelection")
                        .setDisabled(true)
                        .setPlaceholder("Selecciona una acción")
                        .setOptions(
                            new StringSelectMenuOptionBuilder()
                                .setLabel("Foo")
                                .setValue("Bar")
                        )
                )
        ]

        let e = new Embed()
            .defAuthor({ text: `Es el turno de ${this.#playing.user.username}`, icon: this.#playing.user.displayAvatarURL({ dynamic: true }) })
            .defDesc(`# ${this.pet.name}
## 🗡️ ${this.pet.stats.attack} — 🛡️ ${this.pet.stats.defense}
### ❤️ ${ProgressBar(this.pet.hp / this.pet.shop_info.stats.hp * 100)} — **${this.pet.hp}**
### 🍗 ${ProgressBar(this.pet.hunger)} — **${this.pet.hunger}**
### ⚡ ${ProgressBar(this.pet.ultCharge)} — **ULT ${this.pet.ultCharge}**`)
            .defColor(Colores.verde)
            .defFooter({ text: `Movimiento #${this.#movementNo} — Contra ${this.#rival.user.username}`, icon: this.#interaction.guild.iconURL({ dynamic: true }) });

        await this.#interaction.editReply({ content: this.#playing.user.toString(), components: this.#components, embeds: [e] })

        const collector = await new Collector(this.#interaction, {
            filter: (i) => this.#components.find(x => {
                return x.components.find(y => y.data.custom_id === i.customId) && i.user.id === this.#playing.user.id
            }),
            wait: true,
            time: ms("10m")
        }).raw()

        await collector.deferUpdate();

        switch (collector.customId) {
            case "petAttack":
                await this.#selectAttack();
                break;
            case "petItem":
                await this.#selectItem();
                break;
        }

        await this.#updateDocs();

        this.#movementNo++;
    }

    // ----------- Movements -----------
    async #selectAttack() {
        this.#components[0].components.forEach(c => c.setDisabled(true));
        this.#components[1] = new ActionRowBuilder()
            .setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("attackSelection")
                    .setPlaceholder("Selecciona un ataque")
            )

        for (const [i, attack] of this.pet.attacks.entries()) {
            if (attack.type === PetAttacksType.Ultimate && this.pet.ultCharge != 100) continue;

            this.#components[1].components[0]
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(attack.name)
                        .setDescription(`+ ${attack.cost} 🍗`)
                        .setValue(String(i))
                )
        }

        await this.#interaction.editReply({ components: this.#components });
        const collector = await new Collector(this.#interaction, {
            wait: true,
            filter: (inter) => inter.customId === "attackSelection" && inter.user.id === this.#playing.user.id,
            time: ms("10m")
        }).raw();
        await collector.deferUpdate();

        const attackIndex = Number(collector.values[0]);
        let attack = this.pet.attacks[attackIndex];
        let max = this.pet.stats.attack;

        let attackValue = 1;

        switch (attack.type) {
            case PetAttacksType.Basic:
                let unlocked = new Chance().bool({ likelihood: this.#doc.settings.quantities.pets.basic_unlocked });

                if (unlocked) this.#messages.push(GetRandomItem([
                    `# **${this.pet.name}** se viene arriba`,
                    `# **${this.pet.name}** enloquece`,
                    `# **${this.pet.name}** se inspira`,
                    `# **${this.pet.name}** es imparable`
                ]));

                attackValue = unlocked ? new Chance().integer({ min: max / 1.5, max }) : new Chance().integer({ min: 1, max: max / 1.5 });
                break;

            case PetAttacksType.Critical:
                attackValue = new Chance().integer({ min: max / 1.2, max });
                break;

            case PetAttacksType.Advanced:
                attackValue = new Chance().integer({ min: 1, max })
                break;

            case PetAttacksType.Ultimate:
                this.#messages.push(GetRandomItem([
                    `# **${this.pet.name}** FINALMENTE LO HACE`,
                    `# **${this.pet.name}** NO ESTÁ JUGANDO`,
                    `# **${this.pet.name}** QUIERE TERMINAR CON ESTO`,
                    `# **${this.pet.name}** LO DA TODO`
                ]))
                attackValue = max;
                break;
        }

        this.#messages.push(`### **${this.pet.name}** +${attack.cost.toLocaleString("es-CO")} 🍗`);
        this.#messages.push(`### **${this.rivalpet.name}** -${attackValue.toLocaleString("es-CO")} ❤️`);

        this.pet.changeHunger(attack.cost);
        this.pet.ultCharge += attackValue;
        this.rivalpet.changeHp(-attackValue);

        await this.pet.save();
        await this.rivalpet.save();

        let attackEmbed = new Embed()
            .defTitle(`${this.pet.name} Attacks!`)
            .defColor(Colores.verde);

        this.#messages.forEach(msg => {
            attackEmbed.defDesc(`${attackEmbed.data.description ?? ""}\n${msg}`)
        })

        await this.#interaction.editReply({ embeds: [attackEmbed], components: [] })
        await Sleep(2000)
        return this.#togglePlayer();
    }

    async #selectItem() {
        const maxhp = this.pet.shop_info.stats.hp;

        this.#components[0].components.forEach(c => c.setDisabled(true));
        this.#components[1] = new ActionRowBuilder()
            .setComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("itemSelection")
                    .setPlaceholder("Selecciona un item")
            )

        let itemsAdded = [];

        for (const [i, _item] of this.#playing.doc.data.inventory.entries()) {
            if (itemsAdded.find(x => x === _item.item_id) || _item.shopType != ShopTypes.PetShop) continue;
            const item = await new Item(this.#interaction, _item.item_id, _item.shopType).build(this.#playing.doc, this.#doc);

            let hunger = item.item.stats.hunger > 100 ? 100 : item.item.stats.hunger;
            let hp = item.item.stats.hp > maxhp ? maxhp : item.item.stats.hp;

            this.#components[1].components[0]
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(item.item.name)
                        .setDescription(`- ${hunger} 🍗, + ${hp} ❤️‍🩹`)
                        .setValue(String(i))
                )

            itemsAdded.push(item.item.id);
        }

        await this.#interaction.editReply({ components: this.#components });
        const collector = await new Collector(this.#interaction, {
            wait: true,
            filter: (inter) => inter.customId === "itemSelection" && inter.user.id === this.#playing.user.id,
            time: ms("10m")
        }).raw();
        await collector.deferUpdate();

        const itemIndex = Number(collector.values[0]);

        let item = await new Item(this.#interaction, this.#playing.doc.data.inventory[itemIndex].item_id, ShopTypes.PetShop).build(this.#playing.doc, this.#doc);
        let hunger = item.item.stats.hunger > 100 ? 100 : item.item.stats.hunger;
        let hp = item.item.stats.hp > maxhp ? maxhp : item.item.stats.hp;

        this.#messages.push(`### **${this.pet.name}** -${hunger.toLocaleString("es-CO")} 🍗`);
        this.#messages.push(`### **${this.pet.name}** +${hp.toLocaleString("es-CO")} ❤️`);

        this.pet.changeHunger(-hunger);
        this.pet.changeHp(hp);
        await item.removeItemFromInv();
        await this.pet.save();

        let itemEmbed = new Embed()
            .defTitle(`${this.pet.name} usa ${item.item.name}!`)
            .defColor(Colores.verde);

        this.#messages.forEach(msg => {
            itemEmbed.defDesc(`${itemEmbed.data.description ?? ""}\n${msg}`)
        })

        await this.#interaction.editReply({ embeds: [itemEmbed], components: [] })
        await Sleep(2000)
        return this.#togglePlayer();
    }
}

module.exports = PetCombat