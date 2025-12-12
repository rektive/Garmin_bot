const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TEMP_FILE = path.join(__dirname, '../temp_channels.json');
const OWNER_ID = '479224801324695561'; 

// --- 👇 CONFIGURATION: PASTE YOUR CATEGORY ID HERE 👇 ---
const TARGET_CATEGORY_ID = '123456789012345678'; 
// -------------------------------------------------------

// Helper to save channel ID (Reuse logic for auto-cleanup)
function saveTempChannel(id) {
    let channels = [];
    try {
        if (fs.existsSync(TEMP_FILE)) {
            channels = JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
        }
    } catch (e) { console.error(e); }
    
    if (!channels.includes(id)) {
        channels.push(id);
        fs.writeFileSync(TEMP_FILE, JSON.stringify(channels, null, 2));
    }
}

module.exports = {
    async execute(interaction) {
        // 1. Permission Check (Owner or Admin only)
        if (interaction.user.id !== OWNER_ID && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: '⛔ Access Denied. Only Admins or the Owner can use this command.', 
                ephemeral: true 
            });
        }

        const targetUser = interaction.options.getUser('user');
        const name = `🔒 Private: ${interaction.user.username} & ${targetUser.username}`;

        try {
            const guild = interaction.guild;
            
            // Determine Parent Category
            let parent = TARGET_CATEGORY_ID;
            if (parent === '123456789012345678') parent = null; 

            // Create the channel with strict permissions
            const voiceChannel = await guild.channels.create({
                name: name,
                type: ChannelType.GuildVoice,
                parent: parent,
                userLimit: 2, // Limit to 2 people mostly, but permissions control access anyway
                permissionOverwrites: [
                    {
                        // Deny everyone
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        // Allow Creator (You) + Manage Permissions
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers],
                    },
                    {
                        // Allow Target User
                        id: targetUser.id,
                        allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel],
                    }
                ]
            });

            // Save ID so it auto-deletes when empty (using your existing index.js logic)
            saveTempChannel(voiceChannel.id);

            const embed = new EmbedBuilder()
                .setColor('#FF0000') // Red for Private
                .setTitle('🔒 Private Channel Created')
                .setDescription(`Created **${name}**.\n\nOnly ${interaction.user} and ${targetUser} can see and join this channel.\nIt will auto-delete when empty.`)
                .addFields({ name: 'Join Here', value: `<#${voiceChannel.id}>` });

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // Optional: Start the 5-minute cleanup timer immediately just like /voice
            setTimeout(async () => {
                try {
                    const channel = await guild.channels.fetch(voiceChannel.id).catch(() => null);
                    if (channel && channel.members.size === 0) {
                        await channel.delete();
                        // Remove from JSON
                        let channels = [];
                        if (fs.existsSync(TEMP_FILE)) channels = JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
                        const newIds = channels.filter(id => id !== voiceChannel.id);
                        fs.writeFileSync(TEMP_FILE, JSON.stringify(newIds, null, 2));
                    }
                } catch (err) {}
            }, 300000); // 5 minutes

        } catch (error) {
            console.error('Error creating private voice channel:', error);
            await interaction.reply({ content: '❌ Failed to create channel. Check permissions!', ephemeral: true });
        }
    },
};