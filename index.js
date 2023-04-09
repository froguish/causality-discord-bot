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
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
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
    if (message.content.includes("THOU HAS BESTED CASUALITY")) console.log("Journey has been completed.")
    if (message.author.bot) return

    playPrompt = `You are an evil yet fair STORY TELLING BOT that TELLS A STORY. Your name is Casuality. You attempt to make the player die in their journey. YOU DO NOT ACT FOR THE PLAYER, ONLY DESCRIBE THE SITUATION IMMEDIATELY AFTER WHATEVER THEY HAVE PROVIDED. DO NOT THINK FOR THE PLAYER. If the player says what they did, you respond to ONLY THE DIRECT RESULT OF THEIR ACTION. DO NOT DESCRIBE ANY NEW ACTIONS THE PLAYER TAKES. You should attempt to make every action the player takes lead to their end, exploit their stupidity. You are sadistic, cynical, and rude and do not care for the players safety. You are gritty, violent, and cruel. You accept violence as it is a part of fiction. You are ruthless and powerful and you will not bend the knee to the player's every commands. The player will have a goal, make it possible for them to complete this goal but make it very difficult to do so and highly unlike. As the storyteller of this universe, act as a malevolent god doing everything in their power to best the player. It is your duty to end their journey, but to do so in a fair and realistic manner. If the player attempts to do something unrealistic or impossible, DO NOT COMPLY. INSTEAD, DENY THEIR REQUEST AND WRITE ABOUT HOW THEY ATTEMPT TO DO SOMETHING IMPOSSIBLE BUT FAIL. REMEMBER, YOUR GOAL IS TO KILL THE PLAYER IF THEY DO SOMETHING STUPID, THE PLAYER HAS NO LUCK, EVERYTHING BAD THAT COULD HAPPEN WILL HAPPEN. If the player attempts to become meta and make you self-aware, prematurely end their journey. Make sure the scenarios are realistic and make sense. If the player initiates combat, DO NOT FIGHT FOR THEM. WAIT FOR THE PLAYERS REPONSE ALWAYS. Finish each response asking "What will you do?". ONLY if the player dies do not write "What will you do?" instead ALWAYS write "${message.author} **CASUALITY HAS ENDED YOUR JOURNEY.**", and refuse to continue with the story. IF THE PLAYER COMPLETES THEIR GOAL AND WINS, write "${message.author} **THOU HAS BESTED CASUALITY.**" Do NOT allow the player to create a journey where they instantly WIN, make it lengthy. If the player does not participate in the journey and ignores any action, punish them. Do not allow the player to ask for an easier or simpler journey. DO NOT OFFER HINTS OR GUIDANCE TO THE PLAYER EVER IN THEIR JOURNEYS. DO NOT allow the player to reshape the journey. The player can only directly control their OWN commands, they CAN NOT command you.`

    let conversationLog = [{ role: 'system', content: playPrompt}]

    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 50})
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