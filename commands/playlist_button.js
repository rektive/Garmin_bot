// commands/playlist_button.js
const fs = require('fs');
const path = require('path');
const { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

const PLAYLISTS_FILE = path.join(__dirname, '../playlists.json');
let playlists = {}; // { guildId: [ { id, name, songs: [{id, label, song}] } ] }

// Load playlists from JSON
try {
    if (fs.existsSync(PLAYLISTS_FILE)) {
        const raw = fs.readFileSync(PLAYLISTS_FILE, 'utf8');
        if (raw) playlists = JSON.parse(raw);
    }
} catch (err) {
    console.error('Failed to load playlists.json', err);
}

// Save playlists
function savePlaylists() {
    fs.writeFileSync(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
}

// Generate unique ID for new playlists
function generatePlaylistId(guildId) {
    const guildPlaylists = playlists[guildId] || [];
    if (guildPlaylists.length === 0) return 1;
    return Math.max(...guildPlaylists.map(p => p.id)) + 1;
}

// Generate unique ID for songs within a playlist
function generateSongId(playlist) {
    if (!playlist.songs || playlist.songs.length === 0) return 1;
    return Math.max(...playlist.songs.map(s => s.id)) + 1;
}

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = {
    name: 'playlist_button',

    // For compatibility with your other buttons
    createRow(PREFIX) {
        const btn = new ButtonBuilder()
            .setCustomId('playlist')
            .setLabel('📁 Playlist')
            .setStyle(ButtonStyle.Primary);

        return new ActionRowBuilder().addComponents(btn);
    },

    // alias used in some places
    createButton(PREFIX) {
        return this.createRow(PREFIX);
    },

    // When main Playlist button is clicked — show dynamic playlist buttons
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'playlist') return;

        const guildId = interaction.guild.id;
        const guildPlaylists = playlists[guildId] || [];

        // Build rows with dynamic playlist buttons
        const rows = [];
        
        // Add playlist buttons (max 5 per row)
        for (let i = 0; i < Math.min(guildPlaylists.length, 20); i += 5) {
            const row = new ActionRowBuilder();
            const chunk = guildPlaylists.slice(i, i + 5);
            
            for (const playlist of chunk) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`playlist_open_${playlist.id}`)
                        .setLabel(playlist.name)
                        .setStyle(ButtonStyle.Secondary)
                );
            }
            rows.push(row);
        }
        
        // Add control buttons (Create + Delete + Back)
        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('create_playlist_button')
                .setLabel('➕ Create Playlist')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('delete_playlist_button')
                .setLabel('🗑️ Delete Playlist')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('back_to_menu')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
        );
        rows.push(controlRow);

        const content = guildPlaylists.length > 0 
            ? '📁 Choose a playlist or create a new one:' 
            : '📁 No playlists yet. Click "➕ Create Playlist" to create your first playlist!';

        // Reply ephemeral so only the clicker sees it
        await interaction.reply({
            content: content,
            components: rows,
            ephemeral: true,
        });
    },

    // Show playlist contents
    async showPlaylistContents(interaction, playlistId) {
        const guildId = interaction.guild.id;
        const guildPlaylists = playlists[guildId] || [];
        const playlist = guildPlaylists.find(p => p.id === playlistId);

        if (!playlist) {
            await interaction.reply({
                content: '❌ Playlist not found.',
                ephemeral: true
            });
            return;
        }

        const songs = playlist.songs || [];
        const rows = [];

        // Add song buttons (max 5 per row, max 15 songs to leave room for controls)
        for (let i = 0; i < Math.min(songs.length, 15); i += 5) {
            const row = new ActionRowBuilder();
            const chunk = songs.slice(i, i + 5);
            
            for (const song of chunk) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`playlist_play_song_${playlistId}_${song.id}`)
                        .setLabel(song.label)
                        .setStyle(ButtonStyle.Secondary)
                );
            }
            rows.push(row);
        }

        // Add control buttons
        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`playlist_add_song_${playlistId}`)
                .setLabel('➕ Add Song')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`playlist_remove_song_${playlistId}`)
                .setLabel('➖ Remove Song')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId(`playlist_play_all_${playlistId}`)
                .setLabel('▶️ Play All')
                .setStyle(ButtonStyle.Primary)
        );
        rows.push(controlRow);

        const backRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('back_to_playlists')
                .setLabel('◀️ Back to Playlists')
                .setStyle(ButtonStyle.Secondary)
        );
        rows.push(backRow);

        const content = songs.length > 0 
            ? `📁 **${playlist.name}** (${songs.length} song${songs.length !== 1 ? 's' : ''})\nClick a song to play it, or use the buttons below:` 
            : `📁 **${playlist.name}**\nNo songs yet. Click "➕ Add Song" to add your first song!`;

        await interaction.update({
            content: content,
            components: rows,
            ephemeral: true
        });
    },

    // Handles all interactions
    async handleInteraction(client, interaction) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return false;

        const guildId = interaction.guild?.id;
        const id = interaction.customId;

        // Back to menu button
        if (interaction.isButton() && id === 'back_to_menu') {
            try {
                await interaction.update({ content: '✅ Returned to menu.', components: [], ephemeral: true });
            } catch (e) {
                try { 
                    await interaction.followUp({ content: '✅ Returned to menu.', ephemeral: true }); 
                } catch(_) {}
            }
            return true;
        }

        // Back to playlists button
        if (interaction.isButton() && id === 'back_to_playlists') {
            await this.execute(interaction);
            return true;
        }

        // Create Playlist button clicked
        if (interaction.isButton() && id === 'create_playlist_button') {
            const guildPlaylists = playlists[guildId] || [];
            
            if (guildPlaylists.length >= 20) {
                try {
                    await interaction.reply({
                        content: '❌ Maximum of 20 playlists reached for this server.',
                        ephemeral: true
                    });
                } catch (e) {
                    try {
                        await interaction.followUp({
                            content: '❌ Maximum of 20 playlists reached for this server.',
                            ephemeral: true
                        });
                    } catch(_) {}
                }
                return true;
            }

            const modal = new ModalBuilder()
                .setCustomId('create_playlist_modal')
                .setTitle('Create New Playlist');
            
            const nameInput = new TextInputBuilder()
                .setCustomId('playlist_name')
                .setLabel('Playlist Name')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Chill Vibes"')
                .setMaxLength(80)
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput)
            );
            
            await interaction.showModal(modal);
            return true;
        }

        // Delete Playlist button clicked
        if (interaction.isButton() && id === 'delete_playlist_button') {
            const guildPlaylists = playlists[guildId] || [];
            
            if (guildPlaylists.length === 0) {
                try {
                    await interaction.reply({
                        content: '❌ No playlists to delete. Create some playlists first!',
                        ephemeral: true
                    });
                } catch (e) {
                    try {
                        await interaction.followUp({
                            content: '❌ No playlists to delete. Create some playlists first!',
                            ephemeral: true
                        });
                    } catch(_) {}
                }
                return true;
            }

            const modal = new ModalBuilder()
                .setCustomId('delete_playlist_modal')
                .setTitle('Delete Playlist');
            
            const nameInput = new TextInputBuilder()
                .setCustomId('playlist_name_delete')
                .setLabel('Playlist Name to Delete')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Chill Vibes"')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput)
            );
            
            await interaction.showModal(modal);
            return true;
        }

        // Modal: Create playlist
        if (interaction.isModalSubmit() && id === 'create_playlist_modal') {
            const playlistName = interaction.fields.getTextInputValue('playlist_name');
            
            if (!playlists[guildId]) {
                playlists[guildId] = [];
            }
            
            const newPlaylist = {
                id: generatePlaylistId(guildId),
                name: playlistName,
                songs: []
            };
            
            playlists[guildId].push(newPlaylist);
            savePlaylists();
            
            await interaction.reply({
                content: `✅ Created playlist: **${playlistName}**\n\nClick the Playlist button again to see it!`,
                ephemeral: true
            });
            return true;
        }

        // Modal: Delete playlist
        if (interaction.isModalSubmit() && id === 'delete_playlist_modal') {
            const playlistName = interaction.fields.getTextInputValue('playlist_name_delete').trim();
            
            if (!playlists[guildId] || playlists[guildId].length === 0) {
                await interaction.reply({
                    content: '❌ No playlists to delete.',
                    ephemeral: true
                });
                return true;
            }
            
            const playlistIndex = playlists[guildId].findIndex(
                p => p.name.toLowerCase() === playlistName.toLowerCase()
            );
            
            if (playlistIndex === -1) {
                await interaction.reply({
                    content: `❌ Playlist "${playlistName}" not found.\n\nAvailable playlists:\n${playlists[guildId].map(p => `• ${p.name}`).join('\n')}`,
                    ephemeral: true
                });
                return true;
            }
            
            const deletedPlaylist = playlists[guildId][playlistIndex];
            playlists[guildId].splice(playlistIndex, 1);
            savePlaylists();
            
            await interaction.reply({
                content: `✅ Deleted playlist: **${deletedPlaylist.name}**\n\nClick the Playlist button again to see the updated list!`,
                ephemeral: true
            });
            return true;
        }

        // Open playlist
        if (interaction.isButton() && id.startsWith('playlist_open_')) {
            const playlistId = parseInt(id.replace('playlist_open_', ''));
            await this.showPlaylistContents(interaction, playlistId);
            return true;
        }

        // Add song to playlist
        if (interaction.isButton() && id.startsWith('playlist_add_song_')) {
            const playlistId = parseInt(id.replace('playlist_add_song_', ''));
            const guildPlaylists = playlists[guildId] || [];
            const playlist = guildPlaylists.find(p => p.id === playlistId);

            if (!playlist) {
                await interaction.reply({
                    content: '❌ Playlist not found.',
                    ephemeral: true
                });
                return true;
            }

            if (playlist.songs && playlist.songs.length >= 15) {
                await interaction.reply({
                    content: '❌ Maximum of 15 songs per playlist reached.',
                    ephemeral: true
                });
                return true;
            }

            const modal = new ModalBuilder()
                .setCustomId(`add_song_to_playlist_modal_${playlistId}`)
                .setTitle(`Add Song to ${playlist.name}`);
            
            const labelInput = new TextInputBuilder()
                .setCustomId('song_label')
                .setLabel('Song Label (displayed on button)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Tokyo Drift"')
                .setMaxLength(80)
                .setRequired(true);
            
            const songInput = new TextInputBuilder()
                .setCustomId('song_query')
                .setLabel('Song Name or YouTube URL')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Tokyo Drift" or YouTube link')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(labelInput),
                new ActionRowBuilder().addComponents(songInput)
            );
            
            await interaction.showModal(modal);
            return true;
        }

        // Modal: Add song to playlist
        if (interaction.isModalSubmit() && id.startsWith('add_song_to_playlist_modal_')) {
            const playlistId = parseInt(id.replace('add_song_to_playlist_modal_', ''));
            const songLabel = interaction.fields.getTextInputValue('song_label');
            const songQuery = interaction.fields.getTextInputValue('song_query');
            
            const guildPlaylists = playlists[guildId] || [];
            const playlist = guildPlaylists.find(p => p.id === playlistId);

            if (!playlist) {
                await interaction.reply({
                    content: '❌ Playlist not found.',
                    ephemeral: true
                });
                return true;
            }

            if (!playlist.songs) playlist.songs = [];

            const newSong = {
                id: generateSongId(playlist),
                label: songLabel,
                song: songQuery
            };

            playlist.songs.push(newSong);
            savePlaylists();

            await interaction.reply({
                content: `✅ Added song to **${playlist.name}**: **${songLabel}**\n\nOpen the playlist again to see it!`,
                ephemeral: true
            });
            return true;
        }

        // Remove song from playlist
        if (interaction.isButton() && id.startsWith('playlist_remove_song_')) {
            const playlistId = parseInt(id.replace('playlist_remove_song_', ''));
            const guildPlaylists = playlists[guildId] || [];
            const playlist = guildPlaylists.find(p => p.id === playlistId);

            if (!playlist) {
                await interaction.reply({
                    content: '❌ Playlist not found.',
                    ephemeral: true
                });
                return true;
            }

            if (!playlist.songs || playlist.songs.length === 0) {
                await interaction.reply({
                    content: '❌ No songs to remove from this playlist.',
                    ephemeral: true
                });
                return true;
            }

            const modal = new ModalBuilder()
                .setCustomId(`remove_song_from_playlist_modal_${playlistId}`)
                .setTitle(`Remove Song from ${playlist.name}`);
            
            const labelInput = new TextInputBuilder()
                .setCustomId('song_label_remove')
                .setLabel('Song Label to Remove')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Tokyo Drift"')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(labelInput)
            );
            
            await interaction.showModal(modal);
            return true;
        }

        // Modal: Remove song from playlist
        if (interaction.isModalSubmit() && id.startsWith('remove_song_from_playlist_modal_')) {
            const playlistId = parseInt(id.replace('remove_song_from_playlist_modal_', ''));
            const songLabel = interaction.fields.getTextInputValue('song_label_remove').trim();
            
            const guildPlaylists = playlists[guildId] || [];
            const playlist = guildPlaylists.find(p => p.id === playlistId);

            if (!playlist || !playlist.songs || playlist.songs.length === 0) {
                await interaction.reply({
                    content: '❌ No songs to remove.',
                    ephemeral: true
                });
                return true;
            }

            const songIndex = playlist.songs.findIndex(
                s => s.label.toLowerCase() === songLabel.toLowerCase()
            );

            if (songIndex === -1) {
                await interaction.reply({
                    content: `❌ Song "${songLabel}" not found in this playlist.\n\nAvailable songs:\n${playlist.songs.map(s => `• ${s.label}`).join('\n')}`,
                    ephemeral: true
                });
                return true;
            }

            const removedSong = playlist.songs[songIndex];
            playlist.songs.splice(songIndex, 1);
            savePlaylists();

            await interaction.reply({
                content: `✅ Removed song from **${playlist.name}**: **${removedSong.label}**\n\nOpen the playlist again to see the updated list!`,
                ephemeral: true
            });
            return true;
        }

        // Play all songs in playlist (shuffle mode)
        if (interaction.isButton() && id.startsWith('playlist_play_all_')) {
            const playlistId = parseInt(id.replace('playlist_play_all_', ''));
            const guildPlaylists = playlists[guildId] || [];
            const playlist = guildPlaylists.find(p => p.id === playlistId);

            if (!playlist) {
                await interaction.reply({
                    content: '❌ Playlist not found.',
                    ephemeral: true
                });
                return true;
            }

            if (!playlist.songs || playlist.songs.length === 0) {
                await interaction.reply({
                    content: '❌ This playlist is empty. Add some songs first!',
                    ephemeral: true
                });
                return true;
            }

            if (!interaction.member.voice.channel) {
                await interaction.reply({
                    content: '❌ You need to be in a voice channel to play music!',
                    ephemeral: true
                });
                return true;
            }

            try {
                await interaction.deferReply({ ephemeral: true });

                const distube = interaction.client.distube;
                const voiceChannel = interaction.member.voice.channel;
                
                // Shuffle the songs
                const shuffledSongs = shuffleArray(playlist.songs);

                // Play first song
                await distube.play(voiceChannel, shuffledSongs[0].song, {
                    member: interaction.member,
                    textChannel: interaction.channel
                });

                // Add remaining songs to queue
                for (let i = 1; i < shuffledSongs.length; i++) {
                    await distube.play(voiceChannel, shuffledSongs[i].song, {
                        member: interaction.member,
                        textChannel: interaction.channel
                    });
                }

                await interaction.editReply({
                    content: `🔀 Playing **${playlist.name}** in shuffle mode (${shuffledSongs.length} songs)!`
                });
            } catch (err) {
                console.error('Playlist play error:', err);
                await interaction.editReply({
                    content: '⚠️ Failed to play the playlist. Please try again.'
                });
            }
            return true;
        }

        // Play individual song from playlist
        if (interaction.isButton() && id.startsWith('playlist_play_song_')) {
            const parts = id.replace('playlist_play_song_', '').split('_');
            const playlistId = parseInt(parts[0]);
            const songId = parseInt(parts[1]);

            const guildPlaylists = playlists[guildId] || [];
            const playlist = guildPlaylists.find(p => p.id === playlistId);

            if (!playlist) {
                await interaction.reply({
                    content: '❌ Playlist not found.',
                    ephemeral: true
                });
                return true;
            }

            const song = playlist.songs.find(s => s.id === songId);

            if (!song) {
                await interaction.reply({
                    content: '❌ Song not found.',
                    ephemeral: true
                });
                return true;
            }

            if (!interaction.member.voice.channel) {
                await interaction.reply({
                    content: '❌ You need to be in a voice channel to play music!',
                    ephemeral: true
                });
                return true;
            }

            try {
                await interaction.deferReply({ ephemeral: true });

                const distube = interaction.client.distube;
                const voiceChannel = interaction.member.voice.channel;
                
                await distube.play(voiceChannel, song.song, {
                    member: interaction.member,
                    textChannel: interaction.channel
                });

                await interaction.followUp({
                    content: `✅ Playing: **${song.label}** from **${playlist.name}**`,
                    ephemeral: true
                });
            } catch (err) {
                console.error('Song play error:', err);
                await interaction.editReply({
                    content: '⚠️ Failed to play the song. Please try again.'
                });
            }
            return true;
        }

        return false;
    },
};