import express from 'express';
import { obfuscate } from './lexer';

const app = express();
const port = process.env.PORT || 3000;

const testScript = `-- ULTIMATE HUB LOADER V10.3
if getgenv().UHLoaded then
    pcall(function() getgenv().UH:Destroy() end)
    getgenv().UH, getgenv().UHCore, getgenv().UHLoaded = nil, nil, nil
    task.wait(0.3)
end
getgenv().UHLoaded = true

print("=== ULTIMATE HUB STARTING ===")

local CFG = {
    CU = "https://pastebin.com/raw/hRnCQzUq",
}

local HS, TS, PL = game:GetService("HttpService"), game:GetService("TweenService"), game:GetService("Players")
local LP = PL.LocalPlayer

local function SN(t, x, d)
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {Title = t, Text = x, Duration = d})
    end)
end

local function LH()
    print("=== LOADING HUB ===")
    local C = getgenv().UHCore
    if not C then
        print("=== LOADING CORE ===")
        local success, err = pcall(function()
            loadstring(game:HttpGet(CFG.CU))()
        end)
        if not success then
            warn("Error:", err)
            return
        end
    end
    print("=== HUB LOADED ===")
end

LH()`;

console.log("\n");
console.log("╔═══════════════════════════════════════════════════════════════════╗");
console.log("║     NEPHILIM OBFUSCATOR v0.2.0 - PHASE 2: STRING ENCRYPTION       ║");
console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

try {
    const result = obfuscate(testScript, { debug: true });
    
    console.log("┌───────────────────────────────────────────────────────────────────┐");
    console.log("│ 📊 STATISTICS                                                    │");
    console.log("└───────────────────────────────────────────────────────────────────┘");
    console.log(`   ⏱  Time             : ${result.stats.timeMs}ms`);
    console.log(`   📝 Tokens           : ${result.stats.originalTokens}`);
    console.log(`   🔄 Vars Renamed     : ${result.stats.identifiersRenamed}`);
    console.log(`   🔐 Strings Encrypted: ${result.stats.stringsEncrypted}`);
    console.log(`   📏 Size             : ${result.stats.originalLength} → ${result.stats.outputLength} chars`);
    console.log(`   📈 Expansion        : ${((result.stats.outputLength / result.stats.originalLength - 1) * 100).toFixed(1)}%\n`);
    
    console.log("┌───────────────────────────────────────────────────────────────────┐");
    console.log("│ 🔄 RENAME MAP                                                    │");
    console.log("└───────────────────────────────────────────────────────────────────┘");
    Object.entries(result.map).forEach(([o, n]) => console.log(`   ${o.padEnd(12)} → ${n}`));
    
    if (result.debugLogs) {
        console.log("\n┌───────────────────────────────────────────────────────────────────┐");
        console.log("│ 🔐 ENCRYPTION DEBUG                                              │");
        console.log("└───────────────────────────────────────────────────────────────────┘");
        result.debugLogs
            .filter(l => l.phase === 'ENCRYPT')
            .slice(0, 10)
            .forEach(l => {
                const data = l.data ? ` ${JSON.stringify(l.data)}` : '';
                console.log(`   • ${l.message}${data}`);
            });
    }
    
    console.log("\n┌───────────────────────────────────────────────────────────────────┐");
    console.log("│ 📜 OBFUSCATED OUTPUT                                             │");
    console.log("└───────────────────────────────────────────────────────────────────┘");
    console.log(result.code);
    
    console.log("\n╔═══════════════════════════════════════════════════════════════════╗");
    console.log("║  ✅ PHASE 2 COMPLETE - Strings are now XOR encrypted!            ║");
    console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

} catch (e) {
    console.error("❌ ERROR:", e);
}

app.use(express.json({ limit: '10mb' }));

app.get('/', (_, res) => {
    res.json({
        name: 'Nephilim Obfuscator',
        version: '0.2.0',
        phase: 'Phase 2 - String Encryption',
        features: ['Variable Renaming', 'String XOR Encryption'],
    });
});

app.post('/obfuscate', (req, res) => {
    try {
        const { code, options } = req.body;
        if (!code) return res.status(400).json({ error: 'No code provided' });
        const result = obfuscate(code, { 
            debug: req.query.debug === 'true',
            ...options 
        });
        res.json({ success: true, ...result });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => console.log(`🚀 Nephilim v0.2.0 running on port ${port}`));
