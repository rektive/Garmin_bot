const { getVoiceConnection } = require('@discordjs/voice');
const levelSystem = require('./level_system.js');
const health = require('./health.js');

module.exports = {
    name: 'restart',
    description: 'Smart restart: Soft reset on PC, Hard reset on Cloud.',
    
    execute: async (message, args) => {
        const OWNER_ID = '479224801324695561';

        if (message.author.id !== OWNER_ID) {
            return message.reply('⛔ Access Denied. Only the owner can restart Garmin.');
        }

        await message.reply('🔄 **SYSTEM REBOOT:** Saving data and restarting services...');
        console.log(`Restart initiated by ${message.author.tag}`);

        // 1. Save Data (Always important)
        try {
            levelSystem.save(message.client);
            health.save(message.client);
            console.log('Data saved before restart.');
        } catch (err) {
            console.error('Failed to save data:', err);
        }

        // 2. Clean up Voice (Always important)
        console.log('Cleaning up voice connections...');
        message.client.guilds.cache.forEach(guild => {
            try {
                const connection = getVoiceConnection(guild.id);
                if (connection) {
                    console.log(`Destroying voice connection in guild: ${guild.name}`);
                    connection.destroy();
                }
            } catch (error) {
                console.error(`Error clearing voice for guild ${guild.id}:`, error);
            }
        });

        // 3. Smart Restart Logic
        setTimeout(async () => {
            // Check for common environment variables used by Cloud Platforms
            const isCloudHost = process.env.RAILWAY_ENVIRONMENT || process.env.RENDER || process.env.DYNO;

            if (isCloudHost) {
                // --- CLOUD MODE: HARD CRASH ---
                // On Railway/Render, the only way to "restart" is to die.
                // The platform sees the crash and automatically starts a new one.
                console.log('☁️ Cloud Environment Detected. Exiting with code 1 to trigger platform auto-restart.');
                process.exit(1); 
            } else {
                // --- LOCAL PC MODE: SOFT RESET ---
                // We do NOT exit. We just destroy the client and re-login.
                // This keeps your terminal window open.
                console.log('💻 Local Environment Detected. Performing Soft Reset...');
                
                try {
                    // Destroy the client (logs out, stops listening)
                    await message.client.destroy();
                    console.log('Client destroyed. Reconnecting in 3 seconds...');

                    // Wait a moment to ensure ports open up
                    setTimeout(async () => {
                        // Clear module cache for commands? (Optional, complex to do right)
                        // For now, we just re-login to fix connection/voice bugs.
                        
                        await message.client.login(process.env.TOKEN);
                        console.log('✅ Soft reset complete. Bot is back online in the same process.');
                    }, 3000);
                } catch (err) {
                    console.error('❌ Failed to soft restart:', err);
                    console.log('Attempting hard exit as fallback...');
                    process.exit(1);
                }
            }
        }, 1000); 
    }
};