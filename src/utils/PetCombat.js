const { CommandInteraction, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, User, ButtonBuilder, ButtonStyle } = require("discord.js");
const Pet = require("./Pet");
const Collector = require("./Collector");
const Embed = require("./Embed");
const { ProgressBar, Sleep, GetRandomItem } = require("./functions");
const { Colores } = require("../resources");
const { PetAttacksType, ShopTypes } = require("./Enums");
const { FetchError, AlreadyUsingError } = require("../errors");

const Chance = require("chance");
const ms = require("ms")

/**
 * Representa una pelea entre mascotas
 */
class PetCombat {
    #interaction;
    #doc;
    #userDoc;
    #rivalDoc;
    #bet;
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
        this.#userDoc = user;
        this.#rivalDoc = rival;

        if (this.#userDoc.data.pets.length === 0 || this.#rivalDoc.data.pets.length === 0)
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
        let doc = playerNo === 0 ? this.#userDoc : this.#rivalDoc

        // Seleccionar mascota
        let components = [
            new ActionRowBuilder()
                .setComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("petCombat")
                        .setPlaceholder(`Selecciona tu mascota, ${user.username}`)
                )
        ]

        if ((playerNo === 0 ? this.#userDoc.data.pets : this.#rivalDoc.data.pets).length != 1) {
            for await (const pet of playerNo === 0 ? this.#userDoc.data.pets : this.#rivalDoc.data.pets) {
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
            let p = playerNo === 0 ? this.#userDoc.data.pets : this.#rivalDoc.data.pets;
            this.#users.set(playerNo, {
                user,
                doc,
                pet: await new Pet(this.#interaction, p[0].id).build(this.#doc, doc)
            })
        }

        this.#interaction.client.petCombats.set(user.id, this.#users.get(playerNo));
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

        while (!this.#ended) await this.#turn()
    }

    // TODO: Apuestas, embeds
    async endgame() {
        let player1 = this.#users.get(0);
        let player2 = this.#users.get(1);

        if (player1.pet.wasDefeated && player2.pet.wasDefeated) { // ambas perdieron
            console.log("fue un empate");
            player1.pet.changeHp(1);
            player2.pet.changeHp(1);
        } else if (player1.pet.wasDefeated) { // perdio el retador
            console.log("gano el jugador 2");
            player1.pet.changeHp(1);
            player1.pet.defeats++;
            player2.pet.wins++;
        } else { // perdio el retado
            console.log("gano el jugador 1");
            player2.pet.changeHp(1);
            player2.pet.defeats++;
            player1.pet.wins++;
        }

        this.#interaction.client.petCombats.delete(player1.user.id)
        this.#interaction.client.petCombats.delete(player2.user.id)

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

        if(this.#movementNo === 1) {
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
### 🍗 ${ProgressBar(this.pet.hunger)} — **${this.pet.hunger}**`)
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
        }
        
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
}

module.exports = PetCombat