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
        // 1. Permission Check (Fast Reply)
        if (interaction.user.id !== OWNER_ID) {
            return interaction.reply({ content: '⛔ Access Denied.', ephemeral: true });
        }

        // 2. Defer Reply (Prevents timeout errors)
        await interaction.deferReply({ ephemeral: true });

        // Get and clean input
        let inputTarget = interaction.options.getString('target');
        const userId = inputTarget.replace(/[<@!>]/g, '');
        const messageContent = interaction.options.getString('msg');

        // 3. Basic ID Validation
        if (!/^\d{17,19}$/.test(userId)) {
             return interaction.editReply({ 
                content: `❌ **Invalid ID Format.**\nThe ID \`${userId}\` doesn't look right.` 
            });
        }

        // Verify user exists first
        let targetUser;
        try {
            targetUser = await interaction.client.users.fetch(userId);
        } catch (e) {
            return interaction.editReply({ content: `❌ Invalid User ID: \`${userId}\`. Could not find user.` });
        }

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
                console.log(`[DM SENT IMMEDIATELY] To: ${targetUser.tag}`);
                return interaction.editReply({ content: `✅ **${targetUser.tag}** is online! Sent immediately.` });
            } catch (error) {
                return interaction.editReply({ content: `❌ Failed to send. DMs blocked?` });
            }
        }

        // Queue it
        const queue = loadQueue();
        queue.push({
            userId: userId,
            tag: targetUser.tag,
            content: messageContent,
            adminId: interaction.user.id
        });
        saveQueue(queue);

        await interaction.editReply({ content: `✅ Message queued for **${targetUser.tag}**. Will send when they come online.` });
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