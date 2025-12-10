// const { getVoiceConnection } = require('@discordjs/voice'); // <-- Import this
// const levelSystem = require('./level_system.js');
// const health = require('./health.js');

// module.exports = {
//     name: 'restart',
//     description: 'Soft resets the bot connection and cleans up voice states.',
    
//     execute: async (message, args) => {
//         const OWNER_ID = '479224801324695561'; // Your ID

//         if (message.author.id !== OWNER_ID) {
//             return message.reply('⛔ Access Denied. Only the owner can restart Garmin.');
//         }

//         await message.reply('🔄 Performing soft reset... (Cleaning voice connections & reconnecting)');
//         console.log(`Soft reset initiated by ${message.author.tag}`);

//         // 1. Save Data
//         try {
//             levelSystem.save(message.client);
//             health.save(message.client);
//             console.log('Data saved before reset.');
//         } catch (err) {
//             console.error('Failed to save data during reset:', err);
//         }

//         // 2. CLEANUP VOICE CONNECTIONS (The Fix)
//         // We must destroy all existing voice connections before restarting the client.
//         // Otherwise, the new client sees "zombie" connections it can't control.
//         console.log('Cleaning up voice connections...');
//         message.client.guilds.cache.forEach(guild => {
//             const connection = getVoiceConnection(guild.id);
//             if (connection) {
//                 console.log(`Destroying voice connection in guild: ${guild.name}`);
//                 connection.destroy(); // Forcefully disconnect
//             }
//         });

//         // 3. Refresh the connection
//         // We use a small timeout to let the voice connections finish closing
//         setTimeout(async () => {
//             try {
//                 await message.client.destroy();
                
//                 console.log('Client destroyed. Reconnecting...');
                
//                 await message.client.login(process.env.TOKEN);
                
//                 console.log('Soft reset complete. Bot is back online.');
//             } catch (err) {
//                 console.error('Failed to reconnect:', err);
//             }
//         }, 1000); // 1 second delay to ensure clean disconnects
//     }
// };

const { getVoiceConnection } = require('@discordjs/voice');
const levelSystem = require('./level_system.js');
const health = require('./health.js');
const { spawn } = require('child_process'); // <-- 1. Import this for the "Hard" restart

module.exports = {
    name: 'restart',
    description: 'Hard restarts the bot process to fix bugs and ghosts.',
    
    execute: async (message, args) => {
        const OWNER_ID = '479224801324695561';

        if (message.author.id !== OWNER_ID) {
            return message.reply('⛔ Access Denied. Only the owner can restart Garmin.');
        }

        await message.reply('🔄 **REBOOTING SYSTEM:** Saving data, clearing voice, and spawning a fresh process...');
        console.log(`Hard restart initiated by ${message.author.tag}`);

        // 2. Save Data (Keep this!)
        try {
            levelSystem.save(message.client);
            health.save(message.client);
            console.log('Data saved before restart.');
        } catch (err) {
            console.error('Failed to save data:', err);
        }

        // 3. Clean up Voice (Keep this to prevent "Voice Already Created" errors!)
        console.log('Cleaning up voice connections...');
        message.client.guilds.cache.forEach(guild => {
            const connection = getVoiceConnection(guild.id);
            if (connection) {
                console.log(`Destroying voice connection in guild: ${guild.name}`);
                connection.destroy();
            }
        });

        // 4. THE MAGIC: Spawn a NEW bot process
        // This starts a completely new "Garmin" in the background
        const child = spawn(process.argv[0], process.argv.slice(1), {
            detached: true, 
            stdio: 'inherit'
        });

        // 5. Unlink the new bot from the old one so it can run alone
        child.unref();

        // 6. KILL THE OLD BOT (This fixes the "Ghost" double messages)
        console.log('Exiting old process...');
        process.exit(0);
    }
};