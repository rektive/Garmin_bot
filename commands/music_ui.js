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

// --- RECOMMENDATIONS (SoundCloud Only) ---
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
            .setTitle('🔍 Music Search (SoundCloud)')
            .setDescription(
                `**Type your song name in the chat below.**\n` +
                `I will try to find it on SoundCloud.\n\n` +
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
            
            const resultEmbed = new EmbedBuilder()
                .setColor('#FF5500')
                .setTitle('🔍 SoundCloud Result')
                .setDescription(
                    `**Query:** \`${query}\`\n` +
                    `Click below to search & play on SoundCloud.`
                );

            const safeQuery = query.substring(0, 80);
            
            const playRow = new ActionRowBuilder().addComponents(
                 new ButtonBuilder()
                    .setCustomId(`mui_play_url_${safeQuery}`) 
                    .setLabel(`▶️ Play "${safeQuery.substring(0, 25)}..."`)
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
            // Check if it's already a URL
            const isUrl = /^(http|https):\/\//.test(songUrl);
            
            // Primary Attempt: SoundCloud Search
            let playQuery = songUrl;
            if (!isUrl) {
                playQuery = `scsearch:${songUrl}`;
            }

            try {
                // Try SoundCloud first
                await client.distube.play(channel, playQuery, {
                    member: interaction.member,
                    textChannel: interaction.channel
                });
            } catch (scError) {
                // Fallback: If SoundCloud fails (NO_RESULT), try generic search (YouTube)
                if (scError.errorCode === 'NO_RESULT' && !isUrl) {
                    console.log(`SoundCloud failed for "${songUrl}", trying generic search...`);
                    await client.distube.play(channel, songUrl, { // Remove 'scsearch:' prefix
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
            await interaction.followUp({ content: '❌ Error playing song from SoundCloud AND YouTube. Try a different query.', ephemeral: true });
        }
    }
};

// const { 
//     ActionRowBuilder, 
//     ButtonBuilder, 
//     ButtonStyle, 
//     EmbedBuilder 
// } = require('discord.js');
// const fs = require('fs');
// const path = require('path');

// const LIBRARY_FILE = path.join(__dirname, '../server_library.json');

// function loadLibrary() {
//     try {
//         if (fs.existsSync(LIBRARY_FILE)) {
//             return JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf8'));
//         }
//     } catch (e) { console.error(e); }
//     return { likedSongs: [] };
// }

// function saveLibrary(data) {
//     fs.writeFileSync(LIBRARY_FILE, JSON.stringify(data, null, 2));
// }

// // --- HELPER: Build Vertical Song Buttons ---
// function buildSongRows(songs) {
//     const rows = [];
//     // Max 4 songs to leave room for nav row
//     const max = Math.min(songs.length, 4);

//     for (let i = 0; i < max; i++) {
//         const song = songs[i];
//         // Clean name for button label (max 45 chars)
//         let safeName = song.name.replace(/[^a-zA-Z0-9 \-\(\)]/g, "").substring(0, 45);
//         if (!safeName) safeName = "Track " + (i + 1);

//         const row = new ActionRowBuilder().addComponents(
//             // BUTTON 1: The Play Button
//             new ButtonBuilder()
//                 .setCustomId(`mui_play_url_${song.url}`)
//                 .setLabel(`▶️ ${safeName}`)
//                 .setStyle(ButtonStyle.Secondary),
            
//             // BUTTON 2: The Like Button
//             new ButtonBuilder()
//                 .setCustomId(`mui_like_url_${song.url}::${safeName}`)
//                 .setLabel('❤️')
//                 .setStyle(ButtonStyle.Secondary)
//         );
//         rows.push(row);
//     }
//     return rows;
// }

// // --- HELPER: Navigation Row (NO HOME) ---
// function getNavRow(currentView) {
//     return new ActionRowBuilder().addComponents(
//         new ButtonBuilder()
//             .setCustomId('mui_search_mode')
//             .setLabel('🔍 Search')
//             .setStyle(currentView === 'search' ? ButtonStyle.Primary : ButtonStyle.Secondary)
//             .setDisabled(currentView === 'search'),
//         new ButtonBuilder()
//             .setCustomId('mui_library')
//             .setLabel('📚 Library')
//             .setStyle(currentView === 'library' ? ButtonStyle.Primary : ButtonStyle.Secondary)
//             .setDisabled(currentView === 'library'),
//         new ButtonBuilder()
//             .setCustomId('mui_song')
//             .setLabel('🎵 Song')
//             .setStyle(currentView === 'song' ? ButtonStyle.Primary : ButtonStyle.Secondary)
//             .setDisabled(currentView === 'song')
//     );
// }

// module.exports = {
//     name: 'music_ui',

//     // --- 1. START (Defaults to Search) ---
//     async start(message) {
//         await this.showSearchMode(message);
//     },

//     // --- 2. VIEW: SEARCH MODE ---
//     async showSearchMode(interactionOrMessage) {
//         const embed = new EmbedBuilder()
//             .setColor('#FF5500')
//             .setTitle('🔍 Music Search')
//             .setDescription(
//                 `**Type your song name in the chat below.**\n` +
//                 `I will show a play button for your search.\n\n` +
//                 `**Search Bar:**\n` +
//                 `\` 🔍 | [ Waiting for input... ]                    \``
//             );

//         const navRow = getNavRow('search');

//         if (interactionOrMessage.update) {
//              await interactionOrMessage.update({ embeds: [embed], components: [navRow] });
//         } else {
//              await interactionOrMessage.reply({ embeds: [embed], components: [navRow] });
//         }

//         const client = interactionOrMessage.client; 
//         const userId = interactionOrMessage.user ? interactionOrMessage.user.id : interactionOrMessage.author.id;
//         const channel = interactionOrMessage.channel;

//         const filter = m => m.author.id === userId;
//         const collector = channel.createMessageCollector({ filter, max: 1, time: 60000 });

//         collector.on('collect', async m => {
//             try { await m.delete(); } catch(e) {} 
//             const query = m.content;
            
//             // --- DIRECT PLAY RESULT ---
//             // Instead of searching for a list, we present the query as a direct playable item
//             const resultEmbed = new EmbedBuilder()
//                 .setColor('#FF5500')
//                 .setTitle('🔍 Result')
//                 .setDescription(
//                     `**Ready to play:** \`${query}\`\n` +
//                     `Click below to start listening.`
//                 );

//             const safeQuery = query.substring(0, 80);
//             const playRow = new ActionRowBuilder().addComponents(
//                  new ButtonBuilder()
//                     .setCustomId(`mui_play_url_${safeQuery}`) 
//                     .setLabel(`▶️ Play "${safeQuery.substring(0, 25)}..."`)
//                     .setStyle(ButtonStyle.Success)
//             );

//             // We try to edit the last known UI message
//             try {
//                 if (interactionOrMessage.message) {
//                     await interactionOrMessage.message.edit({ embeds: [resultEmbed], components: [playRow, navRow] });
//                 } else if (interactionOrMessage.edit) {
//                     await interactionOrMessage.edit({ embeds: [resultEmbed], components: [playRow, navRow] });
//                 }
//             } catch(e) {
//                 // Fallback: send new message if edit fails
//                  await channel.send({ embeds: [resultEmbed], components: [playRow, navRow] });
//             }
//         });
//     },

//     // --- 3. VIEW: LIBRARY ---
//     async showLibrary(interaction) {
//         const data = loadLibrary();
//         const likedSongs = data.likedSongs;

//         const embed = new EmbedBuilder()
//             .setColor('#FF5500')
//             .setTitle('📚 Server Library')
//             .setDescription(`**Liked Songs Playlist**\n${likedSongs.length} songs saved.`);

//         const openRow = new ActionRowBuilder().addComponents(
//              new ButtonBuilder().setCustomId('mui_open_liked').setLabel('📂 Open Playlist').setStyle(ButtonStyle.Success)
//         );

//         const navRow = getNavRow('library');

//         await interaction.update({ embeds: [embed], components: [openRow, navRow] });
//     },

//     // --- 4. VIEW: OPENED PLAYLIST ---
//     async openLikedSongs(interaction) {
//         const data = loadLibrary();
//         const songs = data.likedSongs; 

//         const embed = new EmbedBuilder()
//             .setColor('#FF5500')
//             .setTitle('❤️ Liked Songs')
//             .setDescription(songs.length > 0 ? 'Pick a track:' : 'No songs yet!');

//         const songRows = buildSongRows(songs);
        
//         const customNavRow = new ActionRowBuilder().addComponents(
//             new ButtonBuilder().setCustomId('mui_search_mode').setLabel('🔍 Search').setStyle(ButtonStyle.Secondary),
//             new ButtonBuilder().setCustomId('mui_library').setLabel('⬅️ Back').setStyle(ButtonStyle.Secondary),
//             new ButtonBuilder().setCustomId('mui_song').setLabel('🎵 Song').setStyle(ButtonStyle.Secondary)
//         );

//         const allRows = [...songRows, customNavRow];
//         await interaction.update({ embeds: [embed], components: allRows });
//     },

//     // --- 5. VIEW: PLAYER ---
//     async showPlayer(interaction) {
//         const queue = interaction.client.distube.getQueue(interaction.guildId);
//         if (!queue || !queue.songs || queue.songs.length === 0) {
//              const embed = new EmbedBuilder().setColor('#808080').setTitle('🎵 No Music Playing').setDescription('Go to **Search** to play something!');
//              return interaction.update({ embeds: [embed], components: [getNavRow('song')] });
//         }
        
//         // Hijack logic: trigger update via event in index.js
//         try {
//             queue.nowPlayingMessage = await interaction.channel.messages.fetch(interaction.message.id);
//             interaction.client.distube.emit('playSong', queue, queue.songs[0]);
//         } catch (e) { console.error(e); }
        
//         await interaction.deferUpdate();
//     },

//     // --- MAIN HANDLER ---
//     async handleInteraction(client, interaction) {
//         if (!interaction.isButton()) return;
//         const id = interaction.customId;

//         // Navigation
//         if (id === 'mui_search_mode' || id === 'mui_back_to_search') await this.showSearchMode(interaction);
//         if (id === 'mui_library') await this.showLibrary(interaction);
//         if (id === 'mui_open_liked') await this.openLikedSongs(interaction);
//         if (id === 'mui_song') await this.showPlayer(interaction);

//         // Playing Logic
//         if (id.startsWith('mui_play_url_')) {
//             const url = id.replace('mui_play_url_', '');
//             await this.playSong(client, interaction, url);
//         }

//         // Liking Logic
//         if (id.startsWith('mui_like_url_')) {
//             const raw = id.replace('mui_like_url_', '');
//             const [url, name] = raw.split('::');
            
//             const data = loadLibrary();
//             const existingIndex = data.likedSongs.findIndex(s => s.url === url);

//             if (existingIndex === -1) {
//                 data.likedSongs.push({ name, url });
//                 saveLibrary(data);
//                 await interaction.reply({ content: `❤️ Added **${name}** to Liked Songs!`, ephemeral: true });
//             } else {
//                 data.likedSongs.splice(existingIndex, 1);
//                 saveLibrary(data);
//                 await interaction.reply({ content: `💔 Removed **${name}** from Liked Songs.`, ephemeral: true });
//             }
//         }
//     },

//     // --- PLAY HELPER ---
//     async playSong(client, interaction, songUrl) {
//         const channel = interaction.member.voice.channel;
//         if (!channel) return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });

//         await interaction.deferUpdate(); 
        
//         try {
//             // Simply play the URL/Query. DisTube handles the searching/resolving.
//             await client.distube.play(channel, songUrl, {
//                 member: interaction.member,
//                 textChannel: interaction.channel
//             });
            
//             const queue = client.distube.getQueue(interaction.guildId);
//             if (queue) {
//                 // Try to grab the message ID so index.js can edit it
//                 const uiMessage = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
//                 if (uiMessage) queue.nowPlayingMessage = uiMessage;
//             }
//         } catch (e) {
//             console.error(e);
//             await interaction.followUp({ content: '❌ Error playing song. Link or query may be invalid.', ephemeral: true });
//         }
//     }
// };