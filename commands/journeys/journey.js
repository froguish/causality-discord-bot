const { SlashCommandBuilder } = require('discord.js');
var queue = []

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
		const categorySize = await interaction.guild.channels.cache.get("1094756148315443270").children.cache.size
		const character = interaction.options.getString('character')
		const goal = interaction.options.getString('goal')
		const setting = interaction.options.getString('setting')

		if (categorySize > 4) {
			interaction.reply("Journey size limit reached! \nPlease hold tight as you are placed into a queue. You will be pinged when a spot opens.")
			queue[queue.length] = [`${interaction.user}`, character, goal, setting]
			return
		}

		await interaction.reply(`${character} is going on a journey to ${goal} in ${setting}!`);
		const channel = await interaction.guild.channels.create({
			name: "test1",
			type: 0,
			parent: "1094756148315443270"
		});
		channel.send(`${interaction.user}`)
	},
	queue
};