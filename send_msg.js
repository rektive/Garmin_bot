module.exports = {
    async execute(interaction) {
        const OWNER_ID = '479224801324695561'; 

        // 1. Permission Check (Fast Reply)
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '⛔ Access Denied.', ephemeral: true });
        }

        // 2. Defer Reply (Tells Discord "Thinking..." so it doesn't timeout)
        await interaction.deferReply({ ephemeral: true });

        // Get the input (could be "12345" or "<@12345>")
        let inputTarget = interaction.options.getString('target');
        const messageContent = interaction.options.getString('msg');

        // Clean the input to get just the ID
        const userId = inputTarget.replace(/[<@!>]/g, '');

        // 3. Basic ID Validation
        if (!/^\d{17,19}$/.test(userId)) {
             return interaction.editReply({ 
                content: `❌ **Invalid ID Format.**\nThe ID \`${userId}\` doesn't look right. Discord IDs are usually 17-19 digits long.` 
            });
        }

        try {
            // 4. Fetch user by ID (This takes time, hence deferReply)
            const targetUser = await interaction.client.users.fetch(userId);
            
            // 5. Send DM
            await targetUser.send(`**Message from Garmin Admin:**\n${messageContent}`);
            
            // 6. Confirm Success
            await interaction.editReply({ 
                content: `✅ Message sent to **${targetUser.tag}** (${userId}).` 
            });
            console.log(`[DM SENT] To: ${targetUser.tag} | Content: "${messageContent}"`);

        } catch (error) {
            console.error(`Failed to send DM to ${userId}:`, error.message);
            
            // Handle specific errors
            let errorMessage = `❌ Failed. `;
            if (error.code === 10013) errorMessage += `Unknown User (ID might be wrong).`;
            else if (error.code === 50007) errorMessage += `User has DMs disabled or blocked the bot.`;
            else errorMessage += `Make sure the ID is correct and they share a server with the bot.`;

            await interaction.editReply({ content: errorMessage });
        }
    },
};