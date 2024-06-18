const { DoesntExistsError } = require("../../errors")
const { Command, Item } = require("../../utils")

const command = new Command({
    name: "use",
    desc: "Usa items en tu inventario"
})

command.addOption({
    type: "integer",
    name: "id",
    desc: "ID de uso del item",
    min: 1,
    req: true
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "[DS] El usuario con el que vas a afectar el item",
    req: false
})

command.execute = async (interaction, models, params, client) => {
    await interaction.deferReply();
    const { id, usuario } = params

    // codigo
    const user = params.getUser();
    const inv_item = user.data.inventory.find(x => x.use_id === id.value);

    if (!inv_item) throw new DoesntExistsError(interaction, `Item con ID de uso \`${id.value}\``, "tu inventario");

    const item = await new Item(interaction, inv_item.item_id, inv_item.shopType).build(params.getUser(), params.getDoc());
    return await item.use(usuario?.member)
}

module.exports = command;