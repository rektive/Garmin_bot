const { PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const QUEUE_FILE = path.join(__dirname, '../dm_queue.json');

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
        // 1. Permission Check (Admins only)
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: '⛔ Access Denied. Only admins can use this command.', 
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
                await user.send(`${msg.content}`);
                console.log(`[DM DELIVERED] To: ${user.tag} (Came Online) | Content: "${msg.content}"`);
                
                // Optional: Notify the admin who queued it?
                // const admin = await client.users.fetch(msg.adminId);
                // admin.send(`✅ Your queued message to **${user.tag}** has been delivered!`).catch(()=>{});

            } catch (err) {
                console.error(`Failed to deliver queued DM to ${userId}:`, err);
                // If failed (e.g. blocked), maybe keep in queue? 
                // For now we remove it to prevent loops/spam if they blocked the bot.
            }
        }

        // Save the queue without the sent messages
        saveQueue(remainingQueue);
    }
};