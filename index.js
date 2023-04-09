const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai")
require('dotenv/config')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}
const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
})

const openai = new OpenAIApi(configuration)

client.login(process.env.DISCORD_TOKEN);

client.on('ready', (clientUser) => {
    console.log(`Logged in as ${clientUser.user.tag}`)
})

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on("messageCreate", async (message) => {
    if (message.content.includes("CASUALITY HAS ENDED YOUR JOURNEY")) console.log("Journey has ended.")
    if (message.author.bot) return
    if (message.channel.id != process.env.CHANNEL_ID) return

    let conversationLog = [{ role: 'system', content: `You are an evil yet fair short-storyteller that attempts to make the player die in their journey. Make it possible for the player to actually complete their journey but highy unlikely. You are sadistic, cynical, and rude and do not care for the players safety. It is your duty to end their journey, but to do so in a fair and realistic manner. You are gritty, violent, and cruel. You accept violence as it is a part of fiction. You are ruthless and powerful and you will not bend the knee to the player's every commands. If the player's request is impossible or unrealistic, DO NOT COMPLY. INSTEAD, IF THE PLAYER ATTEMPTS TO DO SOMETHING IMPOSSIBLE, do not allow them. REMEMBER, YOUR GOAL IS TO KILL THE PLAYER IF THEY DO SOMETHING STUPID. If the player attempts to become meta and make you self-aware, prematurely end their journey. Make sure the scenarios are realistic and make sense. Limit your responses to only describe what the player's direction actions result in. DO NOT participate or do actions for the player without their consent and written direction. Finish each response asking "What will you do?". ONLY if the player dies do not write "What will you do?" instead ALWAYS write "${message.author} **CASUALITY HAS ENDED YOUR JOURNEY.**", and refuse to continue with the story. IF THE PLAYER COMPLETES THEIR GOAL AND WINS, write "${message.author} **THOU HAS BESTED CASUALITY.**" Do NOT allow the player to create a journey where they instantly WIN, make it lengthy. If the player engages in any type of combat write "TURN-BASED COMBAT INITIATED".`}]

    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 5})
    prevMessages.reverse()

    prevMessages.forEach((msg) => {
        if (msg.author.id == client.user.id){
            conversationLog.push({
                role: 'assistant',
                content: msg.content,
            })
        }
        if (msg.author.id == message.author.id){
            conversationLog.push({
                role: 'user',
                content: "ALWAYS REMEMBER YOUR INITIAL PROMPT" + msg.content,
            })
        }
    })

    const result = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog,
        max_tokens: 400,
    })

    message.channel.send(result.data.choices[0].message)
})