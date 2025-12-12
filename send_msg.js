module.exports = {
    async execute(interaction) {
        const OWNER_ID = '479224801324695561'; 

        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '⛔ Access Denied.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        // 1. Try to get as User (if updated to User option)
        let targetUser = interaction.options.getUser('user') || interaction.options.getUser('target');
        let userId;

        // 2. If not a User object, try to get as String (if updated to String option)
        if (!targetUser) {
            const inputString = interaction.options.getString('target') || interaction.options.getString('user');
            if (inputString) {
                // Extract ID from string (e.g. "<@12345>" -> "12345")
                userId = inputString.replace(/[<@!>]/g, '');
            }
        } else {
            userId = targetUser.id;
        }

        const messageContent = interaction.options.getString('msg');

        if (!userId) {
             return interaction.editReply('❌ Error: Could not find a user ID in your input. Please check the command options.');
        }

        try {
            // Force fetch to ensure we can DM them (and get the tag if we only had an ID string)
            targetUser = await interaction.client.users.fetch(userId);
            
            await targetUser.send(`**Message from Garmin Admin:**\n${messageContent}`);
            
            // Safe access to tag
            const tagName = targetUser ? targetUser.tag : "Unknown User";

            await interaction.editReply({ 
                content: `✅ Message sent to **${tagName}** (${userId}).` 
            });
            console.log(`[DM SENT] To: ${tagName} | Content: "${messageContent}"`);

        } catch (error) {
            console.error(`Failed to send DM to ${userId}:`, error.message);
            await interaction.editReply(`❌ Failed. User might have DMs blocked or ID \`${userId}\` is invalid.`);
        }
    },
};
