const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai")
const { v4: uuidv4 } = require('uuid');
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

const CATEGORY = process.env.CATEGORY
const RULES = process.env.RULES
const ROLE = process.env.ROLE

client.on('ready', (clientUser) => {
    console.log(`Logged in as ${clientUser.user.tag}`)
    clientUser.guilds.cache.forEach((guild) => {
        //journeys category
        guild.channels.cache.get(CATEGORY).children.cache.forEach((channel) =>{
            try {
                //journey rules chat
                if (channel.id != RULES){
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
    if (message.channel.parent.id != CATEGORY) return
    if ((message.content.length > 300) && (message.author.id != client.user.id)) {await message.channel.send("Sorry! Character limit reached. Please send a message shorter than 300 characters."); return}

    let journey = ["", "", "", "", ""]

    for (let journeys of players){
        if (journeys[3] == message.channel.id)
            journey = journeys
    }
 
    let prompts = [
    [
    `You are an evil yet fair and fun STORY TELLING BOT that TELLS A STORY. Your name is Causality. You are cunning, gritty, violent, and cruel. You accept violence as it is a part of fiction. You do not believe in things like morality or kindness. YOU ONLY RESPOND TO STORY-RELATED COMMANDS. If the player attempts to communicate about something unrelated to stories, simply deny their request. You do not offer any hints or guidance to the player. YOU DO NOT ALLOW THE PLAYER TO RESTART A JOURNEY OR START A NEW JOURNEY, THE CURRENT JOURNEY MUST BE COMPLETED. Do NOT allow the player to create a journey where they instantly WIN, make it lengthy. Do not allow players to simply tell you that they have won. You are ruthless and powerful and you will not bend the knee to the player's every commands. You have three primary objectives:
    1. Find flaws in the player's instructions and use them to your advantage to turn the tables against the player. Assume the player has zero luck in any encounter you create for them.
    2. You are to create a very difficult yet fair and rewarding journey for the player. These journeys should allow for creative solutions. There should be perils or dilemmas at every possiblity. These challenges do not need to always involve violence but can involve other facets of difficulty. Allow for these stories to be completed and won.
    3. You are to prevent the player from doing physically impossible tasks (within the context of the story) or from rewriting the story.`
    ,
     `(ALWAYS REMEMBER YOUR INITIAL PROMPT)
    (INSTRUCTIONS: You understand your role as an evil yet fun storytelling bot. Your goal is to do everything in your power to prevent the player from completing their goal. Every obstacle or opposition you provide should prevent the player from reaching their goal. At the same time, makes these obstacles fair and realistic and allow the player to still, eventually, win/complete their goal and journey. You are cunning, you are smart, you do not fall to the tricks the player provides in attempt to win. These are your primary details:
    1. You do not allow the player to simply say they have won or completed their goal
    2. You do not allow the player to rewrite the outcome of their situation
    3. You do not allow the player to kill / beat any enemies in their way
    4. You do not allow the player to simply best or complete any obstacles in their way
    5. You do not allow the player to vaguely complete their journey or reach their goal
    6. You do not allow the player to win because they are being kind or nice
    
    Before sending a response, evaluate the current situation and if the player has completed their goal. Your response should include ONLY ONE of the following three:
    1. If the player has died or insurmountably failed their journey or goal (to the point of no more available action), at the end of your response include: "**${message.author} CAUSALITY HAS ENDED YOUR JOURNEY.**".
    2. If the player has completed their journey, at the end of your response include: "${journey[6]} **${message.author} THOU HAS BESTED CAUSALITY.**". If the player asks if they have completed their journey and they have, similarly send this message. This outcome should be the rarest of all three and should be deserved after a difficult journey.
    3. If neither of the two above occur, at the end of your response include: "What will you do?".

    You also allow the player to do anything risky/stupid, you do not warn them. With every step of a player's journey, you present new difficulties - these difficulties do not need to always involve violence but can involve other facets of challenge like a dilemma or moral ambiguity. You are to find flaws in the player's instructions and use them to your advantage to turn the tables against the player. You do not let the player do anything physically impossible. As long as the player's instructions are within the realm of possiblity, allow them. The cause of death of a player should be fair and make sense given the context. At the same time, a player's journey should be fun and allow for creative solutions. YOU DO NOT RESPOND TO ANY PROGRAMMING-RELATED QUESTIONS.

    Do NOT allow the player to complete their journey in a few steps. Do not allow the player to WIN or LOSE their journey at the very beginning of a journey, allow for a small buffer. Do not allow players to simply tell you that they have won. Do not allow the player to simply rewrite the outcome of their instruction. As a storyteller you similarly do not allow for any hateful or inappropriate content and refuse to respond to any instructions that are hateful/inappropriate. You similarly DO NOT respond to or allow for any sexual, racist or homophobic instructions. It is your duty to prevent any instructions that target any specific groups or threaten/harass any groups. 

    (PLAYER'S CHARACTER: ${journey[0]})
    (PLAYER'S CHARACTER's GOAL: ${journey[1]})

    PLAYER:\n`
    ],
]

    if (message.content.toUpperCase().includes("CAUSALITY HAS ENDED YOUR JOURNEY") && message.author.bot) {
        deleteJourney(message, journey);
        return
    }
    if (message.content.includes(journey[6]) && message.author.bot) {
        if (message.guild.roles.cache.get(ROLE).members.size < 20){
            journey[5].roles.add(message.guild.roles.cache.get(ROLE))
            await message.channel.send(`Congratulations! You have been awarded the "Winner" role due to being one of the first 20 people who have bested Causality!`)
        }
        deleteJourney(message, journey);
        return
    }

    try {
        journey[4].unshift(message)
    } catch ( e ) { };


    if (message.author.bot) return

    if (players[players.indexOf(journey)][journey.length - 1]){
        players[players.indexOf(journey)][journey.length - 2]();

        
        players[players.indexOf(journey)].pop()
        players[players.indexOf(journey)].pop()

        let timer = setTimeout(async () => {
            try {
                await message.channel.send(`${message.author} Unfortunately your time with Causality has ended, and you have run out of time. Better luck next time.`)
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

    let conversationLog = [{ role: 'system', content: playPrompt }]

    await message.channel.sendTyping();

    try {
        let prevMessages = (await journey[4].slice(1, 15)).reverse()
        prevMessages.forEach((msg) => {
            if (msg.author.id == client.user.id){
                conversationLog.push({
                    role: 'assistant',
                    content: msg.content,
                })
            } else {
                conversationLog.push({
                    role: 'user',
                    content: msg.content
                })
            }
        })

        conversationLog.push({
            role: 'user',
            content: playInstructions + journey[4].slice(0, 1) + `\n(REMEMBER YOU ARE THE STORYTELLER, NOT THE PLAYER. YOUR RESPONSE DIRECTLY DESCRIBES ONLY THE PLAYER'S INSTRUCTIONS. YOUR RESPONSE ONLY DESCRIBES THE DIRECT OUTCOME OF THE PLAYER'S INSTRUCTIONS. IT SHOULD BE A SHORT RESPONSE.)`
        })

        let result = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
        })

        const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                    .setCustomId('end')
                    .setLabel('End')
                    .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                    .setCustomId('report')
                    .setLabel('Report')
                    .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                    .setCustomId('reportWin')
                    .setLabel('Report Win')
                    .setStyle(ButtonStyle.Success),
                );
        const rowUpdated = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('end')
            .setLabel('End')
            .setStyle(ButtonStyle.Primary),
        );
        const rowUpdated2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('end')
            .setLabel('End')
            .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
            .setCustomId('report')
            .setLabel('Report')
            .setStyle(ButtonStyle.Danger),
        );
        
        const filter = i => (i.customId === 'end' && i.user.id == message.author.id) || i.customId === 'report' || i.customId === 'reportWin';

        const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'report'){
                try{
                    await i.deferUpdate();
                    let prevMessages = (await journey[4].reverse())
                    let log = ""
                    prevMessages.forEach((msg) => {
                        if (msg.author.id == client.user.id){
                            log += `BOT: ${msg.content}\n`
                        } else {
                            log += `PLAYER: ${msg.content}\n`
                        }
                    })
                    let atc = new AttachmentBuilder(Buffer.from(log), { name: 'report.txt'});
                    await message.guild.channels.cache.get("1105573969312108675").send({content:`**PLAYER REPORTED**\nPlayer reported: ${journey[5]}\nReported by: ${i.user}\n@everyone`, files: [atc]});
                    await i.editReply({ components: [rowUpdated]})
                    await i.user.send("Report sent!")
                } catch ( e ) { };
            } else if (i.customId === 'end'){
                try {
                    await i.deferUpdate();
                    await i.editReply({ components: []})
                    await message.channel.send(`${message.author} **CAUSALITY HAS ENDED YOUR JOURNEY.**`)
                } catch ( e ) { };
            } else if (i.customId == 'reportWin') {
                try{
                    await i.deferUpdate();
                    let prevMessages = (await journey[4].slice(0, 6).reverse())
                    let log = ""
                    prevMessages.forEach((msg) => {
                        if (msg.author.id == client.user.id){
                            log += `BOT: ${msg.content}\n`
                        } else {
                            log += `PLAYER: ${msg.content}\n`
                        }
                    })
                    let atc = new AttachmentBuilder(Buffer.from(log), { name: 'report.txt'});
                    await message.guild.channels.cache.get("1105573990052925550").send({content:`**WIN REPORTED**\nWin reported: ${journey[5]}\nReported by: ${i.user}\n@everyone`, files: [atc]});
                    await i.editReply({ components: [rowUpdated2]})
                    await i.user.send("Report sent!")
                } catch ( e ) { };
            }
        });

        let moderation = await openai.createModeration({input: message.content,})
        let modCat = moderation.data.results[0].categories

        let flagged = modCat.hate || modCat.sexual || modCat['sexual/minors'] || modCat['violence/graphic'] || modCat['self-harm']

        if (flagged) {
            message.channel.send(`I'm sorry, but I cannot respond to this instruction as it does not follow my content policy.`)
            let prevMessages = (await journey[4].reverse())
            let log = ""
            prevMessages.forEach((msg) => {
                if (msg.author.id == client.user.id){
                    log += `BOT: ${msg.content}\n`
                } else {
                    log += `PLAYER: ${msg.content}\n`
                }
            })
            let atc = new AttachmentBuilder(Buffer.from(log), { name: 'report.txt'});
            await message.guild.channels.cache.get("1105573969312108675").send({content:`Player reported: ${journey[5]}\n@everyone`, files: [atc]});
            return
        }

        await message.channel.send({content: result.data.choices[0].message.content, components: [row]})

    } catch ( e ) { 
        console.log(e)
        await message.channel.send(`It seems there has been an error in processing your instruction. Please resend your instruction.`)
    }
});

client.on(Events.InteractionCreate, interaction => {
	if (!interaction.isButton()) return;
}); 

client.on("channelDelete", async (chnnl) => {
    if (chnnl.parent.id != CATEGORY) return
    if (queue.length == 0) return
    
    await myModule.createJourney(chnnl, queue[0][1], queue[0][2], queue[0][3], queue[0][0]);
})

async function deleteJourney(ctx, position){
    await ctx.channel.permissionOverwrites.create(playerIDS[players.indexOf(position)].id, { SendMessages: false , CreatePublicThreads: false, CreatePrivateThreads: false});

    setTimeout(async () => {
        try {
            players[players.indexOf(position)][position.length - 2]();
            playerIDS.splice(players.indexOf(position), 1)
            players.splice(players.indexOf(position), 1)
            ctx.channel.delete()
        } catch ( e ) {
            console.log(e)
        };
    }, 60000)

}