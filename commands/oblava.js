const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('oblava')
        .setDescription('Deletes all Garmin messages and commands from the last 100 messages.'),

    async execute(interaction) {
        // 1. Create the Confirmation Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_oblava')
                .setLabel('Yes, Start Oblava')
                .setStyle(ButtonStyle.Danger), // Red button for danger
            new ButtonBuilder()
                .setCustomId('cancel_oblava')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary) // Grey button
        );

        // 2. Ask for confirmation (Ephemeral/Secret)
        const response = await interaction.reply({
            content: `⚠️ **WARNING** ⚠️\nAre you sure you want to delete all recent traces of Garmin (bot messages and commands)?\nThis checks the last 100 messages.`,
            components: [row],
            ephemeral: true
        });

        // 3. Create the Collector (Listens for clicks on THIS message for 15 seconds)
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 15000 
        });

        collector.on('collect', async i => {
            // --- ACTION: YES ---
            if (i.customId === 'confirm_oblava') {
                // Update the button message to show we are working
                await i.update({ content: '🧹 Scanning and purging messages...', components: [] });

                const channel = interaction.channel;
                const botId = interaction.client.user.id;
                const PREFIX = '!Garmin';

                try {
                    // Fetch the last 100 messages
                    const messages = await channel.messages.fetch({ limit: 100 });

                    // Filter the messages
                    const messagesToDelete = messages.filter(msg => {
                        // Condition A: The message is FROM the bot
                        if (msg.author.id === botId) return true;

                        // Condition B: The message starts with !Garmin (Case insensitive)
                        if (msg.content.toLowerCase().startsWith(PREFIX.toLowerCase())) return true;

                        // Condition C: The message mentions the bot
                        if (msg.mentions.has(botId)) return true;

                        return false;
                    });

                    // Check if anything was found
                    if (messagesToDelete.size === 0) {
                        return i.editReply('🧹 No Garmin traces found in the last 100 messages.');
                    }

                    // Execute Delete
                    // 'true' filters out messages older than 14 days to prevent API errors
                    await channel.bulkDelete(messagesToDelete, true);

                    await i.editReply(`💥 **OBLAVA COMPLETE.** Removed ${messagesToDelete.size} Garmin-related messages.`);

                } catch (error) {
                    console.error(error);
                    await i.editReply('❌ Failed to execute Oblava. I might be missing "Manage Messages" permissions.');
                }
            } 
            // --- ACTION: NO ---
            else if (i.customId === 'cancel_oblava') {
                await i.update({ content: '✅ Oblava cancelled.', components: [] });
            }
        });

        // Optional: Clean up buttons if user ignores the message
        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ content: '❌ Oblava timed out.', components: [] }).catch(() => {});
            }
        });
    },
};