module.exports = {
    async execute(interaction) {
        const OWNER_ID = '479224801324695561'; // Your Discord ID

        // 1. Permission Check (Owner Only)
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: '⛔ Access Denied. Only the bot owner can use this command.', 
                ephemeral: true 
            });
        }

        const targetUser = interaction.options.getUser('user');
        const messageContent = interaction.options.getString('msg');

        // 2. Send the DM
        try {
            await targetUser.send(`**Message from Garmin Admin:**\n${messageContent}`);
            
            await interaction.reply({ 
                content: `✅ Message sent to **${targetUser.tag}**. I will log any reply in the terminal.`, 
                ephemeral: true 
            });
            console.log(`[DM SENT] To: ${targetUser.tag} | Content: "${messageContent}"`);

        } catch (error) {
            console.error(`Failed to send DM to ${targetUser.tag}:`, error);
            await interaction.reply({ 
                content: `❌ Failed to send DM. The user might have DMs blocked.`, 
                ephemeral: true 
            });
        }
    },
};