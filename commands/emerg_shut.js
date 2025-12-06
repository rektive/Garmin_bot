// commands/emerg_shut.js
const levelSystem = require('./level_system.js'); // <-- 1. ADD THIS LINE

module.exports = {
    name: 'emerg_shut',

    canHandle: (message, PREFIX) => {
        return message.content.toLowerCase() === `${PREFIX.toLowerCase()} emergency`;
    },

    // 2. ADD 'client' to this function
    handle: async (message, PREFIX, client) => { 
        const ALLOWED_USER_ID = '479224801324695561'; // Discord ID

        if (message.author.id !== ALLOWED_USER_ID) {
            await message.reply('Ti kto takoy chtobi otkluchat menya?');
            return;
        }

        await message.reply('⚠️ Emergency shutdown initiated. Saving level data...');
        console.log(`⚠️ Bot shutdown triggered by ${message.author.tag}`);

        // --- 3. ADD THIS TRY...CATCH BLOCK ---
        try {
            levelSystem.save(client);
            console.log('Level data saved successfully.');
        } catch (err) {
            console.error('Failed to save level data during shutdown:', err);
            await message.channel.send('⚠️ **CRITICAL:** Failed to save level data!');
        }
        // --- END OF NEW BLOCK ---

        // Give the message time to send before exiting
        setTimeout(() => {
            process.exit(0); // stops the Node.js process
        }, 2000); // 4. Increased timeout to 2 seconds
    }
};