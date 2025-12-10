// commands/create_voice.js
const { ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const TEMP_FILE = path.join(__dirname, '../temp_channels.json');

// --- 👇 CONFIGURATION: PASTE YOUR CATEGORY ID HERE 👇 ---
// Right-click the Category Name -> Copy ID
const TARGET_CATEGORY_ID = '123456789012345678'; 
// -------------------------------------------------------

// Helper to save channel ID
function saveTempChannel(id) {
    let channels = [];
    try {
        if (fs.existsSync(TEMP_FILE)) {
            channels = JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
        }
    } catch (e) {}
    
    if (!channels.includes(id)) {
        channels.push(id);
        fs.writeFileSync(TEMP_FILE, JSON.stringify(channels, null, 2));
    }
}

module.exports = {
    async execute(interaction) {
        const name = interaction.options.getString('name') || `${interaction.user.username}'s Room`;
        const limit = interaction.options.getInteger('limit') || 0;

        try {
            const guild = interaction.guild;
            
            // Determine Parent Category
            let parent = TARGET_CATEGORY_ID;
            
            // Safety check
            if (parent === '123456789012345678') {
                console.log('⚠️ WARNING: TARGET_CATEGORY_ID in create_voice.js is not set!');
                parent = null; 
            }

            const voiceChannel = await guild.channels.create({
                name: name,
                type: ChannelType.GuildVoice,
                parent: parent, 
                userLimit: limit,
                permissionOverwrites: [
                    {
                        id: interaction.user.id,
                        allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers], 
                    },
                    {
                        id: guild.id,
                        allow: [PermissionsBitField.Flags.Connect], 
                    }
                ]
            });

            saveTempChannel(voiceChannel.id);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔊 Voice Channel Created')
                .setDescription(`Created **${name}**!\n\n**Rules:**\n1. If no one joins in **5 minutes**, it will delete.\n2. It deletes **15 seconds** after everyone leaves.`)
                .addFields({ name: 'Join Here', value: `<#${voiceChannel.id}>` });

            await interaction.reply({ embeds: [embed], ephemeral: true });

            // --- 👇 NEW LOGIC: 5 Minute Cleanup Timer 👇 ---
            setTimeout(async () => {
                try {
                    // Fetch the channel to see if it still exists and check member count
                    const channel = await guild.channels.fetch(voiceChannel.id).catch(() => null);
                    
                    if (channel && channel.members.size === 0) {
                        console.log(`Temp channel ${channel.name} was unused for 5 mins. Deleting.`);
                        await channel.delete();

                        // Remove from JSON tracking
                        let channels = [];
                        if (fs.existsSync(TEMP_FILE)) {
                            channels = JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
                        }
                        const newIds = channels.filter(id => id !== voiceChannel.id);
                        fs.writeFileSync(TEMP_FILE, JSON.stringify(newIds, null, 2));
                    }
                } catch (err) {
                    console.error('Error in 5-minute cleanup check:', err);
                }
            }, 300000); // 300,000 ms = 5 Minutes
            // -----------------------------------------------

        } catch (error) {
            console.error('Error creating voice channel:', error);
            await interaction.reply({ content: '❌ Failed to create channel. Check my permissions or the Category ID!', ephemeral: true });
        }
    },
};