// // commands/health.js
// const fs = require('fs');
// const path = require('path');
// const { EmbedBuilder } = require('discord.js');

// const HEALTH_FILE = path.join(__dirname, '..', 'health.json');
// let healthData = {};

// const OWNER_ID = '479224801324695561'; // Your Discord ID for immunity

// // --- 👇 1. ADDED THIS MAP TO TRACK TIMERS 👇 ---
// const regenerationTimers = new Map();

// // --- PRIVATE HELPER FUNCTIONS ---

// function loadHealth() {
//     try {
//         if (fs.existsSync(HEALTH_FILE)) {
//             const rawData = fs.readFileSync(HEALTH_FILE, 'utf8');
//             healthData = JSON.parse(rawData);
//         }
//     } catch (err) {
//         console.error('Failed to load health.json', err);
//     }
// }

// function saveHealth() {
//     try {
//         fs.writeFileSync(HEALTH_FILE, JSON.stringify(healthData, null, 2));
//     } catch (err) {
//         console.error('Failed to save health.json', err);
//     }
// }

// loadHealth();

// function getHealthVisuals(hp) {
//     if (hp <= 20) {
//         return {
//             color: '#FF0000', // Red
//             status: '💔 Danger (20% or less)',
//             barEmoji: '🟥'
//         };
//     } else if (hp <= 40) {
//         return {
//             color: '#FFA500', // Orange
//             status: '🧡 Critical (40% or less)',
//             barEmoji: '🟧'
//         };
//     } else if (hp <= 60) {
//         return {
//             color: '#FFFF00', // Yellow
//             status: '💛 Wounded (60% or less)',
//             barEmoji: '🟨'
//         };
//     } else {
//         return {
//             color: '#00FF00', // Green
//             status: '💚 Healthy (Over 60%)',
//             barEmoji: '🟩'
//         };
//     }
// }

// // --- PUBLIC FUNCTIONS ---

// module.exports = {
//     getHealth: (userId) => {
//         return healthData[userId] !== undefined ? healthData[userId] : 100;
//     },

//     setHealth: (userId, newHp) => {
//         healthData[userId] = Math.max(0, Math.min(100, newHp));
//         return healthData[userId];
//     },

//     renderHealthBar: (hp) => {
//         const totalBars = 10;
//         const filledBars = Math.round(hp / 10);
//         const emptyBars = totalBars - filledBars;
//         const visuals = getHealthVisuals(hp);

//         const bar = visuals.barEmoji.repeat(filledBars) + '⬛'.repeat(emptyBars);
//         return `[ ${bar} ] **${hp}/100 HP**`;
//     },

//     createHealthEmbed: (member, oldHp, newHp, reason) => {
//         const hpChange = newHp - oldHp;
//         const isDamage = hpChange < 0;
//         const title = isDamage ? '❤️‍🩹 Vitals Hit!' : '💚 Vitals Restored!';
        
//         const visuals = getHealthVisuals(newHp);
//         const healthBar = module.exports.renderHealthBar(newHp);

//         return new EmbedBuilder()
//             .setColor(visuals.color)
//             .setTitle(title)
//             .setThumbnail(member.user.displayAvatarURL())
//             .setDescription(`**${member.displayName}**'s vitals have changed.`)
//             .addFields(
//                 { name: 'Reason', value: reason, inline: false },
//                 { name: 'HP Change', value: `\`${isDamage ? '' : '+'}${hpChange} HP\``, inline: true },
//                 { name: 'Status', value: visuals.status, inline: true },
//                 { name: 'Current Vitals', value: healthBar, inline: false }
//             )
//             .setTimestamp();
//     },

//     applyDamage: async (client, member, amount, reason) => {
//         if (member.id === OWNER_ID) {
//             const embed = new EmbedBuilder()
//                 .setColor('#0099ff')
//                 .setTitle('🛡️ Damage Immune!')
//                 .setDescription(`**${member.displayName}** is the bot owner and cannot take damage.`)
//                 .setThumbnail(member.user.displayAvatarURL());
//             return embed;
//         }
        
//         const oldHp = module.exports.getHealth(member.id);
//         const newHp = module.exports.setHealth(member.id, oldHp - amount);
        
//         if (newHp === 0 && oldHp > 0) {
//             module.exports.handleDisabledState(client, member, reason);
//         }
        
//         return module.exports.createHealthEmbed(member, oldHp, newHp, reason);
//     },

//     applyHeal: async (client, member, amount, reason) => {
//         const oldHp = module.exports.getHealth(member.id);
//         const newHp = module.exports.setHealth(member.id, oldHp + amount);
        
//         return module.exports.createHealthEmbed(member, oldHp, newHp, reason);
//     },

//     // --- 👇 2. THIS ENTIRE FUNCTION IS REPLACED 👇 ---
//     /**
//      * Handles the 0 HP "disabled" state and starts regeneration.
//      */
//     handleDisabledState: (client, member, reason) => {
//         if (member.id === OWNER_ID) {
//             console.log("Bot owner hit 0 HP but is immune.");
//             return; 
//         }

//         // Prevent multiple regeneration timers from stacking
//         if (regenerationTimers.has(member.id)) {
//             console.log(`User ${member.user.tag} is already regenerating.`);
//             return;
//         }

//         console.log(`${member.user.tag} is disabled at 0 HP. Starting regeneration...`);
//         try {
//             if (member.voice.channel) {
//                 member.voice.setChannel(null, 'User is disabled at 0 HP');
//             }
//         } catch (err) {
//             console.error('Failed to kick disabled user from VC:', err);
//         }
        
//         // DM the user they are disabled
//         const embed = new EmbedBuilder()
//             .setColor('#FF0000')
//             .setTitle('💀 YOU ARE DISABLED')
//             .setThumbnail('https://i.imgur.com/B1QkLNc.png') // A standard "X" icon
//             .setDescription(`You have hit 0 HP and are now disabled. You cannot join voice channels.`)
//             .addFields(
//                 { name: 'Final Hit', value: reason },
//                 { name: 'Regeneration', value: 'You will regenerate 10 HP every minute.' }
//             );
//         member.send({ embeds: [embed] }).catch(() => {}); // Fails silently if DMs are off

//         // --- THIS IS THE NEW REGENERATION ENGINE ---
//         const intervalId = setInterval(() => {
//             const currentHp = module.exports.getHealth(member.id);

//             if (currentHp >= 100) {
//                 // User is fully healed, stop the timer
//                 clearInterval(intervalId);
//                 regenerationTimers.delete(member.id);
//                 console.log(`User ${member.user.tag} has fully regenerated. Stopping timer.`);
//                 return;
//             }

//             // Heal the user by 10 HP
//             const newHp = module.exports.setHealth(member.id, currentHp + 10);
//             console.log(`Regenerating +10 HP for ${member.user.tag}. Now at ${newHp}.`);

//             // On the *first* regeneration (0 -> 10), send a DM
//             if (currentHp === 0 && newHp > 0) {
//                 const healEmbed = module.exports.createHealthEmbed(member, 0, newHp, "Regeneration");
//                 healEmbed.setTitle('💚 VITALS STABLE')
//                     .setDescription('You have regenerated 10 HP and are no longer disabled.');
                
//                 member.send({ embeds: [healEmbed] }).catch(() => {});
//             }

//         }, 60000); // 60,000ms = 1 minute

//         // Store the timer so we can manage it
//         regenerationTimers.set(member.id, intervalId);
//     },
//     // --- END OF REPLACED FUNCTION ---

//     checkVoiceJoin: (newState) => {
//         if (newState.channelId) {
//             if (newState.member.id === OWNER_ID) {
//                 return; 
//             }
            
//             const hp = module.exports.getHealth(newState.member.id);
//             if (hp === 0) {
//                 try {
//                     newState.member.voice.setChannel(null, 'Disabled at 0 HP');
//                     newState.member.send('❌ You cannot join voice channels, you are disabled at 0 HP!').catch(() => {});
//                 } catch (err) {}
//             }
//         }
//     },
    
//     getHealthVisuals,

//     save: (client) => {
//         saveHealth();
//     }
// };

// commands/health.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const HEALTH_FILE = path.join(__dirname, '..', 'health.json');
let healthData = {};

const OWNER_ID = '479224801324695561'; // Your Discord ID for immunity
const regenerationTimers = new Map();

// --- PRIVATE HELPER FUNCTIONS ---
// (These are all unchanged)

function loadHealth() {
    try {
        if (fs.existsSync(HEALTH_FILE)) {
            const rawData = fs.readFileSync(HEALTH_FILE, 'utf8');
            healthData = JSON.parse(rawData);
        }
    } catch (err) {
        console.error('Failed to load health.json', err);
    }
}

function saveHealth() {
    try {
        fs.writeFileSync(HEALTH_FILE, JSON.stringify(healthData, null, 2));
    } catch (err) {
        console.error('Failed to save health.json', err);
    }
}

loadHealth();

function getHealthVisuals(hp) {
    if (hp <= 20) {
        return {
            color: '#FF0000', // Red
            status: '💔 Danger (20% or less)',
            barEmoji: '🟥'
        };
    } else if (hp <= 40) {
        return {
            color: '#FFA500', // Orange
            status: '🧡 Critical (40% or less)',
            barEmoji: '🟧'
        };
    } else if (hp <= 60) {
        return {
            color: '#FFFF00', // Yellow
            status: '💛 Wounded (60% or less)',
            barEmoji: '🟨'
        };
    } else {
        return {
            color: '#00FF00', // Green
            status: '💚 Healthy (Over 60%)',
            barEmoji: '🟩'
        };
    }
}

// --- PUBLIC FUNCTIONS ---

module.exports = {
    getHealth: (userId) => {
        return healthData[userId] !== undefined ? healthData[userId] : 100;
    },

    setHealth: (userId, newHp) => {
        healthData[userId] = Math.max(0, Math.min(100, newHp));
        return healthData[userId];
    },

    renderHealthBar: (hp) => {
        const totalBars = 10;
        const filledBars = Math.round(hp / 10);
        const emptyBars = totalBars - filledBars;
        const visuals = getHealthVisuals(hp);

        const bar = visuals.barEmoji.repeat(filledBars) + '⬛'.repeat(emptyBars);
        return `[ ${bar} ] **${hp}/100 HP**`;
    },

    createHealthEmbed: (member, oldHp, newHp, reason) => {
        const hpChange = newHp - oldHp;
        const isDamage = hpChange < 0;
        const title = isDamage ? '❤️‍🩹 Vitals Hit!' : '💚 Vitals Restored!';
        
        const visuals = getHealthVisuals(newHp);
        const healthBar = module.exports.renderHealthBar(newHp);

        return new EmbedBuilder()
            .setColor(visuals.color)
            .setTitle(title)
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`**${member.displayName}**'s vitals have changed.`)
            .addFields(
                { name: 'Reason', value: reason, inline: false },
                { name: 'HP Change', value: `\`${isDamage ? '' : '+'}${hpChange} HP\``, inline: true },
                { name: 'Status', value: visuals.status, inline: true },
                { name: 'Current Vitals', value: healthBar, inline: false }
            )
            .setTimestamp();
    },

    // --- 👇 1. THIS FUNCTION IS MODIFIED 👇 ---
    applyDamage: async (client, member, amount, reason) => {
        // --- IMMUNITY CHECK REMOVED ---
        // You will now take damage and see the embed.
        
        const oldHp = module.exports.getHealth(member.id);
        const newHp = module.exports.setHealth(member.id, oldHp - amount);
        
        if (newHp === 0 && oldHp > 0) {
            module.exports.handleDisabledState(client, member, reason);
        }
        
        return module.exports.createHealthEmbed(member, oldHp, newHp, reason);
    },
    // --- END OF MODIFICATION ---

    applyHeal: async (client, member, amount, reason) => {
        const oldHp = module.exports.getHealth(member.id);
        const newHp = module.exports.setHealth(member.id, oldHp + amount);
        
        return module.exports.createHealthEmbed(member, oldHp, newHp, reason);
    },

    // --- 👇 2. THIS FUNCTION IS MODIFIED 👇 ---
    handleDisabledState: (client, member, reason) => {
        // Prevent multiple regeneration timers from stacking
        if (regenerationTimers.has(member.id)) {
            console.log(`User ${member.user.tag} is already regenerating.`);
            return;
        }

        console.log(`${member.user.tag} is disabled at 0 HP. Starting regeneration...`);

        // --- IMMUNITY REMOVED ---
        // The bot will now kick *everyone* who hits 0 HP, including the owner.
        try {
            if (member.voice.channel) {
                member.voice.setChannel(null, 'User is disabled at 0 HP');
            }
        } catch (err) {
            console.error('Failed to kick disabled user from VC:', err);
        }
        // --- END OF CHANGE ---
        
        // DM the user (this will happen to you)
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('💀 YOU ARE DISABLED')
            .setThumbnail('https://i.imgur.com/B1QkLNc.png')
            .addFields(
                { name: 'Final Hit', value: reason },
                { name: 'Regeneration', value: 'You will regenerate 10 HP every minute.' }
            );
        
        // --- NEW DM LOGIC ---
        // Add a special message to the DM if you are the owner
        if (member.id === OWNER_ID) {
            embed.setDescription('You have hit 0 HP and are now disabled.\n*(As owner, you can still rejoin VCs.)*');
        } else {
             embed.setDescription('You have hit 0 HP and are now disabled. You cannot join voice channels.');
        }
        // --- END OF NEW DM LOGIC ---

        member.send({ embeds: [embed] }).catch(() => {});

        // Start regeneration timer (this will happen to you)
        const intervalId = setInterval(() => {
            const currentHp = module.exports.getHealth(member.id);

            if (currentHp >= 100) {
                clearInterval(intervalId);
                regenerationTimers.delete(member.id);
                console.log(`User ${member.user.tag} has fully regenerated. Stopping timer.`);
                return;
            }

            const newHp = module.exports.setHealth(member.id, currentHp + 10);
            console.log(`Regenerating +10 HP for ${member.user.tag}. Now at ${newHp}.`);

            if (currentHp === 0 && newHp > 0) {
                const healEmbed = module.exports.createHealthEmbed(member, 0, newHp, "Regeneration");
                healEmbed.setTitle('💚 VITALS STABLE')
                    .setDescription('You have regenerated 10 HP and are no longer disabled.');
                
                member.send({ embeds: [healEmbed] }).catch(() => {});
            }

        }, 60000); 

        regenerationTimers.set(member.id, intervalId);
    },

    // --- 👇 3. THIS FUNCTION IS UNCHANGED (It's already correct) 👇 ---
    // This function provides your "God Mode" by *only* checking for immunity
    // when a user *tries to join* a channel.
    checkVoiceJoin: (newState) => {
        if (newState.channelId) {
            // Check 1: Is user the owner? If so, always allow.
            if (newState.member.id === OWNER_ID) {
                return; 
            }
            
            // Check 2: Is user at 0 HP?
            const hp = module.exports.getHealth(newState.member.id);
            if (hp === 0) {
                // User is not owner AND is at 0 HP, so kick them.
                try {
                    newState.member.voice.setChannel(null, 'Disabled at 0 HP');
                    newState.member.send('❌ You cannot join voice channels, you are disabled at 0 HP!').catch(() => {});
                } catch (err) {}
            }
        }
    },
    
    getHealthVisuals,

    save: (client) => {
        saveHealth();
    }
};