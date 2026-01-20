import express from 'express';
import { tokenize, obfuscate, TokenType } from './lexer';

const app = express();
const port = process.env.PORT || 3000;

// === ULTIMATE HUB TEST SCRIPT ===
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

// === RUN TEST ===
console.log("\n");
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║          NEPHILIM OBFUSCATOR v0.1.0                        ║");
console.log("║          PHASE 1: LEXER + RENAMER TEST                     ║");
console.log("╚════════════════════════════════════════════════════════════╝");

console.log("\n┌─────────────────────────────────────────────────────────────┐");
console.log("│ ORIGINAL CODE (First 400 chars)                            │");
console.log("└─────────────────────────────────────────────────────────────┘");
console.log(testScript.substring(0, 400) + "...\n");

try {
    const startTime = Date.now();
    const result = obfuscate(testScript);
    const endTime = Date.now();
    
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ OBFUSCATION STATS                                          │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(`  ⏱  Time Taken       : ${endTime - startTime}ms`);
    console.log(`  📊 Original Tokens  : ${result.stats.originalTokens}`);
    console.log(`  🔄 Vars Renamed     : ${result.stats.identifiersRenamed}`);
    console.log(`  📝 Original Size    : ${result.stats.originalLength} chars`);
    console.log(`  📦 Output Size      : ${result.stats.outputLength} chars\n`);
    
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ RENAME MAPPING                                             │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    const entries = Object.entries(result.map);
    entries.forEach(([orig, obf]) => {
        console.log(`  ${orig.padEnd(20)} → ${obf}`);
    });
    
    console.log("\n┌─────────────────────────────────────────────────────────────┐");
    console.log("│ OBFUSCATED OUTPUT                                          │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(result.code);
    
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║         ✅ PHASE 1 OBFUSCATION SUCCESSFUL!                 ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

} catch (e) {
    console.error("❌ OBFUSCATION ERROR:", e);
}

// === EXPRESS SERVER ===
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
    res.json({
        name: 'Nephilim Obfuscator',
        version: '0.1.0',
        status: 'online',
        phase: 'Phase 1 - Renamer',
        endpoints: {
            'POST /obfuscate': 'Send { "code": "your lua code" } to obfuscate'
        }
    });
});

app.post('/obfuscate', (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code) {
            return res.status(400).json({ 
                success: false, 
                error: 'No code provided. Send { "code": "your lua code" }' 
            });
        }
        
        const result = obfuscate(code);
        
        res.json({
            success: true,
            obfuscated: result.code,
            stats: result.stats,
            renameMap: result.map
        });
        
    } catch (e: any) {
        res.status(500).json({ 
            success: false, 
            error: e.message 
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Nephilim API Server running on port ${port}`);
    console.log(`📡 Endpoints:`);
    console.log(`   GET  /           - Status & info`);
    console.log(`   POST /obfuscate  - Obfuscate Lua code`);
});
