const { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Chance = require("chance");
const ms = require("ms");

const { CardType, EndReasons, Cooldowns } = require("./Enums");
const Embed = require("./Embed");
const { Colores } = require("../resources");

const Collector = require("./Collector");
const { ExecutionError, AlreadyUsingError } = require("../errors");
const { PrettyCurrency } = require("./functions");

/**
 * TY UnbelievaBoat 💚 !
 */
class Blackjack {

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Number} decks
     */
    constructor(interaction, decks = 1) {
        this.interaction = interaction;
        this.client = interaction.client;
        this.Emojis = this.client.getCustomEmojis(this.interaction.guild.id);

        this.shuffled = false;
        this.deckNumber = decks;

        this.deck = this.#getDeck();
        this.#shuffleCards();
        this.#rows();
    }

    #rows() {
        this.row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("hit")
                    .setLabel("Pedir")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId("stand")
                    .setLabel("Plantarse")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("double")
                    .setLabel("Doblar")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("split")
                    .setLabel("Dividir")
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
            )

        this.supportRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("giveup")
                    .setLabel("Rendirse")
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId("bjHelp")
                    .setLabel("Ayuda")
                    .setEmoji("⁉️")
                    .setStyle(ButtonStyle.Secondary)
            )
    }

    #getDeck() {
        const client = this.interaction.client;

        if (client.blackjackCards.length === 0) return this.#fillCards();
        return client.blackjackCards
    }

    #fillCards() {
        const client = this.interaction.client;
        const cards = client.blackjackCards;

        let spadecount = 0;
        let heartscount = 0;
        let diamondscount = 0;
        let cloverscount = 0;
        let decks = 0;

        deckLoop:
        for (let i = 1; i < 14; i++) {
            let card = i;
            let value = i;

            let cardtype;

            if (card === 11) card = "J"
            if (card === 12) card = "Q"
            if (card === 13) card = "K"

            if (value > 10) value = 10;

            if (spadecount != 13) {
                cardtype = CardType.Spade;
                spadecount++
            }

            else if (heartscount != 13) {
                cardtype = CardType.Heart;
                heartscount++
            }
            else if (diamondscount != 13) {
                cardtype = CardType.Diamond;
                diamondscount++
            }
            else if (cloverscount != 13) {
                cardtype = CardType.Clover;
                cloverscount++
            }

            cards.push({
                type: cardtype,
                card,
                value
            })

            if (cloverscount === 13) { // una deck completa
                decks++;

                spadecount = 0;
                heartscount = 0;
                diamondscount = 0;
                cloverscount = 0;
            }
            if (decks === this.deckNumber) break deckLoop;
            if (i === 13) i = 0; // si i es 13 reiniciar

        }

        console.log("🟢 Se rellenaron las cartas")
        return cards;
    }

    #shuffleCards() {
        this.shuffled = true
        this.deck = new Chance().shuffle(this.deck)
        return this
    }

    #borrowCards(number = 1) {
        let spliced = this.deck.slice(0, number)
        this.deck.splice(0, number)

        this.#updateClient();

        return spliced
    }

    #checkCards(number = 1) {
        return this.deck.slice(0, number);
    }

    #updateClient() {
        this.interaction.client.blackjackCards = this.deck;
        return
    }

    #translateCards(cardsarray, dealer = false) {
        let ret = [];
        let tempValue = 0;
        for (const obj of cardsarray) {
            let suffix;
            const { type, card } = obj;
            let value = obj.value;

            if (type === CardType.Spade) suffix = "S";
            if (type === CardType.Heart) suffix = "H";
            if (type === CardType.Diamond) suffix = "D";
            if (type === CardType.Clover) suffix = "C";

            let emoji = this.client.Emojis[card + suffix] ?? card + suffix;

            if (dealer && ret.length > 0) emoji = this.client.Emojis.BackCard;
            else
                tempValue += value;

            ret.push(emoji)
        }

        let actualValue = !dealer ? this.#checkValue(cardsarray) : tempValue;
        if (actualValue === 21 && cardsarray.length === 2) actualValue = "Blackjack"

        let cards = ret.join(" ");
        return `${cards}\n\n${this.#checkValue(cardsarray, true).soft && !dealer && Number(actualValue) ? "Podrían valer" : "Valen"}: **${actualValue}**`;
    }

    async #generateEmbed(showDealer = false) {
        //console.log("⚪ Se debería mostrar las cartas del Dealer? %s", showDealer)
        this.embed = new Embed()
            .defAuthor({ text: "Blackjack", icon: this.client.EmojisObject.BackCard.url })
            .defDesc(`Hay ${PrettyCurrency(this.interaction.guild, this.bet)} en juego.`)
            .defField("Tu mano", this.#translateCards(this.player_hand), true)
            .defField("Mano del Dealer", this.#translateCards(this.dealer_hand, showDealer ? false : true), true)
            .defFooter({ text: `Quedan ${this.deck.length} cartas en la baraja` })
            .defColor(Colores.verde)
    }

    async #collectorWork(message) {
        const interaction = this.interaction;

        const filter = async i => {
            return i.user.id === interaction.user.id &&
                (i.customId === "hit" || i.customId === "stand" ||
                    i.customId === "double" || i.customId === "split" ||
                    i.customId === "giveup") &&
                i.message.id === message.id;
        }

        this.collector = new Collector(this.interaction, { filter, time: ms("10m") }, true);
        this.collector.onActive(async () => {
            this.interaction.followUp({
                ephemeral: true, embeds: [
                    new AlreadyUsingError(interaction, "Ya estás en un juego de Blackjack, terminalo antes de iniciar otro.").embed
                ]
            });
        }).onEnd(() => {
            this.row.components.forEach(c => c.setDisabled());
            this.supportRow.components.find(c => c.data.custom_id === "giveup").setDisabled();

            this.interaction.editReply({ components: [this.row, this.supportRow] });
        }).handle();

        this.collector = this.collector.raw();

        this.collector.on("collect", async (i) => {
            this.#getDeck(); // para rellenar, en caso de ser necesario

            if (this.ended) try {
                return i.update();
            } catch (err) {
                console.log(err)
            }

            switch (i.customId) {
                case "hit":
                    await this.#hit();

                    await this.#generateEmbed();
                    if (!this.ended) this.interaction.editReply({
                        embeds: [this.embed],
                        components: [this.row, this.supportRow]
                    })
                    break;
                case "stand":
                    await this.#stand();
                    break;
                case "double":
                    await this.#double();
                    break;
                case "split":
                    this.#split();
                    break;
                case "giveup":
                    this.#giveup();
                    this.played--;
                    break;

                case "dev":
                    console.log(this.#checkCards());
                    this.played--;
                    break;

                default:
                    this.played--
            }

            this.played++;

            if (this.played >= 2) {
                this.supportRow.components.find(x => x.data.custom_id === "giveup").setDisabled(true)
                this.interaction.editReply({
                    components: [this.row, this.supportRow]
                })
            }
        })

        this.collector.on("end", async (c, reason) => {
            if (reason === EndReasons.OldCollector) return;
            if (!this.ended) {
                await this.endgame(false, EndReasons.TimeOut);
            }
        })
    }

    async #hit() {
        console.log("🟢 %s ha pedido otra carta", this.interaction.user.username)

        let card = this.#borrowCards(1);
        this.player_hand = this.player_hand.concat(card); // agregar la nueva carta a la mano

        let valor = this.#checkValue()

        /* console.log("🟢 Las nuevas cartas son:")
        console.log(this.player_hand) */

        if (valor > 21) return await this.endgame(false, EndReasons.Over21);
        if (valor === 21) return await this.#stand();
    }

    async #stand() {
        console.log("🟢 %s se ha plantado", this.interaction.user.username)

        let hit = true;
        let saved = 0;

        while (hit && this.#checkValue() != 21) {
            // que juegue el dealer
            let obj = this.#checkValue(this.dealer_hand, true);
            let dealer_value = obj.value;
            let nextCard = this.#checkCards();

            this.#getDeck(); // para rellenar, en caso de ser necesario

            if (dealer_value === 21 && obj.soft && this.dealer_hand.length === 2) { // BLACKJACK!
                hit = false;
            } else

                if (dealer_value < 17 || obj.soft) {
                    console.log("⚪ Es %s", dealer_value)
                    console.log("⚪ La siguiente carta vale %s", nextCard[0].value)

                    let card = this.#borrowCards(1);

                    // si se pasa, y pasa el 50/50 y se ha salvado menos de 5 veces tomarla, sino, que siga el loop
                    if (dealer_value + card[0].value <= 21) this.dealer_hand = this.dealer_hand.concat(card)
                    else if (dealer_value + card[0].value > 21 && new Chance().bool() || saved > 5)
                        this.dealer_hand = this.dealer_hand.concat(card)

                    else saved++
                }

            if (this.#checkValue(this.dealer_hand) >= 17 && !obj.soft) hit = false;
        }

        console.log("⚪ Finalmente el valor de la mano es %s", this.#checkValue(this.dealer_hand))

        let dealerVal = this.#checkValue(this.dealer_hand);
        let playerVal = this.#checkValue();

        if (dealerVal > 21 && playerVal < 21) await this.endgame(true)
        else if (dealerVal > 21 && playerVal <= 21) await this.endgame(true)
        else if (playerVal > dealerVal && dealerVal < 21) await this.endgame(true)
        else if (playerVal === dealerVal) await this.endgame(-1)
        else await this.endgame(false);
    }

    async #double() {
        console.log("🟢 %s ha doblado decidió doblar su apuesta", this.interaction.user.username);

        this.bet *= 2

        this.#hit();

        if (!this.ended) await this.#stand();
    }

    #split() {
        this.interaction.followUp({ content: `Esta opción está en construcción vuelve en 9 años ${this.client.Emojis.Determined}`, ephemeral: true });
        this.played--; // quitarlo despues
    }

    #giveup() {
        this.bet = Math.ceil(this.bet / 2);

        return this.endgame(false, EndReasons.GaveUp);
    }

    #checkValue(hand = this.player_hand, obj = false) {
        // checkear el valor
        let valor = 0;
        let asValue = 0;
        hand.forEach(card => {
            if (card.card === 1) {
                if (asValue + 11 <= 21) asValue += 10 // PORQUE DESPUÉS SE AGREGA 1, REALMENTE DEBERIA SER 11
            }
            valor += card.value
            asValue += card.value
        });

        let returnable = asValue > valor ?
            asValue <= 21 ? asValue : valor
            : valor;

        return obj ? { value: returnable, soft: returnable === asValue && asValue != valor } : returnable;
    }

    async start(bet, user, doc) {
        this.played = 0;
        this.bet = bet;
        this.ended = false;

        this.user = user;
        this.doc = doc;

        if (this.bet < this.doc.settings.quantities.limits.bets.blackjack.min)
            throw new ExecutionError(this.interaction,
                `La apuesta debe ser mayor a ${PrettyCurrency(this.interaction.guild, this.doc.settings.quantities.limits.bets.blackjack.min)}`
            )
        else if (this.bet > this.doc.settings.quantities.limits.bets.blackjack.max)
            throw new ExecutionError(this.interaction,
                `La apuesta debe ser menor a ${PrettyCurrency(this.interaction.guild, this.doc.settings.quantities.limits.bets.blackjack.max)}`
            )

        console.log("🟢 Hay %s cartas en la baraja", this.deck.length)

        // sacar la mano del dealer
        this.dealer_hand = this.#borrowCards(2)
        console.log("⚪ La mano inicial del dealer será");
        console.log(this.dealer_hand)

        // sacar la mano inicial del jugador
        this.player_hand = this.#borrowCards(2)
        console.log("⚪ La mano inicial del jugador será");
        console.log(this.player_hand)

        let splitBttn = this.row.components.find(x => x.data.custom_id === "split");

        if (this.player_hand.length === 2 && this.player_hand.every(x => {
            return x.card === this.player_hand[0].card
        })) splitBttn.setDisabled(false);
        else splitBttn.setDisabled(true);

        console.log("🟢 Ahora hay %s cartas", this.deck.length)

        await this.#generateEmbed();

        let msg = await this.interaction.editReply({ embeds: [this.embed], components: [this.row, this.supportRow] });

        await this.#collectorWork(msg);

        // revisar que no gane instantaneamente
        if (this.#checkValue() === 21) return this.endgame(true, EndReasons.Blackjack);
    }

    async endgame(won = false, reason = null) {
        this.ended = true;
        let save = true;

        console.log("🟢 Se terminó el juego con resultado %s", won)
        await this.#generateEmbed(reason != EndReasons.Blackjack)

        if (won === -1) {
            this.embed
                .defDesc(`Se te regresan ${PrettyCurrency(this.interaction.guild, this.bet)}.`)
                .defColor(Colores.cake)
        } else

            if (!won) {
                this.embed
                    .defDesc(`Perdiste ${PrettyCurrency(this.interaction.guild, this.bet)}.`)
                    .defColor(Colores.rojo)

                if (reason === EndReasons.GaveUp) {
                    this.embed
                        .defDesc(`Perdiste ${PrettyCurrency(this.interaction.guild, this.bet)} al rendirte.`)
                        .defColor(Colores.rojooscuro)
                } else if (reason === EndReasons.TimeOut) {
                    this.embed
                        .defDesc(`Perdiste ${PrettyCurrency(this.interaction.guild, this.bet)} porque pasó mucho tiempo.`)
                        .defColor(Colores.rojooscuro)
                }

                await this.user.removeCurrency(this.bet);
                await this.doc.addToBank(this.bet, "gambling");

                console.log("🔴 %s perdió %s %s en el Blackjack", this.interaction.user.username, this.bet.toLocaleString("es-CO"), this.Emojis.Currency.name);
            } else {
                save = false;
                this.embed
                    .defDesc(`Ganaste ${PrettyCurrency(this.interaction.guild, this.bet)}.`)
                    .defColor(Colores.verdejeffrey)

                if (reason === EndReasons.Blackjack) {
                    this.embed
                        .defDesc(`Ganaste ${PrettyCurrency(this.interaction.guild, this.bet)} instantáneamente.`)
                        .defAuthor({ text: "BLACKJACK!", icon: this.client.EmojisObject.BackCard.url })
                }

                let countQ = this.client.wonBlackjack.find(x => x.user === this.interaction.user.id && x.guild === this.interaction.guild.id);
                if (countQ) countQ.count++;
                else this.client.wonBlackjack.push({
                    user: this.interaction.user.id,
                    guild: this.interaction.guild.id,
                    count: 1
                })

                if (countQ?.count === this.doc.settings.quantities.blackjack.consecutive_wins) await this.user.cooldown(Cooldowns.Blackjack, { save: false });

                this.user.addCount("blackjack", 1, false);
                await this.user.addCurrency(this.bet)
            }

        if (reason === EndReasons.Blackjack) {
            this.row.components.forEach(c => c.setDisabled());
            this.supportRow.components.find(c => c.data.custom_id === "giveup").setDisabled();
        }

        await this.interaction.editReply({ embeds: [this.embed], components: [this.row, this.supportRow] })
        if (this.collector) this.collector.stop()

        if (save) await this.user.save();
        return this;
    }
}

module.exports = Blackjack;