// // schdeule_button.js
// const fs = require('fs');
// const path = require('path');
// const {
//     ButtonBuilder,
//     ButtonStyle,
//     ActionRowBuilder,
//     ModalBuilder,
//     TextInputBuilder,
//     TextInputStyle
// } = require('discord.js');
// const schedule = require('node-schedule');

// const SCHEDULE_FILE = path.join(__dirname, '../schedules.json');
// let schedules = [];

// // Load schedules from JSON
// try {
//     if (fs.existsSync(SCHEDULE_FILE)) {
//         const raw = fs.readFileSync(SCHEDULE_FILE, 'utf8');
//         if (raw) schedules = JSON.parse(raw);
//     }
// } catch (err) {
//     console.error('Failed to load schedules.json', err);
// }

// // Save schedules
// function saveSchedules() {
//     fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedules, null, 2));
// }

// // Parse time string with optional MM/DD prefix
// function parseTimeString(str) {
//     const match = str.match(/^(?:(\d{1,2})\/(\d{1,2}) )?(\d{1,2}):(\d{2})(am|pm)$/i);
//     if (!match) return null;

//     let month = match[1] ? parseInt(match[1]) : null;
//     let day = match[2] ? parseInt(match[2]) : null;
//     let hh = parseInt(match[3]);
//     let mm = parseInt(match[4]);
//     const meridian = match[5].toLowerCase();

//     if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
//     if (meridian === 'pm' && hh !== 12) hh += 12;
//     if (meridian === 'am' && hh === 12) hh = 0;

//     return { month, day, hh, mm };
// }

// // Schedule a job (annual if month/day provided)
// function scheduleJob(client, entry) {
//     const { guildId, roleId, channelId, hh, mm, day, month } = entry;

//     const rule = new schedule.RecurrenceRule();
//     rule.hour = hh;
//     rule.minute = mm;
//     if (day) rule.date = day;
//     if (month) rule.month = month - 1;

//     schedule.scheduleJob(rule, async () => {
//         try {
//             const guild = await client.guilds.fetch(guildId);
//             const role = guild.roles.cache.get(roleId);
//             const channel = guild.channels.cache.get(channelId);
//             if (role && channel) {
//                 channel.send(`${role} Poleteli molodezh!`);
//                 channel.send(`${role} Poleteli molodezh!`);
//                 channel.send(`${role} Poleteli molodezh!`);
//                 channel.send(`${role} Poleteli molodezh!`);
//             }
//         } catch (err) {
//             console.error('Failed to send scheduled message:', err);
//         }
//     });
// }

// // Schedule all loaded schedules
// function initSchedules(client) {
//     for (const entry of schedules) {
//         scheduleJob(client, entry);
//     }
// }

// // --- Fixed createButton function ---
// function createButton() {
//     return new ButtonBuilder()
//         .setCustomId('schedule_button')
//         .setLabel('Schedule Game')
//         .setStyle(ButtonStyle.Primary);
// }

// // Handle button/modal interaction
// async function handleInteraction(client, interaction) {
//     if (interaction.isButton() && interaction.customId === 'schedule_button') {
//         const modal = new ModalBuilder()
//             .setCustomId('schedule_modal')
//             .setTitle('Schedule Game');

//         const roleInput = new TextInputBuilder()
//             .setCustomId('role')
//             .setLabel('Game Role (mention or exact name)')
//             .setStyle(TextInputStyle.Short)
//             .setRequired(true);

//         const timeInput = new TextInputBuilder()
//             .setCustomId('time')
//             .setLabel('Time (hh:mmam/pm or MM/DD hh:mmam/pm)')
//             .setStyle(TextInputStyle.Short)
//             .setRequired(true);

//         modal.addComponents(
//             new ActionRowBuilder().addComponents(roleInput),
//             new ActionRowBuilder().addComponents(timeInput)
//         );

//         await interaction.showModal(modal);
//     }

//     if (interaction.isModalSubmit() && interaction.customId === 'schedule_modal') {
//         const roleInput = interaction.fields.getTextInputValue('role');
//         const timeInput = interaction.fields.getTextInputValue('time');

//         // Parse role
//         let roleId = roleInput.replace(/[^0-9]/g, '');
//         let role = interaction.guild.roles.cache.get(roleId);
//         if (!role) {
//             role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleInput.toLowerCase());
//         }
//         if (!role) {
//             return interaction.reply({ content: 'Role not found. Mention it or type exact name.', ephemeral: true });
//         }

//         // Parse time
//         const parsed = parseTimeString(timeInput);
//         if (!parsed) {
//             return interaction.reply({ content: 'Invalid time format. Use hh:mmam/pm or optional MM/DD hh:mmam/pm', ephemeral: true });
//         }

//         // Save and schedule
//         const entry = {
//             guildId: interaction.guild.id,
//             roleId: role.id,
//             channelId: interaction.channel.id,
//             hh: parsed.hh,
//             mm: parsed.mm,
//             day: parsed.day,
//             month: parsed.month
//         };
//         schedules.push(entry);
//         saveSchedules();
//         scheduleJob(interaction.client, entry);

//         await interaction.reply({
//             content: `Scheduled reminder for ${role} at ${timeInput}`,
//             ephemeral: true
//         });
//     }
// }

// module.exports = {
//     createButton,
//     handleInteraction,
//     initSchedules
// };


// commands/schedule_button.js
const fs = require('fs');
const path = require('path');
const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    EmbedBuilder,
    PermissionsBitField
} = require('discord.js');
const schedule = require('node-schedule');

const SCHEDULE_FILE = path.join(__dirname, '../schedules.json');
let schedules = [];
const activeJobs = new Map(); // This will hold our running schedule.Job objects

// Load schedules from JSON
try {
    if (fs.existsSync(SCHEDULE_FILE)) {
        const raw = fs.readFileSync(SCHEDULE_FILE, 'utf8');
        if (raw) schedules = JSON.parse(raw);
    }
} catch (err) {
    console.error('Failed to load schedules.json', err);
}

// Save schedules
function saveSchedules() {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedules, null, 2));
}

// Parse time string (This logic is unchanged, as requested)
function parseTimeString(str) {
    const match = str.match(/^(?:(\d{1,2})\/(\d{1,2}) )?(\d{1,2}):(\d{2})(am|pm)$/i);
    if (!match) return null;

    let month = match[1] ? parseInt(match[1]) : null;
    let day = match[2] ? parseInt(match[2]) : null;
    let hh = parseInt(match[3]);
    let mm = parseInt(match[4]);
    const meridian = match[5].toLowerCase();

    if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
    if (meridian === 'pm' && hh !== 12) hh += 12;
    if (meridian === 'am' && hh === 12) hh = 0;

    const now = new Date();
    let year = now.getFullYear();
    const jsMonth = month ? month - 1 : now.getMonth(); 
    const jsDay = day ? day : now.getDate();

    let eventDate = new Date(year, jsMonth, jsDay, hh, mm, 0);
    
    if (!month && !day && eventDate < now) {
        eventDate.setDate(eventDate.getDate() + 1);
    }
    else if (month && day && eventDate < now) {
        eventDate.setFullYear(year + 1);
    }

    return { 
        month: eventDate.getMonth() + 1, 
        day: eventDate.getDate(), 
        hh, 
        mm, 
        year: eventDate.getFullYear(),
        timestamp: Math.floor(eventDate.getTime() / 1000)
    };
}

// --- NEW scheduleJob FUNCTION ---
// This now pings individual users and has a custom UI
function scheduleJob(client, entry) {
    const { guildId, channelId, hh, mm, day, month, year, jobId, gameName, attendees, schedulerId, messageId } = entry;

    const rule = new schedule.RecurrenceRule();
    rule.tz = 'America/New_York'; // IMPORTANT: Set to your server's timezone
    rule.hour = hh;
    rule.minute = mm;
    rule.date = day;
    rule.month = month - 1;
    rule.year = year;

    const job = schedule.scheduleJob(rule, async () => {
        try {
            const guild = await client.guilds.fetch(guildId);
            const channel = guild.channels.cache.get(channelId);
            if (!channel) return;

            // --- 1. UNPIN THE ORIGINAL MESSAGE ---
            try {
                const originalMessage = await channel.messages.fetch(messageId);
                if (originalMessage && originalMessage.pinned) {
                    await originalMessage.unpin('Event starting.');
                }
            } catch (err) {
                console.error('Failed to unpin message:', err);
            }

            // --- 2. CREATE THE FINAL PING ---
            let pingContent = '';
            let description = '';

            if (attendees.length > 0) {
                pingContent = attendees.map(id => `<@${id}>`).join(' ');
                description = `**Poleteli molodezh!**\n\nThe time has come for **${gameName}**.\n\n**Attendees:**\n${pingContent}`;
            } else {
                description = `The scheduled time for **${gameName}** has arrived, but no one signed up.`;
            }

            // --- 3. THE "BEAUTIFUL UI" FOR THE PING ---
            const finalEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(`🟢 IT'S TIME TO PLAY: ${gameName}! 🟢`)
                .setDescription(description)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: 'Scheduled By', value: `<@${schedulerId}>` }
                )
                .setTimestamp();
            
            await channel.send({ content: pingContent, embeds: [finalEmbed] });
            
            // Job is done, remove it
            schedules = schedules.filter(s => s.jobId !== jobId);
            saveSchedules();
            activeJobs.delete(jobId);

        } catch (err) {
            console.error('Failed to send scheduled message:', err);
        }
    });
    return job;
}

// Schedule all loaded schedules
function initSchedules(client) {
    for (const entry of schedules) {
        const job = scheduleJob(client, entry);
        activeJobs.set(entry.jobId, job);
    }
}

// --- Fixed createButton function ---
function createButton() {
    return new ButtonBuilder()
        .setCustomId('schedule_button')
        .setLabel('Schedule Game')
        .setStyle(ButtonStyle.Primary);
}

// --- REBUILT handleInteraction FUNCTION ---
async function handleInteraction(client, interaction) {

    // --- Part A: Handle the initial "Schedule Game" button click ---
    if (interaction.isButton() && interaction.customId === 'schedule_button') {
        const modal = new ModalBuilder()
            .setCustomId('schedule_modal')
            .setTitle('Schedule a New Game Night');

        // --- NEW: Asks for game name, not role ---
        const gameInput = new TextInputBuilder()
            .setCustomId('game_name')
            .setLabel('What game are you playing?')
            .setPlaceholder('e.g., PUBG, Call of Duty, etc.')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const timeInput = new TextInputBuilder()
            .setCustomId('time')
            .setLabel('When? (e.g., 9:30pm or 11/15 9:30pm)')
            .setPlaceholder('Format: hh:mm(am/pm). Use your local time.')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(gameInput),
            new ActionRowBuilder().addComponents(timeInput)
        );

        await interaction.showModal(modal);
    }

    // --- Part B: Handle the Modal (pop-up) submission ---
    if (interaction.isModalSubmit() && interaction.customId === 'schedule_modal') {
        const gameName = interaction.fields.getTextInputValue('game_name');
        const timeInput = interaction.fields.getTextInputValue('time');

        // --- REMOVED all role parsing logic ---

        // Parse time (logic is unchanged)
        const parsed = parseTimeString(timeInput);
        if (!parsed) {
            return interaction.reply({ content: 'Invalid time format. Use hh:mmam/pm or optional MM/DD hh:mmam/pm', ephemeral: true });
        }

        const jobId = `${Date.now()}`;

        const rsvpRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`rsvp_yes_${jobId}`)
                .setLabel("✅ I'm In!")
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`rsvp_no_${jobId}`)
                .setLabel("❌ Can't Make It")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId(`schedule_cancel_${jobId}`)
                .setLabel('🗑️ Cancel')
                .setStyle(ButtonStyle.Danger)
        );

        const eventEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🎮 GAME NIGHT SCHEDULED! 🎮`)
            .setDescription(`Get ready! A new game night has been scheduled.`)
            .setThumbnail(interaction.guild.iconURL())
            .addFields(
                { name: 'Event', value: `**${gameName}**`, inline: false },
                { name: 'When (Your Time)', value: `<t:${parsed.timestamp}:F>`, inline: false },
                { name: 'When (Relative)', value: `<t:${parsed.timestamp}:R>`, inline: false },
                { name: 'Scheduled By', value: `${interaction.user}`, inline: false },
                { name: '✅ Attendees (0)', value: 'No one has joined yet.' }
            )
            .setTimestamp()
            .setFooter({ text: `Event ID: ${jobId}` });

        await interaction.reply({ embeds: [eventEmbed], components: [rsvpRow] });
        const eventMessage = await interaction.fetchReply();

        // --- NEW: Pin the message ---
        try {
            if (!eventMessage.pinned) {
                await eventMessage.pin();
            }
        } catch(err) {
            console.error("Failed to pin message. Bot might be missing 'Manage Messages' permission.", err);
            await interaction.followUp({ content: "⚠️ I couldn't pin this message. Please make sure I have the 'Manage Messages' permission.", ephemeral: true });
        }

        // Save and schedule
        const entry = {
            jobId: jobId,
            messageId: eventMessage.id,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            gameName: gameName, // <-- NEW: Storing gameName
            hh: parsed.hh,
            mm: parsed.mm,
            day: parsed.day,
            month: parsed.month,
            year: parsed.year,
            timestamp: parsed.timestamp,
            schedulerId: interaction.user.id,
            attendees: [] // <-- NEW: This list will be pinged
        };
        schedules.push(entry);
        saveSchedules();
        const job = scheduleJob(interaction.client, entry);
        activeJobs.set(jobId, job);
    }

    // --- Part C: Handle the new "RSVP" button clicks ---
    if (interaction.isButton() && interaction.customId.startsWith('rsvp_')) {
        const [, type, jobId] = interaction.customId.split('_');
        const userId = interaction.user.id;
        
        const eventIndex = schedules.findIndex(s => s.jobId === jobId);
        if (eventIndex === -1) {
            return interaction.reply({ content: 'This event seems to be outdated or canceled.', ephemeral: true });
        }

        const event = schedules[eventIndex];
        
        // --- REMOVED all role logic ---
        const attendeeIndex = event.attendees.indexOf(userId);

        if (type === 'yes') {
            if (attendeeIndex > -1) { 
                return interaction.reply({ content: "You are already in the list!", ephemeral: true });
            }
            event.attendees.push(userId);
            await interaction.reply({ content: "You're on the list! You will be pinged when the event starts.", ephemeral: true });
        } 
        else if (type === 'no') {
            if (attendeeIndex === -1) {
                return interaction.reply({ content: "You are not on the 'I'm In!' list.", ephemeral: true });
            }
            event.attendees.splice(attendeeIndex, 1);
            await interaction.reply({ content: "You've been removed from the list. You won't be pinged.", ephemeral: true });
        }

        schedules[eventIndex] = event;
        saveSchedules();

        const attendeeList = event.attendees.length > 0 
            ? event.attendees.map(id => `<@${id}>`).join('\n')
            : 'No one has joined yet.';
        
        const updatedEmbed = new EmbedBuilder(interaction.message.embeds[0])
            .setFields(
                interaction.message.embeds[0].fields[0], // Game
                interaction.message.embeds[0].fields[1], // When (Local)
                interaction.message.embeds[0].fields[2], // When (Relative)
                interaction.message.embeds[0].fields[3], // Scheduled By
                { name: `✅ Attendees (${event.attendees.length})`, value: attendeeList } // Updated field
            );
        
        await interaction.message.edit({ embeds: [updatedEmbed] });
    }

    // --- Part D: Handle the "Cancel" button click ---
    if (interaction.isButton() && interaction.customId.startsWith('schedule_cancel_')) {
        const jobId = interaction.customId.replace('schedule_cancel_', '');
        
        const eventIndex = schedules.findIndex(s => s.jobId === jobId);
        if (eventIndex === -1) {
            return interaction.reply({ content: 'This event is already canceled or outdated.', ephemeral: true });
        }

        const event = schedules[eventIndex];
        
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && interaction.user.id !== event.schedulerId) {
            return interaction.reply({ content: 'You do not have permission to cancel this event.', ephemeral: true });
        }

        const job = activeJobs.get(jobId);
        if (job) {
            job.cancel();
            activeJobs.delete(jobId);
        }

        schedules.splice(eventIndex, 1);
        saveSchedules();

        // --- Unpin the message on cancel ---
        try {
            if (interaction.message.pinned) {
                await interaction.message.unpin('Event canceled.');
            }
        } catch(err) {
            console.error('Failed to unpin canceled event:', err);
        }

        const canceledEmbed = new EmbedBuilder(interaction.message.embeds[0])
            .setTitle('🚫 EVENT CANCELED 🚫')
            .setColor('#FF0000')
            .setFields(
                interaction.message.embeds[0].fields[0], // Game
                interaction.message.embeds[0].fields[1], // When (Local)
                { name: 'Status', value: `Canceled by ${interaction.user}` }
            )
            .setImage(null); 

        await interaction.update({ embeds: [canceledEmbed], components: [] });
    }
}

module.exports = {
    createButton,
    handleInteraction,
    initSchedules
};