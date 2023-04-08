const { Command, Categories, Item, ErrorEmbed } = require("../../src/utils")

const command = new Command({
    name: "use",
    desc: "Usa items en tu inventario",
    category: Categories.Economy
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

    console.log(inv_item)

    let noItem = new ErrorEmbed(interaction, {
        type: "doesntExist",
        data: {
            action: "use",
            missing: `Item con ID de uso \`${id.value}\``,
            context: "tu inventario"
        }
    });

    if (!inv_item) return noItem.send();

    const item = await new Item(interaction, inv_item.item_id, inv_item.isDarkShop).build(params.getUser(), params.getDoc());
    return item.use(id.value, usuario?.member)
}

module.exports = command;