const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TEMP_FILE = path.join(__dirname, '../temp_channels.json');

// Helper to remove ID from JSON
function removeTempChannelId(id) {
    try {
        if (fs.existsSync(TEMP_FILE)) {
            let channels = JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
            channels = channels.filter(cId => cId !== id);
            fs.writeFileSync(TEMP_FILE, JSON.stringify(channels, null, 2));
        }
    } catch (e) { console.error(e); }
}

module.exports = {
    async execute(interaction) {
        const { channel } = interaction.member.voice;
        
        // 1. Basic Checks
        if (!channel) {
            return interaction.reply({ 
                content: '❌ You must be in a voice channel to use this command!', 
                ephemeral: true 
            });
        }

        // 2. Permission Check (Applies to both Limit and Remove)
        if (!channel.permissionsFor(interaction.user).has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ 
                content: '⛔ You do not have permission to manage this room. Only the owner or admins can do this.', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();

        // --- SUBCOMMAND: LIMIT ---
        if (subcommand === 'limit') {
            const limit = interaction.options.getInteger('number');
            try {
                await channel.setUserLimit(limit);
                const limitText = limit === 0 ? 'Unlimited' : limit.toString();
                await interaction.reply({ 
                    content: `✅ Room **${channel.name}** limit set to **${limitText}** users.`,
                    ephemeral: true 
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: '❌ Failed to update limit.', ephemeral: true });
            }
        }

        // --- SUBCOMMAND: REMOVE ---
        else if (subcommand === 'remove') {
            
            // Create buttons
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_delete')
                    .setLabel('Yes, Delete It')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_delete')
                    .setLabel('No, Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

            // Send confirmation message (Silent/Ephemeral)
            const response = await interaction.reply({
                content: `⚠️ Are you sure you want to delete **${channel.name}**? This cannot be undone.`,
                components: [row],
                ephemeral: true
            });

            // --- COLLECTOR LOGIC ---
            // This listens for button clicks on THIS specific message for 15 seconds
            const collector = response.createMessageComponentCollector({ 
                componentType: ComponentType.Button, 
                time: 15000 
            });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_delete') {
                    try {
                        await i.update({ content: '🗑️ Deleting channel...', components: [] });
                        await channel.delete();
                        removeTempChannelId(channel.id); // Clean up JSON
                    } catch (err) {
                        // Channel might already be gone
                        console.error(err);
                    }
                } else if (i.customId === 'cancel_delete') {
                    await i.update({ content: '✅ Deletion cancelled.', components: [] });
                }
            });
        }
    },
};