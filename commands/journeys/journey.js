const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai")
require('dotenv/config')

var queue = []
var players = []
var playerIDS = []

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
		try{
			var categorySize = await interaction.guild.channels.cache.get("1094756148315443270").children.cache.size
			let character = interaction.options.getString('character')
			let goal = interaction.options.getString('goal')
			let setting = interaction.options.getString('setting')
			
			if (playerIDS.includes(interaction.member)) {
				await interaction.reply({content: "Sorry! Users may only have 1 journey at a time.", ephemeral: true})
				return	
			}

			if (categorySize > 5) {
				for (let pos of queue) {
					if (pos[0] == interaction.member){
						await interaction.reply({content: "Sorry! Users may only have 1 journey in the queue at a time.", ephemeral: true})
						return
					}
				}
				interaction.reply({content: `Journey size limit reached! \nPlease hold tight as you are placed into a queue. You will be pinged when a spot opens. You are currently number ${queue.length + 1}. You can expect to wait approxmiately ${(queue.length + 1) * 15 / 60} hour(s).`, ephemeral: true})
				queue.push([interaction.member, character, goal, setting])
				return
			}
			
			

			await interaction.reply({ content: `Journey started!`, ephemeral: true});
			
			await createJourney(interaction, character, goal, setting, interaction.member);
		} catch ( e ) { };

	},
	queue,
	players,
	playerIDS,
	createJourney,
};

async function createJourney(ctx, a, b, c, ping){
	if (queue != 0){
		queue.shift()
	}

	const channel = await ctx.guild.channels.create({
        name: "Journey",
        type: 0,
        parent: "1094756148315443270"
    });

	channel.permissionOverwrites.create(channel.guild.roles.everyone, { SendMessages: false });

	playerIDS.push(ping)
	
	channel.sendTyping()

	let playerInfo = [a, b, c, channel]
	var context = [
		`Let's start a new journey! Generate a random short detailed sentence about a named character for this journey described as YOU. Include their appearance and personality.`,
		`Let's start a new journey! Given the character info: (${playerInfo[0]}), generate random a detailed short sentence about their goal.`,
		`Let's start a new journey! Given the character info: (${playerInfo[0]}) and the character's goal (${playerInfo[1]}), generate a random setting for the character.`
	]

	for (let i = 0; i < playerInfo.length; i++){
		if (playerInfo[i] == null){
			let missing = [{role: 'system', content: context[i]}]

			let result = await openai.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages: missing,
				max_tokens: 200,
			})

			playerInfo[i] = result.data.choices[0].message.content

			context = [
				`Generate a random short descriptive sentence about a named character described as YOU.`,
				`Given the character info: (${playerInfo[0]}), generate random a detailed short sentence about their goal.`,
				`Given the character info: (${playerInfo[0]}) and the character's goal (${playerInfo[1]}), generate a random setting for the character.`
			]
		}
	}

	const conversationLog = [
		{ role: 'system', content: `You are a scenario describing storyteller. You describe gritty and realistic scenarios. The elements provided are the player: (${playerInfo[0]}), the player's goal: (${playerInfo[1]}), and the setting: (${playerInfo[2]}).`}, { role: 'user', content: `Given those elements, you are to generate an introduction of the character, their goal, and their setting. The generation should NOT complete the character's goal, and should start the character in a situation that makes it so their goal is not readily available to be completed, place some difficulty in their way. Finish the generation with "What will you do?"`}]

	const result = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		messages: conversationLog,
	})

	players.push([playerInfo[0], playerInfo[1], playerInfo[2], playerInfo[3], [], ping]);

	channel.send(`${ping}`)
	channel.send(result.data.choices[0].message)

	channel.permissionOverwrites.create(ping.id, { SendMessages: true });

	let timer = setTimeout(async () => {
		try {
			players.shift()
			playerIDS.shift()
			await channel.delete()
		} catch (e) {}
	}, 300000)

	function cancel(){
		clearTimeout(timer);
	}

	let notStarted = true

	players[players.length - 1].push(cancel);
	players[players.length - 1].push(notStarted);

}