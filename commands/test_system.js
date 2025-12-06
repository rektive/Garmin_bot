// commands/test_system.js
// Full system integrity check (safe, read-only)

const fs = require("fs");
const path = require("path");

module.exports = {
  name: "test-system",
  description: "Performs a system integrity check for all commands, buttons, and main index.js.",

  async execute(message, args, client) {
    const checkResults = [];
    let successCount = 0;

    await message.channel.send("🧠 System Test started... (wait 5 seconds)");
    await new Promise((res) => setTimeout(res, 5000));

    // --- Helper: safe file checker ---
    const safeCheck = (filePath) => {
      try {
        // Ensure file exists
        if (!fs.existsSync(filePath)) {
          return `❌ Missing file: ${path.basename(filePath)}`;
        }

        // Check read permission
        fs.accessSync(filePath, fs.constants.R_OK);

        // Check write permission (non-destructive)
        fs.accessSync(filePath, fs.constants.W_OK);

        return "✅ Accessible";
      } catch (err) {
        return `⚠️ Permission/Access issue: ${err.message}`;
      }
    };

    // --- 1️⃣ Check index.js ---
    const indexPath = path.join(__dirname, "..", "index.js");
    checkResults.push(`🗂️ index.js → ${safeCheck(indexPath)}`);

    try {
      const code = require(indexPath);
      successCount++;
    } catch (err) {
      checkResults.push(`❌ index.js failed to load: ${err.message}`);
    }

    // --- 2️⃣ Check all commands ---
    const commandsPath = __dirname;
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((f) => f.endsWith(".js") && f !== "test_system.js");

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      let status = `🔹 ${file} → `;

      const permission = safeCheck(filePath);
      if (!permission.startsWith("✅")) {
        checkResults.push(status + permission);
        continue;
      }

      try {
        delete require.cache[require.resolve(filePath)];
        const cmd = require(filePath);

        const hasHandler =
          typeof cmd.execute === "function" ||
          typeof cmd.run === "function" ||
          typeof cmd.handleInteraction === "function";

        if (!cmd.name) {
          checkResults.push(status + "⚠️ Missing 'name' property");
        } else if (!hasHandler) {
          checkResults.push(status + "⚠️ No valid handler (execute/run/handleInteraction)");
        } else {
          checkResults.push(status + "✅ Loaded successfully");
          successCount++;
        }
      } catch (err) {
        checkResults.push(status + `❌ Failed to load: ${err.message}`);
      }
    }

    // --- 3️⃣ Check buttons folder (if exists) ---
    const buttonsPath = path.join(__dirname, "..", "buttons");
    if (fs.existsSync(buttonsPath)) {
      const buttonFiles = fs
        .readdirSync(buttonsPath)
        .filter((f) => f.endsWith(".js"));

      for (const file of buttonFiles) {
        const filePath = path.join(buttonsPath, file);
        let status = `🎛️ ${file} → `;

        const permission = safeCheck(filePath);
        if (!permission.startsWith("✅")) {
          checkResults.push(status + permission);
          continue;
        }

        try {
          delete require.cache[require.resolve(filePath)];
          const btn = require(filePath);
          const hasHandler = typeof btn.handleInteraction === "function";

          if (!hasHandler) {
            checkResults.push(status + "⚠️ No handleInteraction() found");
          } else {
            checkResults.push(status + "✅ Loaded successfully");
            successCount++;
          }
        } catch (err) {
          checkResults.push(status + `❌ Failed to load: ${err.message}`);
        }
      }
    } else {
      checkResults.push("ℹ️ No buttons folder found — skipped.");
    }

    // --- 4️⃣ Summary ---
    const resultSummary =
      checkResults.length > 0
        ? checkResults.join("\n")
        : "✅ Everything operational!";

    await message.channel.send(
      `🧩 **System Check Complete**  
Checked files: ${successCount} OK  
----------------------------------  
${resultSummary}`
    );
  },
};
