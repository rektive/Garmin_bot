// commands/level_system.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const LEVEL_DATA_FILE = path.join(__dirname, '..', 'levels.json');
const userCooldowns = new Map();

// Helper function to calculate XP needed for next level
function calculateXpForLevel(level) {
    // This is a common formula: 5 * (level^2) + 50 * level + 100
    return 5 * (level ** 2) + (50 * level) + 100;
}

module.exports = {
    // This will be called in index.js on 'ready'
    init: (client) => {
        let levelData = {};
        try {
            if (fs.existsSync(LEVEL_DATA_FILE)) {
                const rawData = fs.readFileSync(LEVEL_DATA_FILE, 'utf8');
                levelData = JSON.parse(rawData);
            }
        } catch (err) {
            console.error('Failed to load levels.json', err);
        }
        
        // Load data into a Map for better performance
        client.levels = new Map(Object.entries(levelData));
        console.log(`Level system initialized. Loaded ${client.levels.size} users.`);
    },

    // This will be called in index.js on 'messageCreate'
    giveXP: async (message) => {
        const userId = message.author.id;
        const guildId = message.guild.id;

        // 1. Check cooldown to prevent spam
        const cooldownKey = `${guildId}-${userId}`;
        const lastMessageTime = userCooldowns.get(cooldownKey);
        const now = Date.now();

        if (lastMessageTime && (now - lastMessageTime < 60000)) { // 60-second cooldown
            return;
        }
        userCooldowns.set(cooldownKey, now);

        // 2. Get user data
        const userData = message.client.levels.get(userId) || { xp: 0, level: 0 };

        // 3. Give random XP
        const xpGained = Math.floor(Math.random() * 10) + 15; // 15-25 XP
        userData.xp += xpGained;

        // 4. Check for level up
        const xpToNextLevel = calculateXpForLevel(userData.level);
        
        if (userData.xp >= xpToNextLevel) {
            userData.level++;
            userData.xp -= xpToNextLevel; // Reset XP for next level

            // Send level up message
            const levelUpEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎉 Level Up!')
                .setDescription(`Congratulations, ${message.author}! You've reached **Level ${userData.level}**!`)
                .setThumbnail(message.author.displayAvatarURL());
            
            try {
                await message.channel.send({ embeds: [levelUpEmbed] });
            } catch (e) {
                console.error('Failed to send level up message:', e);
            }
        }

        // 5. Save data
        message.client.levels.set(userId, userData);
        
        // We'll save to file periodically instead of every message
        // This is done in the 'save' function
    },

    // We need to export this for the profile button
    calculateXpForLevel,

    // Call this periodically or on bot shutdown to save data
    save: (client) => {
        if (!client.levels) return;
        
        try {
            // Convert Map to a simple object for JSON
            const dataObject = Object.fromEntries(client.levels);
            fs.writeFileSync(LEVEL_DATA_FILE, JSON.stringify(dataObject, null, 2));
            console.log('Level data saved.');
        } catch (err) {
            console.error('Failed to save levels.json', err);
        }
    }
};