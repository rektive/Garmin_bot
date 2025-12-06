module.exports = {
  name: 'proceed',

  canHandle: (message, PREFIX) => {
    return message.content.toLowerCase().startsWith(`${PREFIX.toLowerCase()} proceed`);
  },

  handle: async (message, args) => {
    const member = message.member;
    const guild = message.guild;

    // check permission
    const hasG = member.roles.cache.some(r => r.name === 'G');
    if (!hasG) {
      return message.reply('❌ Only users with the **G** role can use this command.');
    }

    // ensure there are enough arguments
    if (args.length < 3 || !args.includes('to')) {
      return message.reply('⚠️ Correct usage:\n`!Garmin proceed @Role_Name to @User`\nOR\n`!Garmin proceed @Role_Name to all`');
    }

    // find "to" position
    const toIndex = args.indexOf('to');
    const roleArg = args.slice(0, toIndex).join(' ');
    const targetArg = args.slice(toIndex + 1).join(' ').toLowerCase();

    // extract role mention or name
    const roleMention = message.mentions.roles.first();
    const role = roleMention || guild.roles.cache.find(r => r.name === roleArg.replace(/<@&|>/g, '').trim());

    if (!role) {
      return message.reply('❌ That role does not exist on this server.');
    }

    // target handling - check for "all" FIRST before looking for mentions
    if (targetArg === 'all') {
      // assign to all members
      const members = await guild.members.fetch();
      let successCount = 0;
      let failCount = 0;
      
      for (const [id, m] of members) {
        if (m.user.bot) continue; // skip bots
        try {
          await m.roles.add(role);
          successCount++;
        } catch (err) {
          console.error(`Failed to assign ${role.name} to ${m.user.tag}:`, err);
          failCount++;
        }
      }
      
      return message.reply(`✅ Successfully assigned **${role.name}** to ${successCount} members.${failCount > 0 ? ` (${failCount} failed)` : ''}`);
    }

    // specific user
    const targetMember = message.mentions.members.first() ||
      guild.members.cache.find(m => m.user.username.toLowerCase() === targetArg);

    if (!targetMember) {
      return message.reply('❌ Could not find that user. Make sure to mention them with @.');
    }

    try {
      await targetMember.roles.add(role);
      return message.reply(`✅ Successfully assigned **${role.name}** to ${targetMember.user.tag}.`);
    } catch (err) {
      console.error(err);
      return message.reply(`⚠️ Failed to assign **${role.name}** to ${targetMember.user.tag}: ${err.message}`);
    }
  }
};