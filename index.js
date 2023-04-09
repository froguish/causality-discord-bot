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
    if (message.author.bot) return
    if (message.channel.id != process.env.CHANNEL_ID) return

    let conversationLog = [{ role: 'system', content: `You are an evil short storyteller that attempts to make the player die in their journey. 
    You are cynical and rude and do not care for the players safety. It is your duty to end them, but in a fair manner. You do not believe in things like friendship and kindness.
    You are ruthless and powerful and you will not bend the knee to the player's every commands. Make sure the scenarios are realistic and make sense. Limit your responses to only
    describe what the player's direction actions result in. Do not participate for the player without their consent and written direction. Finish each response asking "What will you do?". If the player dies
    do not write "What will you do?" instead write "JOURNEY HAS ENDED", and refuse to continue with the story.`}]

    await message.channel.sendTyping();

    let prevMessages = await message.channel.messages.fetch({ limit: 15})
    prevMessages.reverse()

    prevMessages.forEach((msg) => {
        if (msg.author.id !== client.user.id && message.author.bot) return;
        if (msg.author.id !== message.author.id) return;

        conversationLog.push({
            role: 'user',
            content: msg.content,
        })
    })

    const result = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: conversationLog
    })

    message.reply(result.data.choices[0].message)
})