const { BadParamsError } = require("../../../errors");
const { Command } = require("../../../utils");

const command = new Command({
    name: "all-blackjack",
    desc: "Apuesta todo tu dinero en el Blackjack"
})

command.execute = async (interaction, models, params, client) => {
    const file = require("../blackjack");
    const user = params.getUser();
    if (user.getCurrency() <= 0) throw new BadParamsError(interaction, "Tienes que tener dinero para hacer eso");

    return await file.execute(interaction, models, Object.assign({}, params, {
        apuesta: {
            value: user.getCurrency()
        }
    }), client)
}

module.exports = command;