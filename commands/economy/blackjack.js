const { Command, Categories, Blackjack } = require("../../src/utils")

const command = new Command({
    name: "blackjack",
    desc: "Juega al Blackjack con los Jeffros",
    category: Categories.Economy
})

command.addOption({
    type: "integer",
    name: "apuesta",
    desc: "Cuántos Jeffros te vas a jugar",
    req: true
})

/*

Object
Beat the dealer by getting as close to 21 as possible, without going over.

Hit / Stand
Hit to draw another card
Stand to finish your game and let the dealer play.

Double Down
Double your bet, draw one more card, and then stand.
Split
If your first two cards are the same number you can split them into separate hands. An equal bet amount is placed on the new hand, and an extra card is drawn for each hand.

Card Values
An ace :aC: is worth either 1 or 11 (this is decided based on whether you would go over 21 if using 11). If the value being used for an ace is 11, this will show as "Soft" in your total.
Cards 2 to 10 are the same as value their number.
Face cards :jC: :qC: :kC: are all worth 10.
Dealers Play
When it's the dealers turn they will hit until reaching 17 or more.
Result
If the first two cards result in 21, this is a natural Blackjack and beats any other combination of 21.
If you have the same total as the dealer your bet is returned.

*/

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { apuesta } = params;

    const bj = new Blackjack(interaction, 4);
    bj.start(apuesta.value);

    //interaction.deleteReply();
}

module.exports = command