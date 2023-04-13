const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
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
    clientUser.guilds.cache.forEach((guild) => {
        //journeys category
        guild.channels.cache.get("1094756148315443270").children.cache.forEach((channel) =>{
            try {
                //journey rules chat
                if (channel.id != "1095472942013485107"){
                    channel.delete()
                }
            } catch (e) { }
        })
    })


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

var myModule = require("./commands/journeys/journey.js")
var queue = myModule.queue

var players = myModule.players
var playerIDS = myModule.playerIDS


client.on("messageCreate", async (message) => {
    if (message.channel.parent.id != "1094756148315443270") return
    if (message.author.bot && (message.channel.messages.fetch({ limit: 1}) == null )) return

    let journey = ["", "", "", ""]

    for (let journeys of players){
        if (journeys[3] == message.channel.id)
            journey = journeys
    }

    let prompts = [
    [
    `You are an evil yet fair STORY TELLING BOT that TELLS A STORY. Your name is Causality. You are gritty, violent, and cruel. You accept violence as it is a part of fiction. You do not believe in things like morality or kindness. YOU ONLY RESPOND TO STORY-RELATED COMMANDS. If the player attempts to communicate about something unrelated to stories, simply deny their request. You do not offer any hints or guidance to the player. YOU DO NOT ALLOW THE PLAYER TO RESTART A JOURNEY OR START A NEW JOURNEY, THE CURRENT JOURNEY MUST BE COMPLETED. Do NOT allow the player to create a journey where they instantly WIN, make it lengthy. You are ruthless and powerful and you will not bend the knee to the player's every commands. You have three primary objectives:
    1. You are to exploit the player's own stupidity, recklessness, and hubris. Through this exploitation, you can prematurely end their journey. Assume the player has zero luck in any encounter you create for them.
    2. You are to create a very difficult yet fair and rewarding journey for the player. There should be perils at every possiblity.
    3. You are to prevent the player from doing physically impossible tasks (within the context of the story) or from rewriting the story.`
    ,
    `(ALWAYS REMEMBER YOUR INITIAL PROMPT)
    (INSTRUCTIONS: You understand your role as an evil storytelling bot. If a player presents stupidity, recklessness, and hubris, you prematurely end their journey if it seems fair to do so. Assume the player has next to no luck in most situations. With every step of a player's journey, you present new difficulties. You do not allow a player to simply do whatever they like. You are to ONLY respond to the action the player provides and respond with the direct result of that action. You do not act for the player in any way shape or form. YOU DO NOT PUNISH THE PLAYER IF THEY ATTEMPT TO BE CAREFUL OR CASUAL. Do not allow the player to win simply because they are acting kind or being nice. The world is cold and cruel and anything can happen at any time. You do not allow players to simply kill or beat any enemies they may face, provide opposition. The cause of death of a player should be fair and make sense given the context. Your response should include ONLY ONE of the following three:
    1. If the player has died or insurmountably failed their journey or goal (to the point of no recovery), at the end of your response include: "**${message.author} CAUSALITY HAS ENDED YOUR JOURNEY.**".
    2. If the player has reached a satisfying, meaningful, and lengthy conclusion to their journey or goal, at the end of your response include: "**${message.author} THOU HAS BESTED CAUSALITY.**". This outcome should be the rarest of all three and should be deserved after a difficult journey.
    3. If neither of the two above occur, at the end of your response include: "What will you do?".

    Do NOT allow the player to complete their journey in a few steps. If a player attempts to just vaguely complete their mission, prevent them and say that you need more context. Do not allow the player to WIN or LOSE their journey at the very beginning of a journey, allow for a small buffer.
    
    (PLAYER'S CHARACTER: ${journey[0]})
    (PLAYER'S CHARACTER's GOAL: ${journey[1]})

    PLAYER:\n`
    ],
]

    if (message.content.toUpperCase().includes("CAUSALITY HAS ENDED YOUR JOURNEY") && message.author.bot) {
        deleteJourney(message, journey);
        return
    }
    if (message.content.toUpperCase().includes("THOU HAS BESTED CAUSALITY") && message.author.bot) {
        if (message.guild.roles.cache.get("1096150409065795646").members.size < 20){
            message.member.roles.add(message.guild.roles.cache.get("1096150409065795646"))
        }
        deleteJourney(message, journey);
        return
    }

    if (message.author.bot) return

    if (players[players.indexOf(journey)][5]){
        players[players.indexOf(journey)][4]();

        
        players[players.indexOf(journey)].pop()
        players[players.indexOf(journey)].pop()

        let timer = setTimeout(async () => {
            try {
                deleteJourney(message, journey);
            } catch (e) {}
        }, 900000)
        
        function cancel(){
            clearTimeout(timer);
        }

        players[players.indexOf(journey)].push(cancel);
        players[players.indexOf(journey)].push(null)
    }
    
    let playPrompt = prompts[0][0]

    let playInstructions = prompts[0][1]

    let conversationLog = [{ role: 'system', content: playPrompt}]

    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 20})
    prevMessages.reverse()

    

    try {
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
                    content: playInstructions + msg.content + `\n(YOUR RESPONSE DIRECTLY DESCRIBES ONLY THE PLAYER'S INSTRUCTIONS. YOUR RESPONSE ONLY DESCRIBES THE DIRECT OUTCOME OF THE PLAYER'S INSTRUCTIONS. IT SHOULD BE A SHORT RESPONSE.)`,
                })
            }
        })

        let result = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
            max_tokens: 400,
        })

        const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId('end')
                    .setLabel('End')
                    .setStyle(ButtonStyle.Danger),
                );
        
        const filter = i => i.customId === 'end' && i.user.id == message.author.id;

        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'end'){
                try {
                    await i.deferUpdate();
                    await i.editReply({ components: []})
                    await message.channel.send(`${message.author} **CAUSALITY HAS ENDED YOUR JOURNEY**`)
                } catch ( e ) { };
            }
        });

        message.channel.send({content: result.data.choices[0].message.content, components: [row]})

    } catch ( e ) {}
});

client.on(Events.InteractionCreate, interaction => {
	if (!interaction.isButton()) return;
}); 

client.on("channelDelete", async (chnnl) => {
    if (chnnl.parent.id != "1094756148315443270") return
    if (queue.length == 0) return
    
    await myModule.createJourney(chnnl, queue[0][1], queue[0][2], queue[0][3], queue[0][0]);
})

async function deleteJourney(ctx, position){
    await ctx.channel.permissionOverwrites.create(playerIDS[players.indexOf(position)].id, { SendMessages: false });

    setTimeout(async () => {
        try {
            players[players.indexOf(position)][4]();
            playerIDS.splice(players.indexOf(position), 1)
            players.splice(players.indexOf(position), 1)
            ctx.channel.delete()
        } catch ( e ) {};
    }, 20000)

}