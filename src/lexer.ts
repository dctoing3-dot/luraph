// ============================================================================
// NEPHILIM OBFUSCATOR v0.3.0 - PHASE 3: NUMBER OBFUSCATION
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
// RESERVED GLOBALS
// ============================================================================

const RESERVED = new Set([
    'print', 'type', 'tostring', 'tonumber', 'pairs', 'ipairs', 'next', 'select',
    'unpack', 'pcall', 'xpcall', 'error', 'assert', 'setmetatable', 'getmetatable',
    'rawget', 'rawset', 'rawequal', 'loadstring', 'load', 'dofile', 'require',
    'collectgarbage', 'setfenv', 'getfenv', 'math', 'string', 'table', 'os', 'io',
    'coroutine', 'debug', 'bit32', 'bit', 'utf8', 'package',
    'game', 'workspace', 'script', 'plugin', 'wait', 'spawn', 'delay', 'tick',
    'time', 'elapsedTime', 'warn', 'typeof', 'task', 'version',
    'Instance', 'Vector3', 'Vector2', 'CFrame', 'Color3', 'UDim', 'UDim2', 'Enum',
    'Ray', 'Region3', 'Rect', 'BrickColor', 'TweenInfo', 'NumberSequence',
    'ColorSequence', 'NumberRange', 'PhysicalProperties', 'Random',
    'getgenv', 'getrenv', 'getrawmetatable', 'setrawmetatable', 'hookfunction',
    'hookmetamethod', 'newcclosure', 'islclosure', 'iscclosure', 'checkcaller',
    'getinfo', 'getupvalue', 'setupvalue', 'getconstant', 'setconstant',
    'getconnections', 'firesignal', 'fireserver', 'fireclient', 'syn', 'Synapse',
    'Drawing', 'request', 'http_request', 'HttpGet', 'HttpPost', 'readfile',
    'writefile', 'appendfile', 'isfile', 'isfolder', 'makefolder', 'listfiles',
    'setclipboard', 'identifyexecutor', 'getexecutorname',
    '_G', '_VERSION', '_ENV', 'self', 'nil', 'true', 'false',
    'GetService', 'FindFirstChild', 'WaitForChild', 'GetChildren', 'GetDescendants',
    'IsA', 'Clone', 'Destroy', 'Connect', 'Disconnect', 'Fire', 'Invoke',
    'SetCore', 'GetPropertyChangedSignal', 'GetAttribute', 'SetAttribute',
    'LocalPlayer', 'Character', 'Humanoid', 'HumanoidRootPart', 'Parent', 'Name',
    'Position', 'Enabled', 'Visible', 'Value', 'Text', 'Title', 'Duration', 'Icon',
    'Callback', 'CurrentValue', 'Options', 'Range', 'Increment', 'Color',
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
// IDENTIFIER ANALYSIS
// ============================================================================

function analyzeIdentifiers(tokens: Token[]): Set<string> {
    const localVars = new Set<string>();
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.type !== TokenType.IDENTIFIER) continue;
        if (RESERVED.has(t.value)) continue;
        
        const prev = tokens[i - 1];
        const prev2 = tokens[i - 2];
        const next = tokens[i + 1];
        
        if (prev && (prev.type === TokenType.DOT || prev.type === TokenType.COLON)) continue;
        
        let braceDepth = 0;
        for (let j = 0; j < i; j++) {
            if (tokens[j].type === TokenType.LBRACE) braceDepth++;
            if (tokens[j].type === TokenType.RBRACE) braceDepth--;
        }
        if (braceDepth > 0 && next && next.type === TokenType.ASSIGN) continue;
        
        let isLocal = false;
        
        if (prev && prev.type === TokenType.LOCAL) isLocal = true;
        
        if (!isLocal && prev && prev.type === TokenType.COMMA) {
            for (let j = i - 1; j >= 0; j--) {
                if (tokens[j].type === TokenType.LOCAL) { isLocal = true; break; }
                if (tokens[j].type === TokenType.ASSIGN || tokens[j].line < t.line) break;
            }
        }
        
        if (!isLocal && prev && prev.type === TokenType.FUNCTION && prev2 && prev2.type === TokenType.LOCAL) {
            isLocal = true;
        }
        
        if (!isLocal) {
            let parenDepth = 0;
            for (let j = i - 1; j >= 0; j--) {
                const tk = tokens[j];
                if (tk.type === TokenType.RPAREN) parenDepth++;
                if (tk.type === TokenType.LPAREN) {
                    parenDepth--;
                    if (parenDepth < 0) {
                        for (let k = j - 1; k >= 0; k--) {
                            if (tokens[k].type === TokenType.FUNCTION) { isLocal = true; break; }
                            if (tokens[k].type === TokenType.RPAREN || tokens[k].type === TokenType.END) break;
                        }
                        break;
                    }
                }
                if (tk.line < t.line - 1) break;
            }
        }
        
        if (isLocal) localVars.add(t.value);
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
        if (t.type !== TokenType.IDENTIFIER || !map[t.value]) { result.push(t); continue; }
        
        const prev = tokens[i - 1];
        const next = tokens[i + 1];
        
        if (prev && (prev.type === TokenType.DOT || prev.type === TokenType.COLON)) { result.push(t); continue; }
        
        let braceDepth = 0;
        for (let j = 0; j < i; j++) {
            if (tokens[j].type === TokenType.LBRACE) braceDepth++;
            if (tokens[j].type === TokenType.RBRACE) braceDepth--;
        }
        if (braceDepth > 0 && next && next.type === TokenType.ASSIGN) { result.push(t); continue; }
        
        result.push({ ...t, value: map[t.value], literal: map[t.value] });
    }
    
    return result;
}

// ============================================================================
// STRING ENCRYPTION (XOR) - PHASE 2
// ============================================================================

export interface StringEncryptionResult {
    encryptedStrings: Map<string, { encrypted: string; key: number }>;
    decryptorName: string;
    decryptorCode: string;
}

function generateXorKey(): number {
    return Math.floor(Math.random() * 0xEF) + 0x10;
}

function xorEncrypt(str: string, key: number): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        const encrypted = charCode ^ key;
        result += '\\' + encrypted.toString(8).padStart(3, '0');
    }
    return result;
}

function generateObfuscatedName(prefix: string = ''): string {
    const chars = ['I', 'l', '_'];
    let name = prefix || '_';
    for (let i = 0; i < 4; i++) {
        name += chars[Math.floor(Math.random() * 2)];
    }
    name += '_';
    return name;
}

export function encryptStrings(tokens: Token[]): { tokens: Token[]; encryption: StringEncryptionResult } {
    const encryptedStrings = new Map<string, { encrypted: string; key: number }>();
    const decryptorName = generateObfuscatedName('_S');
    const globalKey = generateXorKey();
    
    debug('ENCRYPT', `Using global XOR key: 0x${globalKey.toString(16)}`);
    debug('ENCRYPT', `Decryptor function name: ${decryptorName}`);
    
    const result: Token[] = [];
    let stringCount = 0;
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        if (t.type === TokenType.STRING && t.literal && t.literal.length > 0) {
            const original = t.literal as string;
            
            if (original.length <= 2) {
                result.push(t);
                continue;
            }
            
            const encrypted = xorEncrypt(original, globalKey);
            encryptedStrings.set(original, { encrypted, key: globalKey });
            
            debug('ENCRYPT', `String encrypted`, { 
                original: original.substring(0, 30) + (original.length > 30 ? '...' : ''),
                length: original.length 
            });
            
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
    
    debug('ENCRYPT', `Total strings encrypted: ${stringCount}`);
    
    // Luau-compatible decryptor using bit32
    const decryptorCode = `local ${decryptorName}=(function(s,k)local r=""for i=1,#s do r=r..string.char(bit32.bxor(string.byte(s,i),k))end return r end)`;
    
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
    maxDepth: 3
};

class NumberObfuscator {
    private config: NumberObfuscationConfig;
    private mathCacheName: string;
    private usedMathFuncs: Set<string> = new Set();
    
    constructor(config: Partial<NumberObfuscationConfig> = {}) {
        this.config = { ...DEFAULT_NUMBER_CONFIG, ...config };
        this.mathCacheName = generateObfuscatedName('_M');
    }
    
    /**
     * Generates obfuscated expression for a number
     */
    obfuscateNumber(num: number, depth: number = 0): string {
        // Handle special cases
        if (num !== num) return '(0/0)'; // NaN
        if (num === Infinity) return '(1/0)';
        if (num === -Infinity) return '(-1/0)';
        
        // Base case or simple numbers
        if (depth >= this.config.maxDepth) {
            return this.generateBaseExpression(num);
        }
        
        // Choose obfuscation strategy based on number type
        if (Number.isInteger(num)) {
            return this.obfuscateInteger(num, depth);
        } else {
            return this.obfuscateFloat(num, depth);
        }
    }
    
    /**
     * Obfuscate integer values
     */
    private obfuscateInteger(num: number, depth: number): string {
        const strategies: (() => string)[] = [];
        
        // Strategy 1: Addition/Subtraction decomposition
        strategies.push(() => {
            const a = Math.floor(Math.random() * 1000) - 500;
            const b = num - a;
            if (depth === 0) {
                return `(${this.obfuscateNumber(a, depth + 1)}+${this.obfuscateNumber(b, depth + 1)})`;
            }
            return `(${a}+${b})`;
        });
        
        // Strategy 2: Multiplication/Division
        if (num !== 0) {
            strategies.push(() => {
                const factors = this.findFactors(Math.abs(num));
                if (factors.length > 0) {
                    const [a, b] = factors[Math.floor(Math.random() * factors.length)];
                    const sign = num < 0 ? '-' : '';
                    if (depth === 0) {
                        return `(${sign}${this.obfuscateNumber(a, depth + 1)}*${this.obfuscateNumber(b, depth + 1)})`;
                    }
                    return `(${sign}${a}*${b})`;
                }
                return this.generateBaseExpression(num);
            });
        }
        
        // Strategy 3: Bitwise XOR (Luau compatible with bit32)
        if (this.config.useBitwise && num >= 0 && num <= 0xFFFFFFFF) {
            strategies.push(() => {
                const key = Math.floor(Math.random() * 0xFFFF);
                const encoded = (num ^ key) >>> 0;
                return `bit32.bxor(${encoded},${key})`;
            });
        }
        
        // Strategy 4: Bitwise operations combination
        if (this.config.useBitwise && num >= 0 && num <= 0xFFFFFFFF) {
            strategies.push(() => {
                const shift = Math.floor(Math.random() * 8) + 1;
                if (num % (1 << shift) === 0) {
                    const base = num >> shift;
                    return `bit32.lshift(${base},${shift})`;
                }
                return this.generateBaseExpression(num);
            });
        }
        
        // Strategy 5: Math functions
        if (this.config.useMathFunctions) {
            strategies.push(() => {
                if (num >= 0) {
                    const squared = num * num;
                    if (squared <= Number.MAX_SAFE_INTEGER) {
                        this.usedMathFuncs.add('floor');
                        this.usedMathFuncs.add('sqrt');
                        return `math.floor(math.sqrt(${squared}))`;
                    }
                }
                return this.generateBaseExpression(num);
            });
        }
        
        // Strategy 6: Negation trick
        strategies.push(() => {
            return `(-(-${Math.abs(num)})${num < 0 ? '*-1' : ''})`;
        });
        
        // Strategy 7: Floor division
        if (num !== 0) {
            strategies.push(() => {
                const multiplier = Math.floor(Math.random() * 10) + 2;
                const dividend = num * multiplier;
                return `(${dividend}//${multiplier})`;
            });
        }
        
        // Strategy 8: Modulo trick
        strategies.push(() => {
            const base = num + Math.floor(Math.random() * 100) + 100;
            const mod = base - num;
            return `(${base}%${mod === 0 ? 1 : mod}+${num - (base % (mod === 0 ? 1 : mod))})`;
        });
        
        // Select random strategy
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        return strategy();
    }
    
    /**
     * Obfuscate floating point values
     */
    private obfuscateFloat(num: number, depth: number): string {
        const strategies: (() => string)[] = [];
        
        // Strategy 1: Split into integer + decimal
        strategies.push(() => {
            const intPart = Math.floor(num);
            const decPart = num - intPart;
            const decMultiplier = Math.pow(10, this.countDecimals(num));
            const decInt = Math.round(decPart * decMultiplier);
            return `(${this.obfuscateNumber(intPart, depth + 1)}+${decInt}/${decMultiplier})`;
        });
        
        // Strategy 2: Fraction representation
        strategies.push(() => {
            const precision = Math.pow(10, 6);
            const numerator = Math.round(num * precision);
            const denominator = precision;
            const gcd = this.gcd(Math.abs(numerator), denominator);
            return `(${numerator / gcd}/${denominator / gcd})`;
        });
        
        // Strategy 3: Using math functions
        if (this.config.useMathFunctions) {
            strategies.push(() => {
                this.usedMathFuncs.add('floor');
                const multiplier = Math.pow(10, this.countDecimals(num));
                const scaled = Math.round(num * multiplier);
                return `(${scaled}/${multiplier})`;
            });
        }
        
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        return strategy();
    }
    
    /**
     * Generate base expression (minimal obfuscation)
     */
    private generateBaseExpression(num: number): string {
        if (num === 0) {
            const zeros = ['(1-1)', '(0*1)', 'bit32.bxor(1,1)', '(#"")'];
            return zeros[Math.floor(Math.random() * (this.config.useBitwise ? zeros.length : 2))];
        }
        if (num === 1) {
            const ones = ['(2-1)', '(1*1)', '(1^1)', '#"a"', 'bit32.bxor(0,1)'];
            return ones[Math.floor(Math.random() * (this.config.useBitwise ? ones.length : 3))];
        }
        
        // For other numbers, use hex or simple expression
        if (Number.isInteger(num) && num > 0) {
            if (Math.random() > 0.5) {
                return `0x${num.toString(16).toUpperCase()}`;
            }
        }
        
        return num.toString();
    }
    
    /**
     * Helper: Find factor pairs
     */
    private findFactors(n: number): [number, number][] {
        const factors: [number, number][] = [];
        const sqrt = Math.sqrt(n);
        for (let i = 2; i <= sqrt && i < 100; i++) {
            if (n % i === 0) {
                factors.push([i, n / i]);
            }
        }
        return factors;
    }
    
    /**
     * Helper: Count decimal places
     */
    private countDecimals(num: number): number {
        if (Number.isInteger(num)) return 0;
        const str = num.toString();
        const decimalIndex = str.indexOf('.');
        return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
    }
    
    /**
     * Helper: Greatest common divisor
     */
    private gcd(a: number, b: number): number {
        return b === 0 ? a : this.gcd(b, a % b);
    }
    
    /**
     * Get used math functions for caching
     */
    getUsedMathFuncs(): Set<string> {
        return this.usedMathFuncs;
    }
}

/**
 * Apply number obfuscation to tokens
 */
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
            
            // Skip very small/simple numbers or in specific contexts
            if (shouldSkipNumber(tokens, i, num)) {
                result.push(t);
                continue;
            }
            
            const obfuscated = obfuscator.obfuscateNumber(num);
            debug('NUMBER', `${num} → ${obfuscated}`);
            
            // Wrap in parentheses and create expression tokens
            const exprTokens = expressionToTokens(obfuscated, t.line, t.column);
            result.push(...exprTokens);
            
            numbersObfuscated++;
        } else {
            result.push(t);
        }
    }
    
    debug('NUMBER', `Total numbers obfuscated: ${numbersObfuscated}`);
    
    return { tokens: result, numbersObfuscated };
}

/**
 * Determine if number should be skipped
 */
function shouldSkipNumber(tokens: Token[], index: number, num: number): boolean {
    // Skip loop bounds in for loops (for i = 1, 10)
    // Look backwards for 'for' keyword
    let forLoopContext = false;
    for (let j = index - 1; j >= 0 && j > index - 10; j--) {
        if (tokens[j].type === TokenType.FOR) {
            forLoopContext = true;
            break;
        }
        if (tokens[j].type === TokenType.DO || tokens[j].type === TokenType.END) break;
    }
    
    // Skip simple increment values in for loops
    if (forLoopContext && (num === 1 || num === -1)) {
        return true;
    }
    
    // Skip array indices that are simple (1, 2, 3)
    const prev = tokens[index - 1];
    if (prev && prev.type === TokenType.LBRACKET && num >= 1 && num <= 10) {
        // Allow obfuscation for larger indices
        return num <= 3;
    }
    
    return false;
}

/**
 * Convert expression string to tokens
 */
function expressionToTokens(expr: string, line: number, column: number): Token[] {
    // Simple tokenizer for generated expressions
    const result: Token[] = [];
    let i = 0;
    
    while (i < expr.length) {
        const c = expr[i];
        
        if (c === ' ') { i++; continue; }
        
        if (c === '(') { result.push({ type: TokenType.LPAREN, value: '(', line, column }); i++; }
        else if (c === ')') { result.push({ type: TokenType.RPAREN, value: ')', line, column }); i++; }
        else if (c === '+') { result.push({ type: TokenType.PLUS, value: '+', line, column }); i++; }
        else if (c === '*') { result.push({ type: TokenType.STAR, value: '*', line, column }); i++; }
        else if (c === '%') { result.push({ type: TokenType.PERCENT, value: '%', line, column }); i++; }
        else if (c === '^') { result.push({ type: TokenType.CARET, value: '^', line, column }); i++; }
        else if (c === ',') { result.push({ type: TokenType.COMMA, value: ',', line, column }); i++; }
        else if (c === '.') { result.push({ type: TokenType.DOT, value: '.', line, column }); i++; }
        else if (c === '#') { result.push({ type: TokenType.HASH, value: '#', line, column }); i++; }
        else if (c === '-') { result.push({ type: TokenType.MINUS, value: '-', line, column }); i++; }
        else if (c === '/') {
            if (expr[i + 1] === '/') {
                result.push({ type: TokenType.DOUBLE_SLASH, value: '//', line, column });
                i += 2;
            } else {
                result.push({ type: TokenType.SLASH, value: '/', line, column });
                i++;
            }
        }
        else if (c === '"') {
            // String literal
            let str = '"';
            i++;
            while (i < expr.length && expr[i] !== '"') {
                str += expr[i];
                i++;
            }
            str += '"';
            i++;
            result.push({ type: TokenType.STRING, value: str, literal: str.slice(1, -1), line, column });
        }
        else if (/[0-9]/.test(c) || (c === '0' && expr[i + 1] === 'x')) {
            // Number
            let numStr = '';
            if (c === '0' && expr[i + 1] === 'x') {
                numStr = '0x';
                i += 2;
                while (i < expr.length && /[0-9a-fA-F]/.test(expr[i])) {
                    numStr += expr[i];
                    i++;
                }
                result.push({ type: TokenType.NUMBER, value: numStr, literal: parseInt(numStr, 16), line, column });
            } else {
                while (i < expr.length && /[0-9.]/.test(expr[i])) {
                    numStr += expr[i];
                    i++;
                }
                result.push({ type: TokenType.NUMBER, value: numStr, literal: parseFloat(numStr), line, column });
            }
        }
        else if (/[a-zA-Z_]/.test(c)) {
            // Identifier (math, bit32, etc.)
            let ident = '';
            while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
                ident += expr[i];
                i++;
            }
            result.push({ type: TokenType.IDENTIFIER, value: ident, literal: ident, line, column });
        }
        else {
            i++;
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
    TokenType.DOT, TokenType.COLON, TokenType.HASH,
    TokenType.NOT
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
        
        // Determine if space is needed
        if (prev && prev.type !== TokenType.EOF) {
            const needsSpace = !NO_SPACE_AFTER.has(prev.type) && 
                               !NO_SPACE_BEFORE.has(t.type) &&
                               (SPACE_AFTER.has(prev.type) || SPACE_BEFORE.has(t.type));
            
            // Special case: negative numbers after operators
            if (t.type === TokenType.MINUS && prev && 
                (prev.type === TokenType.ASSIGN || prev.type === TokenType.COMMA ||
                 prev.type === TokenType.LPAREN || prev.type === TokenType.LBRACKET)) {
                // No space before unary minus
            } else if (needsSpace) {
                code += ' ';
            }
        }
        
        // Output token
        if (t.type === TokenType.STRING) {
            if (t.value.startsWith('"') && t.value.endsWith('"')) {
                code += t.value;
            } else {
                const esc = (t.literal || '')
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r')
                    .replace(/\t/g, '\\t');
                code += '"' + esc + '"';
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
    
    // Defaults
    const opts = {
        debug: options.debug ?? false,
        renameVariables: options.renameVariables ?? true,
        encryptStrings: options.encryptStrings ?? true,
        obfuscateNumbers: options.obfuscateNumbers ?? true,
        numberComplexity: options.numberComplexity ?? 'medium'
    };
    
    enableDebug(opts.debug);
    debug('MAIN', 'Starting obfuscation v0.3.0', { options: opts });
    
    // Step 1: Tokenize
    let tokens = tokenize(source);
    const originalTokenCount = tokens.length;
    debug('MAIN', 'Tokenization complete', { tokenCount: tokens.length });
    
    // Step 2: Rename variables
    let renameMap: RenameMap = {};
    if (opts.renameVariables) {
        renameMap = createRenameMap(tokens);
        tokens = applyRenameMap(tokens, renameMap);
        debug('MAIN', 'Renaming complete', { renamed: Object.keys(renameMap).length });
    }
    
    // Step 3: Encrypt strings
    let stringsEncrypted = 0;
    let prependCode = '';
    if (opts.encryptStrings) {
        const encResult = encryptStrings(tokens);
        tokens = encResult.tokens;
        prependCode = encResult.encryption.decryptorCode;
        stringsEncrypted = encResult.encryption.encryptedStrings.size;
        debug('MAIN', 'String encryption complete', { encrypted: stringsEncrypted });
    }
    
    // Step 4: Obfuscate numbers (NEW PHASE 3)
    let numbersObfuscated = 0;
    if (opts.obfuscateNumbers) {
        const numResult = obfuscateNumbers(tokens, {
            complexity: opts.numberComplexity,
            useBitwise: true,
            useMathFunctions: true,
            maxDepth: opts.numberComplexity === 'high' ? 4 : opts.numberComplexity === 'medium' ? 3 : 2
        });
        tokens = numResult.tokens;
        numbersObfuscated = numResult.numbersObfuscated;
        debug('MAIN', 'Number obfuscation complete', { obfuscated: numbersObfuscated });
    }
    
    // Step 5: Generate code
    const code = tokensToCode(tokens, prependCode);
    
    const endTime = Date.now();
    debug('MAIN', 'Obfuscation complete', { timeMs: endTime - startTime });
    
    const result: ObfuscateResult = {
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
        }
    };
    
    if (opts.debug) result.debugLogs = getDebugLogs();
    
    return result;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default { obfuscate, tokenize, enableDebug, getDebugLogs };
