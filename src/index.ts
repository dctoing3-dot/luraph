import express from 'express';
import { tokenize, TokenType } from './lexer';

const app = express();
const port = process.env.PORT || 3000;

// === SCRIPT TEST AREA ===
const testScript = `
-- ULTIMATE HUB LOADER V10.3 (NO KEY SYSTEM)
if getgenv().UHLoaded then
    pcall(function() getgenv().UH:Destroy() end)
    getgenv().UH, getgenv().UHCore = nil, nil
    task.wait(0.3)
end
getgenv().UHLoaded = true
print("=== ULTIMATE HUB LOADER V10.3 STARTING ===")
local CFG = { CU = "https://pastebin.com/raw/hRnCQzUq" }
local HS, TS = game:GetService("HttpService"), game:GetService("TweenService")
`;

console.log("\n\n" + "=".repeat(50));
console.log("NEPHILIM LEXER TEST - RENDER LOGS");
console.log("=".repeat(50));

try {
    const startTime = Date.now();
    const tokens = tokenize(testScript);
    const endTime = Date.now();

    console.log(`[SUCCESS] Tokenization complete in ${endTime - startTime}ms`);
    console.log(`[INFO] Total Tokens Found: ${tokens.length}\n`);

    console.log("--- TOKEN OUTPUT SAMPLE (First 20) ---");
    tokens.slice(0, 20).forEach((t, i) => {
        console.log(`[${i}] Type: ${t.type.padEnd(12)} | Value: "${t.value.replace(/\n/g, '\\n')}"`);
    });

    // Simple analysis
    const identifiers = tokens.filter(t => t.type === TokenType.IDENTIFIER).map(t => t.value);
    console.log("\n--- IDENTIFIERS FOUND (To be renamed) ---");
    console.log([...new Set(identifiers)].join(", "));

} catch (e) {
    console.error("[ERROR] Lexing failed:", e);
}

console.log("=".repeat(50) + "\n\n");

// === DUMMY SERVER (Agar Render tidak crash) ===
app.get('/', (req, res) => {
  res.send('Nephilim Obfuscator Core is Running. Check Logs for Test Output.');
});

app.listen(port, () => {
  console.log(`Nephilim Server listening on port ${port}`);
});
