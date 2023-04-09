const { Command, Categories } = require("../../src/utils");

const command = new Command({
    name: "pay",
    desc: "Paga tus deudas con otros usuarios",
    category: Categories.Economy
})

command.addOption({
    type: "user",
    name: "usuario",
    desc: "A quién le vas a pagar",
    req: true
})

command.addOption({
    type: "integer",
    name: "dinero",
    desc: "Cuánto le vas a pagar",
    min: 1
})

module.exports = command;