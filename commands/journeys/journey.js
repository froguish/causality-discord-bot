const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('journey')
		.setDescription('Creates a new journey')
		.addStringOption(option =>
			option.setName("character")
			.setDescription('The character description'))
		.addStringOption(option =>
			option.setName("goal")
			.setDescription(`The character's goal`))
		.addStringOption(option =>
			option.setName("setting")
			.setDescription('The description of the starting setting'))
		,
	async execute(interaction) {
		const character = interaction.options.getString('character')
		const goal = interaction.options.getString('goal')
		const setting = interaction.options.getString('setting')
		await interaction.reply(`${character} is going on a journey to ${goal} in ${setting}!`);
		const channel = await interaction.guild.channels.create({
			name: "test1",
			type: 0,
			parent: "1064958146193408020"
		});
		channel.send(`${interaction.user}`)
	},
};