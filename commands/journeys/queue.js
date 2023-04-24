const { SlashCommandBuilder } = require('discord.js');

var myModule = require("./journey.js")
var queue = myModule.queue

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Check queue size'),
	async execute(interaction) {
		await interaction.reply({content: `The queue currently has ${queue.length} waiting. It will take approximately ${(queue.length) * 15 / 60} hour(s) until it fully clears.`, ephemeral: true});
	},
};