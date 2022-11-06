const { Command, Categories, Blackjack, ErrorEmbed } = require("../../src/utils")

const command = new Command({
    name: "blackjack",
    desc: "Juega al Blackjack con los Jeffros",
    category: Categories.Economy
})

command.addOption({
    type: "integer",
    name: "apuesta",
    desc: "Cuántos Jeffros te vas a jugar",
    min: 1,
    req: true
})


command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();

    const { Users} = models;
    const { apuesta } = params;

    let user = await Users.getOrCreate({
        user_id: interaction.user.id,
        guild_id: interaction.guild.id
    });

    let notEnough = new ErrorEmbed(interaction, {
        type: "economyError",
        data: {
            action: "blackjack",
            error: `No tienes tantos Jeffros para apostar.`,
            money: user.economy.global.jeffros
        }
    })

    if(user.economy.global.jeffros < apuesta.value) return notEnough.send();

    const bj = new Blackjack(interaction, 4);
    bj.start(apuesta.value);

    //interaction.deleteReply();
}

module.exports = command