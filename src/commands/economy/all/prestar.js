const { BadParamsError } = require("../../../errors");
const { Command } = require("../../../utils");
const file = require("../prestar");

const command = new Command({
    name: "all-prestar",
    desc: "Préstale todo tu dinero a un usuario"
})

command.data.options = file.data.options.filter(x => x.name != "dinero");

command.execute = async (interaction, models, params, client) => {
    const user = params.getUser();
    if (user.getCurrency() <= 0) throw new BadParamsError(interaction, "Tienes que tener dinero para hacer eso");

    return await file.execute(interaction, models, Object.assign({}, params, {
        dinero: {
            value: user.getCurrency()
        }
    }), client)
}

module.exports = command;