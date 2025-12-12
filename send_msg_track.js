const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '../dm_queue.json');
const OWNER_ID = '479224801324695561';

function loadQueue() {
    try {
        if (fs.existsSync(QUEUE_FILE)) return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    } catch (e) { console.error(e); }
    return [];
}

function saveQueue(queue) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

module.exports = {
    async execute(interaction) {
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

        // Verify user exists first (and try to fetch full user object if we only have ID)
        try {
            if (!targetUser) {
                 targetUser = await interaction.client.users.fetch(userId);
            }
        } catch (e) {
            return interaction.editReply({ content: `❌ Invalid User ID: \`${userId}\`. Could not find user.` });
        }
        
        // Safe check for tag just in case fetch failed but didn't throw (unlikely)
        const userTag = targetUser ? targetUser.tag : "Unknown User";

        // Check if online via Guild Member (needs to be in THIS server to check status)
        let isOnline = false;
        try {
            const guildMember = await interaction.guild.members.fetch(userId);
            isOnline = guildMember && guildMember.presence && guildMember.presence.status !== 'offline';
        } catch (e) {
            // User might not be in this server, so we can't check status easily.
            // We proceed to queue them or treat as offline.
        }

        if (isOnline) {
            try {
                await targetUser.send(`**Message from Garmin Admin:**\n${messageContent}`);
                console.log(`[DM SENT IMMEDIATELY] To: ${userTag}`);
                return interaction.editReply({ content: `✅ **${userTag}** is online! Sent immediately.` });
            } catch (error) {
                return interaction.editReply({ content: `❌ Failed to send. DMs blocked?` });
            }
        }

        // Queue it
        const queue = loadQueue();
        queue.push({
            userId: userId,
            tag: userTag,
            content: messageContent,
            adminId: interaction.user.id
        });
        saveQueue(queue);

        await interaction.editReply({ content: `✅ Message queued for **${userTag}**. Will send when they come online.` });
    },

    async checkAndSend(client, userId, newStatus) {
        if (newStatus === 'offline') return;

        const queue = loadQueue();
        const messagesToSend = queue.filter(item => item.userId === userId);
        
        if (messagesToSend.length === 0) return;

        const remainingQueue = queue.filter(item => item.userId !== userId);
        
        for (const msg of messagesToSend) {
            try {
                const user = await client.users.fetch(userId);
                await user.send(`**Message from Garmin Admin:**\n${msg.content}`);
                console.log(`[DM DELIVERED] To: ${user.tag}`);
            } catch (err) {
                console.error(`Failed to deliver queued DM to ${userId}:`, err);
            }
        }
        saveQueue(remainingQueue);
    }
};