// // commands/music_button.js
// const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const playCommand = require('./play'); // uses your existing play.js

// module.exports = {
//   name: 'music_button',

//   // For compatibility with your other buttons which use createRow/createButton
//   createRow(PREFIX) {
//     const btn = new ButtonBuilder()
//       .setCustomId('music')
//       .setLabel('🎵 Music')
//       .setStyle(ButtonStyle.Primary);

//     return new ActionRowBuilder().addComponents(btn);
//   },

//   // alias used in some places in your index.js
//   createButton(PREFIX) {
//     return this.createRow(PREFIX);
//   },

//   // When main Music button is clicked — show a small ephemeral panel with song-buttons
//   async execute(interaction) {
//     if (!interaction.isButton()) return;
//     if (interaction.customId !== 'music') return;

//     // Build song buttons (customize/add as you want)
//     const row = new ActionRowBuilder().addComponents(
//       new ButtonBuilder()
//         .setCustomId('music_song_Tokyo%20Drift')
//         .setLabel('Tokyo Drift')
//         .setStyle(ButtonStyle.Secondary),
//       new ButtonBuilder()
//         .setCustomId('music_song_Never%20Gonna%20Give%20You%20Up')
//         .setLabel('Never Gonna Give You Up')
//         .setStyle(ButtonStyle.Secondary),
//       new ButtonBuilder()
//         .setCustomId('music_song_Погоня')
//         .setLabel('Погоня')
//         .setStyle(ButtonStyle.Secondary),
//       new ButtonBuilder()
//         .setCustomId('music_song_Erika%20(German%20Folk%20Song)')
//         .setLabel('Erika')
//         .setStyle(ButtonStyle.Secondary),
//       new ButtonBuilder()
//         .setCustomId('back_to_menu')
//         .setLabel('Back')
//         .setStyle(ButtonStyle.Danger)
//     );

//     // Reply ephemeral so only the clicker sees it
//     await interaction.reply({
//       content: '🎵 Choose a track to play:',
//       components: [row],
//       ephemeral: true,
//     });
//   },

//   // Handles clicks on the per-song buttons (Tokyo / Never ...)
//   // Returns true if handled, false otherwise.
//   async handleSongButtons(interaction) {
//     if (!interaction.isButton()) return false;

//     const id = interaction.customId;

//     // Back to menu button
//     if (id === 'back_to_menu') {
//       try {
//         await interaction.update({ content: '✅ Returned to menu.', components: [], ephemeral: true });
//       } catch (e) {
//         try { 
//           await interaction.followUp({ content: '✅ Returned to menu.', ephemeral: true }); 
//         } catch(_) {}
//       }
//       return true;
//     }

//     // Song button ids start with 'music_song_'
//     if (!id.startsWith('music_song_')) return false;

//     // Check if user is in a voice channel
//     if (!interaction.member.voice.channel) {
//       try {
//         await interaction.reply({ 
//           content: '❌ You need to be in a voice channel to use this!', 
//           ephemeral: true 
//         });
//       } catch (e) {
//         try {
//           await interaction.followUp({ 
//             content: '❌ You need to be in a voice channel to use this!', 
//             ephemeral: true 
//           });
//         } catch(_) {}
//       }
//       return true;
//     }

//     // decode the song name from the id
//     const songName = decodeURIComponent(id.replace('music_song_', ''));

//     // Acknowledge immediately
//     try {
//       await interaction.deferReply({ ephemeral: true });
//     } catch (e) {
//       // already deferred or replied
//     }

//     // Build a message-like object for playCommand
//     const fakeMessage = {
//       member: interaction.member,
//       guild: interaction.guild,
//       channel: interaction.channel,
//       client: interaction.client,
//       author: interaction.user,
//       reply: async (content) => {
//         // Send to channel for visibility
//         try {
//           return await interaction.channel.send(
//             typeof content === 'string' ? content : content.content || content
//           );
//         } catch (err) {
//           console.error('Failed to send to channel:', err);
//           try {
//             return await interaction.followUp({ 
//               content: typeof content === 'string' ? content : content.content || content, 
//               ephemeral: true 
//             });
//           } catch(_) {}
//         }
//       },
//     };

//     // Call DisTube directly instead of going through playCommand
//     try {
//       const distube = interaction.client.distube;
//       const voiceChannel = interaction.member.voice.channel;
      
//       await distube.play(voiceChannel, songName, {
//         member: interaction.member,
//         textChannel: interaction.channel
//       });
      
//       // Confirm to user
//       try {
//         await interaction.followUp({ 
//           content: `✅ Requested: **${songName}**`, 
//           ephemeral: true 
//         });
//       } catch (e) {
//         // ignore
//       }
//     } catch (err) {
//       console.error('music_button -> failed to play:', err);
//       try {
//         await interaction.followUp({ 
//           content: `⚠️ Failed to play: ${songName}. Try again!`, 
//           ephemeral: true 
//         });
//       } catch (e) {
//         // ignore
//       }
//     }

//     return true;
//   },
// };










// commands/music_button.js
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

const MUSIC_BUTTONS_FILE = path.join(__dirname, '../music_buttons.json');
let musicButtons = {}; // { guildId: [ { id, label, song } ] }

// Load music buttons from JSON
try {
    if (fs.existsSync(MUSIC_BUTTONS_FILE)) {
        const raw = fs.readFileSync(MUSIC_BUTTONS_FILE, 'utf8');
        if (raw) musicButtons = JSON.parse(raw);
    }
} catch (err) {
    console.error('Failed to load music_buttons.json', err);
}

// Save music buttons
function saveMusicButtons() {
    fs.writeFileSync(MUSIC_BUTTONS_FILE, JSON.stringify(musicButtons, null, 2));
}

// Generate unique ID for new buttons
function generateButtonId(guildId) {
    const buttons = musicButtons[guildId] || [];
    if (buttons.length === 0) return 1;
    return Math.max(...buttons.map(b => b.id)) + 1;
}

module.exports = {
    name: 'music_button',

    // For compatibility with your other buttons
    createRow(PREFIX) {
        const btn = new ButtonBuilder()
            .setCustomId('music')
            .setLabel('🎵 Music')
            .setStyle(ButtonStyle.Primary);

        return new ActionRowBuilder().addComponents(btn);
    },

    // alias used in some places
    createButton(PREFIX) {
        return this.createRow(PREFIX);
    },

    // When main Music button is clicked — show dynamic song buttons
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (interaction.customId !== 'music') return;

        const guildId = interaction.guild.id;
        const buttons = musicButtons[guildId] || [];

        // Build rows with dynamic song buttons
        const rows = [];
        
        // Add song buttons (max 5 per row)
        for (let i = 0; i < Math.min(buttons.length, 20); i += 5) {
            const row = new ActionRowBuilder();
            const chunk = buttons.slice(i, i + 5);
            
            for (const btn of chunk) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`music_song_${btn.id}`)
                        .setLabel(btn.label)
                        .setStyle(ButtonStyle.Secondary)
                );
            }
            rows.push(row);
        }
        
        // Add control buttons (Add Song + Delete Song + Back) in last row
        const controlRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('add_song_button')
                .setLabel('➕ Add Song')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('delete_song_button')
                .setLabel('🗑️ Delete Song')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('back_to_menu')
                .setLabel('Back')
                .setStyle(ButtonStyle.Secondary)
        );
        rows.push(controlRow);

        const content = buttons.length > 0 
            ? '🎵 Choose a track to play or add a new one:' 
            : '🎵 No songs added yet. Click "➕ Add Song" to add your first song!';

        // Reply ephemeral so only the clicker sees it
        await interaction.reply({
            content: content,
            components: rows,
            ephemeral: true,
        });
    },

    // Handles clicks on song buttons, add button, modals
    async handleSongButtons(interaction) {
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

        // Add Song button clicked - show modal
        if (interaction.isButton() && id === 'add_song_button') {
            const buttons = musicButtons[guildId] || [];
            
            // Check limit (20 song buttons + 1 row for controls = 5 rows max)
            if (buttons.length >= 20) {
                try {
                    await interaction.reply({
                        content: '❌ Maximum of 20 song buttons reached for this server.',
                        ephemeral: true
                    });
                } catch (e) {
                    try {
                        await interaction.followUp({
                            content: '❌ Maximum of 20 song buttons reached for this server.',
                            ephemeral: true
                        });
                    } catch(_) {}
                }
                return true;
            }

            const modal = new ModalBuilder()
                .setCustomId('add_song_modal')
                .setTitle('Add New Song Button');
            
            const labelInput = new TextInputBuilder()
                .setCustomId('button_label')
                .setLabel('Button Label (displayed on button)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Tokyo Drift"')
                .setMaxLength(80)
                .setRequired(true);
            
            const songInput = new TextInputBuilder()
                .setCustomId('song_query')
                .setLabel('Song Name or SoundCloud URL')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Tokyo Drift" or Youtube link')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(labelInput),
                new ActionRowBuilder().addComponents(songInput)
            );
            
            await interaction.showModal(modal);
            return true;
        }

        // Delete Song button clicked - show modal
        if (interaction.isButton() && id === 'delete_song_button') {
            const buttons = musicButtons[guildId] || [];
            
            if (buttons.length === 0) {
                try {
                    await interaction.reply({
                        content: '❌ No songs to delete. Add some songs first!',
                        ephemeral: true
                    });
                } catch (e) {
                    try {
                        await interaction.followUp({
                            content: '❌ No songs to delete. Add some songs first!',
                            ephemeral: true
                        });
                    } catch(_) {}
                }
                return true;
            }

            const modal = new ModalBuilder()
                .setCustomId('delete_song_modal')
                .setTitle('Delete Song Button');
            
            const labelInput = new TextInputBuilder()
                .setCustomId('button_label_delete')
                .setLabel('Button Label to Delete')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., "Tokyo Drift"')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(labelInput)
            );
            
            await interaction.showModal(modal);
            return true;
        }

        // Modal submitted - save new song button
        if (interaction.isModalSubmit() && id === 'add_song_modal') {
            const buttonLabel = interaction.fields.getTextInputValue('button_label');
            const songQuery = interaction.fields.getTextInputValue('song_query');
            
            // Initialize guild's music buttons if needed
            if (!musicButtons[guildId]) {
                musicButtons[guildId] = [];
            }
            
            // Create new button entry
            const newButton = {
                id: generateButtonId(guildId),
                label: buttonLabel,
                song: songQuery
            };
            
            musicButtons[guildId].push(newButton);
            saveMusicButtons();
            
            await interaction.reply({
                content: `✅ Added song button: **${buttonLabel}**\nSong: ${songQuery}\n\nClick the Music button again to see it!`,
                ephemeral: true
            });
            return true;
        }

        // Modal submitted - delete song button
        if (interaction.isModalSubmit() && id === 'delete_song_modal') {
            const buttonLabel = interaction.fields.getTextInputValue('button_label_delete').trim();
            
            if (!musicButtons[guildId] || musicButtons[guildId].length === 0) {
                await interaction.reply({
                    content: '❌ No songs to delete.',
                    ephemeral: true
                });
                return true;
            }
            
            // Find button by label (case-insensitive)
            const buttonIndex = musicButtons[guildId].findIndex(
                b => b.label.toLowerCase() === buttonLabel.toLowerCase()
            );
            
            if (buttonIndex === -1) {
                await interaction.reply({
                    content: `❌ Song button "${buttonLabel}" not found.\n\nAvailable buttons:\n${musicButtons[guildId].map(b => `• ${b.label}`).join('\n')}`,
                    ephemeral: true
                });
                return true;
            }
            
            // Delete the button
            const deletedButton = musicButtons[guildId][buttonIndex];
            musicButtons[guildId].splice(buttonIndex, 1);
            saveMusicButtons();
            
            await interaction.reply({
                content: `✅ Deleted song button: **${deletedButton.label}**\n\nClick the Music button again to see the updated list!`,
                ephemeral: true
            });
            return true;
        }

        // Song button clicked - play the song
        if (interaction.isButton() && id.startsWith('music_song_')) {
            // Check if user is in a voice channel
            if (!interaction.member.voice.channel) {
                try {
                    await interaction.reply({ 
                        content: '❌ You need to be in a voice channel to use this!', 
                        ephemeral: true 
                    });
                } catch (e) {
                    try {
                        await interaction.followUp({ 
                            content: '❌ You need to be in a voice channel to use this!', 
                            ephemeral: true 
                        });
                    } catch(_) {}
                }
                return true;
            }

            // Get the button ID
            const buttonId = parseInt(id.replace('music_song_', ''));
            const buttons = musicButtons[guildId] || [];
            const songButton = buttons.find(b => b.id === buttonId);
            
            if (!songButton) {
                try {
                    await interaction.reply({
                        content: '❌ Song button not found.',
                        ephemeral: true
                    });
                } catch (e) {
                    try {
                        await interaction.followUp({
                            content: '❌ Song button not found.',
                            ephemeral: true
                        });
                    } catch(_) {}
                }
                return true;
            }

            // Acknowledge immediately
            try {
                await interaction.deferReply({ ephemeral: true });
            } catch (e) {
                // already deferred or replied
            }

            // Call DisTube to play the song
            try {
                const distube = interaction.client.distube;
                const voiceChannel = interaction.member.voice.channel;
                
                await distube.play(voiceChannel, songButton.song, {
                    member: interaction.member,
                    textChannel: interaction.channel
                });
                
                // Confirm to user
                try {
                    await interaction.followUp({ 
                        content: `✅ Requested: **${songButton.label}**`, 
                        ephemeral: true 
                    });
                } catch (e) {
                    // ignore
                }
            } catch (err) {
                console.error('music_button -> failed to play:', err);
                try {
                    await interaction.followUp({ 
                        content: `⚠️ Failed to play: ${songButton.label}. Try again!`, 
                        ephemeral: true 
                    });
                } catch (e) {
                    // ignore
                }
            }

            return true;
        }

        return false;
    },
};