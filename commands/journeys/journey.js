const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai")
require('dotenv/config')

var queue = []
var players = []
var playerInfo = []

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
})

const openai = new OpenAIApi(configuration)

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
		var categorySize = await interaction.guild.channels.cache.get("1094756148315443270").children.cache.size
		var character = interaction.options.getString('character')
		var goal = interaction.options.getString('goal')
		var setting = interaction.options.getString('setting')

		if (categorySize > 4) {
			interaction.reply("Journey size limit reached! \nPlease hold tight as you are placed into a queue. You will be pinged when a spot opens.")
			queue.push([`${interaction.user}`, character, goal, setting])
			return
		}

		/*
		if (await players.includes(interaction.user.id)) {
			interaction.reply("Sorry! Users may only have 1 journey at a time.")
			return
		}
		*/

		await players.push(interaction.user.id)

		await interaction.reply(`Journey started!`);
		const channel = await interaction.guild.channels.create({
			name: "Journey",
			type: 0,
			parent: "1094756148315443270"
		});

		channel.send(`${interaction.user} Journey generating...`)

		playerInfo = [character, goal, setting]
		var context = [
			`Generate a random short detailed sentence about a named character described as YOU.`,
			`Given the character info: (${playerInfo[0]}), generate random a detailed short sentence about their goal.`,
			`Given the character info: (${playerInfo[0]}) and the character's goal (${playerInfo[1]}), generate a random setting for the character.`
		]

		for (let i = 0; i < playerInfo.length; i ++){
			if (playerInfo[i] == null){
				let missing = [{role: 'system', content: context[i]}]

				let result = await openai.createChatCompletion({
					model: 'gpt-3.5-turbo',
					messages: missing,
					max_tokens: 200,
				})

				playerInfo[i] = result.data.choices[0].message.content

				context = [
					`Generate a random short detailed sentence about a named character described as YOU.`,
					`Given the character info: (${playerInfo[0]}), generate random a detailed short sentence about their goal.`,
					`Given the character info: (${playerInfo[0]}) and the character's goal (${playerInfo[1]}), generate a random setting for the character.`
				]
			}
		}

		const conversationLog = [
			{ role: 'system', content: `You are a scenario describing storyteller. You describe gritty and realistic scenarios. The elements provided are the player: (${playerInfo[0]}), the player's goal: (${playerInfo[1]}), and the setting: (${playerInfo[2]}). Given those elements, you are to generate an introduction of the character, their goal, and their setting. Finish the generation with "What will you do?"`}]

		const result = await openai.createChatCompletion({
			model: 'gpt-3.5-turbo',
			messages: conversationLog,
			max_tokens: 800,
		})

		channel.send(result.data.choices[0].message)
	},
	queue,
	playerInfo
};