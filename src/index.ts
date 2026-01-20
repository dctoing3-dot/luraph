import express from 'express';
import { tokenize, obfuscate, TokenType } from './lexer';

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
console.log("╔════════════════════════════════════════════════════════════╗");
console.log("║       NEPHILIM OBFUSCATOR v0.1.1 (BUG FIXED)               ║");
console.log("║       PHASE 1: SMART RENAMER                               ║");
console.log("╚════════════════════════════════════════════════════════════╝");

try {
    const startTime = Date.now();
    const result = obfuscate(testScript);
    const endTime = Date.now();
    
    console.log("\n┌─────────────────────────────────────────────────────────────┐");
    console.log("│ OBFUSCATION STATS                                          │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(`  ⏱  Time          : ${endTime - startTime}ms`);
    console.log(`  📊 Tokens        : ${result.stats.originalTokens}`);
    console.log(`  🔄 Vars Renamed  : ${result.stats.identifiersRenamed}`);
    console.log(`  📝 Original      : ${result.stats.originalLength} chars`);
    console.log(`  📦 Output        : ${result.stats.outputLength} chars\n`);
    
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ RENAME MAPPING (Local vars only - NO table keys!)          │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    Object.entries(result.map).forEach(([orig, obf]) => {
        console.log(`  ${orig.padEnd(15)} → ${obf}`);
    });
    
    console.log("\n┌─────────────────────────────────────────────────────────────┐");
    console.log("│ OBFUSCATED OUTPUT                                          │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(result.code);
    
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║  ✅ PHASE 1 COMPLETE - Table keys preserved!               ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

} catch (e) {
    console.error("❌ ERROR:", e);
}

app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
    res.json({
        name: 'Nephilim Obfuscator',
        version: '0.1.1',
        status: 'online',
        phase: 'Phase 1 - Smart Renamer'
    });
});

app.post('/obfuscate', (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }
        const result = obfuscate(code);
        res.json({ success: true, obfuscated: result.code, stats: result.stats });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Nephilim API running on port ${port}`);
});
