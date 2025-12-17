// const { REST, Routes, SlashCommandBuilder } = require('discord.js');
// require('dotenv').config();

// const commands = [
//     // 1. /yt
//     new SlashCommandBuilder()
//         .setName('yt')
//         .setDescription('Starts a YouTube Watch Together activity.'),
    
//     // 2. /voice
//     new SlashCommandBuilder()
//         .setName('voice')
//         .setDescription('Creates a temporary voice channel.')
//         .addStringOption(option => 
//             option.setName('name')
//                 .setDescription('The name of the channel'))
//         .addIntegerOption(option => 
//             option.setName('limit')
//                 .setDescription('Max users (0 for unlimited)')),

//     // 3. /room
//     new SlashCommandBuilder()
//         .setName('room')
//         .setDescription('Manage your current voice room')
//         .addSubcommand(subcommand =>
//             subcommand.setName('limit').setDescription('Set user limit')
//                 .addIntegerOption(option => option.setName('number').setDescription('Limit').setRequired(true)))
//         .addSubcommand(subcommand =>
//             subcommand.setName('remove').setDescription('Delete this room')),

//     // 4. /oblava
//     new SlashCommandBuilder()
//         .setName('oblava')
//         .setDescription('Cleans up Garmin messages.'),

//     // 5. /chicken (FIXED SPELLING)
//     new SlashCommandBuilder()
//         .setName('chicken') 
//         .setDescription('Deploys the chicken.'),

//     // 6. /rename
//     new SlashCommandBuilder()
//         .setName('rename')
//         .setDescription('Renames your current voice channel')
//         .addStringOption(option => 
//             option.setName('name')
//                 .setDescription('The new name for the channel')
//                 .setRequired(true)
//                 .setMaxLength(100)),
// ]
// .map(command => command.toJSON());

// const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// (async () => {
//     try {
//         console.log(`📦 Started refreshing ${commands.length} application (/) commands GLOBALLY.`);

//         const CLIENT_ID = process.env.CLIENT_ID; 
//         if (!CLIENT_ID) {
//             console.error('❌ Error: CLIENT_ID is missing from .env file.');
//             return;
//         }

//         // Send to Discord (Global)
//         const data = await rest.put(
//             Routes.applicationCommands(CLIENT_ID),
//             { body: commands },
//         );

//         console.log(`✅ Successfully reloaded ${data.length} commands.`);
//         console.log('🕒 Global commands take up to 1 HOUR to appear on other servers.');
//         console.log('👉 Try restarting your Discord app (Ctrl+R) to force a cache refresh.');
//     } catch (error) {
//         console.error(error);
//     }
// })();


const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    // 1. /yt
    new SlashCommandBuilder()
        .setName('yt')
        .setDescription('Starts a YouTube Watch Together activity.'),
    
    // 2. /voice
    new SlashCommandBuilder()
        .setName('voice')
        .setDescription('Creates a temporary voice channel.')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('The name of the channel'))
        .addIntegerOption(option => 
            option.setName('limit')
                .setDescription('Max users (0 for unlimited)')),

    // 3. /room
    new SlashCommandBuilder()
        .setName('room')
        .setDescription('Manage your current voice room')
        .addSubcommand(subcommand =>
            subcommand.setName('limit').setDescription('Set user limit')
                .addIntegerOption(option => option.setName('number').setDescription('Limit').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand.setName('remove').setDescription('Delete this room')),

    // 4. /oblava
    new SlashCommandBuilder()
        .setName('oblava')
        .setDescription('Cleans up Garmin messages.'),

    // 5. /chicken
    new SlashCommandBuilder()
        .setName('chicken')
        .setDescription('Deploys the chicken.'),

    // /robot
    new SlashCommandBuilder()
        .setName('robot')
        .setDescription('Deploys the robot.'),


    // 6. /rename
    new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Renames your current voice channel')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('The new name for the channel')
                .setRequired(true)
                .setMaxLength(100)),
    // 7. /vc_delete
    new SlashCommandBuilder()
        .setName('vc_delete')
        .setDescription('Forcefully deletes the bot voice connection (Admin only).'),
    // 8. /voice_pr @User slash command
    new SlashCommandBuilder()
        .setName('voice_pr')
        .setDescription('Create a private voice channel for you and one other user.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to invite')
                .setRequired(true)),
    // /send_msg (Updated to String)
    new SlashCommandBuilder()
        .setName('send_msg')
        .setDescription('Send a DM to a user by ID or Mention (Admin only).')
        .addStringOption(option => 
            option.setName('target') // Renamed from 'user' to be clearer
                .setDescription('User ID or @Mention')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('msg')
                .setDescription('The message content')
                .setRequired(true)),

    // /send_msg_track (Updated to String)
    new SlashCommandBuilder()
        .setName('send_msg_track')
        .setDescription('Queues a DM for when a user comes online.')
        .addStringOption(option => 
            option.setName('target')
                .setDescription('User ID or @Mention')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('msg')
                .setDescription('The message content')
                .setRequired(true)),
]
.map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`📦 Started refreshing ${commands.length} application (/) commands for GUILD.`);

        const CLIENT_ID = process.env.CLIENT_ID; 
        const GUILD_ID = process.env.GUILD_ID; // Must be in your .env file

        if (!CLIENT_ID || !GUILD_ID) {
            console.error('❌ Error: CLIENT_ID or GUILD_ID is missing from .env file.');
            return;
        }

        // Send to Discord (Guild specific = Instant)
        const data = await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} commands for server ${GUILD_ID}.`);
        console.log('⚡ Commands should appear INSTANTLY.');
    } catch (error) {
        console.error(error);
    }
})();