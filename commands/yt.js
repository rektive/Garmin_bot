const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

// This is the specific Application ID for YouTube Watch Together
const YOUTUBE_ACTIVITY_ID = '880218394199220334'; 

module.exports = {
    data: {
        name: 'yt',
        description: 'Starts a YouTube Watch Together activity in your voice channel.',
    },
    async execute(interaction) {
        // 1. Check if user is in a voice channel
        const channel = interaction.member.voice.channel;
        if (!channel) {
            return interaction.reply({ 
                content: '❌ You need to be in a voice channel to start YouTube Together!', 
                ephemeral: true 
            });
        }

        // 2. Create the Invite Link
        try {
            // Discord.js has a built-in method for this now called 'createInvite'
            // We invite people to the channel with the 'targetApplication' set to YouTube
            const invite = await channel.createInvite({
                targetApplication: YOUTUBE_ACTIVITY_ID,
                targetType: 2 // 2 means "Target Application"
            });

            // 3. Create the UI
            const embed = new EmbedBuilder()
                .setColor('#FF0000') // YouTube Red
                .setTitle('📺 YouTube Watch Together')
                .setDescription(`Click the button below to join **YouTube** in <#${channel.id}>!`)
                .setThumbnail('https://i.imgur.com/7v5930n.png'); // YouTube logo

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Start Watching')
                        .setStyle(ButtonStyle.Link)
                        .setURL(invite.url) // The invite link acts as the "Start Activity" button
                );

            await interaction.reply({ embeds: [embed], components: [row] });

        } catch (error) {
            console.error('Error creating YouTube activity:', error);
            await interaction.reply({ 
                content: '❌ Failed to start YouTube Together. Make sure I have "Create Invite" permissions!', 
                ephemeral: true 
            });
        }
    },
};