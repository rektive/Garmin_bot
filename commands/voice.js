// commands/voice.js
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  StreamType,
  AudioPlayerStatus,
} = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'voice',
  description: 'Join voice channel and play audio',

  canHandle: (message, PREFIX) => {
    if (!message.content) return false;
    return message.content.toLowerCase().startsWith(`${PREFIX.toLowerCase()} join `);
  },

  handle: async (message, PREFIX) => {
    const subTarget = message.mentions.members.first();
    if (!subTarget) return message.reply('Please mention a user to join their voice channel.');

    const voiceChannel = subTarget.voice.channel;
    if (!voiceChannel) return message.reply(`${subTarget.user.tag} is not in a voice channel.`);

    // Permission checks for bot
    const botMember = message.guild.members.me || message.guild.members.cache.get(message.client.user.id);
    const perms = voiceChannel.permissionsFor(botMember);
    if (!perms || !perms.has('Connect') || !perms.has('Speak')) {
      return message.reply('I need **Connect** and **Speak** permissions in that voice channel.');
    }

    try {
      // join WITHOUT selfDeaf/selfMute (explicit false)
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      const player = createAudioPlayer({
        behaviors: { noSubscriber: NoSubscriberBehavior.Play }, // play even if no subscribers
      });

      // subscribe and keep subscription (optional)
      const subscription = connection.subscribe(player);
      if (!subscription) {
        console.warn('Warning: subscription returned null (no active subscription).');
      }

      // utility: pick & play random audio from folder (folders are one level up from commands)
      const playRandomAudioFromFolder = (folderName) => {
        try {
          const folderPath = path.join(__dirname, '..', folderName);
          if (!fs.existsSync(folderPath)) {
            console.warn(`Audio folder does not exist: ${folderPath}`);
            return false;
          }
          const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(mp3|wav|m4a|ogg)$/i));
          if (!files.length) {
            console.warn(`No audio files found in ${folderPath}`);
            return false;
          }
          const randomFile = files[Math.floor(Math.random() * files.length)];
          const filePath = path.join(folderPath, randomFile);
          console.log(`voice.js -> playing file: ${filePath}`);
          const resource = createAudioResource(fs.createReadStream(filePath), { inputType: StreamType.Arbitrary });
          player.play(resource);
          return true;
        } catch (err) {
          console.error('Error in playRandomAudioFromFolder:', err);
          return false;
        }
      };

      // player events for debugging
      player.on('error', (err) => {
        console.error('Audio player error:', err);
      });
      player.on(AudioPlayerStatus.Playing, (old) => {
        console.log('Audio player status: Playing');
      });
      player.on(AudioPlayerStatus.Idle, () => {
        console.log('Audio player status: Idle');
      });

      // Wait for the connection to become ready before starting audio (max 10s)
      const waitForReady = (conn, timeout = 10000) => {
        return new Promise((resolve, reject) => {
          const handled = () => {
            if (conn.state.status === 'ready') {
              conn.off('stateChange', handled);
              clearTimeout(timer);
              resolve();
            }
          };
          const timer = setTimeout(() => {
            conn.off('stateChange', handled);
            reject(new Error('Voice connection did not become ready within timeout'));
          }, timeout);
          conn.on('stateChange', handled);
          // immediate check
          if (conn.state.status === 'ready') {
            conn.off('stateChange', handled);
            clearTimeout(timer);
            return resolve();
          }
        });
      };

      try {
        await waitForReady(connection, 10000);
        console.log('Voice connection ready.');
      } catch (err) {
        console.warn('Voice connection may not be ready:', err.message);
        // still try to play — but log this
      }

      // Play intro after 3s
      setTimeout(() => {
        const ok = playRandomAudioFromFolder('intro_audio');
        if (!ok) message.channel.send('⚠️ No intro audio available or failed to play.');
      }, 1500);

      // Play mid audio every 10 minutes while connected
      const interval = setInterval(() => {
        const status = connection.state?.status;
        if (!status || status === 'disconnected' || status === 'destroyed') {
          clearInterval(interval);
          return;
        }
        const ok = playRandomAudioFromFolder('mid_audio');
        if (!ok) console.warn('mid_audio playback failed or no files.');
      }, 10 * 60 * 1000); // 10 minutes

      // cleanup when disconnected/destroyed
      connection.on('stateChange', (oldState, newState) => {
        if (['disconnected', 'destroyed'].includes(newState.status)) {
          clearInterval(interval);
          try { player.stop(true); } catch (e) {}
          console.log('Voice connection ended, cleared mid audio interval.');
        }
      });

      //await message.channel.send(`✅ Joined **${voiceChannel.name}** — will play intro and periodic audio.`);

    } catch (err) {
      console.error('Error joining voice channel:', err);
      message.channel.send(`⚠️ Failed to join the voice channel: ${err.message}`);
    }
  },
};




















