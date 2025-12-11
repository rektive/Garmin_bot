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
        new ButtonBuilder().setCustomId('mui_home').setLabel('🏠 Home').setStyle(currentView === 'home' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(currentView === 'home'),
        new ButtonBuilder().setCustomId('mui_search_mode').setLabel('🔍 Search').setStyle(currentView === 'search' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(currentView === 'search'),
        new ButtonBuilder().setCustomId('mui_library').setLabel('📚 Library').setStyle(currentView === 'library' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(currentView === 'library'),
        new ButtonBuilder().setCustomId('mui_song').setLabel('🎵 Song').setStyle(currentView === 'song' ? ButtonStyle.Primary : ButtonStyle.Secondary).setDisabled(currentView === 'song')
    );
}

module.exports = {
    name: 'music_ui',

    async start(message) {
        await this.showHome(message);
    },

    // --- VIEW: HOME ---
    async showHome(interactionOrMessage, isEdit = false) {
        const embed = new EmbedBuilder()
            .setColor('#FF5500') 
            .setTitle('🏠 Home - Discover')
            .setDescription('**Good afternoon.**\nHere are some recommended playlists.')
            .setThumbnail('https://i.imgur.com/7v5930n.png'); 

        const songRows = buildSongRows(RECOMMENDATIONS);
        const navRow = getNavRow('home');
        const allRows = [...songRows, navRow];

        const payload = { content: '', embeds: [embed], components: allRows };
        
        if (isEdit) await interactionOrMessage.update(payload);
        else await interactionOrMessage.reply(payload);
    },

    // --- VIEW: SEARCH MODE ---
    async showSearchMode(interaction) {
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

        await interaction.update({ embeds: [embed], components: [navRow] });

        const client = interaction.client; 
        const filter = m => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

        collector.on('collect', async m => {
            try { await m.delete(); } catch(e) {} 
            const query = m.content;
            
            const searchingEmbed = new EmbedBuilder(embed.toJSON())
                .setDescription(
                    `**Searching for:** \`${query}\`\n\n` +
                    `**Search Bar:**\n` +
                    `\` 🔍 | ${query}                                  \``
                );
            await interaction.message.edit({ embeds: [searchingEmbed], components: [navRow] });

            await this.performSearch(client, interaction, query);
        });
    },

    // --- EXECUTE SEARCH ---
    async performSearch(client, interaction, query) {
        const distube = client.distube;
        
        try {
            const results = await distube.search(query, { limit: 4, safeSearch: false });
            
            if (!results || results.length === 0) throw new Error("No results");

            const embed = new EmbedBuilder()
                .setColor('#FF5500')
                .setTitle(`🔍 Results for "${query}"`)
                .setDescription('Select a song to Play or Like.');

            const songRows = buildSongRows(results);
            const navRow = getNavRow('search');
            const allRows = [...songRows, navRow];

            await interaction.message.edit({ embeds: [embed], components: allRows });

        } catch (e) {
            console.error("Search Error:", e);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ No Direct Results')
                .setDescription(
                    `DisTube couldn't find a list for: \`${query}\`\n` +
                    `However, you can force the bot to try playing it directly.`
                );
            
            const safeQuery = query.substring(0, 80);
            
            const forceRow = new ActionRowBuilder().addComponents(
                 new ButtonBuilder()
                    .setCustomId(`mui_play_url_${safeQuery}`) 
                    .setLabel(`▶️ Force Play "${safeQuery.substring(0, 20)}..."`)
                    .setStyle(ButtonStyle.Success)
            );

            await interaction.message.edit({ embeds: [errorEmbed], components: [forceRow, getNavRow('search')] });
        }
    },

    // --- VIEW: LIBRARY ---
    async showLibrary(interaction) {
        const data = loadLibrary();
        const likedSongs = data.likedSongs;

        const embed = new EmbedBuilder()
            .setColor('#FF5500')
            .setTitle('📚 Server Library')
            .setDescription(`**Liked Songs**\n${likedSongs.length} songs saved.`);

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
            .setDescription('Top 4 saved songs:');

        const songRows = buildSongRows(songs);
        const navRow = getNavRow('library');
        navRow.components[2].setStyle(ButtonStyle.Primary);
        
        const allRows = [...songRows, navRow];

        await interaction.update({ embeds: [embed], components: allRows });
    },

    // --- VIEW: PLAYER ---
    async showPlayer(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        
        if (!queue || !queue.songs || queue.songs.length === 0) {
             const embed = new EmbedBuilder().setColor('#808080').setTitle('🎵 No Music Playing').setDescription('Go to **Home** or **Search** to play something!');
             return interaction.update({ embeds: [embed], components: [getNavRow('song')] });
        }
        
        queue.nowPlayingMessage = await interaction.channel.messages.fetch(interaction.message.id);
        interaction.client.distube.emit('playSong', queue, queue.songs[0]);
        await interaction.deferUpdate();
    },

    // --- MAIN HANDLER ---
    async handleInteraction(client, interaction) {
        if (!interaction.isButton()) return;
        const id = interaction.customId;

        if (id === 'mui_home') await this.showHome(interaction, true);
        
        // --- UPDATED THIS LINE: Handles BOTH Search and Back Button ---
        if (id === 'mui_search_mode' || id === 'mui_back_to_search') await this.showSearchMode(interaction);
        // -------------------------------------------------------------

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
            if (!data.likedSongs.find(s => s.url === url)) {
                data.likedSongs.push({ name, url });
                saveLibrary(data);
                await interaction.reply({ content: `❤️ Added **${name}**!`, ephemeral: true });
            } else {
                await interaction.reply({ content: `⚠️ **${name}** is already saved.`, ephemeral: true });
            }
        }
    },

    // --- PLAY HELPER ---
    async playSong(client, interaction, songUrl) {
        const channel = interaction.member.voice.channel;
        if (!channel) return interaction.reply({ content: '❌ Join a voice channel first!', ephemeral: true });

        await interaction.deferUpdate(); 
        
        try {
            await client.distube.play(channel, songUrl, {
                member: interaction.member,
                textChannel: interaction.channel
            });
            const queue = client.distube.getQueue(interaction.guildId);
            if (queue) {
                const uiMessage = await interaction.channel.messages.fetch(interaction.message.id);
                queue.nowPlayingMessage = uiMessage;
            }
        } catch (e) {
            console.error(e);
            await interaction.followUp({ content: '❌ Error playing song.', ephemeral: true });
        }
    }
};