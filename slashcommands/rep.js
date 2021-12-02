const { SlashCommandBuilder } = require('@discordjs/builders');
const ms = require("ms");
const prettyms = require("pretty-ms");

const User = require("../modelos/User.model.js");

const repCooldown = ms("1d");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rep')
		.setDescription('Cada 24h puedes darle un punto de reputación a un usuario!')
        .addUserOption(option =>
            option.setName('usuario')
                .setRequired(true)
                .setDescription("A quién le vas a dar el punto de reputación")),
	async execute(interaction, client) {
        const guild = client.guilds.cache.find(x => x.id === interaction.guildId);
        const author = guild.members.cache.find(x => x.id === interaction.user.id);

        const member = guild.members.cache.find(x => x.id === interaction.options.getUser("usuario").id);

        const user = await User.findOne({
            guild_id: guild.id,
            user_id: member.id
        }) ?? await new User({
            guild_id: guild.id,
            user_id: member.id
        });

        const user_author = await User.findOne({
            guild_id: guild.id,
            user_id: author.id
        }) ?? await new User({
            guild_id: guild.id,
            user_id: author.id
        });

        if (member.id === author.id) return interaction.reply({content:`No puedes darte un punto de reputación a ti mismo.`, ephemeral: true});

        if (user_author.data.cooldowns.rep){
            let timer = user_author.data.cooldowns.rep;
            let toCheck = (repCooldown) - (new Date().getTime() - timer);
            let left = prettyms(toCheck, {secondsDecimalDigits: 0 });
            if(toCheck < 0) user_author.data.cooldowns.rep = null;
            else
            return interaction.reply(`Usa este comando en ${left}`);
        }

        user.economy.global.reputation += 1;
        user.save();

        user_author.data.cooldowns.rep = new Date();
        user_author.save();

        interaction.reply(`¡Le has dado un punto de reputación a ${member}, deben de ser buenos! ^^`);
	}
};