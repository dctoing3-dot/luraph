import express from 'express';
import { obfuscate, ObfuscateResult } from './lexer';

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

// ============================================================================
// MAIN TEST
// ============================================================================

console.log("\n");
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║    NEPHILIM OBFUSCATOR v0.1.3 - FIXED + DEBUG MODE           ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

try {
    // Run with DEBUG MODE ON
    const result = obfuscate(testScript, { debug: true });
    
    // ===== STATS =====
    console.log("┌──────────────────────────────────────────────────────────────┐");
    console.log("│ 📊 STATISTICS                                                │");
    console.log("└──────────────────────────────────────────────────────────────┘");
    console.log(`   ⏱  Time        : ${result.stats.timeMs}ms`);
    console.log(`   📝 Tokens      : ${result.stats.originalTokens}`);
    console.log(`   🔄 Renamed     : ${result.stats.identifiersRenamed}`);
    console.log(`   📏 Size        : ${result.stats.originalLength} → ${result.stats.outputLength} chars\n`);
    
    // ===== RENAME MAP =====
    console.log("┌──────────────────────────────────────────────────────────────┐");
    console.log("│ 🔄 RENAME MAP (No Collisions!)                               │");
    console.log("└──────────────────────────────────────────────────────────────┘");
    
    const names = Object.values(result.map);
    const uniqueNames = new Set(names);
    const hasCollision = names.length !== uniqueNames.size;
    
    Object.entries(result.map).forEach(([orig, obf]) => {
        console.log(`   ${orig.padEnd(12)} → ${obf}`);
    });
    
    if (hasCollision) {
        console.log("\n   ⚠️  WARNING: Name collision detected!");
    } else {
        console.log(`\n   ✅ All ${names.length} names are unique!`);
    }
    
    // ===== DEBUG LOGS =====
    if (result.debugLogs && result.debugLogs.length > 0) {
        console.log("\n┌──────────────────────────────────────────────────────────────┐");
        console.log("│ 🔍 DEBUG LOGS                                                │");
        console.log("└──────────────────────────────────────────────────────────────┘");
        
        // Group by phase
        const phases: { [key: string]: typeof result.debugLogs } = {};
        result.debugLogs.forEach(log => {
            if (!phases[log.phase]) phases[log.phase] = [];
            phases[log.phase].push(log);
        });
        
        // Show summary per phase
        Object.entries(phases).forEach(([phase, logs]) => {
            console.log(`\n   [${phase}] - ${logs.length} entries`);
            // Show first 5 of each phase
            logs.slice(0, 5).forEach(log => {
                const data = log.data ? ` ${JSON.stringify(log.data)}` : '';
                console.log(`      • ${log.message}${data}`);
            });
            if (logs.length > 5) {
                console.log(`      ... and ${logs.length - 5} more`);
            }
        });
    }
    
    // ===== OUTPUT =====
    console.log("\n┌──────────────────────────────────────────────────────────────┐");
    console.log("│ 📜 OBFUSCATED OUTPUT                                         │");
    console.log("└──────────────────────────────────────────────────────────────┘");
    console.log(result.code);
    
    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║  ✅ PHASE 1 COMPLETE - Ready for Phase 2: String Encryption  ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

} catch (e) {
    console.error("❌ ERROR:", e);
}

// ============================================================================
// EXPRESS SERVER
// ============================================================================

app.use(express.json({ limit: '10mb' }));

app.get('/', (_, res) => {
    res.json({
        name: 'Nephilim Obfuscator',
        version: '0.1.3',
        status: 'online',
        endpoints: {
            'GET /': 'This info',
            'POST /obfuscate': 'Obfuscate code',
            'POST /obfuscate?debug=true': 'Obfuscate with debug logs'
        }
    });
});

app.post('/obfuscate', (req, res) => {
    try {
        const { code } = req.body;
        const debug = req.query.debug === 'true';
        
        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }
        
        const result = obfuscate(code, { debug });
        res.json({ success: true, ...result });
        
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Nephilim API Server running on port ${port}`);
});
