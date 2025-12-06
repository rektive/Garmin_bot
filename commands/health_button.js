// commands/health_button.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const health = require('./health.js'); // Import the health engine
const { calculateXpForLevel } = require('./level_system.js'); // Import the XP calculator

module.exports = {
    name: 'health_button',

    /**
     * Creates the "Health" button component.
     */
    createButton: () => {
        return new ButtonBuilder()
            .setCustomId('show_health')
            .setLabel('❤️ Health')
            .setStyle(ButtonStyle.Secondary);
    },

    /**
     * Handles the "Health" button click.
     * @returns {boolean} True if the interaction was handled, false otherwise.
     */
    handleInteraction: async (client, interaction) => {
        if (!interaction.isButton() || interaction.customId !== 'show_health') {
            return false;
        }

        try {
            await interaction.deferReply({ ephemeral: true });

            const member = interaction.member;
            
            // --- 1. Get Health Data ---
            const currentHp = health.getHealth(member.id);
            const visuals = health.getHealthVisuals(currentHp);
            const healthBar = health.renderHealthBar(currentHp); // No longer needs `client`

            // --- 2. Get Level Data ---
            const levelData = client.levels.get(member.id) || { xp: 0, level: 0 };
            const xpToNextLevel = calculateXpForLevel(levelData.level);

            // --- 3. Build the "Game UI" Embed ---
            const embed = new EmbedBuilder()
                .setColor(visuals.color)
                .setTitle(`Vitals: ${member.displayName}`)
                .setThumbnail(member.displayAvatarURL())
                .addFields(
                    { 
                        name: 'STATUS', 
                        value: visuals.status, 
                        inline: false 
                    },
                    { 
                        name: 'Health', 
                        value: healthBar, 
                        inline: false 
                    },
                    { 
                        name: 'Level', 
                        value: `\`${levelData.level}\``, 
                        inline: true 
                    },
                    { 
                        name: 'XP', 
                        value: `\`${levelData.xp} / ${xpToNextLevel}\``, 
                        inline: true 
                    }
                );
            
            if (currentHp === 0) {
                embed.setFooter({ text: 'You are DISABLED. Regenerating 10 HP in 1 minute.' });
            } else if (currentHp < 100) {
                embed.setFooter({ text: 'Health only regenerates automatically from 0 HP.' });
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (e) {
            console.error('Failed to show health profile:', e);
        }
        return true;
    }
};