// const { PermissionsBitField } = require('discord.js');

// module.exports = {
//     async execute(interaction) {
//         // 1. Check if user is in a voice channel
//         const { channel } = interaction.member.voice;
        
//         if (!channel) {
//             return interaction.reply({ 
//                 content: '❌ You must be in a voice channel to rename it!', 
//                 ephemeral: true 
//             });
//         }

//         // 2. Get the new name
//         const newName = interaction.options.getString('name');

//         // 3. Permission Check
//         if (!channel.permissionsFor(interaction.user).has(PermissionsBitField.Flags.ManageChannels)) {
//             return interaction.reply({ 
//                 content: '⛔ You do not have permission to rename this room. Only the owner or admins can do this.', 
//                 ephemeral: true 
//             });
//         }

//         // 4. Attempt Rename
//         try {
//             await channel.setName(newName);
//             await interaction.reply({ 
//                 content: `✅ Channel renamed to **${newName}**`,
//                 ephemeral: true 
//             });
//         } catch (error) {
//             console.error(error);
//             // Handle Discord's specific rate limit error for renaming
//             if (error.code === 50035) { 
//                  await interaction.reply({ 
//                     content: '❌ Failed to rename. Discord limits channel renames to **2 times every 10 minutes**.', 
//                     ephemeral: true 
//                 });
//             } else {
//                 await interaction.reply({ 
//                     content: '❌ Failed to rename channel. Is the name too long or offensive?', 
//                     ephemeral: true 
//                 });
//             }
//         }
//     },
// };


const { PermissionsBitField } = require('discord.js');

module.exports = {
    async execute(interaction) {
        // 1. Check if user is in a voice channel
        const { channel } = interaction.member.voice;
        
        if (!channel) {
            return interaction.reply({ 
                content: '❌ You must be in a voice channel to rename it!', 
                ephemeral: true 
            });
        }

        // 2. Get the new name
        const newName = interaction.options.getString('name');

        // 3. Permission Check
        if (!channel.permissionsFor(interaction.user).has(PermissionsBitField.Flags.ManageChannels)) {
            return interaction.reply({ 
                content: '⛔ You do not have permission to rename this room. Only the owner or admins can do this.', 
                ephemeral: true 
            });
        }

        // 4. Attempt Rename
        try {
            await channel.setName(newName);
            await interaction.reply({ 
                content: `✅ Channel renamed to **${newName}**`,
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            // Handle Discord's specific rate limit error for renaming
            if (error.code === 50035) { 
                 await interaction.reply({ 
                    content: '❌ Failed to rename. Discord limits channel renames to **2 times every 10 minutes**.', 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: '❌ Failed to rename channel. Is the name too long or offensive?', 
                    ephemeral: true 
                });
            }
        }
    },
};