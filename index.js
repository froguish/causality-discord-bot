const { Client, GatewayIntentBits } = require("discord.js");
require('dotenv/config')

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
});

client.login(process.env.DISCORD_TOKEN);

client.on('ready', () => {
    console.log("The bot is ready")
})

client.on("messageCreate", async (message) => {
    if (!message?.author.bot) {
        message.channel.send(`${message.content}`)
    }
})