const { Command, Categories } = require("../../src/utils")

const command = new Command({
    name: "dsinventory",
    desc: "Muestra tu inventario de la DarkShop"
})

command.execute = async (interaction, models, params, client) => {
    // codigo
    let command = require("../economy/inventory");

    params["darkshop"] = { value: true }

    return command.execute(interaction, models, params, client)
}

module.exports = command;