// ============================================================================
// NEPHILIM OBFUSCATOR v0.3.2 - PHASE 3: FIXED STRING & NUMBER OBFUSCATION
// ============================================================================

export enum TokenType {
    NUMBER = 'NUMBER', STRING = 'STRING', BOOLEAN = 'BOOLEAN', NIL = 'NIL',
    IDENTIFIER = 'IDENTIFIER',
    AND = 'AND', BREAK = 'BREAK', DO = 'DO', ELSE = 'ELSE', ELSEIF = 'ELSEIF',
    END = 'END', FALSE = 'FALSE', FOR = 'FOR', FUNCTION = 'FUNCTION',
    GOTO = 'GOTO', IF = 'IF', IN = 'IN', LOCAL = 'LOCAL', NOT = 'NOT',
    OR = 'OR', REPEAT = 'REPEAT', RETURN = 'RETURN', THEN = 'THEN',
    TRUE = 'TRUE', UNTIL = 'UNTIL', WHILE = 'WHILE', CONTINUE = 'CONTINUE',
    PLUS = 'PLUS', MINUS = 'MINUS', STAR = 'STAR', SLASH = 'SLASH',
    DOUBLE_SLASH = 'DOUBLE_SLASH', PERCENT = 'PERCENT', CARET = 'CARET', HASH = 'HASH',
    EQ = 'EQ', NEQ = 'NEQ', LT = 'LT', GT = 'GT', LTE = 'LTE', GTE = 'GTE',
    ASSIGN = 'ASSIGN',
    LPAREN = 'LPAREN', RPAREN = 'RPAREN', LBRACE = 'LBRACE', RBRACE = 'RBRACE',
    LBRACKET = 'LBRACKET', RBRACKET = 'RBRACKET', SEMICOLON = 'SEMICOLON',
    COLON = 'COLON', DOUBLE_COLON = 'DOUBLE_COLON', COMMA = 'COMMA',
    DOT = 'DOT', DOT_DOT = 'DOT_DOT', DOT_DOT_DOT = 'DOT_DOT_DOT',
    EOF = 'EOF'
}

export interface Token {
    type: TokenType;
    value: string;
    literal?: any;
    line: number;
    column: number;
}

const KEYWORDS: Record<string, TokenType> = {
    'and': TokenType.AND, 'break': TokenType.BREAK, 'do': TokenType.DO,
    'else': TokenType.ELSE, 'elseif': TokenType.ELSEIF, 'end': TokenType.END,
    'false': TokenType.FALSE, 'for': TokenType.FOR, 'function': TokenType.FUNCTION,
    'goto': TokenType.GOTO, 'if': TokenType.IF, 'in': TokenType.IN,
    'local': TokenType.LOCAL, 'nil': TokenType.NIL, 'not': TokenType.NOT,
    'or': TokenType.OR, 'repeat': TokenType.REPEAT, 'return': TokenType.RETURN,
    'then': TokenType.THEN, 'true': TokenType.TRUE, 'until': TokenType.UNTIL,
    'while': TokenType.WHILE, 'continue': TokenType.CONTINUE
};

// ============================================================================
// DEBUG SYSTEM
// ============================================================================

export interface DebugLog { phase: string; message: string; data?: any; }
let debugLogs: DebugLog[] = [];
let debugEnabled = false;

export function enableDebug(enabled: boolean = true): void {
    debugEnabled = enabled;
    debugLogs = [];
}
export function getDebugLogs(): DebugLog[] { return debugLogs; }
function debug(phase: string, message: string, data?: any): void {
    if (debugEnabled) debugLogs.push({ phase, message, data });
}

// ============================================================================
// LEXER
// ============================================================================

export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    private start = 0;
    private current = 0;
    private line = 1;
    private column = 1;
    private startColumn = 1;

    constructor(source: string) { this.source = source; }

    public tokenize(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.startColumn = this.column;
            this.scanToken();
        }
        this.tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
        debug('LEXER', 'Tokenization complete', { tokenCount: this.tokens.length });
        return this.tokens;
    }

    private scanToken(): void {
        const c = this.advance();
        switch (c) {
            case '(': this.addToken(TokenType.LPAREN); break;
            case ')': this.addToken(TokenType.RPAREN); break;
            case '{': this.addToken(TokenType.LBRACE); break;
            case '}': this.addToken(TokenType.RBRACE); break;
            case ']': this.addToken(TokenType.RBRACKET); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case '*': this.addToken(TokenType.STAR); break;
            case '%': this.addToken(TokenType.PERCENT); break;
            case '^': this.addToken(TokenType.CARET); break;
            case '#': this.addToken(TokenType.HASH); break;
            case ';': this.addToken(TokenType.SEMICOLON); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.':
                if (this.match('.')) this.addToken(this.match('.') ? TokenType.DOT_DOT_DOT : TokenType.DOT_DOT);
                else if (this.isDigit(this.peek())) this.number();
                else this.addToken(TokenType.DOT);
                break;
            case '-':
                if (this.match('-')) this.comment();
                else this.addToken(TokenType.MINUS);
                break;
            case '/': this.addToken(this.match('/') ? TokenType.DOUBLE_SLASH : TokenType.SLASH); break;
            case ':': this.addToken(this.match(':') ? TokenType.DOUBLE_COLON : TokenType.COLON); break;
            case '[':
                if (this.peek() === '[' || this.peek() === '=') this.longString();
                else this.addToken(TokenType.LBRACKET);
                break;
            case '=': this.addToken(this.match('=') ? TokenType.EQ : TokenType.ASSIGN); break;
            case '~': if (this.match('=')) this.addToken(TokenType.NEQ); break;
            case '<': this.addToken(this.match('=') ? TokenType.LTE : TokenType.LT); break;
            case '>': this.addToken(this.match('=') ? TokenType.GTE : TokenType.GT); break;
            case '"': case "'": this.string(c); break;
            case ' ': case '\r': case '\t': break;
            case '\n': this.line++; this.column = 1; break;
            default:
                if (this.isDigit(c)) this.number();
                else if (this.isAlpha(c)) this.identifier();
                break;
        }
    }

    private string(quote: string): void {
        let value = '';
        while (!this.isAtEnd() && this.peek() !== quote) {
            if (this.peek() === '\n') { this.line++; this.column = 1; }
            if (this.peek() === '\\') {
                this.advance();
                if (!this.isAtEnd()) {
                    const esc = this.advance();
                    switch (esc) {
                        case 'n': value += '\n'; break;
                        case 't': value += '\t'; break;
                        case 'r': value += '\r'; break;
                        case '\\': value += '\\'; break;
                        case '"': value += '"'; break;
                        case "'": value += "'"; break;
                        case '0': value += '\0'; break;
                        case 'x':
                            if (this.isHexDigit(this.peek()) && this.isHexDigit(this.peekNext())) {
                                value += String.fromCharCode(parseInt(this.advance() + this.advance(), 16));
                            }
                            break;
                        default:
                            if (this.isDigit(esc)) {
                                let dec = esc;
                                if (this.isDigit(this.peek())) dec += this.advance();
                                if (this.isDigit(this.peek())) dec += this.advance();
                                value += String.fromCharCode(parseInt(dec, 10));
                            } else value += esc;
                    }
                }
            } else value += this.advance();
        }
        if (!this.isAtEnd()) this.advance();
        this.addToken(TokenType.STRING, value);
    }

    private longString(): void {
        let level = 0;
        while (this.peek() === '=') { this.advance(); level++; }
        if (this.peek() !== '[') { this.addToken(TokenType.LBRACKET); return; }
        this.advance();
        if (this.peek() === '\n') { this.advance(); this.line++; this.column = 1; }
        let value = '';
        const closing = ']' + '='.repeat(level) + ']';
        while (!this.isAtEnd()) {
            if (this.peek() === '\n') { value += this.advance(); this.line++; this.column = 1; }
            else if (this.checkSeq(closing)) { for (let i = 0; i < closing.length; i++) this.advance(); break; }
            else value += this.advance();
        }
        this.addToken(TokenType.STRING, value);
    }

    private number(): void {
        if (this.source[this.start] === '0') {
            const next = this.peek().toLowerCase();
            if (next === 'x') {
                this.advance();
                while (this.isHexDigit(this.peek()) || this.peek() === '_') this.advance();
                this.addToken(TokenType.NUMBER, parseInt(this.source.substring(this.start, this.current).replace(/_/g, ''), 16));
                return;
            } else if (next === 'b') {
                this.advance();
                while (this.peek() === '0' || this.peek() === '1' || this.peek() === '_') this.advance();
                this.addToken(TokenType.NUMBER, parseInt(this.source.substring(this.start + 2, this.current).replace(/_/g, ''), 2));
                return;
            }
        }
        while (this.isDigit(this.peek()) || this.peek() === '_') this.advance();
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek()) || this.peek() === '_') this.advance();
        }
        if (this.peek().toLowerCase() === 'e') {
            this.advance();
            if (this.peek() === '+' || this.peek() === '-') this.advance();
            while (this.isDigit(this.peek())) this.advance();
        }
        this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current).replace(/_/g, '')));
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        const text = this.source.substring(this.start, this.current);
        const kw = KEYWORDS[text];
        if (kw !== undefined) {
            if (kw === TokenType.TRUE) this.addToken(TokenType.TRUE, true);
            else if (kw === TokenType.FALSE) this.addToken(TokenType.FALSE, false);
            else if (kw === TokenType.NIL) this.addToken(TokenType.NIL, null);
            else this.addToken(kw);
        } else this.addToken(TokenType.IDENTIFIER, text);
    }

    private comment(): void {
        if (this.peek() === '[' && (this.peekNext() === '[' || this.peekNext() === '=')) {
            this.advance();
            let level = 0;
            while (this.peek() === '=') { this.advance(); level++; }
            if (this.peek() === '[') {
                this.advance();
                const closing = ']' + '='.repeat(level) + ']';
                while (!this.isAtEnd()) {
                    if (this.peek() === '\n') { this.advance(); this.line++; this.column = 1; }
                    else if (this.checkSeq(closing)) { for (let i = 0; i < closing.length; i++) this.advance(); break; }
                    else this.advance();
                }
            }
        } else {
            while (!this.isAtEnd() && this.peek() !== '\n') this.advance();
        }
    }

    private isAtEnd(): boolean { return this.current >= this.source.length; }
    private advance(): string { const c = this.source[this.current]; this.current++; this.column++; return c; }
    private peek(): string { return this.isAtEnd() ? '\0' : this.source[this.current]; }
    private peekNext(): string { return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1]; }
    private match(expected: string): boolean {
        if (this.isAtEnd() || this.source[this.current] !== expected) return false;
        this.current++; this.column++; return true;
    }
    private checkSeq(seq: string): boolean {
        for (let i = 0; i < seq.length; i++) {
            if (this.current + i >= this.source.length || this.source[this.current + i] !== seq[i]) return false;
        }
        return true;
    }
    private isDigit(c: string): boolean { return c >= '0' && c <= '9'; }
    private isHexDigit(c: string): boolean { return this.isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F'); }
    private isAlpha(c: string): boolean { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'; }
    private isAlphaNumeric(c: string): boolean { return this.isAlpha(c) || this.isDigit(c); }
    private addToken(type: TokenType, literal?: any): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({ type, value: text, literal: literal !== undefined ? literal : text, line: this.line, column: this.startColumn });
    }
}

export function tokenize(source: string): Token[] { return new Lexer(source).tokenize(); }

// ============================================================================
// RESERVED GLOBALS - EXPANDED
// ============================================================================

const RESERVED = new Set([
    // Lua globals
    'print', 'type', 'tostring', 'tonumber', 'pairs', 'ipairs', 'next', 'select',
    'unpack', 'pcall', 'xpcall', 'error', 'assert', 'setmetatable', 'getmetatable',
    'rawget', 'rawset', 'rawequal', 'loadstring', 'load', 'dofile', 'require',
    'collectgarbage', 'setfenv', 'getfenv', 'math', 'string', 'table', 'os', 'io',
    'coroutine', 'debug', 'bit32', 'bit', 'utf8', 'package',
    
    // Roblox globals
    'game', 'workspace', 'script', 'plugin', 'wait', 'spawn', 'delay', 'tick',
    'time', 'elapsedTime', 'warn', 'typeof', 'task', 'version', 'settings',
    'Instance', 'Vector3', 'Vector2', 'CFrame', 'Color3', 'UDim', 'UDim2', 'Enum',
    'Ray', 'Region3', 'Rect', 'BrickColor', 'TweenInfo', 'NumberSequence',
    'ColorSequence', 'NumberRange', 'PhysicalProperties', 'Random', 'Axes', 'Faces',
    'PathWaypoint', 'OverlapParams', 'RaycastParams', 'DockWidgetPluginGuiInfo',
    'FloatCurveKey', 'RotationCurveKey', 'Font', 'NumberSequenceKeypoint',
    'ColorSequenceKeypoint', 'RBXScriptConnection', 'RBXScriptSignal',
    
    // Executor globals
    'getgenv', 'getrenv', 'getrawmetatable', 'setrawmetatable', 'hookfunction',
    'hookmetamethod', 'newcclosure', 'islclosure', 'iscclosure', 'checkcaller',
    'getinfo', 'getupvalue', 'setupvalue', 'getconstant', 'setconstant',
    'getconnections', 'firesignal', 'fireserver', 'fireclient', 'syn', 'Synapse',
    'Drawing', 'request', 'http_request', 'HttpGet', 'HttpPost', 'readfile',
    'writefile', 'appendfile', 'isfile', 'isfolder', 'makefolder', 'listfiles',
    'setclipboard', 'identifyexecutor', 'getexecutorname', 'gethiddenproperty',
    'sethiddenproperty', 'gethui', 'getinstances', 'getnilinstances', 'fireclickdetector',
    'getcustomasset', 'cloneref', 'compareinstances', 'loadfile', 'crypt', 'base64',
    'lz4', 'cache', 'clonefunction', 'isexecutorclosure', 'getscriptclosure',
    'getscripthash', 'getrunningscripts', 'getloadedmodules', 'isreadonly',
    'setreadonly', 'getproperties', 'getsenv', 'getmenv', 'getfenv', 'setfenv',
    'queue_on_teleport', 'isnetworkowner', 'getnamecallmethod', 'setnamecallmethod',
    
    // Special
    '_G', '_VERSION', '_ENV', 'self', 'nil', 'true', 'false', 'shared',
]);

export interface RenameMap { [original: string]: string; }

// ============================================================================
// NAME GENERATOR
// ============================================================================

class NameGenerator {
    private usedNames = new Set<string>();
    private counter = 0;
    
    generate(): string {
        let name: string;
        do { name = this.createName(this.counter++); } while (this.usedNames.has(name));
        this.usedNames.add(name);
        return name;
    }
    
    private createName(index: number): string {
        const chars = ['I', 'l'];
        let name = '';
        let num = index;
        do { name = chars[num % 2] + name; num = Math.floor(num / 2); } while (num > 0);
        while (name.length < 8) {
            const padIndex = (index + name.length) % 2;
            name = chars[padIndex] + name;
        }
        return name;
    }
}

// ============================================================================
// IMPROVED IDENTIFIER ANALYSIS
// ============================================================================

function analyzeIdentifiers(tokens: Token[]): Set<string> {
    const localVars = new Set<string>();
    const scopeStack: Set<string>[] = [new Set()];
    
    const currentScope = () => scopeStack[scopeStack.length - 1];
    const isInAnyScope = (name: string) => scopeStack.some(s => s.has(name));
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        // Track scope
        if (t.type === TokenType.FUNCTION || t.type === TokenType.DO || 
            t.type === TokenType.THEN || t.type === TokenType.ELSE ||
            t.type === TokenType.REPEAT) {
            scopeStack.push(new Set());
        }
        if (t.type === TokenType.END || t.type === TokenType.UNTIL) {
            if (scopeStack.length > 1) scopeStack.pop();
        }
        
        if (t.type !== TokenType.IDENTIFIER) continue;
        if (RESERVED.has(t.value)) continue;
        
        const prev = tokens[i - 1];
        const prev2 = tokens[i - 2];
        const next = tokens[i + 1];
        
        // Skip property access: obj.prop or obj:method
        if (prev && (prev.type === TokenType.DOT || prev.type === TokenType.COLON)) continue;
        
        // Skip table keys in braces: { key = value }
        let braceDepth = 0;
        for (let j = 0; j < i; j++) {
            if (tokens[j].type === TokenType.LBRACE) braceDepth++;
            if (tokens[j].type === TokenType.RBRACE) braceDepth--;
        }
        if (braceDepth > 0 && next && next.type === TokenType.ASSIGN) continue;
        
        let isLocal = false;
        
        // Direct local declaration: local x
        if (prev && prev.type === TokenType.LOCAL) isLocal = true;
        
        // Multiple local declaration: local a, b, c
        if (!isLocal && prev && prev.type === TokenType.COMMA) {
            for (let j = i - 1; j >= 0; j--) {
                if (tokens[j].type === TokenType.LOCAL) { isLocal = true; break; }
                if (tokens[j].type === TokenType.ASSIGN || tokens[j].type === TokenType.IN) break;
                if (tokens[j].line < t.line) break;
            }
        }
        
        // Local function: local function name
        if (!isLocal && prev && prev.type === TokenType.FUNCTION && prev2 && prev2.type === TokenType.LOCAL) {
            isLocal = true;
        }
        
        // Function parameter
        if (!isLocal) {
            let parenDepth = 0;
            for (let j = i - 1; j >= 0; j--) {
                const tk = tokens[j];
                if (tk.type === TokenType.RPAREN) parenDepth++;
                if (tk.type === TokenType.LPAREN) {
                    parenDepth--;
                    if (parenDepth < 0) {
                        if (j > 0 && tokens[j - 1].type === TokenType.FUNCTION) isLocal = true;
                        break;
                    }
                }
                if (tk.type === TokenType.END || tk.type === TokenType.DO) break;
            }
        }
        
        // For loop variables: for i, v in / for i = 
        if (!isLocal) {
            for (let j = i - 1; j >= 0; j--) {
                if (tokens[j].type === TokenType.FOR) { isLocal = true; break; }
                if (tokens[j].type === TokenType.DO || tokens[j].type === TokenType.END) break;
                if (tokens[j].line < t.line) break;
            }
        }
        
        if (isLocal) {
            localVars.add(t.value);
            currentScope().add(t.value);
        }
    }
    
    return localVars;
}

export function createRenameMap(tokens: Token[]): RenameMap {
    const map: RenameMap = {};
    const generator = new NameGenerator();
    const localVars = analyzeIdentifiers(tokens);
    
    for (const name of localVars) {
        map[name] = generator.generate();
        debug('RENAME', `${name} → ${map[name]}`);
    }
    
    return map;
}

export function applyRenameMap(tokens: Token[], map: RenameMap): Token[] {
    const result: Token[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.type !== TokenType.IDENTIFIER || !map[t.value]) { 
            result.push(t); 
            continue; 
        }
        
        const prev = tokens[i - 1];
        const next = tokens[i + 1];
        
        // Don't rename property access
        if (prev && (prev.type === TokenType.DOT || prev.type === TokenType.COLON)) { 
            result.push(t); 
            continue; 
        }
        
        // Don't rename table keys
        let braceDepth = 0;
        for (let j = 0; j < i; j++) {
            if (tokens[j].type === TokenType.LBRACE) braceDepth++;
            if (tokens[j].type === TokenType.RBRACE) braceDepth--;
        }
        if (braceDepth > 0 && next && next.type === TokenType.ASSIGN) { 
            result.push(t); 
            continue; 
        }
        
        result.push({ ...t, value: map[t.value], literal: map[t.value] });
    }
    
    return result;
}

// ============================================================================
// STRING ENCRYPTION (XOR) - PHASE 2 [IMPROVED]
// ============================================================================

export interface StringEncryptionResult {
    encryptedStrings: Map<string, { encrypted: string; key: number }>;
    decryptorName: string;
    decryptorCode: string;
}

function generateXorKey(): number {
    return Math.floor(Math.random() * 200) + 50; // 50-250
}

/**
 * XOR encrypt dengan HEX escape sequence (\xNN) - lebih reliable
 */
function xorEncryptHex(str: string, key: number): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        const encrypted = (charCode ^ key) & 0xFF;
        result += '\\x' + encrypted.toString(16).padStart(2, '0');
    }
    return result;
}

function generateObfuscatedName(prefix: string = ''): string {
    const chars = ['I', 'l'];
    let name = prefix;
    for (let i = 0; i < 5; i++) {
        name += chars[Math.floor(Math.random() * 2)];
    }
    return name;
}

export function encryptStrings(tokens: Token[]): { tokens: Token[]; encryption: StringEncryptionResult } {
    const encryptedStrings = new Map<string, { encrypted: string; key: number }>();
    const decryptorName = generateObfuscatedName('_');
    const globalKey = generateXorKey();
    
    debug('ENCRYPT', `Using XOR key: ${globalKey}`);
    debug('ENCRYPT', `Decryptor: ${decryptorName}`);
    
    const result: Token[] = [];
    let stringCount = 0;
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        // Encrypt ALL strings (no length skip)
        if (t.type === TokenType.STRING && typeof t.literal === 'string') {
            const original = t.literal;
            
            // Skip empty strings
            if (original.length === 0) {
                result.push(t);
                continue;
            }
            
            const encrypted = xorEncryptHex(original, globalKey);
            encryptedStrings.set(original, { encrypted, key: globalKey });
            
            debug('ENCRYPT', `"${original.substring(0, 20)}${original.length > 20 ? '...' : ''}" encrypted`);
            
            // Generate decryptor call: _Dec("encrypted", key)
            result.push({ type: TokenType.IDENTIFIER, value: decryptorName, line: t.line, column: t.column });
            result.push({ type: TokenType.LPAREN, value: '(', line: t.line, column: t.column });
            result.push({ type: TokenType.STRING, value: `"${encrypted}"`, literal: encrypted, line: t.line, column: t.column });
            result.push({ type: TokenType.COMMA, value: ',', line: t.line, column: t.column });
            result.push({ type: TokenType.NUMBER, value: globalKey.toString(), literal: globalKey, line: t.line, column: t.column });
            result.push({ type: TokenType.RPAREN, value: ')', line: t.line, column: t.column });
            
            stringCount++;
        } else {
            result.push(t);
        }
    }
    
    debug('ENCRYPT', `Total encrypted: ${stringCount}`);
    
    // Robust decryptor - works in ALL Lua environments
    const decryptorCode = `local ${decryptorName}=(function()local b=bit32 or bit local x=b and b.bxor or function(a,c)local r,p=0,1 while a>0 or c>0 do if a%2~=c%2 then r=r+p end a,c,p=math.floor(a/2),math.floor(c/2),p*2 end return r end return function(s,k)local o=""for i=1,#s do o=o..string.char(x(s:byte(i),k))end return o end end)()`;
    
    return {
        tokens: result,
        encryption: {
            encryptedStrings,
            decryptorName,
            decryptorCode
        }
    };
}

// ============================================================================
// NUMBER OBFUSCATION - PHASE 3
// ============================================================================

export interface NumberObfuscationConfig {
    complexity: 'low' | 'medium' | 'high';
    useBitwise: boolean;
    useMathFunctions: boolean;
    maxDepth: number;
}

const DEFAULT_NUMBER_CONFIG: NumberObfuscationConfig = {
    complexity: 'medium',
    useBitwise: true,
    useMathFunctions: true,
    maxDepth: 2
};

class NumberObfuscator {
    private config: NumberObfuscationConfig;
    
    constructor(config: Partial<NumberObfuscationConfig> = {}) {
        this.config = { ...DEFAULT_NUMBER_CONFIG, ...config };
    }
    
    obfuscateNumber(num: number): string {
        if (Number.isNaN(num)) return '(0/0)';
        if (num === Infinity) return '(1/0)';
        if (num === -Infinity) return '(-1/0)';
        
        if (Number.isInteger(num)) {
            return this.obfuscateInteger(num);
        }
        return this.obfuscateFloat(num);
    }
    
    private obfuscateInteger(num: number): string {
        const strategies: (() => string)[] = [];
        const absNum = Math.abs(num);
        
        // Strategy 1: Simple arithmetic
        strategies.push(() => {
            const a = Math.floor(Math.random() * 500) + 100;
            const b = num - a;
            return `(${a}${b >= 0 ? '+' : ''}${b})`;
        });
        
        // Strategy 2: Subtraction
        strategies.push(() => {
            const a = num + Math.floor(Math.random() * 500) + 100;
            return `(${a}-${a - num})`;
        });
        
        // Strategy 3: Multiplication (if factorable)
        if (absNum > 1) {
            for (let f = 2; f <= Math.min(20, Math.sqrt(absNum)); f++) {
                if (absNum % f === 0) {
                    const sign = num < 0 ? '-' : '';
                    strategies.push(() => `(${sign}${f}*${absNum / f})`);
                    break;
                }
            }
        }
        
        // Strategy 4: Bitwise XOR
        if (this.config.useBitwise && num >= 0 && num <= 0x7FFFFFFF) {
            strategies.push(() => {
                const key = Math.floor(Math.random() * 0xFFF) + 1;
                return `bit32.bxor(${num ^ key},${key})`;
            });
        }
        
        // Strategy 5: Floor division
        if (num !== 0) {
            strategies.push(() => {
                const m = Math.floor(Math.random() * 10) + 2;
                return `(${num * m}//${m})`;
            });
        }
        
        // Strategy 6: Hex
        if (absNum > 15) {
            strategies.push(() => `${num < 0 ? '-' : ''}0x${absNum.toString(16).toUpperCase()}`);
        }
        
        return strategies[Math.floor(Math.random() * strategies.length)]();
    }
    
    private obfuscateFloat(num: number): string {
        const precision = 1000000;
        const numerator = Math.round(num * precision);
        const gcd = this.gcd(Math.abs(numerator), precision);
        return `(${numerator / gcd}/${precision / gcd})`;
    }
    
    private gcd(a: number, b: number): number {
        return b === 0 ? a : this.gcd(b, a % b);
    }
}

export function obfuscateNumbers(
    tokens: Token[], 
    config: Partial<NumberObfuscationConfig> = {}
): { tokens: Token[]; numbersObfuscated: number } {
    const obfuscator = new NumberObfuscator(config);
    const result: Token[] = [];
    let numbersObfuscated = 0;
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        if (t.type === TokenType.NUMBER && typeof t.literal === 'number') {
            const num = t.literal;
            
            // Skip numbers in for loops completely
            let inForLoop = false;
            for (let j = i - 1; j >= Math.max(0, i - 15); j--) {
                if (tokens[j].type === TokenType.FOR) { inForLoop = true; break; }
                if (tokens[j].type === TokenType.DO) break;
            }
            
            if (inForLoop) {
                result.push(t);
                continue;
            }
            
            // Skip simple array indices [1], [2], etc.
            const prev = tokens[i - 1];
            if (prev && prev.type === TokenType.LBRACKET && num >= 1 && num <= 10 && Number.isInteger(num)) {
                result.push(t);
                continue;
            }
            
            const obfuscated = obfuscator.obfuscateNumber(num);
            const exprTokens = expressionToTokens(obfuscated, t.line, t.column);
            result.push(...exprTokens);
            numbersObfuscated++;
        } else {
            result.push(t);
        }
    }
    
    debug('NUMBER', `Obfuscated: ${numbersObfuscated}`);
    return { tokens: result, numbersObfuscated };
}

function expressionToTokens(expr: string, line: number, column: number): Token[] {
    const result: Token[] = [];
    let i = 0;
    
    const addTok = (type: TokenType, value: string, literal?: any) => {
        result.push({ type, value, literal: literal !== undefined ? literal : value, line, column });
    };
    
    while (i < expr.length) {
        const c = expr[i];
        if (c === ' ') { i++; continue; }
        
        switch (c) {
            case '(': addTok(TokenType.LPAREN, '('); i++; break;
            case ')': addTok(TokenType.RPAREN, ')'); i++; break;
            case '+': addTok(TokenType.PLUS, '+'); i++; break;
            case '*': addTok(TokenType.STAR, '*'); i++; break;
            case '%': addTok(TokenType.PERCENT, '%'); i++; break;
            case '^': addTok(TokenType.CARET, '^'); i++; break;
            case ',': addTok(TokenType.COMMA, ','); i++; break;
            case '.': addTok(TokenType.DOT, '.'); i++; break;
            case '#': addTok(TokenType.HASH, '#'); i++; break;
            case '-': addTok(TokenType.MINUS, '-'); i++; break;
            case '/':
                if (expr[i + 1] === '/') { addTok(TokenType.DOUBLE_SLASH, '//'); i += 2; }
                else { addTok(TokenType.SLASH, '/'); i++; }
                break;
            default:
                if (/[0-9]/.test(c)) {
                    let numStr = '';
                    if (c === '0' && expr[i + 1]?.toLowerCase() === 'x') {
                        numStr = '0x'; i += 2;
                        while (i < expr.length && /[0-9a-fA-F]/.test(expr[i])) { numStr += expr[i++]; }
                        addTok(TokenType.NUMBER, numStr, parseInt(numStr, 16));
                    } else {
                        while (i < expr.length && /[0-9.]/.test(expr[i])) { numStr += expr[i++]; }
                        addTok(TokenType.NUMBER, numStr, parseFloat(numStr));
                    }
                } else if (/[a-zA-Z_]/.test(c)) {
                    let ident = '';
                    while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) { ident += expr[i++]; }
                    addTok(TokenType.IDENTIFIER, ident);
                } else { i++; }
        }
    }
    
    return result;
}

// ============================================================================
// CODE GENERATOR
// ============================================================================

const SPACE_AFTER = new Set([
    TokenType.LOCAL, TokenType.FUNCTION, TokenType.IF, TokenType.THEN,
    TokenType.ELSE, TokenType.ELSEIF, TokenType.WHILE, TokenType.DO,
    TokenType.FOR, TokenType.IN, TokenType.RETURN, TokenType.AND,
    TokenType.OR, TokenType.NOT, TokenType.END, TokenType.UNTIL,
    TokenType.REPEAT, TokenType.BREAK, TokenType.GOTO,
    TokenType.IDENTIFIER, TokenType.NUMBER, TokenType.STRING,
    TokenType.TRUE, TokenType.FALSE, TokenType.NIL,
    TokenType.RPAREN, TokenType.RBRACE, TokenType.RBRACKET
]);

const SPACE_BEFORE = new Set([
    TokenType.IDENTIFIER, TokenType.NUMBER, TokenType.STRING,
    TokenType.TRUE, TokenType.FALSE, TokenType.NIL, TokenType.FUNCTION,
    TokenType.IF, TokenType.THEN, TokenType.ELSE, TokenType.END,
    TokenType.LOCAL, TokenType.RETURN, TokenType.AND, TokenType.OR,
    TokenType.NOT, TokenType.DO, TokenType.WHILE, TokenType.FOR,
    TokenType.IN, TokenType.UNTIL, TokenType.REPEAT, TokenType.ELSEIF,
    TokenType.LBRACE, TokenType.LPAREN
]);

const NO_SPACE_AFTER = new Set([
    TokenType.LPAREN, TokenType.LBRACE, TokenType.LBRACKET,
    TokenType.DOT, TokenType.COLON, TokenType.HASH, TokenType.NOT
]);

const NO_SPACE_BEFORE = new Set([
    TokenType.RPAREN, TokenType.RBRACE, TokenType.RBRACKET,
    TokenType.DOT, TokenType.COLON, TokenType.COMMA, TokenType.SEMICOLON,
    TokenType.LPAREN, TokenType.LBRACKET
]);

export function tokensToCode(tokens: Token[], prependCode: string = ''): string {
    let code = prependCode ? prependCode + ' ' : '';
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const prev = tokens[i - 1];
        if (t.type === TokenType.EOF) continue;
        
        if (prev && prev.type !== TokenType.EOF) {
            const needsSpace = !NO_SPACE_AFTER.has(prev.type) &&
                               !NO_SPACE_BEFORE.has(t.type) &&
                               (SPACE_AFTER.has(prev.type) || SPACE_BEFORE.has(t.type));
            if (needsSpace) code += ' ';
        }
        
        if (t.type === TokenType.STRING) {
            if (t.value.startsWith('"') || t.value.startsWith("'")) {
                code += t.value;
            } else {
                const escaped = (t.literal ?? '')
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');
                code += '"' + escaped + '"';
            }
        } else {
            code += t.value;
        }
    }
    
    return code;
}

// ============================================================================
// MAIN OBFUSCATE FUNCTION
// ============================================================================

export interface ObfuscateOptions {
    debug?: boolean;
    renameVariables?: boolean;
    encryptStrings?: boolean;
    obfuscateNumbers?: boolean;
    numberComplexity?: 'low' | 'medium' | 'high';
}

export interface ObfuscateResult {
    code: string;
    map: RenameMap;
    stats: {
        originalTokens: number;
        identifiersRenamed: number;
        stringsEncrypted: number;
        numbersObfuscated: number;
        originalLength: number;
        outputLength: number;
        timeMs: number;
    };
    debugLogs?: DebugLog[];
}

export function obfuscate(source: string, options: ObfuscateOptions = {}): ObfuscateResult {
    const startTime = Date.now();
    
    const opts = {
        debug: options.debug ?? false,
        renameVariables: options.renameVariables ?? true,
        encryptStrings: options.encryptStrings ?? true,
        obfuscateNumbers: options.obfuscateNumbers ?? true,
        numberComplexity: options.numberComplexity ?? 'medium'
    };
    
    enableDebug(opts.debug);
    debug('MAIN', 'Nephilim v0.3.2 starting', opts);
    
    let tokens = tokenize(source);
    const originalTokenCount = tokens.length;
    
    // Phase 1: Rename variables
    let renameMap: RenameMap = {};
    if (opts.renameVariables) {
        renameMap = createRenameMap(tokens);
        tokens = applyRenameMap(tokens, renameMap);
        debug('MAIN', `Renamed ${Object.keys(renameMap).length} identifiers`);
    }
    
    // Phase 2: Encrypt strings
    let stringsEncrypted = 0;
    let prependCode = '';
    if (opts.encryptStrings) {
        const encResult = encryptStrings(tokens);
        tokens = encResult.tokens;
        prependCode = encResult.encryption.decryptorCode;
        stringsEncrypted = encResult.encryption.encryptedStrings.size;
        debug('MAIN', `Encrypted ${stringsEncrypted} strings`);
    }
    
    // Phase 3: Obfuscate numbers
    let numbersObfuscated = 0;
    if (opts.obfuscateNumbers) {
        const numResult = obfuscateNumbers(tokens, {
            complexity: opts.numberComplexity,
            useBitwise: true,
            useMathFunctions: true,
            maxDepth: 2
        });
        tokens = numResult.tokens;
        numbersObfuscated = numResult.numbersObfuscated;
        debug('MAIN', `Obfuscated ${numbersObfuscated} numbers`);
    }
    
    const code = tokensToCode(tokens, prependCode);
    const endTime = Date.now();
    
    return {
        code,
        map: renameMap,
        stats: {
            originalTokens: originalTokenCount,
            identifiersRenamed: Object.keys(renameMap).length,
            stringsEncrypted,
            numbersObfuscated,
            originalLength: source.length,
            outputLength: code.length,
            timeMs: endTime - startTime
        },
        debugLogs: opts.debug ? getDebugLogs() : undefined
    };
}

export default { obfuscate, tokenize, enableDebug, getDebugLogs };
