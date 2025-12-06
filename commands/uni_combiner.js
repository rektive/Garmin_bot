// commands/uni_combiner.js
const { ROLE_TO_ASSIGN } = process.env;

module.exports = {
    name: 'uni_combiner',

    // Check if this message can be handled by the combiner
    canHandle: (message, PREFIX) => {
        if (!message.content) return false;
        return (
            message.content.toLowerCase().startsWith(`${PREFIX.toLowerCase()} `) &&
            message.content.toLowerCase().includes(' and ')
        );
    },

    // Handle the combined commands
    handle: async (message, PREFIX) => {
        const combinedParts = message.content
            .slice(PREFIX.length)
            .trim()
            .split(/\s+and\s+/i);

        for (const part of combinedParts) {
            const args = part.trim().split(/ +/);
            const subCommand = args.shift()?.toLowerCase();

            // Find the mention in THIS part
            const subTarget = message.mentions.members.find(
                m => part.includes(`<@${m.id}>`) || part.includes(`<@!${m.id}>`)
            );

            try {
                // assign
                if (subCommand === 'assign') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    const role = message.guild.roles.cache.find(r => r.name === ROLE_TO_ASSIGN);
                    if (!role) throw new Error(`Role "${ROLE_TO_ASSIGN}" does not exist.`);
                    await subTarget.roles.add(role);
                    await message.channel.send(`Role "${ROLE_TO_ASSIGN}" assigned to ${subTarget.user.tag}`);
                }

                // proceed
                else if (subCommand === 'proceed') {
                    const roleMention = part.match(/<@&(\d+)>/);
                    if (!roleMention) throw new Error(`Please mention a valid role for "${subCommand}".`);

                    const roleId = roleMention[1];
                    const role = message.guild.roles.cache.get(roleId);
                    if (!role) throw new Error(`The mentioned role does not exist on this server.`);

                    const isToAll = part.toLowerCase().includes('to all');
                    if (isToAll) {
                        const members = message.guild.members.cache.filter(m => !m.user.bot);
                        for (const [, m] of members) await m.roles.add(role).catch(() => {});
                        await message.channel.send(`✅ Role **${role.name}** assigned to everyone.`);
                    } else {
                        if (!subTarget) throw new Error(`Please mention a user or use "to all".`);
                        await subTarget.roles.add(role);
                        await message.channel.send(`✅ Role **${role.name}** assigned to ${subTarget.user.tag}.`);
                    }
                }

                // un-proceed
                else if (subCommand === 'un-proceed') {
                    const roleMention = part.match(/<@&(\d+)>/);
                    if (!roleMention) throw new Error(`Please mention a valid role for "${subCommand}".`);

                    const roleId = roleMention[1];
                    const role = message.guild.roles.cache.get(roleId);
                    if (!role) throw new Error(`The mentioned role does not exist on this server.`);

                    const isToAll = part.toLowerCase().includes('to all');
                    if (isToAll) {
                        const members = message.guild.members.cache.filter(m => !m.user.bot);
                        for (const [, m] of members) await m.roles.remove(role).catch(() => {});
                        await message.channel.send(`✅ Role **${role.name}** removed from everyone.`);
                    } else {
                        if (!subTarget) throw new Error(`Please mention a user or use "to all".`);
                        await subTarget.roles.remove(role);
                        await message.channel.send(`✅ Role **${role.name}** removed from ${subTarget.user.tag}.`);
                    }
                }

                // disconnect
                else if (subCommand === 'disconnect') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    if (!subTarget.voice.channel) throw new Error('This user is not in a voice channel.');
                    await subTarget.voice.setChannel(null, `Disconnected by ${message.author.tag}`);
                    await message.channel.send(`${subTarget.user.tag} has been disconnected from voice.`);
                }

                // unassign
                else if (subCommand === 'unassign') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    const role = message.guild.roles.cache.find(r => r.name === ROLE_TO_ASSIGN);
                    if (!role) throw new Error(`Role "${ROLE_TO_ASSIGN}" does not exist.`);
                    await subTarget.roles.remove(role);
                    await message.channel.send(`Role "${ROLE_TO_ASSIGN}" removed from ${subTarget.user.tag}`);
                }

                // grant
                else if (subCommand === 'grant') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    const role = message.guild.roles.cache.find(r => r.name === 'G');
                    if (!role) throw new Error('Role "G" does not exist.');
                    await subTarget.roles.add(role);
                    await message.channel.send(`Role "G" granted to ${subTarget.user.tag}`);
                }

                // ungrant
                else if (subCommand === 'ungrant') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    const role = message.guild.roles.cache.find(r => r.name === 'G');
                    if (!role) throw new Error('Role "G" does not exist.');
                    await subTarget.roles.remove(role);
                    await message.channel.send(`Role "G" removed from ${subTarget.user.tag}`);
                }

                // enter-dev
                else if (subCommand === 'enter-dev') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    const hasG = subTarget.roles.cache.some(r => r.name === 'G');
                    if (!hasG) throw new Error(`${subTarget.user.tag} is not in Developer Mode.`);
                    await message.channel.send(`${subTarget.user.tag} has entered Developer Mode 🧠`);
                }

                // bgm
                else if (subCommand === 'bgm') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    const role = message.guild.roles.cache.find(r => r.name === 'BGM');
                    if (!role) throw new Error('Role "BGM" does not exist.');
                    await subTarget.roles.add(role);
                    await message.channel.send(`Role "BGM" granted to ${subTarget.user.tag}`);
                }

                // un-bgm
                else if (subCommand === 'un-bgm') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    const role = message.guild.roles.cache.find(r => r.name === 'BGM');
                    if (!role) throw new Error('Role "BGM" does not exist.');
                    await subTarget.roles.remove(role);
                    await message.channel.send(`Role "BGM" removed from ${subTarget.user.tag}`);
                }

                // lock
                else if (subCommand === 'lock') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    if (!message.member.permissions.has('ModerateMembers'))
                        throw new Error('You don’t have permission to mute members.');

                    if (subTarget.id === '479224801324695561') {
                        await message.channel.send(`🚫 You can’t mute the protected user (${subTarget.user.tag}).`);
                    } else {
                        const muteDuration = 60 * 1000; // 1 minute
                        await subTarget.timeout(muteDuration, 'Muted by universal combiner command');
                        await message.channel.send(`🔇 ${subTarget.user.tag} has been muted for 1 minute.`);
                    }
                }

                // mute
                else if (subCommand === 'mute') {
                    if (!subTarget) throw new Error(`Please mention a user for "${subCommand}".`);
                    if (!subTarget.voice.channel)
                        throw new Error(`This user (${subTarget.user.tag}) is not in a voice channel.`);

                    await subTarget.voice.setMute(true, `Muted by ${message.author.tag}`);
                    await message.channel.send(`${subTarget.user.tag} has been muted for 15 seconds.`);

                    setTimeout(async () => {
                        try {
                            await subTarget.voice.setMute(false, 'Automatically unmuted after 15 seconds');
                            await message.channel.send(`${subTarget.user.tag} has been unmuted.`);
                        } catch (err) {
                            console.error(`Failed to unmute ${subTarget.user.tag}:`, err);
                        }
                    }, 15000);
                }

                // fallback: run any other registered command dynamically
                else {
                    const command = message.client.commands.get(subCommand);
                    if (!command) {
                        await message.channel.send(`⚠️ Unknown command part: "${subCommand}"`);
                        continue;
                    }

                    try {
                        await command.execute(message, args);
                        await message.channel.send(`✅ Executed "${subCommand}" successfully.`);
                    } catch (err) {
                        console.error(`Error executing fallback command "${subCommand}":`, err);
                        await message.channel.send(`⚠️ Failed to execute "${subCommand}": ${err.message}`);
                    }
                }
            } catch (err) {
                console.error(`Error processing "${subCommand}" for ${subTarget?.user?.tag || 'N/A'}:`, err);
                await message.channel.send(`⚠️ Failed to execute "${subCommand}": ${err.message}`);
            }
        }
    },
};
