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

        const allowedID = '1170161251754725466';
        if(interaction.guilf.id !== allowedID) {
            return interaction.reply({
                content: 'This command is not available',
                ephemeral: true
            })
        }
        // 1. Check if user is in a voice channel
        const channel = interaction.member.voice.channel;
        if (!channel) {
            return interaction.reply({ 
                content: '❌ You must be in a Voice Channel to use this command.', 
                ephemeral: true 
            });
        }

        // 2. Acknowledge the command silently
        await interaction.reply({ content: 'Robot deployed...', ephemeral: true });

        try {
            // Path to your audio file. 
            // Make sure you have a file named 'robot.mp3' in your intro_audio folder!
            const audioPath = path.join(__dirname, '..', 'intro_audio', 'robot.mp3');

            if (!fs.existsSync(audioPath)) {
                console.error('Audio file missing:', audioPath);
                return interaction.followUp({ content: '❌ Audio file missing!', ephemeral: true });
            }

            // 3. Join the Voice Channel
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            // 4. Create Player & Resource
            const player = createAudioPlayer();
            const resource = createAudioResource(audioPath);

            connection.subscribe(player);
            player.play(resource);

            // 5. Handle "Finish" (Idle) Event
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