import express from 'express';
import { tokenize, obfuscate, TokenType } from './lexer';

const app = express();
const port = process.env.PORT || 3000;

// === SCRIPT TEST - Ultimate Hub Snippet ===
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
console.log("║          NEPHILIM OBFUSCATOR - PHASE 1 TEST                ║");
console.log("║                 RENAMER TRANSFORMER                        ║");
console.log("╚════════════════════════════════════════════════════════════╝");

console.log("\n┌─────────────────────────────────────────────────────────────┐");
console.log("│ ORIGINAL CODE (Input)                                       │");
console.log("└─────────────────────────────────────────────────────────────┘");
console.log(testScript.substring(0, 500) + "...\n");

try {
    // Run obfuscation
    const result = obfuscate(testScript);
    
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ OBFUSCATION STATS                                          │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(`  ✓ Original Tokens  : ${result.stats.originalTokens}`);
    console.log(`  ✓ Renamed Variables: ${result.stats.identifiersRenamed}`);
    console.log(`  ✓ Output Length    : ${result.stats.outputLength} chars\n`);
    
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ RENAME MAPPING (Original → Obfuscated)                     │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    Object.entries(result.map).forEach(([orig, obf]) => {
        console.log(`  ${orig.padEnd(15)} → ${obf}`);
    });
    
    console.log("\n┌─────────────────────────────────────────────────────────────┐");
    console.log("│ OBFUSCATED CODE (Output)                                   │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(result.code);
    
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║              ✅ OBFUSCATION SUCCESSFUL!                    ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

} catch (e) {
    console.error("❌ ERROR:", e);
}

// === Express Server ===
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        name: 'Nephilim Obfuscator',
        version: '0.1.0',
        phase: 'Phase 1 - Renamer'
    });
});

// API endpoint untuk obfuscate (untuk nanti)
app.use(express.json());
app.post('/obfuscate', (req, res) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }
        const result = obfuscate(code);
        res.json({
            success: true,
            obfuscated: result.code,
            stats: result.stats
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Nephilim Server running on port ${port}`);
    console.log(`📡 API: POST /obfuscate { "code": "your lua code" }`);
});
