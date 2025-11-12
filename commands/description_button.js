const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'description_button',

    // Create the button row
    createRow(PREFIX) {
        const button = new ButtonBuilder()
            .setCustomId('garmin_description')
            .setLabel('📘 Description')
            .setStyle(ButtonStyle.Primary); // Blue button

        return new ActionRowBuilder().addComponents(button);
    },

    // Handle the button interaction
    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'garmin_description') return;

        const message = `
Hey, I am **Garmin!**
${interaction.member} — if you would like to use Garmin and explore endless edges, you need to have **G** or **BGM** role at least.

**Please follow these rules before getting those roles:**
1. No spamming  
2. No disturbing others in voice channels if you are not part of it  
3. Be respectful  

If you will try to use **ROULETTE** button, and you are not in a voice channel, you will be **LOCKED**
Use **!Garmin status @User** to see what modes are **available**!

Just so you know — Garmin has an internal security system that automatically blocks users who break the rules.  
Everyone gets a **second chance**, but there’s **no third one**.

— **Garmin**
        `;

        await interaction.reply({ content: message, ephemeral: true });
    }
};
