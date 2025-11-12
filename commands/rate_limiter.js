// rate_limiter.js
const LIMIT = 5; // how many times a command can be used
const TIME_WINDOW = 5 * 60 * 1000; // 5 minutes window
const BLOCK_DURATION = 10 * 60 * 1000; // 30 minutes block

const usageMap = new Map(); // { userId: { commandName: { timestamps: [...], blockedUntil: 0 } } }

function checkAndRecord(userId, commandName) {
    const now = Date.now();

    if (!usageMap.has(userId)) usageMap.set(userId, {});
    const userData = usageMap.get(userId);

    if (!userData[commandName])
        userData[commandName] = { timestamps: [], blockedUntil: 0 };

    const cmdData = userData[commandName];

    // Check if blocked
    if (cmdData.blockedUntil > now) {
        return {
            allowed: false,
            blocked: true,
            remainingMs: cmdData.blockedUntil - now,
        };
    }

    // Filter timestamps within time window
    cmdData.timestamps = cmdData.timestamps.filter(t => now - t < TIME_WINDOW);

    if (cmdData.timestamps.length >= LIMIT) {
        cmdData.blockedUntil = now + BLOCK_DURATION;
        return {
            allowed: false,
            blocked: true,
            remainingMs: BLOCK_DURATION,
        };
    }

    // Record this use
    cmdData.timestamps.push(now);

    return { allowed: true, blocked: false };
}

module.exports = { checkAndRecord };
