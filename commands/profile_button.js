// commands/profile_button.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { calculateXpForLevel } = require('./level_system.js'); // Import the XP calculator

module.exports = {
    name: 'profile_button',

    // --- THIS IS THE FIXED FUNCTION ---
    /**
     * Creates the "View Profile" button component.
     */
    createButton: () => {
        // It now returns just the ButtonBuilder, not an ActionRowBuilder
        return new ButtonBuilder()
            .setCustomId('show_profile')
            .setLabel('👤 View Profile')
            .setStyle(ButtonStyle.Primary);
    },
    // --- END OF FIX ---

    // This is called in your index.js 'interactionCreate'
    handleInteraction: async (client, interaction) => {
        if (!interaction.isButton()) return false;
        if (interaction.customId !== 'show_profile') return false;

        try {
            await interaction.deferReply({ ephemeral: true });

            const user = interaction.member;
            const levelData = client.levels.get(user.id) || { xp: 0, level: 0 };
            
            // Get user's roles, remove @everyone, and join
            const roles = user.roles.cache
                .filter(r => r.name !== '@everyone')
                .map(r => r.name)
                .join(', ');

            // Calculate XP progress
            const xpToNextLevel = calculateXpForLevel(levelData.level);
            
            const profileEmbed = new EmbedBuilder()
                .setColor(user.displayHexColor || '#0099ff')
                .setTitle(`${user.displayName}'s Profile`)
                .setThumbnail(user.displayAvatarURL())
                .addFields(
                    { name: 'Level', value: `**${levelData.level}**`, inline: true },
                    { name: 'XP', value: `\`${levelData.xp} / ${xpToNextLevel}\``, inline: true },
                    { name: 'Joined Server', value: `<t:${Math.floor(user.joinedTimestamp / 1000)}:D>`, inline: false },
                    { name: 'Roles', value: roles || 'No roles' },
                    { name: 'Karma Stats', value: 'Karma stats are not tracked. The system is live (random) and does not store data.' }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [profileEmbed] });

        } catch (e) {
            console.error('Failed to show profile:', e);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Error getting profile.', ephemeral: true });
            }
        }
        return true;
    }
};