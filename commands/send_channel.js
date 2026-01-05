const { PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

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

        // 2. Get Channel Input
        let inputChannel = interaction.options.getString('channel_id');
        const channelId = inputChannel.replace(/[<#>]/g, '');

        // 3. Verify Channel Exists BEFORE showing modal
        try {
            const targetChannel = await interaction.client.channels.fetch(channelId);
            
            if (!targetChannel) {
                return interaction.reply({ content: `❌ Error: Could not find a channel with ID \`${channelId}\`.`, ephemeral: true });
            }
            if (!targetChannel.isTextBased()) {
                return interaction.reply({ content: `❌ Error: Channel **${targetChannel.name}** is not a text channel.`, ephemeral: true });
            }

            // 4. Show Modal
            // We pass the channel ID in the customId so we know where to send it later
            const modal = new ModalBuilder()
                .setCustomId(`send_channel_modal_${channelId}`)
                .setTitle(`Send to #${targetChannel.name.substring(0, 20)}`);

            const messageInput = new TextInputBuilder()
                .setCustomId('message_content')
                .setLabel("Your Announcement")
                .setStyle(TextInputStyle.Paragraph) // Paragraph allows multi-line text!
                .setPlaceholder("Type your message here...\nLine 2\nLine 3")
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(messageInput);
            modal.addComponents(firstActionRow);

            await interaction.showModal(modal);

        } catch (error) {
            console.error('Error fetching channel for modal:', error);
            return interaction.reply({ content: `❌ Error: Invalid Channel ID or I cannot access it.`, ephemeral: true });
        }
    },
};