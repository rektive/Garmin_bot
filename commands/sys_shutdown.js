// sys_shutdown.js
const { exec } = require('child_process');

module.exports = {
    name: 'sys_shutdown',

    canHandle: (message, PREFIX) => {
        return message.content.toLowerCase() === `${PREFIX.toLowerCase()} shutdown`;
    },

    handle: async (message, PREFIX) => {
        const ALLOWED_USER_ID = '479224801324695561'; // your Discord ID

        if (message.author.id !== ALLOWED_USER_ID) {
            await message.reply('Ti kto takoy chtobi vykluchat laptop? 💀');
            return;
        }

        await message.reply('⚠️ Shutting down Garmin bot and system in 5 seconds...');
        console.log(`⚠️ System shutdown (bot + PC) triggered by ${message.author.tag}`);

        // Step 1 — wait a bit to send message and finish bot tasks
        setTimeout(() => {
            // Step 2 — shutdown system
            exec('shutdown /s /t 0', (error) => {
                if (error) console.error('❌ Failed to execute system shutdown:', error);
            });

            // Step 3 — safely stop the bot process (after command sent)
            process.exit(0);
        }, 5000);
    }
};
