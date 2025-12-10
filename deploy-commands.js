const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    // Open Youtube slash command
    new SlashCommandBuilder()
        .setName('yt')
        .setDescription('Starts a YouTube Watch Together activity in your voice channel.'),
        // Create Voice channel slash command
        new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Creates a temporary voice channel.')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('The name of the channel'))
        .addIntegerOption(option => 
            option.setName('limit')
                .setDescription('Max number of users (0 for unlimited)')),
        // Limit manager slash command
        new SlashCommandBuilder()
        .setName('room')
        .setDescription('Manage your current voice room')
        .addSubcommand(subcommand =>
            subcommand
                .setName('limit')
                .setDescription('Set the max number of users for this room')
                .addIntegerOption(option => 
                    option.setName('number')
                        .setDescription('The user limit (0 = unlimited)')
                        .setRequired(true)
                        .setMinValue(0)
                        .setMaxValue(99)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Delete this room (Owner/Admin only)')),

        new SlashCommandBuilder()
        .setName('oblava')
        .setDescription('Cleans up Garmin messages and commands.'),

        new SlashCommandBuilder()
        .setName('chicken')
        .setDescription('Joins, plays a sound, and leaves.'),
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        const CLIENT_ID = process.env.CLIENT_ID; 
        const GUILD_ID = process.env.GUILD_ID; // <--- 1. We get this from .env now

        if (!CLIENT_ID || !GUILD_ID) {
            console.error('Error: CLIENT_ID or GUILD_ID is missing from .env file.');
            return;
        }

        await rest.put(
            // 2. This creates the command specifically for your server (Instant update)
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();