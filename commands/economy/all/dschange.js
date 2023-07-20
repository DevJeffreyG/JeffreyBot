const { BadParamsError } = require("../../../src/errors");
const { Command, DarkShop } = require("../../../src/utils");

const command = new Command({
    name: "all-dschange",
    desc: "Invierte todo tu dinero posible en la DarkShop"
})

command.execute = async (interaction, models, params, client) => {
    const file = require("../darkshop/dschange");
    const user = params.getUser();
    if (user.economy.global.currency <= 0) throw new BadParamsError(interaction, "Tienes que tener dinero para hacer eso");

    const darkshop = new DarkShop(interaction.guild);
    const one = await darkshop.oneEquals();
    const total = Math.floor(user.economy.global.currency / one);

    return await file.execute(interaction, models, Object.assign({}, params, {
        cantidad: {
            value: total
        }
    }), client)
}

module.exports = command;