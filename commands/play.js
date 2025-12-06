// // commands/play.js
// const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, StreamType } = require('@discordjs/voice');
// const ytdl = require('@distube/ytdl-core'); // updated fork
// const ytsr = require('ytsr');

// const queue = new Map(); // guildId -> { voiceChannel, textChannel, connection, player, songs[], timeout }

// module.exports = {
//   name: 'play',

//   async execute(message, args) {
//     if (!args || !args.length) return message.reply('Please provide a song name or YouTube link.');

//     const query = args.join(' ');
//     const voiceChannel = message.member.voice.channel;
//     if (!voiceChannel) return message.reply('You need to be in a voice channel to use this command.');

//     const botPerms = voiceChannel.permissionsFor(message.client.user);
//     if (!botPerms || !botPerms.has('Connect') || !botPerms.has('Speak')) {
//       return message.reply('I need **Connect** and **Speak** permissions in your voice channel.');
//     }

//     // Resolve song URL and title
//     let url;
//     let title = query;
//     try {
//       url = await resolveToUrl(query);
//       if (!url) return message.reply(`❌ No results found for **${query}**.`);

//       if (ytdl.validateURL(url)) {
//         const info = await ytdl.getBasicInfo(url);
//         if (info && info.videoDetails && info.videoDetails.title) title = info.videoDetails.title;
//       }
//     } catch (err) {
//       console.error('Resolve error:', err);
//       return message.reply('⚠️ Failed to find or resolve the song.');
//     }

//     const song = { title, url };
//     const guildId = message.guild.id;
//     let serverQueue = queue.get(guildId);

//     if (!serverQueue) {
//       const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
//       serverQueue = {
//         textChannel: message.channel,
//         voiceChannel,
//         connection: null,
//         player,
//         songs: [],
//         timeout: null,
//       };
//       queue.set(guildId, serverQueue);
//       serverQueue.songs.push(song);

//       try {
//         const connection = joinVoiceChannel({
//           channelId: voiceChannel.id,
//           guildId: message.guild.id,
//           adapterCreator: message.guild.voiceAdapterCreator,
//           selfDeaf: false,
//           selfMute: false,
//         });
//         serverQueue.connection = connection;
//         connection.subscribe(serverQueue.player);

//         // Player listeners
//         serverQueue.player.on('error', (err) => {
//           console.error('Audio player error:', err);
//           try { serverQueue.songs.shift(); } catch(e){}
//           playSong(message.guild, serverQueue.songs[0]);
//         });

//         serverQueue.player.on(AudioPlayerStatus.Idle, () => {
//           serverQueue.songs.shift();
//           playSong(message.guild, serverQueue.songs[0]);
//         });

//         await playSong(message.guild, song);
//         return message.channel.send(`✅ Queued and starting: **${song.title}**`);
//       } catch (err) {
//         console.error('Connection / play error:', err);
//         queue.delete(guildId);
//         return message.reply('⚠️ Could not join the voice channel or start playback.');
//       }
//     } else {
//       serverQueue.songs.push(song);
//       if (serverQueue.timeout) {
//         clearTimeout(serverQueue.timeout);
//         serverQueue.timeout = null;
//       }
//       return message.reply(`✅ Added to queue: **${song.title}**`);
//     }
//   },

//   skip: {
//     async execute(message) {
//       const serverQueue = queue.get(message.guild.id);
//       if (!serverQueue || !serverQueue.songs.length) return message.reply('Nothing is playing.');
//       serverQueue.player.stop();
//       return message.reply('⏭️ Skipped current song.');
//     },
//   },

//   stop: {
//     async execute(message) {
//       const serverQueue = queue.get(message.guild.id);
//       if (!serverQueue) return message.reply('Nothing is playing.');
//       serverQueue.songs = [];
//       try { serverQueue.player.stop(true); } catch(e){}
//       try { if(serverQueue.connection) serverQueue.connection.destroy(); } catch(e){}
//       queue.delete(message.guild.id);
//       return message.reply('🛑 Stopped playback and left voice channel.');
//     },
//   },

//   queue: {
//     async execute(message) {
//       const serverQueue = queue.get(message.guild.id);
//       if (!serverQueue || !serverQueue.songs.length) return message.reply('Queue is empty.');
//       const list = serverQueue.songs.map((s,i)=>`${i+1}. ${s.title}`).join('\n');
//       return message.reply(`🎶 Queue:\n${list}`);
//     },
//   },
// };

// // ----- helper functions -----

// async function resolveToUrl(query) {
//   if (ytdl.validateURL(query)) return query;
//   if (/youtu\.be\/[A-Za-z0-9_-]+/.test(query)) return query;

//   try {
//     const searchResults = await ytsr(query, { limit: 10 });
//     if (!searchResults?.items) return null;
//     const video = searchResults.items.find(i => i.type === 'video');
//     if (video && video.url) return video.url;
//     return null;
//   } catch (err) {
//     console.error('search error in resolveToUrl:', err);
//     throw err;
//   }
// }

// async function playSong(guild, song) {
//   const serverQueue = queue.get(guild.id);
//   if (!serverQueue) return;

//   if (!song) {
//     serverQueue.timeout = setTimeout(() => {
//       try { if(serverQueue.connection) serverQueue.connection.destroy(); } catch(e){}
//       queue.delete(guild.id);
//       serverQueue.textChannel?.send('⏏️ No requests for 5 minutes — leaving voice channel.');
//     }, 5*60*1000);
//     return;
//   }

//   try {
//     if (!song.url) throw new Error('Song URL missing.');

//     const stream = ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1<<25 });
//     const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
//     serverQueue.player.play(resource);
//     serverQueue.textChannel?.send(`🎵 Now playing: **${song.title}**`);
//   } catch(err) {
//     console.error('Error playing song:', err);
//     serverQueue.textChannel?.send('⚠️ Error playing song. Skipping to next.');
//     try { serverQueue.songs.shift(); } catch(e){}
//     playSong(guild, serverQueue.songs[0]);
//   }
// }













// commands/play.js
// This uses DisTube - a complete Discord music solution
module.exports = {
  name: 'play',

  async execute(message, args) {
    const distube = message.client.distube;
    
    if (!args || !args.length) {
      return message.reply('Please provide a song name or YouTube link.');
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('You need to be in a voice channel to use this command.');
    }

    const botPerms = voiceChannel.permissionsFor(message.client.user);
    if (!botPerms || !botPerms.has('Connect') || !botPerms.has('Speak')) {
      return message.reply('I need **Connect** and **Speak** permissions in your voice channel.');
    }

    const query = args.join(' ');
    
    try {
      await distube.play(voiceChannel, query, {
        member: message.member,
        textChannel: message.channel,
        message
      });
    } catch (err) {
      console.error('Play error:', err);
      return message.reply('⚠️ Failed to play the song. Please try again.');
    }
  },

  skip: {
    async execute(message) {
      const distube = message.client.distube;
      const queue = distube.getQueue(message.guild.id);
      
      if (!queue) {
        return message.reply('Nothing is playing.');
      }
      
      try {
        await distube.skip(message.guild.id);
        return message.reply('⏭️ Skipped current song.');
      } catch (err) {
        return message.reply('⚠️ Cannot skip this song.');
      }
    },
  },

  stop: {
    async execute(message) {
      const distube = message.client.distube;
      const queue = distube.getQueue(message.guild.id);
      
      if (!queue) {
        return message.reply('Nothing is playing.');
      }
      
      try {
        await distube.stop(message.guild.id);

        const connection = distube.voices.get(message.guild.id);
        if (connection) {
          connection.leave();
      }

        await message.reply('🛑 Stopped playback and left voice channel.');
        // Small delay to let DisTube cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        return message.reply('⚠️ Failed to stop playback.');
      }
    },
  },

  queue: {
    async execute(message) {
      const distube = message.client.distube;
      const queue = distube.getQueue(message.guild.id);
      
      if (!queue || !queue.songs.length) {
        //const connection = distube.voices.get(message.guild.id); // Creating connection
        // await new Promise(resolve => setTimeout(resolve, 10000));
        // if(connection) { // New lines///////////////////////////////////////////////
        //   connection.leave(); // New lines///////////////////////////////////////////////
        // }
        return message.reply('Queue is empty.');
      }
      
      const list = queue.songs
        .map((song, i) => `${i + 1}. ${song.name} - \`${song.formattedDuration}\``)
        .slice(0, 10)
        .join('\n');
      
      return message.reply(`🎶 Queue (${queue.songs.length} songs):\n${list}`);
    },
  },
};