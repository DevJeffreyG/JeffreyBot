const { BadParamsError } = require("../../../errors");
const { Command, DarkShop } = require("../../../utils");

const command = new Command({
    name: "all-dschange",
    desc: "Invierte todo tu dinero posible en la DarkShop"
})

command.execute = async (interaction, models, params, client) => {
    const file = require("../darkshop/dschange");
    const user = params.getUser();
    if (user.getCurrency() <= 0) throw new BadParamsError(interaction, "Tienes que tener dinero para hacer eso");

    const darkshop = new DarkShop(interaction.guild);
    const one = await darkshop.oneEquals();
    const total = Math.floor(user.getCurrency() / one);

    return await file.execute(interaction, models, Object.assign({}, params, {
        cantidad: {
            value: total
        }
    }), client)
}

module.exports = command;