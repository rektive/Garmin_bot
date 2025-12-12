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

        // 1. Get Input as STRING
        const inputTarget = interaction.options.getString('target') || interaction.options.getString('user');
        const messageContent = interaction.options.getString('msg');

        if (!inputTarget) {
             return interaction.editReply('❌ Error: Could not read "target" option.');
        }

        // 2. Clean to get ID
        const userId = inputTarget.replace(/[<@!>]/g, '');

        if (!/^\d{17,19}$/.test(userId)) {
             return interaction.editReply(`❌ **Invalid ID Format.**`);
        }

        // 3. Verify user exists via Fetch
        let targetUser;
        try {
            targetUser = await interaction.client.users.fetch(userId);
        } catch (e) {
            return interaction.editReply({ content: `❌ Invalid User ID: \`${userId}\`. Could not find user.` });
        }
        
        const userTag = targetUser.tag || "Unknown User";

        // 4. Check Online Status
        let isOnline = false;
        try {
            const guildMember = await interaction.guild.members.fetch(userId);
            if (guildMember.presence && guildMember.presence.status !== 'offline') {
                isOnline = true;
            }
        } catch (e) {
            // User likely not in this server
        }

        // 5. Logic
        if (isOnline) {
            try {
                await targetUser.send(`${messageContent}`);
                console.log(`[DM SENT IMMEDIATELY] To: ${userTag}`);
                return interaction.editReply({ content: `✅ **${userTag}** is online! Message sent immediately.` });
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