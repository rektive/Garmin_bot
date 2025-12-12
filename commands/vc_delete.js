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
        const connection = getVoiceConnection(guildId);

        if (connection) {
            try {
                // 2. Force Destroy Connection
                connection.destroy();
                
                // 3. Clear DisTube Queue if it exists (to prevent "zombie" playing state)
                const queue = interaction.client.distube.getQueue(guildId);
                if (queue) {
                    queue.stop();
                }

                await interaction.reply({ 
                    content: '✅ **Voice Connection Nuked.** Forcefully disconnected the bot and cleared the queue.', 
                    ephemeral: true 
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ 
                    content: '❌ Failed to destroy connection. Check console for details.', 
                    ephemeral: true 
                });
            }
        } else {
            await interaction.reply({ 
                content: '⚠️ No active voice connection found to delete.', 
                ephemeral: true 
            });
        }
    },
};