// ============================================================================
// NEPHILIM OBFUSCATOR v0.1.3 - FIXED COLLISIONS + DEBUG MODE
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
// DEBUG LOGGER
// ============================================================================

export interface DebugLog {
    phase: string;
    message: string;
    data?: any;
}

let debugLogs: DebugLog[] = [];
let debugEnabled = false;

export function enableDebug(enabled: boolean = true): void {
    debugEnabled = enabled;
    debugLogs = [];
}

export function getDebugLogs(): DebugLog[] {
    return debugLogs;
}

function debug(phase: string, message: string, data?: any): void {
    if (debugEnabled) {
        debugLogs.push({ phase, message, data });
    }
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

    constructor(source: string) { 
        this.source = source; 
        debug('LEXER', 'Initialized', { sourceLength: source.length });
    }

    public tokenize(): Token[] {
        debug('LEXER', 'Starting tokenization');
        
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
// RESERVED GLOBALS - NEVER RENAME
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
// NAME GENERATOR - FIXED: NO COLLISIONS
// ============================================================================

class NameGenerator {
    private usedNames = new Set<string>();
    private counter = 0;
    
    generate(): string {
        let name: string;
        do {
            name = this.createName(this.counter++);
        } while (this.usedNames.has(name));
        
        this.usedNames.add(name);
        debug('NAMEGEN', `Generated unique name`, { index: this.counter - 1, name });
        return name;
    }
    
    private createName(index: number): string {
        const chars = ['I', 'l'];
        let name = '';
        let num = index;
        
        // Convert index to binary-like representation using I and l
        do {
            name = chars[num % 2] + name;
            num = Math.floor(num / 2);
        } while (num > 0);
        
        // Pad to minimum 8 characters for better obfuscation
        while (name.length < 8) {
            // Use index-based padding to ensure uniqueness
            const padIndex = (index + name.length) % 2;
            name = chars[padIndex] + name;
        }
        
        return name;
    }
    
    reset(): void {
        this.usedNames.clear();
        this.counter = 0;
    }
}

// ============================================================================
// SMART SCOPE ANALYSIS
// ============================================================================

interface IdentifierInfo {
    name: string;
    line: number;
    tokenIndex: number;
    isLocal: boolean;
    reason: string;
}

function analyzeIdentifiers(tokens: Token[]): IdentifierInfo[] {
    const identifiers: IdentifierInfo[] = [];
    
    debug('ANALYZE', 'Starting identifier analysis', { tokenCount: tokens.length });
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        if (t.type !== TokenType.IDENTIFIER) continue;
        if (RESERVED.has(t.value)) {
            debug('ANALYZE', `Skipping reserved: ${t.value}`, { line: t.line });
            continue;
        }
        
        const prev = tokens[i - 1];
        const prev2 = tokens[i - 2];
        const next = tokens[i + 1];
        
        // Skip property access (obj.prop) or method call (obj:method)
        if (prev && (prev.type === TokenType.DOT || prev.type === TokenType.COLON)) {
            debug('ANALYZE', `Skipping property/method: ${t.value}`, { line: t.line });
            continue;
        }
        
        // Skip table key inside {}
        let braceDepth = 0;
        for (let j = 0; j < i; j++) {
            if (tokens[j].type === TokenType.LBRACE) braceDepth++;
            if (tokens[j].type === TokenType.RBRACE) braceDepth--;
        }
        if (braceDepth > 0 && next && next.type === TokenType.ASSIGN) {
            debug('ANALYZE', `Skipping table key: ${t.value}`, { line: t.line });
            continue;
        }
        
        // Detect local declarations
        let isLocal = false;
        let reason = '';
        
        // Pattern: local VAR
        if (prev && prev.type === TokenType.LOCAL) {
            isLocal = true;
            reason = 'local declaration';
        }
        
        // Pattern: local VAR, VAR, VAR
        if (!isLocal && prev && prev.type === TokenType.COMMA) {
            for (let j = i - 1; j >= 0; j--) {
                if (tokens[j].type === TokenType.LOCAL) { 
                    isLocal = true; 
                    reason = 'local multi-declaration';
                    break; 
                }
                if (tokens[j].type === TokenType.ASSIGN) break;
                if (tokens[j].line < t.line) break;
            }
        }
        
        // Pattern: local function NAME
        if (!isLocal && prev && prev.type === TokenType.FUNCTION && prev2 && prev2.type === TokenType.LOCAL) {
            isLocal = true;
            reason = 'local function';
        }
        
        // Pattern: function params (NAME, NAME)
        if (!isLocal) {
            let parenDepth = 0;
            let foundFunction = false;
            
            for (let j = i - 1; j >= 0; j--) {
                const tk = tokens[j];
                if (tk.type === TokenType.RPAREN) parenDepth++;
                if (tk.type === TokenType.LPAREN) {
                    parenDepth--;
                    if (parenDepth < 0) {
                        // Check if this ( is after function keyword
                        for (let k = j - 1; k >= 0; k--) {
                            if (tokens[k].type === TokenType.FUNCTION) {
                                foundFunction = true;
                                break;
                            }
                            if (tokens[k].type === TokenType.RPAREN || 
                                tokens[k].type === TokenType.END ||
                                tokens[k].line < tokens[j].line) break;
                        }
                        break;
                    }
                }
                if (tk.line < t.line - 1) break;
            }
            
            if (foundFunction) {
                isLocal = true;
                reason = 'function parameter';
            }
        }
        
        if (isLocal) {
            identifiers.push({
                name: t.value,
                line: t.line,
                tokenIndex: i,
                isLocal: true,
                reason
            });
            debug('ANALYZE', `Found local var: ${t.value}`, { line: t.line, reason });
        }
    }
    
    return identifiers;
}

export function createRenameMap(tokens: Token[]): RenameMap {
    const map: RenameMap = {};
    const generator = new NameGenerator();
    const seenNames = new Set<string>();
    
    debug('RENAME', 'Creating rename map');
    
    const identifiers = analyzeIdentifiers(tokens);
    
    for (const info of identifiers) {
        if (!seenNames.has(info.name)) {
            seenNames.add(info.name);
            const newName = generator.generate();
            map[info.name] = newName;
            debug('RENAME', `Mapping: ${info.name} → ${newName}`, { reason: info.reason });
        }
    }
    
    debug('RENAME', 'Rename map complete', { count: Object.keys(map).length });
    return map;
}

// ============================================================================
// APPLY RENAMING
// ============================================================================

export function applyRenameMap(tokens: Token[], map: RenameMap): Token[] {
    const result: Token[] = [];
    
    debug('APPLY', 'Applying rename map');
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        
        if (t.type !== TokenType.IDENTIFIER || !map[t.value]) {
            result.push(t);
            continue;
        }
        
        const prev = tokens[i - 1];
        const next = tokens[i + 1];
        
        // Don't rename property access or method calls
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
        
        // Rename!
        debug('APPLY', `Renaming: ${t.value} → ${map[t.value]}`, { line: t.line });
        result.push({ ...t, value: map[t.value], literal: map[t.value] });
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
    TokenType.TRUE, TokenType.FALSE, TokenType.NIL
]);

const SPACE_BEFORE = new Set([
    TokenType.IDENTIFIER, TokenType.NUMBER, TokenType.STRING,
    TokenType.TRUE, TokenType.FALSE, TokenType.NIL, TokenType.FUNCTION,
    TokenType.IF, TokenType.THEN, TokenType.ELSE, TokenType.END,
    TokenType.LOCAL, TokenType.RETURN, TokenType.AND, TokenType.OR,
    TokenType.NOT, TokenType.DO, TokenType.WHILE, TokenType.FOR,
    TokenType.IN, TokenType.UNTIL, TokenType.REPEAT, TokenType.ELSEIF
]);

const NO_SPACE_AFTER = new Set([
    TokenType.LPAREN, TokenType.LBRACE, TokenType.LBRACKET, 
    TokenType.DOT, TokenType.COLON, TokenType.HASH
]);

const NO_SPACE_BEFORE = new Set([
    TokenType.RPAREN, TokenType.RBRACE, TokenType.RBRACKET, 
    TokenType.DOT, TokenType.COLON, TokenType.COMMA, 
    TokenType.SEMICOLON, TokenType.LPAREN, TokenType.LBRACKET
]);

export function tokensToCode(tokens: Token[]): string {
    let code = '';
    let lastLine = 1;
    
    debug('CODEGEN', 'Generating code from tokens');
    
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        const prev = tokens[i - 1];
        if (t.type === TokenType.EOF) continue;
        
        if (t.line > lastLine) {
            code += '\n'.repeat(t.line - lastLine);
            lastLine = t.line;
        } else if (prev && prev.type !== TokenType.EOF) {
            const needsSpace = !NO_SPACE_AFTER.has(prev.type) && 
                              !NO_SPACE_BEFORE.has(t.type) &&
                              (SPACE_AFTER.has(prev.type) || SPACE_BEFORE.has(t.type));
            if (needsSpace) code += ' ';
        }
        
        if (t.type === TokenType.STRING) {
            const esc = t.literal
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
            code += '"' + esc + '"';
        } else {
            code += t.value;
        }
    }
    
    debug('CODEGEN', 'Code generation complete', { length: code.length });
    return code;
}

// ============================================================================
// MAIN OBFUSCATE FUNCTION
// ============================================================================

export interface ObfuscateOptions {
    debug?: boolean;
}

export interface ObfuscateResult {
    code: string;
    map: RenameMap;
    stats: {
        originalTokens: number;
        identifiersRenamed: number;
        originalLength: number;
        outputLength: number;
        timeMs: number;
    };
    debugLogs?: DebugLog[];
}

export function obfuscate(source: string, options: ObfuscateOptions = {}): ObfuscateResult {
    const startTime = Date.now();
    
    // Reset and enable debug if requested
    enableDebug(options.debug || false);
    
    debug('MAIN', 'Starting obfuscation', { sourceLength: source.length });
    
    const tokens = tokenize(source);
    const map = createRenameMap(tokens);
    const renamed = applyRenameMap(tokens, map);
    const code = tokensToCode(renamed);
    
    const endTime = Date.now();
    
    debug('MAIN', 'Obfuscation complete', { timeMs: endTime - startTime });
    
    const result: ObfuscateResult = {
        code,
        map,
        stats: {
            originalTokens: tokens.length,
            identifiersRenamed: Object.keys(map).length,
            originalLength: source.length,
            outputLength: code.length,
            timeMs: endTime - startTime
        }
    };
    
    if (options.debug) {
        result.debugLogs = getDebugLogs();
    }
    
    return result;
                        }
