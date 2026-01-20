import express from 'express';
import { Client, GatewayIntentBits, Events, Message, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { obfuscate } from './lexer';

// ============================================================================
// EXPRESS SERVER (untuk health check Render)
// ============================================================================

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

app.get('/', (_, res) => {
    res.json({
        name: 'Nephilim Obfuscator',
        version: '0.2.0',
        status: 'online',
        bot: 'Discord Bot Active',
        features: ['Variable Renaming', 'String XOR Encryption']
    });
});

app.post('/obfuscate', (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'No code provided' });
        const result = obfuscate(code, { debug: false });
        res.json({ success: true, ...result });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`🌐 API Server running on port ${port}`);
});

// ============================================================================
// DISCORD BOT
// ============================================================================

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

if (!DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN not found in environment variables!');
    console.log('📝 Please set DISCORD_TOKEN in Render Environment settings.');
} else {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ]
    });

    const PREFIX = '!';

    client.once(Events.ClientReady, (c) => {
        console.log(`✅ Discord Bot logged in as ${c.user.tag}`);
        console.log(`📡 Serving ${c.guilds.cache.size} servers`);
        
        // Set bot status
        c.user.setActivity('!obf <code> | Nephilim v0.2', { type: 3 }); // Watching
    });

    client.on(Events.MessageCreate, async (message: Message) => {
        // Ignore bots
        if (message.author.bot) return;
        
        // Check for prefix
        if (!message.content.startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        // ==================== HELP COMMAND ====================
        if (command === 'help' || command === 'h') {
            const helpEmbed = new EmbedBuilder()
                .setColor(0x9B59B6)
                .setTitle('🔮 Nephilim Obfuscator')
                .setDescription('Luraph-style Lua Obfuscator')
                .addFields(
                    { name: '📝 Commands', value: 
                        '`!obf <code>` - Obfuscate inline code\n' +
                        '`!obf` + attach .lua file - Obfuscate file\n' +
                        '`!help` - Show this help'
                    },
                    { name: '🔐 Features', value: 
                        '• Variable Renaming (IlIlIlIl style)\n' +
                        '• XOR String Encryption\n' +
                        '• Roblox/Executor Compatible'
                    },
                    { name: '📌 Example', value: 
                        '```\n!obf print("Hello World")\n```'
                    }
                )
                .setFooter({ text: 'Nephilim v0.2.0 | Made for Roblox' })
                .setTimestamp();
            
            await message.reply({ embeds: [helpEmbed] });
            return;
        }

        // ==================== OBFUSCATE COMMAND ====================
        if (command === 'obf' || command === 'obfuscate') {
            let luaCode = '';

            // Check for attachment
            const attachment = message.attachments.first();
            if (attachment) {
                // Download file
                if (!attachment.name?.endsWith('.lua') && !attachment.name?.endsWith('.txt')) {
                    await message.reply('❌ Please attach a `.lua` or `.txt` file!');
                    return;
                }

                try {
                    const response = await fetch(attachment.url);
                    luaCode = await response.text();
                } catch (e) {
                    await message.reply('❌ Failed to download attachment!');
                    return;
                }
            } else {
                // Get code from message
                luaCode = args.join(' ');

                // Check for code block
                const codeBlockMatch = luaCode.match(/```(?:lua)?\n?([\s\S]*?)```/);
                if (codeBlockMatch) {
                    luaCode = codeBlockMatch[1];
                }
            }

            // Validate
            if (!luaCode || luaCode.trim().length === 0) {
                await message.reply(
                    '❌ No code provided!\n\n' +
                    '**Usage:**\n' +
                    '• `!obf print("Hello")` - Inline code\n' +
                    '• `!obf` + attach .lua file\n' +
                    '• `!obf \\`\\`\\`lua\\ncode here\\n\\`\\`\\`` - Code block'
                );
                return;
            }

            // Send processing message
            const processingMsg = await message.reply('⏳ Obfuscating...');

            try {
                const startTime = Date.now();
                const result = obfuscate(luaCode, { debug: false });
                const endTime = Date.now();

                // Create result embed
                const resultEmbed = new EmbedBuilder()
                    .setColor(0x2ECC71)
                    .setTitle('✅ Obfuscation Complete!')
                    .addFields(
                        { name: '⏱️ Time', value: `${endTime - startTime}ms`, inline: true },
                        { name: '🔄 Renamed', value: `${result.stats.identifiersRenamed} vars`, inline: true },
                        { name: '🔐 Encrypted', value: `${result.stats.stringsEncrypted} strings`, inline: true },
                        { name: '📏 Size', value: `${result.stats.originalLength} → ${result.stats.outputLength} chars`, inline: true },
                        { name: '📈 Expansion', value: `${((result.stats.outputLength / result.stats.originalLength - 1) * 100).toFixed(1)}%`, inline: true }
                    )
                    .setFooter({ text: 'Nephilim v0.2.0' })
                    .setTimestamp();

                // If output is small, show in code block
                if (result.code.length <= 1900) {
                    await processingMsg.edit({
                        content: `\`\`\`lua\n${result.code}\n\`\`\``,
                        embeds: [resultEmbed]
                    });
                } else {
                    // Send as file
                    const buffer = Buffer.from(result.code, 'utf-8');
                    const file = new AttachmentBuilder(buffer, { name: 'obfuscated.lua' });

                    await processingMsg.edit({
                        content: '📁 Output too large, sending as file:',
                        embeds: [resultEmbed],
                        files: [file]
                    });
                }

            } catch (e: any) {
                await processingMsg.edit(`❌ Error: ${e.message}`);
            }

            return;
        }

        // ==================== STATS COMMAND ====================
        if (command === 'stats') {
            const embed = new EmbedBuilder()
                .setColor(0x3498DB)
                .setTitle('📊 Bot Statistics')
                .addFields(
                    { name: 'Servers', value: `${client.guilds.cache.size}`, inline: true },
                    { name: 'Uptime', value: `${Math.floor((client.uptime || 0) / 60000)} mins`, inline: true },
                    { name: 'Version', value: '0.2.0', inline: true }
                )
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            return;
        }
    });

    // Login
    client.login(DISCORD_TOKEN).catch(err => {
        console.error('❌ Failed to login to Discord:', err.message);
    });
}

// ============================================================================
// STARTUP MESSAGE
// ============================================================================

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║           NEPHILIM OBFUSCATOR v0.2.0 - DISCORD BOT               ║');
console.log('╠═══════════════════════════════════════════════════════════════════╣');
console.log('║  Commands:                                                        ║');
console.log('║    !obf <code>     - Obfuscate inline Lua code                   ║');
console.log('║    !obf + file     - Obfuscate attached .lua file                ║');
console.log('║    !help           - Show help                                   ║');
console.log('║    !stats          - Bot statistics                              ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝');
console.log('\n');
