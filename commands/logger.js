const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'command_log.json');

function loadLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load logs:', err);
    return [];
  }
}

function saveLogs(logs) {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('Failed to save logs:', err);
  }
}   

function logCommand(message, command) {
  const logs = loadLogs();
  const entry = {
    user: message.author.tag,
    userId: message.author.id,
    command,
    channel: message.channel.name || 'DM',
    guild: message.guild ? message.guild.name : 'DM',
    timestamp: new Date().toISOString(),
  };
  logs.push(entry);
  saveLogs(logs);
  console.log(`[${entry.timestamp}] ${entry.user} used: ${command}`);
}

module.exports = { logCommand };
