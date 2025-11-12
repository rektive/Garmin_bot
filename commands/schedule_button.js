// schdeule_button.js
const fs = require('fs');
const path = require('path');
const {
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');
const schedule = require('node-schedule');

const SCHEDULE_FILE = path.join(__dirname, '../schedules.json');
let schedules = [];

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

// Parse time string with optional MM/DD prefix
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

    return { month, day, hh, mm };
}

// Schedule a job (annual if month/day provided)
function scheduleJob(client, entry) {
    const { guildId, roleId, channelId, hh, mm, day, month } = entry;

    const rule = new schedule.RecurrenceRule();
    rule.hour = hh;
    rule.minute = mm;
    if (day) rule.date = day;
    if (month) rule.month = month - 1;

    schedule.scheduleJob(rule, async () => {
        try {
            const guild = await client.guilds.fetch(guildId);
            const role = guild.roles.cache.get(roleId);
            const channel = guild.channels.cache.get(channelId);
            if (role && channel) {
                channel.send(`${role} Poleteli molodezh!`);
                channel.send(`${role} Poleteli molodezh!`);
                channel.send(`${role} Poleteli molodezh!`);
                channel.send(`${role} Poleteli molodezh!`);
            }
        } catch (err) {
            console.error('Failed to send scheduled message:', err);
        }
    });
}

// Schedule all loaded schedules
function initSchedules(client) {
    for (const entry of schedules) {
        scheduleJob(client, entry);
    }
}

// --- Fixed createButton function ---
function createButton() {
    return new ButtonBuilder()
        .setCustomId('schedule_button')
        .setLabel('Schedule Game')
        .setStyle(ButtonStyle.Primary);
}

// Handle button/modal interaction
async function handleInteraction(client, interaction) {
    if (interaction.isButton() && interaction.customId === 'schedule_button') {
        const modal = new ModalBuilder()
            .setCustomId('schedule_modal')
            .setTitle('Schedule Game');

        const roleInput = new TextInputBuilder()
            .setCustomId('role')
            .setLabel('Game Role (mention or exact name)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const timeInput = new TextInputBuilder()
            .setCustomId('time')
            .setLabel('Time (hh:mmam/pm or MM/DD hh:mmam/pm)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(roleInput),
            new ActionRowBuilder().addComponents(timeInput)
        );

        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'schedule_modal') {
        const roleInput = interaction.fields.getTextInputValue('role');
        const timeInput = interaction.fields.getTextInputValue('time');

        // Parse role
        let roleId = roleInput.replace(/[^0-9]/g, '');
        let role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            role = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === roleInput.toLowerCase());
        }
        if (!role) {
            return interaction.reply({ content: 'Role not found. Mention it or type exact name.', ephemeral: true });
        }

        // Parse time
        const parsed = parseTimeString(timeInput);
        if (!parsed) {
            return interaction.reply({ content: 'Invalid time format. Use hh:mmam/pm or optional MM/DD hh:mmam/pm', ephemeral: true });
        }

        // Save and schedule
        const entry = {
            guildId: interaction.guild.id,
            roleId: role.id,
            channelId: interaction.channel.id,
            hh: parsed.hh,
            mm: parsed.mm,
            day: parsed.day,
            month: parsed.month
        };
        schedules.push(entry);
        saveSchedules();
        scheduleJob(interaction.client, entry);

        await interaction.reply({
            content: `Scheduled reminder for ${role} at ${timeInput}`,
            ephemeral: true
        });
    }
}

module.exports = {
    createButton,
    handleInteraction,
    initSchedules
};
