const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    getVoiceConnection 
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

module.exports = {
    async execute(interaction) {

        // --- 1. SERVER RESTRICTION CHECK ---
        const ALLOWED_GUILD_ID = process.env.GUILD_ID || '1170161251754725466';

        // Check if command is used in a server (not DM)
        if (!interaction.guild) {
             return interaction.reply({ 
                content: '❌ This command can only be used in a server.', 
                ephemeral: true 
            });
        }
        
        // Check if it is the correct server
        // FIX: Changed 'interaction.guilf' to 'interaction.guild'
        if (interaction.guild.id !== ALLOWED_GUILD_ID) {
            return interaction.reply({ 
                content: '⛔ This command is exclusive to the main server.', 
                ephemeral: true 
            });
        }

        // 2. Check if user is in a voice channel
        const channel = interaction.member.voice.channel;
        if (!channel) {
            return interaction.reply({ 
                content: '❌ You must be in a Voice Channel to use this command.', 
                ephemeral: true 
            });
        }

        // 3. Acknowledge the command silently
        await interaction.reply({ content: '🤖 Robot deployed...', ephemeral: true });

        try {
            // Path to your audio file. 
            const audioPath = path.join(__dirname, '..', 'intro_audio', 'robot.mp3');

            if (!fs.existsSync(audioPath)) {
                console.error('Audio file missing:', audioPath);
                return interaction.followUp({ content: '❌ Audio file missing!', ephemeral: true });
            }

            // 4. Join the Voice Channel
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            // 5. Create Player & Resource
            const player = createAudioPlayer();
            const resource = createAudioResource(audioPath);

            connection.subscribe(player);
            player.play(resource);

            // 6. Handle "Finish" (Idle) Event
            player.on(AudioPlayerStatus.Idle, () => {
                try {
                    // Destroy the connection (Leave) immediately after playing
                    if (connection.state.status !== 'destroyed') {
                        connection.destroy();
                    }
                } catch (err) {
                    console.error('Error leaving after robot:', err);
                }
            });

            // Handle Errors
            player.on('error', error => {
                console.error('Audio player error:', error);
                if (connection.state.status !== 'destroyed') {
                    connection.destroy();
                }
            });

        } catch (error) {
            console.error('Error executing /robot:', error);
        }
    },
};