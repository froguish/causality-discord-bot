const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('journey')
		.setDescription('Creates a new journey'),
	async execute(interaction) {
		await interaction.reply('journeeeeeey!');
	},
};