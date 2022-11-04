const { CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Chance = require("chance");
const ms = require("ms");

const { CardType, EndReasons } = require("./Enums");
const Embed = require("./Embed");
const { Colores } = require("../resources");

class Blackjack {

    /**
     * 
     * @param {CommandInteraction} interaction 
     * @param {Number} decks
     */
    constructor(interaction, decks = 1) {
        this.interaction = interaction;
        this.client = interaction.client;

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

    #getCards(number = 1) {
        let spliced = this.deck.slice(0, number)
        this.deck.splice(0, number)

        this.#updateClient();

        return spliced
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
        if(actualValue === 21 && cardsarray.length === 2) actualValue = "Blackjack"

        let cards = ret.join(" ");
        return `${cards}\n\nValen: **${actualValue}**`;
    }

    async start(bet) {
        this.bet = bet;

        console.log("🟢 Hay %s cartas en la baraja", this.deck.length)

        // sacar la mano del dealer
        this.dealer_hand = this.#getCards(2)
        console.log("⚪ La mano inicial del dealer será");
        console.log(this.dealer_hand)

        // sacar la mano inicial del jugador
        this.player_hand = this.#getCards(2)
        console.log("⚪ La mano inicial del jugador será");
        console.log(this.player_hand)

        console.log("🟢 Ahora hay %s cartas", this.deck.length)

        await this.#generateEmbed();

        let msg = await this.interaction.editReply({ embeds: [this.embed], components: [this.row, this.supportRow] });

        // revisar que no gane instantaneamente
        if(this.#checkValue() === 21) this.endgame(true);

        return this.#collectorWork(msg);

    }

    async #generateEmbed() {
        this.embed = new Embed()
            .defAuthor({ text: "Blackjack", icon: this.client.EmojisObject.BackCard.url })
            .defDesc(`Hay **${this.client.Emojis.Jeffros}${this.bet.toLocaleString("es-CO")}** en juego.`)
            .defField("Tu mano", `${this.#translateCards(this.player_hand)}`, true)
            .defField("Mano del Dealer", `${this.#translateCards(this.dealer_hand, true)}`, true)
            .defFooter({ text: `Quedan ${this.deck.length} cartas en la baraja` })
            .defColor(Colores.verde)
    }

    async #collectorWork(message) {
        const client = this.client;
        const interaction = this.interaction;

        const filter = async i => {
            try {
                if (!i.deferred) await i.deferUpdate()
            } catch (err) {
                //console.log("⚠️ %s", err)
            };

            return i.user.id === interaction.user.id &&
                (i.customId === "hit" || i.customId === "stand" ||
                    i.customId === "double" || i.customId === "split" ||
                    i.customId === "giveup") &&
                i.message.id === message.id;
        }

        this.collector = message.createMessageComponentCollector({ filter, time: ms("10m") });

        const active = client.activeCollectors.find(y => {
            let x = y.collector;
            return x.channelId === this.collector.channelId && x.interactionType === this.collector.interactionType && y.userid === interaction.user.id
        });
        if (active) active.collector.stop(EndReasons.OldCollector);
        client.activeCollectors.push({ collector: this.collector, userid: interaction.user.id })

        this.collector.on("collect", async (i) => {
            switch (i.customId) {
                case "hit":
                    this.#hit();
                    break;
                case "stand":
                    break;
                case "double":
                    break;
                case "split":
                    break;
                case "giveup":
                    break;
            }

            await this.#generateEmbed();
            return this.interaction.editReply({embeds: [this.embed], components: [this.row, this.supportRow]})
        })

        this.collector.on("end", async (i, r) => {
            this.row.components.forEach(c => c.setDisabled());
            await this.interaction.editReply({ components: [this.row, this.supportRow] });

            let index = client.activeCollectors.findIndex(x => x.collector === this.collector && x.userid === interaction.user.id);
            if (!isNaN(index)){
                client.activeCollectors.splice(index, 1);
            } else console.log(`🟥 NO SE ELIMINÓ DE LOS ACTIVECOLLECTORS !! {FILE PAGES}`)

            if(r === EndReasons.OldCollector) return this.interaction.deleteReply()
        })
    }

    #hit() {
        console.log("🟢 %s ha pedido otra carta", this.interaction.user.tag)
        // obtener las cartas actuales
        let card = this.#getCards(1);

        this.player_hand = this.player_hand.concat(card);

        let valor = this.#checkValue()

        /* console.log("🟢 Las nuevas cartas son:")
        console.log(this.player_hand) */

        if (valor > 21) return this.endgame(false);
        if(valor === 21) return this.endgame(true);
    }

    #checkValue(hand = this.player_hand) {
        // checkear el valor
        let valor = 0;
        let asValue = 0;
        hand.forEach(card => {
            if(card.card === 1) {
                if(asValue+11 <= 21) asValue += 10 // PORQUE DESPUÉS SE AGREGA 1, REALMENTE DEBERIA SER 11
            }
                valor += card.value
                asValue += card.value
        });

        let returnable = asValue > valor ?
            asValue <= 21 ? asValue : valor
                : valor;

        return returnable;
    }

    async endgame(won = false) {
        await this.#generateEmbed()

        if (!won) {
            this.embed
                .defDesc(`Perdiste **${this.client.Emojis.Jeffros}${this.bet.toLocaleString("es-CO")}**.`)
                .defColor(Colores.rojo)
        } else {
            this.embed
                .defDesc(`Ganaste **${this.client.Emojis.Jeffros}${this.bet.toLocaleString("es-CO")}**.`)
                .defColor(Colores.verdejeffrey)
        }

        await this.interaction.editReply({embeds: [this.embed]})
        this.collector.stop()

        return this;
    }
}

module.exports = Blackjack;