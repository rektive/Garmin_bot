 // index.js
require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const fs = require('fs');
const path = require('path');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');

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

// DisTube Events
client.distube
  .on('playSong', (queue, song) => {
    queue.textChannel.send(`🎵 Now playing: **${song.name}** - \`${song.formattedDuration}\``);
  })
  .on('addSong', (queue, song) => {
    queue.textChannel.send(`✅ Added to queue: **${song.name}** - \`${song.formattedDuration}\``);
  })
  .on('addList', (queue, playlist) => {
    queue.textChannel.send(`✅ Added playlist: **${playlist.name}** (${playlist.songs.length} songs)`);
  })
  .on('error', (queue, error) => {
    console.error('DisTube error:', error);
    if (queue && queue.textChannel) {
      queue.textChannel.send('⚠️ An error occurred while playing music.');
    }
  })
  .on('finish', (queue) => {
    queue.textChannel.send('⏏️ Queue finished. Leaving voice channel...');
    
    // Leave the voice channel after queue finishes
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
  .on('disconnect', (queue) => {
    queue.textChannel.send('👋 Disconnected from voice channel.');
  })
  .on('empty', (queue) => {
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

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
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
    await emergCommand.handle(message, PREFIX);
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

// Help message
if (!command || command === 'garmin' || command === 'help') {
    const { ActionRowBuilder } = require('discord.js');
    const descriptionButton = require('./commands/description_button');
    //const scheduleButton = require('./commands/schedule_button'); // Schedule button import

    if (hasEveryone && hasBGM && !hasAdminRole) {
        // BGM users see only roulette + description
        const row = new ActionRowBuilder().addComponents(
            rouletteButton.createRow(PREFIX).components[0],
            descriptionButton.createRow(PREFIX).components[0],
            musicButton.createButton().components[0],
            playlistButton.createButton().components[0]
            //scheduleButton.createButton() // <- updated
        );

        await message.reply({
            content: `K vashim uslugam sir.\nAvailable commands:\n- ${PREFIX} roulette @Garmin-bot`,
            components: [row],
        });
    } else {
        // Admin or full-access users see all commands + buttons
        const row = new ActionRowBuilder().addComponents(
            rouletteButton.createRow(PREFIX).components[0],
            descriptionButton.createRow(PREFIX).components[0],
            scheduleButton.createButton(), // <- updated
            musicButton.createButton().components[0],
            playlistButton.createButton().components[0]
        );

        await message.reply({
            content: `K vashim uslugam sir - ${message.member}\nAvailable commands:\n- ${PREFIX} disconnect @User\n- ${PREFIX} mute @User\n- ${PREFIX} kaboom @User\n - ${PREFIX} call @User \n- Or use buttons below:`,
            components: [row],
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

            await actualTarget.voice.setChannel(null, `Disconnected by ${member.user.tag}`);
            message.channel.send(`${actualTarget.user.tag} has been disconnected from voice.`);
        } catch (err) {
            message.channel.send('Failed to disconnect the user.');
        }
    } else {
        message.channel.send(`${message.member} - you are in developer mode\nUse "!Garmin exit-dev @User" to procede`);
    }
    }
// Mute
    else if (command === 'mute') {
    if (!target.voice.channel) return message.reply('This user is not in a voice channel.');
    try {
        const actualTarget = await karma.handle(message, 'mute', target);

        await actualTarget.voice.setMute(true, `Muted by ${member.user.tag}`);
        message.channel.send(`${actualTarget.user.tag} has been muted for 15 seconds.`);

        // Unmute after 15 seconds
        setTimeout(async () => {
            try {
                await target.voice.setMute(false, `Automatically unmuted after 10 seconds`);
                message.channel.send(`${target.user.tag} has been unmuted.`);
            } catch (err) {
                message.channel.send(`Failed to unmute ${target.user.tag}.`);
                console.error(err);
            }
        }, 10000); // 15000 ms = 15 seconds

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
            await message.channel.send(`${actualTarget.user.tag} got kaboomed!`);
        } catch (err) {
            await message.channel.send('Kaboom failed.');
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
client.on('interactionCreate', async (interaction) => {
    try {
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

        // When user clicks song buttons
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
