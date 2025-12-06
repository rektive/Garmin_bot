// commands/karma.js
// Handles 30% backfire on certain commands

module.exports = {
    handle: async (message, command, target) => {
        // Safety checks
        if (!command || !target) return target;

        // List of commands that karma can backfire on
        const commandsWithKarma = ['assign', 'mute', 'disconnect', 'kaboom', 'lock'];

        // Only apply karma to these commands
        if (!commandsWithKarma.includes(command)) return target;

        // 30% chance to backfire
        const backfire = Math.random() < 0.2;

        if (backfire) {
            // For kaboom, do not announce who got affected
            if (command !== 'kaboom') {
                await message.channel.send(`💥 System Karma activated! ${message.member.user.tag} got affected instead of ${target.user.tag}.`);
            }
            return message.member; // backfire target
        }

        return target; // normal behavior
    }
};
