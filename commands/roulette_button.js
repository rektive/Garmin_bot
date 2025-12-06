// // commands/roulette_button.js
// const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
// const { 
//   joinVoiceChannel, 
//   createAudioPlayer, 
//   createAudioResource, 
//   AudioPlayerStatus, // We will use .Idle
//   getVoiceConnection 
// } = require('@discordjs/voice');
// const path = require('path');
// const fs = require('fs');

// module.exports = {
//   name: 'roulette_button',

//   createRow: (PREFIX) => {
//     // ... (same as before)
//     const row = new ActionRowBuilder().addComponents(
//       new ButtonBuilder()
//         .setCustomId('garmin_roulette')
//         .setLabel('🎲 Start Roulette')
//         .setStyle(ButtonStyle.Success)
//     );
//     return row;
//   },

//   handleInteraction: async (client, interaction) => {
//     if (!interaction.isButton()) return;
//     if (interaction.customId !== 'garmin_roulette') return;

//     await interaction.deferReply({ ephemeral: false });

//     const member = interaction.member;
//     const guild = interaction.guild;

//     // --- All your permission and user checks ---
//     // (This code is all the same as before)
//     const hasBGM = member.roles.cache.some(r => r.name === 'BGM');
//     const hasG = member.roles.cache.some(r => r.name === 'G');
//     if (!hasBGM && !hasG) {
//       return interaction.editReply('Only users with the BGM or G role can use this command.');
//     }
//     const voiceMembers = guild.members.cache.filter(m => m.voice.channel && !m.user.bot);
//     if (!voiceMembers.size) {
//       return interaction.editReply("Sir, nikogo net v voice channel (");
//     }
//     if (!member.voice.channel) {
//       try {
//         const muteDuration = 60 * 1000;
//         await member.timeout(muteDuration, 'Locked for not being in voice channel during roulette');
//         await interaction.editReply(`🔇 ${member.user.tag}, you are locked for 1 minute because you are not in a voice channel.`);
//       } catch (err) {
//         console.error('Failed to lock user:', err);
//         await interaction.editReply(`⚠️ Failed to lock ${member.user.tag}: ${err.message}`);
//       }
//       return;
//     }
//     const randomIndex = Math.floor(Math.random() * voiceMembers.size);
//     const target = Array.from(voiceMembers.values())[randomIndex];
//     const channel = target.voice.channel;
//     if (!channel) return interaction.editReply("Selected user is not in a voice channel.");
    
//     await interaction.editReply(`🎲 Ruletka poletela.`);

//     // --- ✨ "ON FINISH" LOGIC ✨ ---
    
//     const distubeQueue = client.distube.getQueue(interaction.guildId);
//     let wasPlaying = false;
    
//     try {
//       if (distubeQueue && (distubeQueue.playing || distubeQueue.paused)) {
//         console.log('DisTube queue found. Pausing it.');
//         await distubeQueue.pause();
//         wasPlaying = true;
//       }
//     } catch (e) {
//       console.error('Failed to pause DisTube:', e);
//     }
    
//     try {
      
//       // --- 💡💡💡 FILE PATH CORRECTED 💡💡💡 ---
//       // This path goes UP ONE from 'commands' (..) and then DOWN INTO 'intro_audio'
//       const audioPath = path.join(__dirname, '..', 'intro_audio', 'vkus.mp3');
//       // --- 💡💡💡 END OF CHANGE 💡💡💡 ---
      
//       if (!fs.existsSync(audioPath)) {
//         console.error('🔴 FILE NOT FOUND at path:', audioPath);
//         return interaction.followUp('Audio file not found. Please check server logs.');
//       }

//       const player = createAudioPlayer();
//       const resource = createAudioResource(audioPath);
      
//       let connection = getVoiceConnection(channel.guild.id);
//       if (!connection || connection.joinConfig.channelId !== channel.id) {
//         connection = joinVoiceChannel({
//           channelId: channel.id,
//           guildId: channel.guild.id,
//           adapterCreator: channel.guild.voiceAdapterCreator,
//         });
//       }

//       connection.subscribe(player);
//       player.play(resource);

//       player.on(AudioPlayerStatus.Playing, () => {
//         console.log('Player status: PLAYING');
//       });
//       player.on('error', error => {
//         console.error('🔴 PLAYER ERROR:', error);
//       });

//       // This event *only* runs when the player finishes playing the audio.
//       player.on(AudioPlayerStatus.Idle, async () => {
//         console.log(`Audio finished. Running disconnect logic.`);
//         try {
//           // --- Your disconnect logic ---
//           await target.voice.setChannel(null, `Disconnected by roulette`);
//           await channel.permissionOverwrites.edit(target.id, { Connect: false });
//           await interaction.channel.send(`💥 ${target.user.tag} syebalsa s voice channel for 15 sec)`);

//           setTimeout(async () => {
//             try {
//               await channel.permissionOverwrites.edit(target.id, { Connect: true });
//             } catch (err) {
//               console.log(`Failed to restore permissions for ${target.user.tag}:`, err);
//             }
//           }, 15000); // The 15-second restore timer

//         } catch (err) {
//           console.log(err);
//           await interaction.channel.send(`Failed to disconnect ${target.user.tag}.`);
//         } finally {
//           // --- CLEANUP & RESUME DISTUBE ---
//           player.stop();
          
//           if (wasPlaying && distubeQueue) {
//             console.log('Resuming DisTube queue.');
//             try {
//               await distubeQueue.resume();
//             } catch (e) {
//               console.error('Failed to resume DisTube:', e);
//             }
//           } else {
//             if (connection.state.status !== 'destroyed') {
//               console.log('DisTube not active. Destroying our connection.');
//               connection.destroy();
//             }
//           }
//         }
//       }); // ⬅️ End of Idle listener

//     } catch (err) {
//       console.error('🔴 TOP-LEVEL CATCH ERROR:', err);
//       await interaction.followUp('A critical error occurred. Check the logs.');
      
//       if (wasPlaying && distubeQueue) {
//         console.log('Resuming DisTube after error.');
//         try { await distubeQueue.resume(); } catch (e) { console.error('Failed to resume DisTube:', e); }
//       }
//     }
//   }
// };

// commands/roulette_button.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js'); // <-- 1. ADDED EmbedBuilder
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  getVoiceConnection 
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');
const health = require('./health.js'); // <-- 2. IMPORTED HEALTH

module.exports = {
  name: 'roulette_button',

  createRow: (PREFIX) => {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('garmin_roulette')
        .setLabel('🎲 Start Roulette')
        .setStyle(ButtonStyle.Success)
    );
    return row;
  },

  handleInteraction: async (client, interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'garmin_roulette') return;

    await interaction.deferReply({ ephemeral: false });

    const member = interaction.member;
    const guild = interaction.guild;

    // --- All your permission and user checks ---
    const hasBGM = member.roles.cache.some(r => r.name === 'BGM');
    const hasG = member.roles.cache.some(r => r.name === 'G');
    if (!hasBGM && !hasG) {
      return interaction.editReply('Only users with the BGM or G role can use this command.');
    }
    const voiceMembers = guild.members.cache.filter(m => m.voice.channel && !m.user.bot);
    if (!voiceMembers.size) {
      return interaction.editReply("Sir, nikogo net v voice channel (");
    }

    // --- 3. MODIFIED THIS BLOCK ---
    if (!member.voice.channel) {
      try {
        const muteDuration = 60 * 1000;
        await member.timeout(muteDuration, 'Locked for not being in voice channel during roulette');
        await interaction.editReply(`🔇 ${member.user.tag}, you are locked for 1 minute because you are not in a voice channel.`);
        
        // --- ADDED HEALTH DAMAGE ---
        const damageEmbed = await health.applyDamage(client, member, 40, 'Roulette Lock (Not in VC)');
        await interaction.channel.send({ embeds: [damageEmbed] });

      } catch (err) {
        console.error('Failed to lock user:', err);
        await interaction.editReply(`⚠️ Failed to lock ${member.user.tag}: ${err.message}`);
      }
      return;
    }
    // --- END OF MODIFICATION ---

    const randomIndex = Math.floor(Math.random() * voiceMembers.size);
    const target = Array.from(voiceMembers.values())[randomIndex];
    const channel = target.voice.channel;
    if (!channel) return interaction.editReply("Selected user is not in a voice channel.");
    
    //await interaction.editReply(`🎲 Ruletka poletela.`);

    // --- ✨ "ON FINISH" LOGIC ✨ ---
    
    const distubeQueue = client.distube.getQueue(interaction.guildId);
    let wasPlaying = false;
    
    try {
      if (distubeQueue && (distubeQueue.playing || distubeQueue.paused)) {
        console.log('DisTube queue found. Pausing it.');
        await distubeQueue.pause();
        wasPlaying = true;
      }
    } catch (e) {
      console.error('Failed to pause DisTube:', e);
    }
    
    try {
      
      const audioPath = path.join(__dirname, '..', 'intro_audio', 'vkus.mp3');
      
      if (!fs.existsSync(audioPath)) {
        console.error('🔴 FILE NOT FOUND at path:', audioPath);
        return interaction.followUp('Audio file not found. Please check server logs.');
     }

      const player = createAudioPlayer();
      const resource = createAudioResource(audioPath);
      
      let connection = getVoiceConnection(channel.guild.id);
      if (!connection || connection.joinConfig.channelId !== channel.id) {
        connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
         adapterCreator: channel.guild.voiceAdapterCreator,
        });
      }

      connection.subscribe(player);
      player.play(resource);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log('Player status: PLAYING');
      });
      player.on('error', error => {
        console.error('🔴 PLAYER ERROR:', error);
      });

      // This event *only* runs when the player finishes playing the audio.
      player.on(AudioPlayerStatus.Idle, async () => {
        console.log(`Audio finished. Running disconnect logic.`);
        try {
          // --- 4. MODIFIED THIS BLOCK ---

            // --- ADDED HEALTH DAMAGE ---
            const damageEmbed = await health.applyDamage(client, target, 10, 'Hit by Roulette');
            damageEmbed.setFooter({ text: `${target.user.tag} is blocked from rejoining for 15 seconds.` });
            await interaction.channel.send({ embeds: [damageEmbed] });
            // --- END HEALTH LOGIC ---

          // --- Your disconnect logic ---
          await target.voice.setChannel(null, `Disconnected by roulette`);
         await channel.permissionOverwrites.edit(target.id, { Connect: false });
          // await interaction.channel.send(`💥 ${target.user.tag} syebalsa s voice channel for 15 sec)`); // <-- REPLACED by embed

          setTimeout(async () => {
            try {
              await channel.permissionOverwrites.edit(target.id, { Connect: true });
            } catch (err) {
              console.log(`Failed to restore permissions for ${target.user.tag}:`, err);
           }
          }, 15000); // The 15-second restore timer

        } catch (err) {
          console.log(err);
          await interaction.channel.send(`Failed to disconnect ${target.user.tag}.`);
       } finally {
          // --- CLEANUP & RESUME DISTUBE ---
          player.stop();
          
          if (wasPlaying && distubeQueue) {
            console.log('Resuming DisTube queue.');
            try {
              await distubeQueue.resume();
            } catch (e) {
              console.error('Failed to resume DisTube:', e);
         }
          } else {
            if (connection.state.status !== 'destroyed') {
              console.log('DisTube not active. Destroying our connection.');
              connection.destroy();
            }
          }
        }
      }); // ⬅️ End of Idle listener

    } catch (err) {
      console.error('🔴 TOP-LEVEL CATCH ERROR:', err);
      await interaction.followUp('A critical error occurred. Check the logs.');
      
      if (wasPlaying && distubeQueue) {
        console.log('Resuming DisTube after error.');
        try { await distubeQueue.resume(); } catch (e) { console.error('Failed to resume DisTube:', e); }
      }
    }
  }
};

