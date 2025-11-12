// remove.js
module.exports = {
  name: 'remove',

  canHandle: (message, PREFIX) => {
    const regex = new RegExp(`^${PREFIX}\\s+remove\\b`, 'i');
    return regex.test(message.content);
  },

  handle: async (message, args) => {
    const ownerId = '479224801324695561'; // <-- Replace with your Discord ID
    if (message.author.id !== ownerId) {
      return message.reply('❌ Only the bot owner can use this command.');
    }

    if (args.length < 1) {
      return message.reply('⚠️ Correct usage:\n`!Garmin remove @Role`');
    }

    const roleMention = message.mentions.roles.first();
    if (!roleMention) {
      return message.reply('❌ Please mention a role to remove from all members.');
    }

    const guild = message.guild;
    const role = guild.roles.cache.get(roleMention.id);
    if (!role) {
      return message.reply('❌ That role does not exist on this server.');
    }

    // Fetch all members
    let successCount = 0;
    let failCount = 0;
    const members = await guild.members.fetch();

    for (const [id, member] of members) {
      if (!member.roles.cache.has(role.id)) continue; // skip if user doesn't have role
      try {
        await member.roles.remove(role);
        successCount++;
      } catch (err) {
        console.error(`Failed to remove ${role.name} from ${member.user.tag}:`, err);
        failCount++;
      }
    }

    return message.reply(
      `✅ Successfully removed **${role.name}** from ${successCount} members.${failCount > 0 ? ` (${failCount} failed)` : ''}`
    );
  }
};
