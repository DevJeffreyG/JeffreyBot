const { BadParamsError } = require("../../../errors");
const { Command } = require("../../../utils");
const file = require("../save");

const command = new Command({
    name: "all-save",
    desc: "Protege todo tu dinero"
})

command.execute = async (interaction, models, params, client) => {
    const user = params.getUser();
    if (user.getCurrency() <= 0) throw new BadParamsError(interaction, "Tienes que tener dinero para hacer eso");

    return await file.execute(interaction, models, Object.assign({}, params, {
        cantidad: {
            value: user.getCurrency()
        }
    }), client)
}

module.exports = command;