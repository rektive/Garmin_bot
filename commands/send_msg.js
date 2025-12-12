module.exports = {
    async execute(interaction) {
        const OWNER_ID = '479224801324695561'; 

        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '⛔ Access Denied.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        // 1. Get Input as STRING (Because we deployed it as addStringOption)
        const inputTarget = interaction.options.getString('target') || interaction.options.getString('user');
        const messageContent = interaction.options.getString('msg');

        if (!inputTarget) {
             return interaction.editReply('❌ Error: Could not read "target" option.');
        }

        // 2. Clean the input to get just the ID
        // This handles "<@123456789>" (Mention) AND "123456789" (Raw ID)
        const userId = inputTarget.replace(/[<@!>]/g, '');

        // 3. Validate ID Format
        if (!/^\d{17,19}$/.test(userId)) {
             return interaction.editReply({ 
                content: `❌ **Invalid ID Format.**\nThe ID \`${userId}\` doesn't look right. Discord IDs are usually 17-19 digits long.` 
            });
        }

        try {
            // 4. Fetch user by ID
            const targetUser = await interaction.client.users.fetch(userId);
            
            await targetUser.send(`${messageContent}`);
            
            const tagName = targetUser.tag || "Unknown User";
            await interaction.editReply({ 
                content: `✅ Message sent to **${tagName}** (${userId}).` 
            });
            console.log(`[DM SENT] To: ${tagName} | Content: "${messageContent}"`);

        } catch (error) {
            console.error(`Failed to send DM to ${userId}:`, error.message);
            
            let errorMessage = `❌ Failed. `;
            if (error.code === 10013) errorMessage += `Unknown User (ID might be wrong).`;
            else if (error.code === 50007) errorMessage += `User has DMs disabled or blocked the bot.`;
            else errorMessage += `Make sure the ID is correct and they share a server with the bot.`;

            await interaction.editReply({ content: errorMessage });
        }
    },
};