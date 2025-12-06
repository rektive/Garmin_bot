// // commands/more_button.js
// const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const profileButton = require('./profile_button.js'); // Import the profile button

// module.exports = {
//     name: 'more_button',

//     // This is called in your index.js 'help' command
//     createButton: () => {
//         const row = new ActionRowBuilder().addComponents(
//             new ButtonBuilder()
//                 .setCustomId('more_menu')
//                 .setLabel('More...')
//                 .setStyle(ButtonStyle.Secondary)
//         );
//         return row;
//     },

//     // This is called in your index.js 'interactionCreate'
//     handleInteraction: async (interaction) => {
//         if (!interaction.isButton()) return false;
//         if (interaction.customId !== 'more_menu') return false;

//         // When "More" is clicked, reply with the "Profile" button
//         try {
//             await interaction.reply({
//                 content: 'Here are more options:',
//                 components: [profileButton.createButton()],
//                 ephemeral: true // Only the user who clicked sees this
//             });
//         } catch (e) {
//             console.error('Failed to show More menu:', e);
//         }
//         return true;
//     }
// };
// commands/more_button.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const profileButton = require('./profile_button.js'); // Import the profile button
const healthButton = require('./health_button.js'); // Import the new health button

module.exports = {
    name: 'more_button',

    // This is called in your index.js 'help' command
    createButton: () => {
        // This function only returns the component, not the row.
        // The row is built in your index.js 'help' command.
        return new ButtonBuilder()
            .setCustomId('more_menu')
            .setLabel('More...')
            .setStyle(ButtonStyle.Secondary);
    },

    // This is called in your index.js 'interactionCreate'
    handleInteraction: async (interaction) => {
        if (!interaction.isButton()) return false;
        if (interaction.customId !== 'more_menu') return false;

        try {
            // Create the two buttons for the reply
            const profileBtn = profileButton.createButton(); // Gets the button component
            const healthBtn = healthButton.createButton();   // Gets the button component
            
            const row = new ActionRowBuilder().addComponents(profileBtn, healthBtn);

            await interaction.reply({
                content: 'Here are more options:',
                components: [row],
                ephemeral: true // Only the user who clicked sees this
            });
        } catch (e) {
            console.error('Failed to show More menu:', e);
        }
        return true;
    }
}