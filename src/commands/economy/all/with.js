const { BadParamsError } = require("../../../errors");
const { Command } = require("../../../utils");
const file = require("../with");

const command = new Command({
    name: "all-with",
    desc: "Saca todo tu dinero protegido"
})

command.execute = async (interaction, models, params, client) => {
    const user = params.getUser();
    if (user.getSecured() <= 0) throw new BadParamsError(interaction, "Tienes que tener dinero protegido para hacer eso");

    return await file.execute(interaction, models, Object.assign({}, params, {
        cantidad: {
            value: user.getSecured()
        }
    }), client)
}

module.exports = command;