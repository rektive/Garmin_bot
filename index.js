 // index.js
require('dotenv').config();
//const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const fs = require('fs');
const path = require('path');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');

const health = require('./commands/health.js');
const healthButton = require('./commands/health_button.js');
const levelSystem = require('./commands/level_system.js');
const moreButton = require('./commands/more_button.js');
const profileButton = require('./commands/profile_button.js');
const playlistButton = require('./commands/playlist_button');
const autoRoleSetup = require('./commands/auto_role_setup.js');
const musicButton = require('./commands/music_button.js');
const playCommand = require('./commands/play');
const logg = require('./commands/logger');
const voiceCommand = require('./commands/voice');
const unproc = require('./commands/remove.js');
const proc = require('./commands/proceed.js');  
const karma = require('./commands/karma.js');
const rateLimiter = require('./commands/rate_limiter');
const scheduleButton = require('./commands/schedule_button');
const descriptionButton = require('./commands/description_button');
const rouletteButton = require('./commands/roulette_button');
const uniCombiner = require('./commands/uni_combiner');
const sys_shut = require('./commands/sys_shutdown.js');
const emerg = require('./commands/emerg_shut');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});
//////////////////////////////////////////////////////////////////////////////////////////
/// Initialize DisTube


client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [
    new SpotifyPlugin({
      api: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      },
    }),
    new SoundCloudPlugin()
  ],
});

// // DisTube Events
// client.distube
//   .on('playSong', (queue, song) => {
//     queue.textChannel.send(`🎵 Now playing: **${song.name}** - \`${song.formattedDuration}\``);
//   })
//   .on('addSong', (queue, song) => {
//     queue.textChannel.send(`✅ Added to queue: **${song.name}** - \`${song.formattedDuration}\``);
//   })
//   .on('addList', (queue, playlist) => {
//     queue.textChannel.send(`✅ Added playlist: **${playlist.name}** (${playlist.songs.length} songs)`);
//   })
//   .on('error', (queue, error) => {
//     console.error('DisTube error:', error);
//     if (queue && queue.textChannel) {
//       queue.textChannel.send('⚠️ An error occurred while playing music.');
//     }
//   })
//   .on('finish', (queue) => {
//     queue.textChannel.send('⏏️ Queue finished. Leaving voice channel...');
    
//     // Leave the voice channel after queue finishes
//     setTimeout(() => {
//       try {
//         const voiceConnection = client.distube.voices.get(queue);
//         if (voiceConnection) {
//           voiceConnection.leave();
//         }
//       } catch (err) {
//         console.error('Error leaving voice channel:', err);
//       }
//     }, 1000);
//   })
//   .on('disconnect', (queue) => {
//     queue.textChannel.send('👋 Disconnected from voice channel.');
//   })
//   .on('empty', (queue) => {
//     queue.textChannel.send('⏏️ Voice channel is empty. Leaving...');
//   });

// // DisTube Events
// client.distube
//   .on('playSong', async (queue, song) => {
//     // Define the buttons for the control panel
//     // Define the buttons for the control panel
//     const row1 = new ActionRowBuilder()
//       .addComponents(
//         new ButtonBuilder()
//           .setCustomId('distube_pause_resume')
//           .setLabel('⏸️ Pause / ▶️ Resume')
//           .setStyle(ButtonStyle.Secondary),
//         new ButtonBuilder()
//           .setCustomId('distube_skip')
//           .setLabel('⏭️ Skip')
//           .setStyle(ButtonStyle.Primary),
//         new ButtonBuilder()
//           .setCustomId('distube_stop')
//           .setLabel('⏹️ Stop')
//           .setStyle(ButtonStyle.Danger)
//       );

//     const row2 = new ActionRowBuilder()
//         .addComponents(
//             new ButtonBuilder() // <-- This was the line I fixed
//                 .setCustomId('distube_queue')
//                 .setLabel('Show Queue')
//                 .setStyle(ButtonStyle.Secondary),
//             new ButtonBuilder() // <-- This is the line I fixed
//                 .setCustomId('distube_filters') // <-- THE NEW BUTTON
//                 .setLabel('🎧 Filters')
//                 .setStyle(ButtonStyle.Secondary)
//         );

//     // Create the "Now Playing" Embed
//     const embed = new EmbedBuilder()
//       .setColor('#0099ff')
//       .setTitle(`🎵 Now Playing`)
//       .setDescription(`[${song.name}](${song.url})`)
//       .setThumbnail(song.thumbnail)
//       .addFields(
//         { name: 'Duration', value: `\`${song.formattedDuration}\``, inline: true },
//         { name: 'Requested by', value: `${song.user}`, inline: true }
//       )
//       .setTimestamp();

//     // Check if there's an old "Now Playing" message to edit
//     try {
//       if (queue.nowPlayingMessage) {
//         // Edit the old message with new song info
//         await queue.nowPlayingMessage.edit({ embeds: [embed], components: [row1, row2] });
//       } else {
//         // Send a new message
//         const msg = await queue.textChannel.send({ embeds: [embed], components: [row1, row2] });
//         queue.nowPlayingMessage = msg; // Store the message to edit it next time
//       }
//     } catch (error) {
//       console.error('Error updating Now Playing message:', error);
//    }
//   })
//   .on('addSong', (queue, song) => {
//     // Send a clean, small embed for addSong
//     const embed = new EmbedBuilder()
//       .setColor('#00FF00') // Green
//       .setDescription(`✅ Added to queue: [${song.name}](${song.url}) - \`${song.formattedDuration}\``)
//       .setAuthor({ name: song.user.tag, iconURL: song.user.displayAvatarURL() });
      
//     queue.textChannel.send({ embeds: [embed], components: [] })
//         .then(msg => {
//             // Delete this "Added to queue" message after 10 seconds to keep chat clean
//             setTimeout(() => msg.delete().catch(console.error), 10000);
//         });
//   })
//   .on('addList', (queue, playlist) => {
//     // Send a clean embed for addList
//     const embed = new EmbedBuilder()
//       .setColor('#00FF00') // Green
//       .setDescription(`✅ Added playlist: **${playlist.name}** (${playlist.songs.length} songs)`)
//       .setAuthor({ name: playlist.user.tag, iconURL: playlist.user.displayAvatarURL() });
      
//     queue.textChannel.send({ embeds: [embed], components: [] })
//         .then(msg => {
//             // Delete this "Added playlist" message after 10 seconds
//             setTimeout(() => msg.delete().catch(console.error), 10000);
//         });
//   })
//   .on('error', (queue, error) => {
//     console.error('DisTube error:', error);
//     if (queue && queue.textChannel) {
//       queue.textChannel.send('⚠️ An error occurred while playing music.');
//     }
//   })
//   .on('finish', (queue) => {
//     // When the queue is finished, edit the "Now Playing" message to show it's done
//     try {
//       if (queue.nowPlayingMessage) {
//         const embed = new EmbedBuilder()
//           .setColor('#AAAAAA')
//           .setDescription('⏏️ Queue finished. Leaving voice channel...');
          
//         queue.nowPlayingMessage.edit({ embeds: [embed], components: [] }); // Remove buttons
//         queue.nowPlayingMessage = null; // Clear the stored message
//       } else {
//         queue.textChannel.send('⏏️ Queue finished. Leaving voice channel...');
//       }
//     } catch (error) {
//       console.error('Error editing message on finish:', error);
//     }
    
//     // Your original leave logic
//     setTimeout(() => {
//       try {
//         const voiceConnection = client.distube.voices.get(queue);
//         if (voiceConnection) {
//           voiceConnection.leave();
//         }
//       } catch (err) {
//         console.error('Error leaving voice channel:', err);
//       }
//     }, 1000);
//   })
//   .on('disconnect', (queue) => {
//     // Also clean up the message on disconnect
//      try {
//        if (queue.nowPlayingMessage) {
//         queue.nowPlayingMessage.delete().catch(console.error);
//         queue.nowPlayingMessage = null;
//       }
//     } catch (error) {
//        console.error('Error deleting message on disconnect:', error);
//     }
//     queue.textChannel.send('👋 Disconnected from voice channel.');
//   })
//   .on('empty', (queue) => {
//     // And clean up on empty
//      try {
//        if (queue.nowPlayingMessage) {
//         queue.nowPlayingMessage.delete().catch(console.error);
//         queue.nowPlayingMessage = null;
//       }
//     } catch (error) {
//        console.error('Error deleting message on empty:', error);
//     }
//     queue.textChannel.send('⏏️ Voice channel is empty. Leaving...');
//   });

// DisTube Events
client.distube
  .on('playSong', async (queue, song) => {
    // Define the buttons for the control panel
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('distube_pause_resume')
          .setLabel('⏸️ Pause / ▶️ Resume')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('distube_skip')
          .setLabel('⏭️ Skip')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('distube_stop')
          .setLabel('⏹️ Stop')
          .setStyle(ButtonStyle.Danger)
      );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('distube_queue')
                .setLabel('Show Queue')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('distube_filters')
                .setLabel('🎧 Filters')
                .setStyle(ButtonStyle.Secondary)
        );

    // Create the "Now Playing" Embed
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`🎵 Now Playing`)
      .setDescription(`[${song.name}](${song.url})`)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Duration', value: `\`${song.formattedDuration}\``, inline: true },
        { name: 'Requested by', value: `${song.user}`, inline: true }
      )
      .setTimestamp();

    try {
      if (queue.nowPlayingMessage) {
        await queue.nowPlayingMessage.edit({ embeds: [embed], components: [row1, row2] });
      } else {
        const msg = await queue.textChannel.send({ embeds: [embed], components: [row1, row2] });
        queue.nowPlayingMessage = msg;
      }
    } catch (error) {
      console.error('Error updating Now Playing message:', error);
    }
  })
  .on('addSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setDescription(`✅ Added to queue: [${song.name}](${song.url}) - \`${song.formattedDuration}\``)
      .setAuthor({ name: song.user.tag, iconURL: song.user.displayAvatarURL() });
      
    queue.textChannel.send({ embeds: [embed], components: [] })
        .then(msg => {
            setTimeout(() => msg.delete().catch(console.error), 10000);
        });
  })
  .on('addList', (queue, playlist) => {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setDescription(`✅ Added playlist: **${playlist.name}** (${playlist.songs.length} songs)`)
      .setAuthor({ name: playlist.user.tag, iconURL: playlist.user.displayAvatarURL() });
      
    queue.textChannel.send({ embeds: [embed], components: [] })
        .then(msg => {
            setTimeout(() => msg.delete().catch(console.error), 10000);
        });
  })
  .on('error', (queue, error) => {
    console.error('DisTube error:', error);
    if (queue && queue.textChannel) {
      queue.textChannel.send('⚠️ An error occurred while playing music.');
    }
  })
  .on('finish', async (queue) => { // <-- 1. MADE THIS ASYNC
    try {
      if (queue.nowPlayingMessage) {
        const embed = new EmbedBuilder()
          .setColor('#AAAAAA')
          .setDescription('⏏️ Queue finished. Leaving voice channel...');
          
        // 2. AWAITED THIS EDIT
        await queue.nowPlayingMessage.edit({ embeds: [embed], components: [] }); 
        queue.nowPlayingMessage = null; 
      } else {
        queue.textChannel.send('⏏️ Queue finished. Leaving voice channel...');
      }
    } catch (error) {
      // 3. THIS CATCH BLOCK WILL NOW WORK
      if (error.code === 10008) { // 10008 is "Unknown Message"
        console.log('Now Playing message was already deleted (on finish).');
      } else {
        console.error('Error editing message on finish:', error);
      }
    }
    
    // Your original leave logic
    setTimeout(() => {
      try {
        const voiceConnection = client.distube.voices.get(queue);
        if (voiceConnection) {
          voiceConnection.leave();
        }
      } catch (err) {
        console.error('Error leaving voice channel:', err);
      }
    }, 1000);
  })
  .on('disconnect', async (queue) => { // <-- 1. MADE THIS ASYNC
     try {
       if (queue.nowPlayingMessage) {
        await queue.nowPlayingMessage.delete(); // 2. AWAITED THIS DELETE
        queue.nowPlayingMessage = null;
      }
    } catch (error) {
      // 3. THIS CATCH BLOCK WILL NOW WORK
      if (error.code === 10008) {
        console.log('Now Playing message was already deleted (on disconnect).');
      } else {
        console.error('Error deleting message on disconnect:', error);
      }
    }
    queue.textChannel.send('👋 Disconnected from voice channel.');
  })
  .on('empty', async (queue) => { // <-- 1. MADE THIS ASYNC
     try {
       if (queue.nowPlayingMessage) {
        await queue.nowPlayingMessage.delete(); // 2. AWAITED THIS DELETE
        queue.nowPlayingMessage = null;
      }
    } catch (error) {
       // 3. THIS CATCH BLOCK WILL NOW WORK
       if (error.code === 10008) {
        console.log('Now Playing message was already deleted (on empty).');
      } else {
        console.error('Error deleting message on empty:', error);
      }
    }
    queue.textChannel.send('⏏️ Voice channel is empty. Leaving...');
  });

///////////////////////////////////////////////////////////////////////////////////////////////////////
// Config
const PREFIX = process.env.PREFIX || '!Garmin';
const ADMIN_ROLE_NAME = process.env.ADMIN_ROLE_NAME || 'Admin';
const BGM_ROLE_NAME = process.env.BGM_ROLE_NAME || 'BGM';
const DEV_ROLE_NAME = process.env.DEV_ROLE_NAME || 'G-Developer';
const ROLE_TO_ASSIGN = process.env.ROLE_TO_ASSIGN || 'Пидор-Игнорщик';
const SIGMA_ROLE_NAME = process.env.SIGMA_ROLE_NAME || 'sigma';
const UNAUTHORIZED_THRESHOLD = parseInt(process.env.UNAUTHORIZED_THRESHOLD) || 3;
const MUTE_DURATION_MS = parseInt(process.env.MUTE_DURATION_MS) || 60000;
///////////////////////////////////////////////////////
client.commands = new Map();

const commandFiles = fs
    .readdirSync(path.join(__dirname, 'commands'))
    .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}
///////////////////////////////////////////////////////

// Track unauthorized attempts per user
const unauthorizedCount = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    levelSystem.init(client);
    // Auto-check and create roles for all guilds
    client.guilds.cache.forEach(async (guild) => {
        try {
            // Pass true to auto-assign sigma role
            await autoRoleSetup.setupRoles(guild, true);
        } catch (err) {
            console.error(`Failed to setup roles for ${guild.name}:`, err);
        }
    });
    // Initialize scheduled jobs from schedules.json
    if (scheduleButton && typeof scheduleButton.initSchedules === 'function') {
        scheduleButton.initSchedules(client);
        console.log('Scheduled reminders initialized.');
    }
    // This will save all level and health data every 5 minutes
    setInterval(() => {
        if (!client.levels) return; // Don't save if bot isn't ready
        
        console.log('[Auto-Save] Saving all data to disk...');
        try {
            levelSystem.save(client); // Saves levels.json
            health.save(client);     // Saves health.json
            console.log('[Auto-Save] Save complete.');
        } catch (err) {
            console.error('[Auto-Save] FAILED TO SAVE DATA:', err);
        }
    }, 300000); // 300,000ms = 5 minutes
    // --- END OF NEW BLOCK ---
});

//////////////////////////////////////
// Auto-setup roles when bot joins a new server
// Auto-setup roles when bot joins a new server
client.on('guildCreate', async (guild) => {
    console.log(`[Bot] Joined new guild: ${guild.name} (${guild.id})`);
    
    try {
        // Pass true to auto-assign sigma role to all members
        const result = await autoRoleSetup.setupRoles(guild, true);
        console.log(`[Bot] Auto-setup complete for ${guild.name}:`, result);
        
        // Find a channel to send setup notification
        const systemChannel = guild.systemChannel || guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
        
        if (systemChannel) {
            systemChannel.send(
                `👋 **Garmin Bot Activated!**\n\n` +
                `✅ Created ${result.created.length} required roles\n` +
                `✅ Assigned "sigma" role to all members\n\n` +
                `Type \`!Garmin\` to see available commands!`
            );
        }
    } catch (err) {
        console.error('[Bot] Failed to auto-setup roles:', err);
    }
});
//////////////////////////////////////
//////////////////////////////////////
client.on('voiceStateUpdate', (oldState, newState) => {
    // This function will check if a user is at 0 HP and kick them from VC
    health.checkVoiceJoin(newState);
});
//////////////////////////////////////
function bumpUnauthorized(member) {
    const count = unauthorizedCount.get(member.id) || 0;
    unauthorizedCount.set(member.id, count + 1);
    return count + 1;
}

function isBlockedInDevMode(member, hasDev, message, command) {
    // If the member is in Developer Mode and not using exit-dev
    if (hasDev && command !== 'exit-dev') {
        message.reply(
            "⚠️ You are in Developer Mode. All regular commands are blocked until you exit (!Garmin exit-dev)."
        );
        return true;
    }
    return false;
}

/////////////////////////////////////////////////////
// --- NEW HELPER FUNCTION FOR FILTERS ---
// A list of our favorite filters
const POPULAR_FILTERS = ['bassboost', 'nightcore', 'vaporwave', '3d', 'karaoke', 'echo'];

function createFilterMessage(queue) {
    const activeFilters = queue.filters.names;

    const embed = new EmbedBuilder()
        .setColor('#FFFFFF')
        .setTitle('🎧 Audio Filters')
        .setDescription('Click a filter to toggle it on or off. Click "Clear" to remove all filters.');

    // Create 2 rows of filter buttons
    const row1 = new ActionRowBuilder();
    const row2 = new ActionRowBuilder();

    POPULAR_FILTERS.forEach((filter, index) => {
        const isActive = activeFilters.includes(filter);
        const button = new ButtonBuilder()
            .setCustomId(`filter_${filter}`)
            .setLabel(filter.charAt(0).toUpperCase() + filter.slice(1)) // Capitalize
            .setStyle(isActive ? ButtonStyle.Success : ButtonStyle.Secondary); // Green if on, grey if off

        // This splits our 6 filters into 2 rows of 3
        if (index < 3) {
            row1.addComponents(button);
        } else {
            row2.addComponents(button);
        }
    });

    // Create a 3rd row for the "Clear" button
    const row3 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('filter_clear')
                .setLabel('Clear All Filters')
                .setStyle(ButtonStyle.Danger)
        );
    
    return { embeds: [embed], components: [row1, row2, row3], ephemeral: true };
}
// --- END OF HELPER FUNCTION ---
/////////////////////////////////////////////////////////////////////////////

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    levelSystem.giveXP(message); // This will track XP on every message
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    const member = message.member;
    const hasAdminRole = member.roles.cache.some(r => r.name === ADMIN_ROLE_NAME);
    const hasBGM = member.roles.cache.some(r => r.name === BGM_ROLE_NAME);
    const hasDev = member.roles.cache.some(r => r.name === DEV_ROLE_NAME);
    const hasEveryone = member.roles.cache.some(r => r.name === SIGMA_ROLE_NAME);

    logg.logCommand(message, message.content);

    if (command === 'play') return playCommand.execute(message, args);
    if (command === 'skip') return playCommand.skip.execute(message, args);
    if (command === 'stop') return playCommand.stop.execute(message, args);
    if (command === 'queue') return playCommand.queue.execute(message, args);

    // Implementing voice
    if (voiceCommand.canHandle(message, PREFIX)) {
    return voiceCommand.handle(message, PREFIX);
}




    // --- SYSTEM TEST COMMAND ---
    if (command === 'test-system') {
        await message.channel.send('System Test started...');
        await new Promise(r => setTimeout(r, 5000));

        let result = '';
        try {
            for (const [name, cmd] of client.commands.entries()) {
                result += `✅ ${name} loaded\n`;
            }

            if (rouletteButton && typeof rouletteButton.createRow === 'function') result += `✅ roulette_button OK\n`;
            if (descriptionButton && typeof descriptionButton.createRow === 'function') result += `✅ description_button OK\n`;
            if (scheduleButton && typeof scheduleButton.createButton === 'function') result += `✅ schedule_button OK\n`;

            await message.channel.send(`System Test finished:\n${result}`);
        } catch (err) {
            await message.channel.send(`❌ System Test failed:\n${err.message}`);
        }
        return; // stop further command processing
    }
    // --- END SYSTEM TEST ---

    // Check for emergency shutdown command first
    const emergCommand = client.commands.get('emerg_shut');
    if (emergCommand && emergCommand.canHandle(message, PREFIX)) {
    await emergCommand.handle(message, PREFIX, client);
    return; // stop further command processing
}

    // Check for system shutdown command
const sysShutdownCommand = client.commands.get('sys_shutdown');
if (sysShutdownCommand && sysShutdownCommand.canHandle(message, PREFIX)) {
    await sysShutdownCommand.handle(message, PREFIX);
    return;
}


    if (isBlockedInDevMode(member, hasDev, message, command)) return;

    //UniCombiner call and check
    if (uniCombiner && uniCombiner.canHandle(message, PREFIX)) {
    await uniCombiner.handle(message, PREFIX);
    return;
}


    // Unauthorized users
      if (!hasAdminRole &&!((command === 'roulette' && hasBGM) || ((command === 'garmin' || command === 'help' || !command) && hasBGM))) { 
        const count = bumpUnauthorized(member); 
        await message.reply('Z Moskalyami ne balakayu'); 
        if (count > UNAUTHORIZED_THRESHOLD) { 
          try { 
            await member.timeout(MUTE_DURATION_MS, 'Exceeded unauthorized attempts'); 
            await message.channel.send('Kto to Razpizdelsa'); 
            unauthorizedCount.set(member.id, 0); 
          } 
          catch (err) { 
            console.log('Cannot timeout member:', err.message); 
          } 
        } 
        return; 
      }

// === Rate limiter for heavy commands (assign, disconnect, mute) ===
const RATE_LIMITED_COMMANDS = ['assign', 'disconnect', 'mute'];

if (RATE_LIMITED_COMMANDS.includes(command)) {
    const rl = rateLimiter.checkAndRecord(member.id, command); // pass command name

    if (!rl.allowed) {
        if (rl.blocked) {
            const mins = Math.ceil(rl.remainingMs / 60000);
            await message.reply(
                `⏳ You have exceeded the limit for **${command}** command. You are blocked from using it for another ${mins} minute(s).`
            );
            return;
        } else {
            await message.reply(
                `⏳ Command **${command}** temporarily blocked. Try again later.`
            );
            return;
        }
    }
}




    // Unauthorized users BGM
    // if (!hasBGM) {
    //     const count = bumpUnauthorized(member);
    //     await message.reply('You are not in BGM\nZ Moskalyami ne balakayu');
    //     if (count > UNAUTHORIZED_THRESHOLD) {
    //         try {
    //             await member.timeout(MUTE_DURATION_MS, 'Exceeded unauthorized attempts');
    //             await message.channel.send('Kto to Razpizdelsa');
    //             unauthorizedCount.set(member.id, 0);
    //         } catch (err) {
    //             console.log('Cannot timeout member:', err.message);
    //         }
    //     }
    //     return;
    // }

// // Help message
// if (!command || command === 'garmin' || command === 'help') {
//     const { ActionRowBuilder } = require('discord.js');
//     const descriptionButton = require('./commands/description_button');
//     //const scheduleButton = require('./commands/schedule_button'); // Schedule button import

//     if (hasEveryone && hasBGM && !hasAdminRole) {
//         // BGM users see only roulette + description
//         const row = new ActionRowBuilder().addComponents(
//             rouletteButton.createRow(PREFIX).components[0],
//             descriptionButton.createRow(PREFIX).components[0],
//             musicButton.createButton().components[0],
//             playlistButton.createButton().components[0],
//             moreButton.createButton().components[0]
//             //scheduleButton.createButton() // <- updated
//         );

//         await message.reply({
//             content: `K vashim uslugam sir.\nAvailable commands:\n- ${PREFIX} roulette @Garmin-bot`,
//             components: [row],
//         });
//     } else {
//         // Admin or full-access users see all commands + buttons
//         const row = new ActionRowBuilder().addComponents(
//             rouletteButton.createRow(PREFIX).components[0],
//             descriptionButton.createRow(PREFIX).components[0],
//             scheduleButton.createButton(), // <- updated
//             musicButton.createButton().components[0],
//             playlistButton.createButton().components[0],
//             moreButton.createButton().components[0]
//         );

//         await message.reply({
//             content: `K vashim uslugam sir - ${message.member}\nAvailable commands:\n- ${PREFIX} disconnect @User\n- ${PREFIX} mute @User\n- ${PREFIX} kaboom @User\n - ${PREFIX} call @User \n- Or use buttons below:`,
//             components: [row],
//         });
//     }
//     return;
// }
// Help message
if (!command || command === 'garmin' || command === 'help') {
    const { ActionRowBuilder } = require('discord.js');
    const descriptionButton = require('./commands/description_button');
    //const scheduleButton = require('./commands/schedule_button'); // Schedule button import

    if (hasEveryone && hasBGM && !hasAdminRole) {
        // BGM users see only roulette + description
        const row1 = new ActionRowBuilder().addComponents(
            rouletteButton.createRow(PREFIX).components[0],
            descriptionButton.createRow(PREFIX).components[0],
            musicButton.createButton().components[0]
        );
        const row2 = new ActionRowBuilder().addComponents(
            playlistButton.createButton().components[0],
           moreButton.createButton() // <-- 1. THIS LINE IS FIXED
        );

        await message.reply({
            content: `K vashim uslugam sir.\nAvailable commands:\n- ${PREFIX} roulette @Garmin-bot`,
            components: [row1, row2], 
        });
    } else {
        // Admin or full-access users see all commands + buttons
        const row1 = new ActionRowBuilder().addComponents(
            rouletteButton.createRow(PREFIX).components[0],
           descriptionButton.createRow(PREFIX).components[0],
            scheduleButton.createButton()
        );
        const row2 = new ActionRowBuilder().addComponents(
            musicButton.createButton().components[0],
            playlistButton.createButton().components[0],
            moreButton.createButton() // <-- 2. THIS LINE IS FIXED
        );

        await message.reply({
            content: `K vashim uslugam sir - ${message.member}\nAvailable commands:\n- ${PREFIX} disconnect @User\n- ${PREFIX} mute @User\n- ${PREFIX} kaboom @User\n - ${PREFIX} call @User \n- Or use buttons below:`,
           components: [row1, row2], 
        });
    }
    return;
}





    // if(!gr_command || gr_command === 'garmin' && gr_command === 'granted') {
    //   await message.reply(
    //     `G-Granted - ${user.tag}. These are the commands you can use:\n - ${PREFIX} grant @User`
    //   )
    // }
    if (command === 'proceed') {
        await proc.handle(message, args);
        return;
    }

    if (command === 'setup-roles') return autoRoleSetup.execute(message);

    if (command === 'remove') {
        await proc.handle(message, args);
        return;
    }
    const target = message.mentions.members?.first();
    if (!target) {
        await message.reply('Please mention a user.');
        return;
    } 

    // Assign role
    if (command === 'assign') {
        const role = message.guild.roles.cache.find(r => r.name === ROLE_TO_ASSIGN);
        if (!role) return message.reply(`Role "${ROLE_TO_ASSIGN}" does not exist.`);
        try {
            await target.roles.add(role);
            message.channel.send(`Role "${ROLE_TO_ASSIGN}" assigned to ${target.user.tag}`);
        } catch (err) {
            message.channel.send('Failed to assign role. Make sure bot role is above the target role.');
        }
    }

    // Basic Garmin Mode - BGM Role
    // if(command === `bgm`) {
    //   const role = message.guild.roles.cache.find(r => r.name === 'BGM');
    //   if(!role) return message.reply (`Takoy roli kak"${ROLE_TO_ASSIGN}" nety. Pisat' nauchis dolboyob)`);
    //     try {
    //         await target.roles.add(role);
    //         message.channel.send(`Role "${ROLE_TO_ASSIGN}" assigned to - ${target.user.tag}\nDobro Pozhalovat' sir to BGM - Basic Garmin Mode!
    //           \nThese are available commands:
    //           \n-`);
    //     } catch(err) {
    //         message.channel.send('Failed to assign role. Make sure bot role is above the target role.');
    //     }
    // }

    // Unassign role
    else if (command === 'unassign') {
        const role = message.guild.roles.cache.find(r => r.name === ROLE_TO_ASSIGN);
        if (!role) return message.reply(`Takoy roli kak"${ROLE_TO_ASSIGN}" nety. Pisat; naucis dolboyob).`);
        try {
            await target.roles.remove(role);
            message.channel.send(`${target.user.tag} reabilitirovan, bolshe tak ne delay`);
        } catch (err) {
            message.channel.send('Failed to remove role. Check bot permissions.');
        }
    }
    // Enter Developer Mode
    else if(command === 'enter-dev') {

        const role = message.guild.roles.cache.find(r => r.name === 'G-Developer');
        if(!role) return message.reply(`Role "G-Developer" does not exist.`);
        try {
            await target.roles.add(role);
            message.channel.send(
            `This is for developers
            -**!Garmin proceed @ROLE_NAME to all** // assigns selected role to everybody in a channel
            -**!Garmin proceed @ROLE_NAME to @USER** // assigns selected role to specified user
            Use keyword **"and"** to combine commands into one message
            **SYNTAX EXAMPLE**: !Garmin 'command' @USER **and** "other commands..."`);
        }
        catch(err) {
            message.channel.send(`Failed to enter G-Developer mode`)
        }
    }
    // Developer mode
    else if(command === 'dev') {
        if(!hasBGM && hasAdminRole ) { // && hasDev removed
           await message.reply(
            `This is for developers\n
            -**!Garmin proceed @ROLE_NAME to all** // assigns selected role to everybody in a channel
            -**!Garmin proceed @ROLE_NAME to @USER** // assigns selected role to specified user
            Use keyword **"and"** to combine commands into one message
            **SYNTAX EXAMPLE**: !Garmin 'command' @USER **and** "other commands..."`
        ); 
        } else {
            message.channel.send(`${message.member} - you are not in developer mode! Denied!`)
        }
        return;
    }

    // Exit Developer Mode
    else if(command === 'exit-dev') {
        if(hasDev) {
             const role = message.guild.roles.cache.find(r => r.name === 'G-Developer');
        if(!role) return message.reply(`Role "G-Developer" does not exist.`);
        try {
            await target.roles.remove(role);
            message.channel.send(`You have exited Devloper mode`);
        }
        catch(err) {
            message.channel.send(`Failed to exit G-Developer mode`)
        }
        }
    }


    // Disconnect
    else if (command === 'disconnect') {
        if(!hasDev) {
        if (!target.voice.channel) return message.reply('This user is not in a voice channel.');
        
        try {
            const actualTarget = await karma.handle(message, 'disconnect', target);
            
            // --- HEALTH SYSTEM ADDITION ---
            // This applies 10 damage and gets the embed
            const damageEmbed = await health.applyDamage(client, actualTarget, 10, 'Disconnected by Admin');
            await message.channel.send({ embeds: [damageEmbed] });

            // Karma "Vampirism" - Heal the original target if karma backfired
            if (actualTarget.id !== target.id) { // if karma backfired
                const healEmbed = await health.applyHeal(client, target, 10, 'Karma Backfire');
                await message.channel.send({ embeds: [healEmbed] });
            }
            // --- END HEALTH SYSTEM ---

            await actualTarget.voice.setChannel(null, `Disconnected by ${member.user.tag}`);
            // message.channel.send(`${actualTarget.user.tag} has been disconnected from voice.`); // This is now replaced by the embed
     } catch (err) {
            message.channel.send('Failed to disconnect the user.');
            console.error(err); // Good to log the error
        }
    } else {
        message.channel.send(`${message.member} - you are in developer mode\nUse "!Garmin exit-dev @User" to procede`);
    }
    }


// // Mute
//     else if (command === 'mute') {
//     if (!target.voice.channel) return message.reply('This user is not in a voice channel.');
//     try {
//         const actualTarget = await karma.handle(message, 'mute', target);

//         await actualTarget.voice.setMute(true, `Muted by ${member.user.tag}`);
//         message.channel.send(`${actualTarget.user.tag} has been muted for 15 seconds.`);

//         // Unmute after 15 seconds
//         setTimeout(async () => {
//             try {
//                 await target.voice.setMute(false, `Automatically unmuted after 10 seconds`);
//                 message.channel.send(`${target.user.tag} has been unmuted.`);
//             } catch (err) {
//                 message.channel.send(`Failed to unmute ${target.user.tag}.`);
//                 console.error(err);
//             }
//         }, 10000); // 15000 ms = 15 seconds

//     } catch (err) {
//         message.channel.send('Failed to mute the user.');
//         console.error(err);
//     }
// }
// Mute
    else if (command === 'mute') {
    if (!target.voice.channel) return message.reply('This user is not in a voice channel.');
    try {
        const actualTarget = await karma.handle(message, 'mute', target);

        await actualTarget.voice.setMute(true, `Muted by ${member.user.tag}`);
        
        // --- HEALTH SYSTEM ADDITION ---
        // This applies 10 damage and gets the embed
        const damageEmbed = await health.applyDamage(client, actualTarget, 10, 'Muted by Admin');
        // We add a footer to the embed to keep your original timer message
        damageEmbed.setFooter({ text: `${actualTarget.user.tag} has been muted for 10 seconds.` });
        await message.channel.send({ embeds: [damageEmbed] });

        // Karma "Vampirism"
        if (actualTarget.id !== target.id) { // if karma backfired
            const healEmbed = await health.applyHeal(client, target, 10, 'Karma Backfire');
            await message.channel.send({ embeds: [healEmbed] });
        }
        // --- END HEALTH SYSTEM ---

        // Unmute after 10 seconds
        setTimeout(async () => {
            try {
                // --- BUG FIX: Unmuting actualTarget instead of target ---
                await actualTarget.voice.setMute(false, `Automatically unmuted after 10 seconds`);
                message.channel.send(`${actualTarget.user.tag} has been unmuted.`);
            } catch (err) {
                message.channel.send(`Failed to unmute ${actualTarget.user.tag}.`);
             console.error(err);
            }
        }, 10000); // This is 10,000ms = 10 seconds

    } catch (err) {
        message.channel.send('Failed to mute the user.');
        console.error(err);
    }
}


    // Grant role "G"
    else if (command === 'grant') {
        const role = message.guild.roles.cache.find(r => r.name === 'G');
        if (!role) return message.reply(`Role "G" does not exist.`);
        try {
            await target.roles.add(role);
            //message.channel.send(`Role "G" granted to ${target.user.tag}`);
            message.channel.send(
            `K vashim uslugam sir - ${target.user.tag}.\nAvailable commands:\n- ${PREFIX} assign @User\n- ${PREFIX} unassign @User\n- ${PREFIX} disconnect @User\n- ${PREFIX} mute @User\n- ${PREFIX} kaboom @User\n- ${PREFIX} roulette @Garmin-bot`
        );
        } catch (err) {
            message.channel.send('Failed to grant role.');
        }
    }

    // Grant role "BGM"
    else if (command === 'bgm') {
        const role = message.guild.roles.cache.find(r => r.name === 'BGM');
        if (!role) return message.reply(`Role "BGM" does not exist.`);
        try {
            await target.roles.add(role);
            //message.channel.send(`Role "G" granted to ${target.user.tag}`);
            message.channel.send(
            `K vashim uslugam sir - ${target.user.tag}.\nAvailable commands:\n- ${PREFIX} roulette @Garmin-bot`
        );
        } catch (err) {
            message.channel.send('Failed to grant role.');
        }
    }

    // Ungrant BGM
    else if(command === `un-bgm`) {
        const role = message.guild.roles.cache.find(r => r.name === 'BGM')
        try {
            await target.roles.remove(role);
            message.channel.send(`Role "BGM" removed from ${target.user.tag}`);
        } catch (err) {
            message.channel.send('Failed to remove role. Check bot permissions.');
        }
    }


    // Ungrant  
else if (command === 'ungrant') {
    const role = message.guild.roles.cache.find(r => r.name === 'G');
    if (!role) return message.reply('Role "G" does not exist.');

    // Protect your own account
    if (target.user.id === '479224801324695561') {
        return message.reply('Access denied. You cannot ungrant this user.');
    }

    try {
        await target.roles.remove(role);
        message.channel.send(`Role "G" removed from ${target.user.tag}`);
    } catch (err) {
        message.channel.send('Failed to remove role. Check bot permissions.');
    }
}

//Description
else if (command === 'description') {
    if(hasEveryone) {
        await message.reply(`
            Hey, I am Garmin!\n ${message.member} - if you would like to use Garmmin and explore endless edges you need to have G role or BGM role at least
            \n-Please if you want to be granted with those roles, you need to follow the rules
            \nRules:
            \n1.No spamming
            \n2.No disturbing others in voice channel if you are not part of it
            \n3.Be respectful
            \nJust to know, inside of Garmin there is security system that will block users if they are not following rules
            \nEverybody has a second chance, but there is no third one)
            \n-Garmin`);
    } else {await message.reply(`You cant use this command, please get role - "sigma"`)}
    return;
}

    // Check Status
else if (command === 'status') {
    const target = message.mentions.members?.first() || member; // Default to the caller if no mention

    if (!target) {
        return message.reply('Please mention a user to check their status.');
    }

    const roles = target.roles.cache.map(r => r.name);
    let statusMessage = `🧩 Status for **${target.user.tag}**:\n\n`;

    // Basic role info
    statusMessage += `Roles: ${roles.join(', ') || 'No roles'}\n\n`;

    // Status logic
    if (roles.includes('G')) {
        statusMessage += `✅ Access: Developer Mode available\n`;
        statusMessage += `🧠 Possible actions:\n- Enter Developer Mode (!Garmin dev)\n- Manage users (!Garmin assign / unassign / disconnect / mute / kaboom)\n`;
    } 
    else if (roles.includes('BGM')) {
        statusMessage += `🟡 Access: Basic Garmin Mode\n`;
        statusMessage += `🎲 Possible actions:\n- Use roulette (!Garmin roulette)\n`;
    } 
    else if (roles.includes('Admin')) {
        statusMessage += `🔴 Access: Administrator\n`;
        statusMessage += `⚙️ Possible actions:\n- Full control of all commands\n`;
    } 
    else {
        statusMessage += `❌ Access: Restricted\n`;
        statusMessage += `💬 Possible actions:\n- None (Z Moskalyami ne balakayu)\n`;
    }

    await message.reply(statusMessage);
}

// Call command
else if (command === 'call') {
    if (hasAdminRole) {
        const mention = `<@${target.id}>`; // ✅ Proper mention
        
            await message.channel.send(`${mention}`);
            await message.channel.send(`${mention}`);
            await message.channel.send(`${mention}`);
            await message.channel.send(`${mention}`);
            await message.channel.send(`${mention}`);
        
    } else {
        await message.reply(`You can't use this command, please get role - "sigma"`);
    }
    return;
}
// Proceed command to assign roles to someone or everybody
// else if (command === 'proceed') {
//     await proc.handle(message, args);
// }

// Un-proceed command to remove roles from user/s
// Proceed command to assign roles to someone or everybody
// else if (command === 'un-proceed') {
//     await unproc.handle(message, args);
// }


// ERASE SCHEDULE FILE
else if (command === 'erase-schedule') {
    const schedulePath = path.join(__dirname, 'schedules.json');

    try {
        fs.writeFileSync(schedulePath, JSON.stringify([], null, 2));
        message.reply('🧹 All scheduled reminders have been erased.');
    } catch (err) {
        console.error('Failed to erase schedules:', err);
        message.reply('⚠️ Failed to erase schedules.');
    }
}

// VIEW UPCOMING REMINDERS
else if (command === 'reminders') {
    const schedulePath = path.join(__dirname, 'schedules.json');

    try {
        if (!fs.existsSync(schedulePath)) return message.reply('No schedule file found.');
        const data = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
        if (!data.length) return message.reply('📭 No upcoming reminders.');

        let list = data.map((entry, i) => {
            const time = `${entry.month ? entry.month + '/' : ''}${entry.day ? entry.day + ' ' : ''}${entry.hh.toString().padStart(2, '0')}:${entry.mm.toString().padStart(2, '0')}`;
            return `**${i + 1}.** <@&${entry.roleId}> at **${time}** in <#${entry.channelId}>`;
        }).join('\n');

        message.reply(`📅 **Upcoming Reminders:**\n${list}`);
    } catch (err) {
        console.error('Failed to read schedules:', err);
        message.reply('⚠️ Could not load reminders.');
    }
}
// Ban texting
else if (command === 'ban-text') {
    const target = message.mentions.members.first();
    const PROTECTED_USER_ID = '479224801324695561'; // your Discord ID
    //const PROTECTED_USER_ID2 = '680831332187635730';
    const BAN_DURATION = 60 * 1000; // 1 minute

    if (!target) return message.reply('Please mention a user to ban from texting.');

    if (target.id === PROTECTED_USER_ID) {
        return message.reply('🚫 You cannot ban this protected user.');
    }

    if (!message.member.permissions.has('ManageMessages')) {
        return message.reply('You don’t have permission to use this command.');
    }

    try {
        // Deny text permissions everywhere
        message.guild.channels.cache.forEach(channel => {
            if (channel.isTextBased()) {
                channel.permissionOverwrites.edit(target.id, {
                    SendMessages: false,
                    AddReactions: false,
                }).catch(() => {});
            }
        });

        message.channel.send(`🚫 ${target.user.tag} has been muted from texting for 1 minute.`);

        // Unmute after 1 minute
        setTimeout(async () => {
            for (const channel of message.guild.channels.cache.values()) {
                if (channel.isTextBased()) {
                    // Remove the overwrite entirely to restore original permissions
                    await channel.permissionOverwrites.delete(target.id).catch(() => {});
                }
            }

            message.channel.send(`✅ ${target.user.tag} can now text again.`);
        }, BAN_DURATION);
    } catch (err) {
        console.error('Error while banning text:', err);
        message.reply('❌ Failed to ban user from texting.');
    }
}

// Lock user
else if (command === 'lock') {
    // if (!message.member.permissions.has('ModerateMembers')) {
    //     return message.reply('🚫 You don’t have permission to mute members.');
    // }

    // protect your own ID
    if (target.id === '479224801324695561'|| target.id === '680831332187635730') {
        return message.channel.send(`🚫 You can’t mute the protected user (${target.user.tag}).`);
    }

    const muteDuration = 60 * 1000; // 1 minute

    try {
        await target.timeout(muteDuration, 'Locked by Garmin lock command');
        await message.channel.send(`🔇 ${target.user.tag} has been locked for 1 minute.`);
    } catch (err) {
        console.error('Error locking user:', err);
        await message.channel.send(`⚠️ Failed to locked ${target.user.tag}: ${err.message}`);
    }
}

// Unlock user
else if (command === 'unlock') {
    if (!message.member.permissions.has('ModerateMembers')) {
        return message.reply('🚫 You don’t have permission to unmute members.');
    }

    // protect your own ID
    if (target.id === '479224801324695561') {
        return message.channel.send(`🚫 You can’t unmute the protected user (${target.user.tag}).`);
    }

    try {
        // Remove timeout by setting duration to null
        await target.timeout(null, 'Unmuted by Garmin unlock command');
        await message.channel.send(`🔊 ${target.user.tag} has been unmuted.`);
    } catch (err) {
        console.error('Error unmuting user:', err);
        await message.channel.send(`⚠️ Failed to unmute ${target.user.tag}: ${err.message}`);
    }
}







// Kaboom
else if (command === 'kaboom') {
    if (!target.voice.channel) return message.reply('This user is not in a voice channel.');

    // Apply karma: 30% chance to affect the command sender instead
    let actualTarget = target;
    try {
        actualTarget = await karma.handle(message, 'kaboom', target); 
    } catch (err) { 
        console.error('Karma failed, using original target:', err);
        actualTarget = target;
    }

    const delay = Math.floor(Math.random() * 30000); // 0-30 sec
    setTimeout(async () => {
        try {
            await actualTarget.voice.setChannel(null, `Kaboom by ${member.user.tag}`);
            
            // --- HEALTH SYSTEM ADDITION ---
            const damageEmbed = await health.applyDamage(client, actualTarget, 20, 'Hit by Kaboom');
            await message.channel.send({ embeds: [damageEmbed] });

            // Karma "Vampirism"
            if (actualTarget.id !== target.id) { // if karma backfired
                const healEmbed = await health.applyHeal(client, target, 20, 'Karma Backfire');
                await message.channel.send({ embeds: [healEmbed] });
            }
            // --- END HEALTH SYSTEM ---

        } catch (err) {
            await message.channel.send('Kaboom failed.');
            console.error(err);
     }
    }, delay);

    // Send the Kaboom picture
    message.channel.send({
        content: 'Kaboom?',
        files: ['./kaboom.jpg'] // put kaboom.png in the same folder as index.js
    });
}


                  // Roulette command with temporary block
      // else if (command === 'roulette') {
      //     // Get all members currently in any voice channel
      //     const voiceMembers = message.guild.members.cache.filter(
      //         m => m.voice.channel && !m.user.bot
      //     );

      //     if (!voiceMembers.size) {
      //         return message.reply("Sir nikogo nety v voice channel(");
      //     }

      //     // Pick a random member
      //     const randomIndex = Math.floor(Math.random() * voiceMembers.size);
      //     const target = Array.from(voiceMembers.values())[randomIndex];

      //     const channel = target.voice.channel;
      //     if (!channel) return message.reply("Selected user is not in a voice channel.");

      //     message.channel.send(`🎲 Ruletka poletela.`);

      //     setTimeout(async () => {
      //         try {
      //             // Disconnect the user
      //             await target.voice.setChannel(null, `Disconnected by roulette`);

      //             // Temporarily deny connect permission
      //             await channel.permissionOverwrites.edit(target.id, { Connect: false });

      //             await message.channel.send(`💥 ${target.user.tag} Syebalsa s voice channel for 15 sec)`);

      //             // Restore permission after 15 seconds
      //             setTimeout(async () => {
      //                 try {
      //                     await channel.permissionOverwrites.edit(target.id, { Connect: true });
      //                 } catch (err) {
      //                     console.log(`Failed to restore permissions for ${target.user.tag}:`, err);
      //                 }
      //             }, 15000); // 15 seconds

      //         } catch (err) {
      //             await message.channel.send(`Failed to disconnect ${target.user.tag}.`);
      //             console.log(err);
      //         }
      //     }, 5000); // initial 5-second delay
      // }

      // Roulette command with BGM restriction and temporary block
// else if (command === 'roulette') {
//     // Check if the member has the BGM role
//     const hasG = member.roles.cache.some(r => r.name === 'G');
//     if (!hasBGM && !hasG) {
//         return message.reply("Only users with the BGM or G role can use this command.");
//     }


//     // Get all members currently in any voice channel
//     const voiceMembers = message.guild.members.cache.filter(
//         m => m.voice.channel && !m.user.bot
//     );

//     if (!voiceMembers.size) {
//         return message.reply("Sir nikogo nety v voice channel(");
//     }

//     // Pick a random member
//     const randomIndex = Math.floor(Math.random() * voiceMembers.size);
//     const target = Array.from(voiceMembers.values())[randomIndex];

//     const channel = target.voice.channel;
//     if (!channel) return message.reply("Selected user is not in a voice channel.");

//     message.channel.send(`🎲 Ruletka poletela.`);

//     setTimeout(async () => {
//         try {
//             // Disconnect the user
//             await target.voice.setChannel(null, `Disconnected by roulette`);

//             // Temporarily deny connect permission
//             await channel.permissionOverwrites.edit(target.id, { Connect: false });

//             await message.channel.send(`💥 ${target.user.tag} Syebalsa s voice channel for 15 sec)`);

//             // Restore permission after 15 seconds
//             setTimeout(async () => {
//                 try {
//                     await channel.permissionOverwrites.edit(target.id, { Connect: true });
//                 } catch (err) {
//                     console.log(`Failed to restore permissions for ${target.user.tag}:`, err);
//                 }
//             }, 15000); // 15 seconds

//         } catch (err) {
//             await message.channel.send(`Failed to disconnect ${target.user.tag}.`);
//             console.log(err);
//         }
//     }, 5000); // initial 5-second delay
// }

    // Final Else statement
    else {
        await message.reply('Pisat nauchis!');
    }
});

// // Handle button interactions (like Roulette button)
// client.on('interactionCreate', async (interaction) => {
//     try {
//         if (rouletteButton && typeof rouletteButton.handleInteraction === 'function') {
//             await rouletteButton.handleInteraction(client, interaction);
//         }

//         if (descriptionButton && typeof descriptionButton.handleInteraction === 'function') {
//             await descriptionButton.handleInteraction(interaction);
//         }

//         if (scheduleButton && typeof scheduleButton.handleInteraction === 'function') {
//     await scheduleButton.handleInteraction(client, interaction);
// }

// // --- MUSIC BUTTON HANDLER ---
//         //if (!interaction.isButton()) return;

//         // Import only once at top of your index.js
//         // const musicButton = require('./commands/music_button.js');

//         // When user clicks "Music" button
//         if (interaction.isButton() && interaction.customId === 'music') {
//             await musicButton.execute(interaction);
//             return;
//         }

//         // When user clicks song buttons (like "Tokyo Drift" or "Never Gonna Give You Up")
//         const handled = await musicButton.handleSongButtons(interaction);
//         if (handled) return;

//         // Optional: when user clicks "Back to Menu" (returns to main buttons)
//         if (interaction.isButton() && interaction.customId === 'back_to_menu') {
//             const descriptionButton = require('./commands/description_button.js');
//             await descriptionButton.execute(interaction);
//         }

//     } catch (err) {
//         console.error('Interaction handler error:', err);
//     }
// });
// Handle button interactions (like Roulette button)
// client.on('interactionCreate', async (interaction) => {
//     try {

//             // --- NEW MUSIC CONTROL BUTTON HANDLER ---
//         // This handles the "Pause", "Skip", "Stop", and "Queue" buttons
//         if (interaction.isButton() && interaction.customId.startsWith('music_')) {
//             const queue = client.distube.getQueue(interaction.guildId);

//             // Check if bot is in a channel
//             if (!queue) {
//                 return interaction.reply({ content: 'Bot is not playing anything.', ephemeral: true });
//             }

//             // Check if user is in the same channel
//             if (interaction.member.voice.channelId !== queue.voice.channelId) {
//                 return interaction.reply({ content: 'You must be in the same voice channel!', ephemeral: true });
//             }

//             try {
//                 switch (interaction.customId) {
//                 case 'music_pause_resume':
//                     if (queue.paused) {
//                     queue.resume();
//                     await interaction.reply({ content: 'Resumed the music.', ephemeral: true });
//                     } else {
//                     queue.pause();
//                     await interaction.reply({ content: 'Paused the music.', ephemeral: true });
//                     }
//                     break;

//                 case 'music_skip':
//                     if (queue.songs.length <= 1) {
//                     await interaction.reply({ content: 'No more songs to skip. Stopping queue.', ephemeral: true });
//                     queue.stop(); // Stop if no more songs
//                     } else {
//                     await queue.skip();
//                     await interaction.reply({ content: 'Skipped the song.', ephemeral: true });
//                     // The 'playSong' event will automatically update the embed
//                     }
//                     break;

//                 case 'music_stop':
//                     queue.stop();
//                     await interaction.reply({ content: 'Stopped the music and cleared the queue.', ephemeral: true });
//                     // The 'finish' or 'disconnect' event will handle cleaning the embed
//                     break;
                    
//                 case 'music_queue':
//                     const songList = queue.songs
//                         .map((song, i) => `**${i}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\``)
//                         .slice(0, 10) // Show top 10 (index 0 is current song)
//                         .join('\n');
                        
//                     // This requires EmbedBuilder to be imported at the top of your index.js
//                     const queueEmbed = new EmbedBuilder() 
//                         .setColor('#FFFFFF')
//                         .setTitle('Music Queue')
//                         .setDescription(songList || 'Queue is empty.')
//                         .setFooter({ text: `Now Playing: ${queue.songs[0].name}` });
                        
//                     await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
//                     break;
//                 }
//             } catch (e) {
//                 console.error('Music control error:', e);
//                 await interaction.reply({ content: `An error occurred: ${e.message}`, ephemeral: true });
//             }
//             return; // Stop further processing in this interaction
//         }
//         // --- END OF NEW MUSIC CONTROL HANDLER ---

//         if (rouletteButton && typeof rouletteButton.handleInteraction === 'function') {
//             await rouletteButton.handleInteraction(client, interaction);
//         }

//         if (descriptionButton && typeof descriptionButton.handleInteraction === 'function') {
//             await descriptionButton.handleInteraction(interaction);
//         }

//         if (scheduleButton && typeof scheduleButton.handleInteraction === 'function') {
//             await scheduleButton.handleInteraction(client, interaction);
//         }

//         // --- MUSIC BUTTON HANDLER ---
//         // When user clicks "Music" button
//         if (interaction.isButton() && interaction.customId === 'music') {
//             await musicButton.execute(interaction);
//             return;
//         }

//         // When user clicks song buttons
//         const musicHandled = await musicButton.handleSongButtons(interaction);
//         if (musicHandled) return;

//         // --- PLAYLIST BUTTON HANDLER ---
//         // When user clicks "Playlist" button
//         if (interaction.isButton() && interaction.customId === 'playlist') {
//             await playlistButton.execute(interaction);
//             return;
//         }

//         // Handle all playlist interactions (create, delete, add song, remove song, play all, etc.)
//         const playlistHandled = await playlistButton.handleInteraction(client, interaction);
//         if (playlistHandled) return;

//         // Optional: when user clicks "Back to Menu" (returns to main buttons)
//         if (interaction.isButton() && interaction.customId === 'back_to_menu') {
//             const descriptionButton = require('./commands/description_button.js');
//             await descriptionButton.execute(interaction);
//         }

//     } catch (err) {
//         console.error('Interaction handler error:', err);
//     }
// });

// Handle button interactions (like Roulette button)
// Handle button interactions (like Roulette button)
// Handle button interactions (like Roulette button)
client.on('interactionCreate', async (interaction) => {
    try {

        if (await moreButton.handleInteraction(interaction)) return;
        if (await profileButton.handleInteraction(client, interaction)) return;
        if (await healthButton.handleInteraction(client, interaction)) return;

        // --- MUSIC CONTROL BUTTON HANDLER ---
        // This handles the "Pause", "Skip", "Stop", "Queue", and "Filters" buttons
        if (interaction.isButton() && interaction.customId.startsWith('distube_')) {
            const queue = client.distube.getQueue(interaction.guildId);

            // Check if bot is in a channel
            if (!queue) {
                return interaction.reply({ content: 'Bot is not playing anything.', ephemeral: true });
            }

            // Check if user is in the same channel
            if (interaction.member.voice.channelId !== queue.voice.channelId) {
                return interaction.reply({ content: 'You must be in the same voice channel!', ephemeral: true });
             }

            try {
                switch (interaction.customId) {
                case 'distube_pause_resume':
                    if (queue.paused) {
                        queue.resume();
                    } else {
                        queue.pause();
                    }
                        await interaction.deferUpdate();
                    break;

                case 'distube_skip':
                    if (queue.songs.length <= 1) {
                        queue.stop(); // Stop if no more songs
                    } else {
                        await queue.skip();
                    }
                        await interaction.deferUpdate();
                    break;

                case 'distube_stop':
                    queue.stop();
                        await interaction.deferUpdate();
                    break;
                    
                case 'distube_queue':
                    const songList = queue.songs
                        .map((song, i) => `**${i}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\``)
                        .slice(0, 10) 
                        .join('\n');
                        
                    const queueEmbed = new EmbedBuilder() 
                        .setColor('#FFFFFF')
                        .setTitle('Music Queue')
                        .setDescription(songList || 'Queue is empty.')
                        .setFooter({ text: `Now Playing: ${queue.songs[0].name}` });
                        
                    await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
                    break;

                    // --- 👇 1. ADDED THIS NEW CASE 👇 ---
                    case 'distube_filters':
                        // This calls the helper function you added in Change 2
                        const filterMessage = createFilterMessage(queue);
                        await interaction.reply(filterMessage);
                        break;

                } // --- End of switch
            } catch (e) {
                console.error('Music control error:', e);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `An error occurred: ${e.message}`, ephemeral: true });
                }
            }
             return; // Stop further processing in this interaction
        }
       // --- END OF NEW MUSIC CONTROL HANDLER ---


        // --- 👇 2. ADDED THIS ENTIRE NEW HANDLER 👇 ---

        // --- NEW FILTER SELECTION HANDLER ---
        // This handles clicks on 'filter_bassboost', 'filter_clear', etc.
        if (interaction.isButton() && interaction.customId.startsWith('filter_')) {
            const queue = client.distube.getQueue(interaction.guildId);

            if (!queue) {
                return interaction.reply({ content: 'Bot is not playing anything.', ephemeral: true });
            }
            if (interaction.member.voice.channelId !== queue.voice.channelId) {
                return interaction.reply({ content: 'You must be in the same voice channel!', ephemeral: true });
            }

            const filterName = interaction.customId.replace('filter_', ''); // e.g., 'bassboost' or 'clear'

            try {
                if (filterName === 'clear') {
                    await queue.filters.clear();
                } else {
                    // This toggles the filter on or off
                    if (queue.filters.has(filterName)) {
                        await queue.filters.remove(filterName);
                    } else {
                        await queue.filters.add(filterName);
                    }
                }

                // After toggling, UPDATE the message with the new button states
                // This calls the helper function again to get new buttons
                const filterMessage = createFilterMessage(queue);
                await interaction.update(filterMessage); // .update() edits the existing filter message

            } catch (e) {
                console.error('Filter toggle error:', e);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: `An error occurred: ${e.message}`, ephemeral: true });
                }
            }
            return;
        }
        // --- END OF NEW FILTER HANDLER ---


        // --- YOUR EXISTING HANDLERS (UNCHANGED) ---
        if (rouletteButton && typeof rouletteButton.handleInteraction === 'function') {
            await rouletteButton.handleInteraction(client, interaction);
        }

        if (descriptionButton && typeof descriptionButton.handleInteraction === 'function') {
        await descriptionButton.handleInteraction(interaction);
        }

        if (scheduleButton && typeof scheduleButton.handleInteraction === 'function') {
            await scheduleButton.handleInteraction(client, interaction);
        }

        // --- MUSIC BUTTON HANDLER ---
        // When user clicks "Music" button
        if (interaction.isButton() && interaction.customId === 'music') {
            await musicButton.execute(interaction);
            return;
        }

        // When user clicks song buttons (This will now work!)
        const musicHandled = await musicButton.handleSongButtons(interaction);
        if (musicHandled) return;

        // --- PLAYLIST BUTTON HANDLER ---
        // When user clicks "Playlist" button
        if (interaction.isButton() && interaction.customId === 'playlist') {
            await playlistButton.execute(interaction);
            return;
        }

        // Handle all playlist interactions (create, delete, add song, remove song, play all, etc.)
        const playlistHandled = await playlistButton.handleInteraction(client, interaction);
        if (playlistHandled) return;

        // Optional: when user clicks "Back to Menu" (returns to main buttons)
       if (interaction.isButton() && interaction.customId === 'back_to_menu') {
            const descriptionButton = require('./commands/description_button.js');
            await descriptionButton.execute(interaction);
        }

    } catch (err) {
        console.error('Interaction handler error:', err);
    }
});

// Login
client.login(process.env.TOKEN);