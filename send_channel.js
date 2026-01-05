const { PermissionsBitField } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const OWNER_ID = '479224801324695561'; // Your Discord ID

        // 1. Permission Check (Owner Only)
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: '⛔ Access Denied. Only the bot owner can use this command.', 
                ephemeral: true 
            });
        }

        await interaction.deferReply({ ephemeral: true });

        // 2. Get Inputs
        let inputChannel = interaction.options.getString('channel_id');
        const messageContent = interaction.options.getString('msg');

        // Clean the input to get just the ID (handles "<#12345>" format if you tag a channel)
        const channelId = inputChannel.replace(/[<#>]/g, '');

        // 3. Fetch Channel & Send
        try {
            const targetChannel = await interaction.client.channels.fetch(channelId);

            if (!targetChannel) {
                return interaction.editReply(`❌ Error: Could not find a channel with ID \`${channelId}\`.`);
            }

            // Check if it's a text-based channel where we can send messages
            if (!targetChannel.isTextBased()) {
                return interaction.editReply(`❌ Error: Channel **${targetChannel.name}** is not a text channel.`);
            }

            await targetChannel.send(messageContent);
            
            await interaction.editReply({ 
                content: `✅ Message sent to **#${targetChannel.name}** in **${targetChannel.guild.name}**.` 
            });
            console.log(`[CHANNEL MSG SENT] Channel: ${targetChannel.name} (${channelId}) | Content: "${messageContent}"`);

        } catch (error) {
            console.error(`Failed to send message to channel ${channelId}:`, error);
            await interaction.editReply(`❌ Failed. I might not have permissions to see or send messages in that channel, or the ID is invalid.`);
        }
    },
};