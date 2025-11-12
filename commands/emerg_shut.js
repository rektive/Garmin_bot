// commands/emerg_shut.js
module.exports = {
    name: 'emerg_shut',

    canHandle: (message, PREFIX) => {
        return message.content.toLowerCase() === `${PREFIX.toLowerCase()} emergency`;
    },

    handle: async (message, PREFIX) => {
        const ALLOWED_USER_ID = '479224801324695561'; // Discord ID

        if (message.author.id !== ALLOWED_USER_ID) {
            await message.reply('Ti kto takoy chtobi otkluchat menya?');
            return;
        }

        await message.reply('⚠️ Emergency shutdown initiated.');
        console.log(`⚠️ Bot shutdown triggered by ${message.author.tag}`);

        // Give the message time to send before exiting
        setTimeout(() => {
            process.exit(0); // stops the Node.js process
        }, 1000);
    }
};
