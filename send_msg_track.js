const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '../dm_queue.json');
const OWNER_ID = '479224801324695561'; // Your Discord ID

// Helper to load queue
function loadQueue() {
    try {
        if (fs.existsSync(QUEUE_FILE)) {
            return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
        }
    } catch (e) { console.error(e); }
    return [];
}

// Helper to save queue
function saveQueue(queue) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

module.exports = {
    async execute(interaction) {
        // 1. Permission Check (Owner Only)
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ 
                content: '⛔ Access Denied. Only the bot owner can use this command.', 
                ephemeral: true 
            });
        }

        const targetUser = interaction.options.getUser('user');
        const messageContent = interaction.options.getString('msg');

        // 2. Check if user is already online
        const guildMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const isOnline = guildMember && guildMember.presence && guildMember.presence.status !== 'offline';

        if (isOnline) {
            // If already online, send immediately!
            try {
                await targetUser.send(`**Message from Garmin Admin:**\n${messageContent}`);
                console.log(`[DM SENT IMMEDIATELY] To: ${targetUser.tag} | Content: "${messageContent}"`);
                return interaction.reply({ 
                    content: `✅ **${targetUser.tag}** is already online! Message sent immediately.`, 
                    ephemeral: true 
                });
            } catch (error) {
                return interaction.reply({ 
                    content: `❌ Failed to send DM immediately. They might have DMs blocked.`, 
                    ephemeral: true 
                });
            }
        }

        // 3. Queue the message
        const queue = loadQueue();
        queue.push({
            userId: targetUser.id,
            tag: targetUser.tag,
            content: messageContent,
            adminId: interaction.user.id
        });
        saveQueue(queue);

        await interaction.reply({ 
            content: `✅ Message queued for **${targetUser.tag}**. It will be sent automatically when they come online.`, 
            ephemeral: true 
        });
        console.log(`[DM QUEUED] For: ${targetUser.tag} | Content: "${messageContent}"`);
    },

    // Public method to check and send messages (called from index.js)
    async checkAndSend(client, userId, newStatus) {
        if (newStatus === 'offline') return; // Don't send if they just went offline

        const queue = loadQueue();
        // Find all messages for this user
        const messagesToSend = queue.filter(item => item.userId === userId);
        
        if (messagesToSend.length === 0) return; // Nothing to do

        // Filter out the messages we are about to send
        const remainingQueue = queue.filter(item => item.userId !== userId);
        
        // Send them
        for (const msg of messagesToSend) {
            try {
                const user = await client.users.fetch(userId);
                await user.send(`**Message from Garmin Admin:**\n${msg.content}`);
                console.log(`[DM DELIVERED] To: ${user.tag} (Came Online) | Content: "${msg.content}"`);

            } catch (err) {
                console.error(`Failed to deliver queued DM to ${userId}:`, err);
            }
        }

        // Save the queue without the sent messages
        saveQueue(remainingQueue);
    }
};