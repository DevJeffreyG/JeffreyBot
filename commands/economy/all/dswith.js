const { BadParamsError } = require("../../../src/errors");
const { Command } = require("../../../src/utils");

const command = new Command({
    name: "all-dswith",
    desc: "Saca todo el dinero que tienes invertido de la DarkShop"
})

command.execute = async (interaction, models, params, client) => {
    const file = require("../darkshop/dswith");
    const user = params.getUser();
    if (user.economy.dark.currency <= 0) throw new BadParamsError(interaction, "Tienes que tener dinero para hacer eso");

    return await file.execute(interaction, models, Object.assign({}, params, {
        cantidad: {
            value: user.economy.dark.currency
        }
    }), client)
}

module.exports = command;