module.exports = {
    async execute(interaction) {
        const OWNER_ID = '479224801324695561'; 

        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '⛔ Access Denied.', ephemeral: true });
        }

        // Get the input (could be "12345" or "<@12345>")
        let inputTarget = interaction.options.getString('target');
        const messageContent = interaction.options.getString('msg');

        // Clean the input to get just the ID
        const userId = inputTarget.replace(/[<@!>]/g, '');

        try {
            // Fetch user by ID
            const targetUser = await interaction.client.users.fetch(userId);
            
            await targetUser.send(`${messageContent}`);
            
            await interaction.reply({ 
                content: `✅ Message sent to **${targetUser.tag}** (${userId}).`, 
                ephemeral: true 
            });
            console.log(`[DM SENT] To: ${targetUser.tag} | Content: "${messageContent}"`);

        } catch (error) {
            console.error(`Failed to send DM to ${userId}:`, error);
            await interaction.reply({ 
                content: `❌ Failed. Could not find user with ID: \`${userId}\`.\nMake sure the ID is correct and they share a server with the bot.`, 
                ephemeral: true 
            });
        }
    },
};