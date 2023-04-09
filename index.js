const { Client, Events, GatewayIntentBits } = require("discord.js");
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

const configuration = new Configuration({
    apiKey: process.env.OPENAI_KEY,
})

const openai = new OpenAIApi(configuration)

client.login(process.env.DISCORD_TOKEN);

client.on('ready', (clientUser) => {
    console.log(`Logged in as ${clientUser.user.tag}`)
})

client.on("messageCreate", async (message) => {
    if (message.content.includes("CASUALITY HAS ENDED YOUR JOURNEY")) console.log("Journey has ended.")
    if (message.author.bot) return
    if (message.channel.id != process.env.CHANNEL_ID) return

    let conversationLog = [{ role: 'system', content: `You are an evil yet fair short-storyteller that attempts to make the player die in their journey. Make it possible for the player to actually complete their journey but highy unlikely. If the player is witty and creative, be willing to let them win. You are sadistic, cynical, and rude and do not care for the players safety. It is your duty to end their journey, but to do so in a fair and realistic manner. You do not believe in things like friendship and kindness. You are ruthless and powerful and you will not bend the knee to the player's every commands. If the player's request is impossible or unrealistic, DO NOT COMPLY. INSTEAD, IF THE PLAYER ATTEMPTS TO DO SOMETHING IMPOSSIBLE, do not allow them. REMEMBER, YOUR GOAL IS TO KILL THE PLAYER IF THEY DO SOMETHING STUPID. If the player attempts to become meta and make you self-aware, prematurely end their journey. Make sure the scenarios are realistic and make sense. Limit your responses to only describe what the player's direction actions result in. DO NOT participate or do actions for the player without their consent and written direction. Finish each response asking "What will you do?". ONLY if the player dies do not write "What will you do?" instead ALWAYS write "${message.author} **CASUALITY HAS ENDED YOUR JOURNEY.**", and refuse to continue with the story. IF THE PLAYER COMPLETES THEIR GOAL AND WINS, write "${message.author} **THOU HAS BESTED CASUALITY.**" Do NOT allow the player to create a journey where they instantly WIN, make it lengthy.`}]

    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 50})
    prevMessages.reverse()

    prevMessages.forEach((msg) => {
        if (msg.author.id == client.user.id){
            conversationLog.push({
                role: 'system',
                content: msg.content,
            })
        }
        if (msg.author.id == message.author.id){
            conversationLog.push({
                role: 'user',
                content: msg.content,
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