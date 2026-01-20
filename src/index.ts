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

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║       NEPHILIM OBFUSCATOR v0.1.2 - ALL BUGS FIXED          ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

try {
    const result = obfuscate(testScript);
    
    console.log("📊 STATS:");
    console.log(`   Tokens: ${result.stats.originalTokens} | Renamed: ${result.stats.identifiersRenamed}`);
    console.log(`   Size: ${result.stats.originalLength} → ${result.stats.outputLength} chars\n`);
    
    console.log("🔄 RENAME MAP:");
    Object.entries(result.map).forEach(([o, n]) => console.log(`   ${o.padEnd(12)} → ${n}`));
    
    console.log("\n📜 OUTPUT:\n" + "─".repeat(60));
    console.log(result.code);
    console.log("─".repeat(60));
    
    console.log("\n✅ SUCCESS! Function names & params now renamed!");

} catch (e) { console.error("❌ ERROR:", e); }

app.use(express.json({ limit: '10mb' }));
app.get('/', (_, res) => res.json({ name: 'Nephilim', version: '0.1.2', status: 'online' }));
app.post('/obfuscate', (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'No code' });
        res.json({ success: true, ...obfuscate(code) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});
app.listen(port, () => console.log(`\n🚀 Server on port ${port}`));
