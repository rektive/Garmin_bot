// // commands/auto_role_setup.js
// module.exports = {
//   name: 'auto_role_setup',

//   /**
//    * Required roles configuration
//    * Add/remove roles as needed for your bot
//    */
//   requiredRoles: [
//     {
//       name: 'G',
//       color: '#00FF00', // Green
//       permissions: ['ManageRoles', 'ManageChannels', 'KickMembers', 'BanMembers'],
//       reason: 'Main admin role for Garmin bot'
//     },
//     {
//       name: 'BGM',
//       color: '#FFA500', // Orange
//       permissions: [],
//       reason: 'Basic Garmin Mode - Limited access role'
//     },
//     {
//       name: 'G-Developer',
//       color: '#FF0000', // Red
//       permissions: ['ManageRoles'],
//       reason: 'Developer mode for advanced commands'
//     }
//   ],

//   /**
//    * Check and create missing roles in a guild, then assign to all members
//    */
//   async setupRoles(guild, autoAssign = false) {
//     console.log(`[Auto Setup] Checking roles for guild: ${guild.name}`);
    
//     const createdRoles = [];
//     const existingRoles = [];
//     const failedRoles = [];
//     let sigmaRole = null;

//     for (const roleConfig of this.requiredRoles) {
//       try {
//         // Check if role already exists
//         let role = guild.roles.cache.find(r => r.name === roleConfig.name);
        
//         if (role) {
//           existingRoles.push(roleConfig.name);
//           console.log(`[Auto Setup] ✓ Role "${roleConfig.name}" already exists`);
          
//           // Store sigma role for assignment later
//           if (roleConfig.name === 'sigma') {
//             sigmaRole = role;
//           }
//         } else {
//           // Create the role
//           role = await guild.roles.create({
//             name: roleConfig.name,
//             color: roleConfig.color,
//             permissions: roleConfig.permissions,
//             reason: roleConfig.reason
//           });

//           createdRoles.push(roleConfig.name);
//           console.log(`[Auto Setup] ✅ Created role: "${roleConfig.name}"`);
          
//           // Store sigma role for assignment later
//           if (roleConfig.name === 'sigma') {
//             sigmaRole = role;
//           }
          
//           // Small delay to avoid rate limits
//           await new Promise(resolve => setTimeout(resolve, 500));
//         }
        
//       } catch (err) {
//         failedRoles.push(roleConfig.name);
//         console.error(`[Auto Setup] ❌ Failed to create role "${roleConfig.name}":`, err.message);
//       }
//     }

//     // Auto-assign sigma role to all members if requested
//     if (autoAssign && sigmaRole) {
//       console.log(`[Auto Setup] Assigning "sigma" role to all members...`);
//       try {
//         const members = await guild.members.fetch();
//         let assignedCount = 0;
        
//         for (const [id, member] of members) {
//           if (member.user.bot) continue; // Skip bots
//           try {
//             await member.roles.add(sigmaRole);
//             assignedCount++;
//             await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to avoid rate limits
//           } catch (err) {
//             console.error(`[Auto Setup] Failed to assign sigma to ${member.user.tag}:`, err.message);
//           }
//         }
        
//         console.log(`[Auto Setup] ✅ Assigned "sigma" to ${assignedCount} members`);
//       } catch (err) {
//         console.error(`[Auto Setup] ❌ Failed to assign sigma role:`, err.message);
//       }
//     }

//     return {
//       created: createdRoles,
//       existing: existingRoles,
//       failed: failedRoles
//     };
//   },

//   /**
//    * Manual command to setup roles
//    * Usage: !Garmin setup-roles
//    */
//   async execute(message) {
//     // Check if user has permission
//     if (!message.member.permissions.has('Administrator')) {
//       return message.reply('❌ Only administrators can use this command.');
//     }

//     const loadingMsg = await message.channel.send('🔄 Setting up required roles...');

//     try {
//       const result = await this.setupRoles(message.guild);

//       let response = '**🛠️ Role Setup Complete**\n\n';
      
//       if (result.created.length > 0) {
//         response += `✅ **Created Roles** (${result.created.length}):\n`;
//         response += result.created.map(r => `- ${r}`).join('\n');
//         response += '\n\n';
//       }
      
//       if (result.existing.length > 0) {
//         response += `✓ **Already Exists** (${result.existing.length}):\n`;
//         response += result.existing.map(r => `- ${r}`).join('\n');
//         response += '\n\n';
//       }
      
//       if (result.failed.length > 0) {
//         response += `❌ **Failed to Create** (${result.failed.length}):\n`;
//         response += result.failed.map(r => `- ${r}`).join('\n');
//         response += '\n\n';
//         response += '*Make sure the bot has "Manage Roles" permission and its role is above the roles it needs to create.*';
//       }

//       await loadingMsg.edit(response);
      
//     } catch (err) {
//       console.error('[Auto Setup] Error during manual setup:', err);
//       await loadingMsg.edit('❌ An error occurred during role setup. Check bot permissions.');
//     }
//   }
// };

// commands/auto_role_setup.js
module.exports = {
  name: 'auto_role_setup',

  /**
   * Required roles configuration
   */
  requiredRoles: [
    {
      name: 'G',
      color: '#00FF00', // Green
      permissions: ['ManageRoles', 'ManageChannels', 'KickMembers', 'BanMembers'],
      reason: 'Main admin role for Garmin bot'
    },
    {
      name: 'BGM',
      color: '#FFA500', // Orange
      permissions: [],
      reason: 'Basic Garmin Mode - Limited access role'
    },
    {
      name: 'G-Developer',
      color: '#FF0000', // Red
      permissions: ['ManageRoles'],
      reason: 'Developer mode for advanced commands'
    }
  ],

  /**
   * Check and create missing roles in a guild, then assign G role to all members
   */
  async setupRoles(guild) {
    console.log(`[Auto Setup] Checking roles for guild: ${guild.name}`);

    const createdRoles = [];
    const existingRoles = [];
    const failedRoles = [];

    for (const roleConfig of this.requiredRoles) {
      try {
        // Check if role already exists
        let role = guild.roles.cache.find(r => r.name === roleConfig.name);

        if (role) {
          existingRoles.push(roleConfig.name);
          console.log(`[Auto Setup] ✓ Role "${roleConfig.name}" already exists`);
        } else {
          // Create the role
          role = await guild.roles.create({
            name: roleConfig.name,
            color: roleConfig.color,
            permissions: roleConfig.permissions,
            reason: roleConfig.reason
          });

          createdRoles.push(roleConfig.name);
          console.log(`[Auto Setup] ✅ Created role: "${roleConfig.name}"`);

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Auto-assign G role to all members
        if (roleConfig.name === 'G') {
          console.log(`[Auto Setup] Assigning "G" role to all members...`);
          const members = await guild.members.fetch();
          let assignedCount = 0;

          for (const [id, member] of members) {
            if (member.user.bot) continue; // Skip bots
            try {
              await member.roles.add(role);
              assignedCount++;
              await new Promise(resolve => setTimeout(resolve, 200)); // Small delay to avoid rate limits
            } catch (err) {
              console.error(`[Auto Setup] Failed to assign G to ${member.user.tag}:`, err.message);
            }
          }

          console.log(`[Auto Setup] ✅ Assigned "G" role to ${assignedCount} members`);
        }

      } catch (err) {
        failedRoles.push(roleConfig.name);
        console.error(`[Auto Setup] ❌ Failed to create role "${roleConfig.name}":`, err.message);
      }
    }

    return {
      created: createdRoles,
      existing: existingRoles,
      failed: failedRoles
    };
  },

  /**
   * Manual command to setup roles
   * Usage: !Garmin setup-roles
   */
  async execute(message) {
    // Check if user has permission
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Only administrators can use this command.');
    }

    const loadingMsg = await message.channel.send('🔄 Setting up required roles...');

    try {
      const result = await this.setupRoles(message.guild);

      let response = '**🛠️ Role Setup Complete**\n\n';

      if (result.created.length > 0) {
        response += `✅ **Created Roles** (${result.created.length}):\n`;
        response += result.created.map(r => `- ${r}`).join('\n');
        response += '\n\n';
      }

      if (result.existing.length > 0) {
        response += `✓ **Already Exists** (${result.existing.length}):\n`;
        response += result.existing.map(r => `- ${r}`).join('\n');
        response += '\n\n';
      }

      if (result.failed.length > 0) {
        response += `❌ **Failed to Create** (${result.failed.length}):\n`;
        response += result.failed.map(r => `- ${r}`).join('\n');
        response += '\n\n';
        response += '*Make sure the bot has "Manage Roles" permission and its role is above the roles it needs to create.*';
      }

      await loadingMsg.edit(response);

    } catch (err) {
      console.error('[Auto Setup] Error during manual setup:', err);
      await loadingMsg.edit('❌ An error occurred during role setup. Check bot permissions.');
    }
  }
};
