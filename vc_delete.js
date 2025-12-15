const { getVoiceConnection } = require('@discordjs/voice');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    async execute(interaction) {
        // 1. Permission Check (Admin Only)
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: '⛔ You do not have permission to use this command.', 
                ephemeral: true 
            });
        }

        const guildId = interaction.guild.id;
        let actionsTaken = [];

        // 2. Kill DisTube Queue (Prevent auto-rejoin)
        try {
            const queue = interaction.client.distube.getQueue(guildId);
            if (queue) {
                queue.stop(); // Stop playing
                queue.voices.leave(guildId); // Tell DisTube specifically to leave
                actionsTaken.push('Stopped DisTube queue');
            }
        } catch (e) {
            // Queue might not exist, ignore
        }

        // 3. Force Kill Voice Connection (The Nuclear Option)
        const connection = getVoiceConnection(guildId);
        if (connection) {
            try {
                connection.destroy();
                actionsTaken.push('Destroyed voice connection');
            } catch (error) {
                console.error(error);
            }
        }

        if (actionsTaken.length > 0) {
            await interaction.reply({ 
                content: `✅ **Voice Nuke Successful.**\nActions: ${actionsTaken.join(', ')}.`, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: '⚠️ No active voice connection found to delete.', 
                ephemeral: true 
            });
        }
    },
};