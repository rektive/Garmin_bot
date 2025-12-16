// // commands/roulette_button.js
// const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js'); // <-- 1. ADDED EmbedBuilder
// const { 
//   joinVoiceChannel, 
//   createAudioPlayer, 
//   createAudioResource, 
//   AudioPlayerStatus,
//   getVoiceConnection 
// } = require('@discordjs/voice');
// const path = require('path');
// const fs = require('fs');
// const health = require('./health.js'); // <-- 2. IMPORTED HEALTH

// module.exports = {
//   name: 'roulette_button',

//   createRow: (PREFIX) => {
//     const row = new ActionRowBuilder().addComponents(
//       new ButtonBuilder()
//         .setCustomId('garmin_roulette')
//         .setLabel('🎲 Start Roulette')
//         .setStyle(ButtonStyle.Success)
//     );
//     return row;
//   },

//   handleInteraction: async (client, interaction) => {
//     if (!interaction.isButton()) return;
//     if (interaction.customId !== 'garmin_roulette') return;

//     await interaction.deferReply({ ephemeral: false });

//     const member = interaction.member;
//     const guild = interaction.guild;

//     // --- All your permission and user checks ---
//     const hasBGM = member.roles.cache.some(r => r.name === 'BGM');
//     const hasG = member.roles.cache.some(r => r.name === 'G');
//     if (!hasBGM && !hasG) {
//       return interaction.editReply('Only users with the BGM or G role can use this command.');
//     }
//     const voiceMembers = guild.members.cache.filter(m => m.voice.channel && !m.user.bot);
//     if (!voiceMembers.size) {
//       return interaction.editReply("Sir, nikogo net v voice channel (");
//     }

//     // --- 3. MODIFIED THIS BLOCK ---
//     if (!member.voice.channel) {
//       try {
//         const muteDuration = 60 * 1000;
//         await member.timeout(muteDuration, 'Locked for not being in voice channel during roulette');
//         await interaction.editReply(`🔇 ${member.user.tag}, you are locked for 1 minute because you are not in a voice channel.`);
        
//         // --- ADDED HEALTH DAMAGE ---
//         const damageEmbed = await health.applyDamage(client, member, 40, 'Roulette Lock (Not in VC)');
//         await interaction.channel.send({ embeds: [damageEmbed] });

//       } catch (err) {
//         console.error('Failed to lock user:', err);
//         await interaction.editReply(`⚠️ Failed to lock ${member.user.tag}: ${err.message}`);
//       }
//       return;
//     }
//     // --- END OF MODIFICATION ---

//     const randomIndex = Math.floor(Math.random() * voiceMembers.size);
//     const target = Array.from(voiceMembers.values())[randomIndex];
//     const channel = target.voice.channel;
//     if (!channel) return interaction.editReply("Selected user is not in a voice channel.");
//     
//     //await interaction.editReply(`🎲 Ruletka poletela.`);

//     // --- ✨ "ON FINISH" LOGIC ✨ ---
//     
//     const distubeQueue = client.distube.getQueue(interaction.guildId);
//     let wasPlaying = false;
//     
//     try {
//       if (distubeQueue && (distubeQueue.playing || distubeQueue.paused)) {
//         console.log('DisTube queue found. Pausing it.');
//         await distubeQueue.pause();
//         wasPlaying = true;
//       }
//     } catch (e) {
//       console.error('Failed to pause DisTube:', e);
//     }
//     
//     try {
//       
//       const audioPath = path.join(__dirname, '..', 'intro_audio', 'vkus.mp3');
//       
//       if (!fs.existsSync(audioPath)) {
//         console.error('🔴 FILE NOT FOUND at path:', audioPath);
//         return interaction.followUp('Audio file not found. Please check server logs.');
//      }

//       const player = createAudioPlayer();
//       const resource = createAudioResource(audioPath);
//       
//       let connection = getVoiceConnection(channel.guild.id);
//       if (!connection || connection.joinConfig.channelId !== channel.id) {
//         connection = joinVoiceChannel({
//           channelId: channel.id,
//           guildId: channel.guild.id,
//          adapterCreator: channel.guild.voiceAdapterCreator,
//         });
//       }

//       connection.subscribe(player);
//       player.play(resource);

//       player.on(AudioPlayerStatus.Playing, () => {
//         console.log('Player status: PLAYING');
//       });
//       player.on('error', error => {
//         console.error('🔴 PLAYER ERROR:', error);
//       });

//       // This event *only* runs when the player finishes playing the audio.
//       player.on(AudioPlayerStatus.Idle, async () => {
//         console.log(`Audio finished. Running disconnect logic.`);
//         try {
//           // --- 4. MODIFIED THIS BLOCK ---

//             // --- ADDED HEALTH DAMAGE ---
//             const damageEmbed = await health.applyDamage(client, target, 10, 'Hit by Roulette');
//             damageEmbed.setFooter({ text: `${target.user.tag} is blocked from rejoining for 15 seconds.` });
//             await interaction.channel.send({ embeds: [damageEmbed] });
//             // --- END HEALTH LOGIC ---

//           // --- Your disconnect logic ---
//           await target.voice.setChannel(null, `Disconnected by roulette`);
//          await channel.permissionOverwrites.edit(target.id, { Connect: false });
//           // await interaction.channel.send(`💥 ${target.user.tag} syebalsa s voice channel for 15 sec)`); // <-- REPLACED by embed

//           setTimeout(async () => {
//             try {
//               await channel.permissionOverwrites.edit(target.id, { Connect: true });
//             } catch (err) {
//               console.log(`Failed to restore permissions for ${target.user.tag}:`, err);
//            }
//           }, 15000); // The 15-second restore timer

//         } catch (err) {
//           console.log(err);
//           await interaction.channel.send(`Failed to disconnect ${target.user.tag}.`);
//        } finally {
//           // --- CLEANUP & RESUME DISTUBE ---
//           player.stop();
//           
//           if (wasPlaying && distubeQueue) {
//             console.log('Resuming DisTube queue.');
//             try {
//               await distubeQueue.resume();
//             } catch (e) {
//               console.error('Failed to resume DisTube:', e);
//          }
//           } else {
//             if (connection.state.status !== 'destroyed') {
//               console.log('DisTube not active. Destroying our connection.');
//               connection.destroy();
//             }
//           }
//         }
//       }); // ⬅️ End of Idle listener

//     } catch (err) {
//       console.error('🔴 TOP-LEVEL CATCH ERROR:', err);
//       await interaction.followUp('A critical error occurred. Check the logs.');
//       
//       if (wasPlaying && distubeQueue) {
//         console.log('Resuming DisTube after error.');
//         try { await distubeQueue.resume(); } catch (e) { console.error('Failed to resume DisTube:', e); }
//       }
//     }
//   }
// };

const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const LIBRARY_FILE = path.join(__dirname, '../server_library.json');

function loadLibrary() {
    try {
        if (fs.existsSync(LIBRARY_FILE)) {
            return JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf8'));
        }
    } catch (e) { console.error(e); }
    return { likedSongs: [] };
}

function saveLibrary(data) {
    fs.writeFileSync(LIBRARY_FILE, JSON.stringify(data, null, 2));
}

// --- RECOMMENDATIONS ---
const RECOMMENDATIONS = [
    { name: 'Lofi Girl - Hip Hop', url: 'https://soundcloud.com/lofigirl/sets/lofi-hip-hop-music-beats-to' },
    { name: 'NCS Gaming Music', url: 'https://soundcloud.com/nocopyrightsounds/sets/gaming-music' },
    { name: 'Best Phonk', url: 'https://soundcloud.com/phonk/sets/phonk' }
];

// --- HELPER: Build Vertical Song Buttons ---
function buildSongRows(songs) {
    const rows = [];
    const max = Math.min(songs.length, 4);

    for (let i = 0; i < max; i++) {
        const song = songs[i];
        let safeName = song.name.replace(/[^a-zA-Z0-9 \-\(\)]/g, "").substring(0, 45);
        if (!safeName) safeName = "Track " + (i + 1);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`mui_play_url_${song.url}`)
                .setLabel(`▶️ ${safeName}`)
                .setStyle(ButtonStyle.Secondary),
            
            new ButtonBuilder()
                .setCustomId(`mui_like_url_${song.url}::${safeName}`)
                .setLabel('❤️')
                .setStyle(ButtonStyle.Secondary)
        );
        rows.push(row);
    }
    return rows;
}

// --- HELPER: Navigation Row ---
function getNavRow(currentView) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('mui_search_mode')
            .setLabel('🔍 Search')
            .setStyle(currentView === 'search' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(currentView === 'search'),
        new ButtonBuilder()
            .setCustomId('mui_library')
            .setLabel('📚 Library')
            .setStyle(currentView === 'library' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(currentView === 'library'),
        new ButtonBuilder()
            .setCustomId('mui_song')
            .setLabel('🎵 Song')
            .setStyle(currentView === 'song' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setDisabled(currentView === 'song')
    );
}

module.exports = {
    name: 'music_ui',

    async start(message) {
        await this.showSearchMode(message);
    },

    // --- VIEW: SEARCH MODE ---
    async showSearchMode(interactionOrMessage) {
        const embed = new EmbedBuilder()
            .setColor('#FF5500')
            .setTitle('🔍 Music Search')
            .setDescription(
                `**Type your song name in the chat below.**\n` +
                `I will update this window with results.\n\n` +
                `**Search Bar:**\n` +
                `\` 🔍 | [ Waiting for input... ]                    \``
            );

        const navRow = getNavRow('search');

        if (interactionOrMessage.update) {
             await interactionOrMessage.update({ embeds: [embed], components: [navRow] });
        } else {
             await interactionOrMessage.reply({ embeds: [embed], components: [navRow] });
        }

        const client = interactionOrMessage.client; 
        const userId = interactionOrMessage.user ? interactionOrMessage.user.id : interactionOrMessage.author.id;
        const channel = interactionOrMessage.channel;

        const filter = m => m.author.id === userId;
        const collector = channel.createMessageCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async m => {
            try { await m.delete(); } catch(e) {} 
            const query = m.content;
            
            // --- DIRECT PLAY RESULT UI ---
            const resultEmbed = new EmbedBuilder()
                .setColor('#FF5500')
                .setTitle('🔍 Result')
                .setDescription(
                    `**Found result for:** \`${query}\`\n` +
                    `Click below to play.`
                );

            const safeQuery = query.substring(0, 80);
            const playButtonLabel = `▶️ Play "${safeQuery.substring(0, 25)}..."`;

            const playRow = new ActionRowBuilder().addComponents(
                 new ButtonBuilder()
                    .setCustomId(`mui_play_url_${safeQuery}`) 
                    .setLabel(playButtonLabel)
                    .setStyle(ButtonStyle.Success)
            );

            try {
                if (interactionOrMessage.message) {
                    await interactionOrMessage.message.edit({ embeds: [resultEmbed], components: [playRow, navRow] });
                } else if (interactionOrMessage.edit) {
                    await interactionOrMessage.edit({ embeds: [resultEmbed], components: [playRow, navRow] });
                }
            } catch(e) {
                 await channel.send({ embeds: [resultEmbed], components: [playRow, navRow] });
            }
        });
    },

    // --- VIEW: LIBRARY ---
    async showLibrary(interaction) {
        const data = loadLibrary();
        const likedSongs = data.likedSongs;

        const embed = new EmbedBuilder()
            .setColor('#FF5500')
            .setTitle('📚 Server Library')
            .setDescription(`**Liked Songs Playlist**\n${likedSongs.length} songs saved.`);

        const openRow = new ActionRowBuilder().addComponents(
             new ButtonBuilder().setCustomId('mui_open_liked').setLabel('📂 Open Playlist').setStyle(ButtonStyle.Success)
        );

        const navRow = getNavRow('library');

        await interaction.update({ embeds: [embed], components: [openRow, navRow] });
    },

    // --- VIEW: OPENED PLAYLIST ---
    async openLikedSongs(interaction) {
        const data = loadLibrary();
        const songs = data.likedSongs; 

        const embed = new EmbedBuilder()
            .setColor('#FF5500')
            .setTitle('❤️ Liked Songs')
            .setDescription(songs.length > 0 ? 'Pick a track:' : 'No songs yet!');

        const songRows = buildSongRows(songs);
        
        const customNavRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('mui_search_mode').setLabel('🔍 Search').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('mui_library').setLabel('⬅️ Back').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('mui_song').setLabel('🎵 Song').setStyle(ButtonStyle.Secondary)
        );

        const allRows = [...songRows, customNavRow];
        await interaction.update({ embeds: [embed], components: allRows });
    },

    // --- VIEW: PLAYER ---
    async showPlayer(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        if (!queue || !queue.songs || queue.songs.length === 0) {
             const embed = new EmbedBuilder().setColor('#808080').setTitle('🎵 No Music Playing').setDescription('Go to **Search** to play something!');
             return interaction.update({ embeds: [embed], components: [getNavRow('song')] });
        }
        
        try {
            queue.nowPlayingMessage = await interaction.channel.messages.fetch(interaction.message.id);
            interaction.client.distube.emit('playSong', queue, queue.songs[0]);
        } catch (e) { console.error(e); }
        
        await interaction.deferUpdate();
    },

    // --- MAIN HANDLER ---
    async handleInteraction(client, interaction) {
        if (!interaction.isButton()) return;
        const id = interaction.customId;

        if (id === 'mui_search_mode' || id === 'mui_back_to_search') await this.showSearchMode(interaction);
        if (id === 'mui_library') await this.showLibrary(interaction);
        if (id === 'mui_open_liked') await this.openLikedSongs(interaction);
        if (id === 'mui_song') await this.showPlayer(interaction);

        if (id.startsWith('mui_play_url_')) {
            const url = id.replace('mui_play_url_', '');
            await this.playSong(client, interaction, url);
        }

        if (id.startsWith('mui_like_url_')) {
            const raw = id.replace('mui_like_url_', '');
            const [url, name] = raw.split('::');
            const data = loadLibrary();
            const existingIndex = data.likedSongs.findIndex(s => s.url === url);

            if (existingIndex === -1) {
                data.likedSongs.push({ name, url });
                saveLibrary(data);
                await interaction.reply({ content: `❤️ Added **${name}** to Liked Songs!`, ephemeral: true });
            } else {
                data.likedSongs.splice(existingIndex, 1);
                saveLibrary(data);
                await interaction.reply({ content: `💔 Removed **${name}** from Liked Songs.`, ephemeral: true });
            }
        }
    },

    // --- PLAY HELPER (SMART FALLBACK) ---
    async playSong(client, interaction, songUrl) {
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });

        await interaction.deferUpdate(); 
        
        try {
            const isUrl = /^(http|https):\/\//.test(songUrl);
            
            // 1. Try SoundCloud First
            let playQuery = songUrl;
            if (!isUrl) {
                playQuery = `scsearch:${songUrl}`;
            }

            try {
                // Attempt play from SoundCloud
                await client.distube.play(channel, playQuery, {
                    member: interaction.member,
                    textChannel: interaction.channel
                });
            } catch (scError) {
                // 2. Fallback to YouTube if SoundCloud fails (NO_RESULT)
                if (scError.errorCode === 'NO_RESULT' && !isUrl) {
                    console.log(`SoundCloud failed for "${songUrl}", falling back to YouTube...`);
                    // Just play the raw query (DisTube defaults to YouTube)
                    await client.distube.play(channel, songUrl, { 
                        member: interaction.member,
                        textChannel: interaction.channel
                    });
                } else {
                    throw scError; // Throw other errors (like permissions)
                }
            }

            // Capture UI for update
            const queue = client.distube.getQueue(interaction.guildId);
            if (queue) {
                const uiMessage = await interaction.channel.messages.fetch(interaction.message.id);
                queue.nowPlayingMessage = uiMessage;
            }
        } catch (e) {
            console.error(e);
            await interaction.followUp({ content: '❌ Error playing song. No results found anywhere.', ephemeral: true });
        }
    }
};