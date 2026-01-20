// ============================================================================
// NEPHILIM OBFUSCATOR - LEXER + RENAMER (FIXED)
// Version: 0.1.1 - Fixed table key renaming bugs
// ============================================================================

export enum TokenType {
    NUMBER = 'NUMBER',
    STRING = 'STRING',
    BOOLEAN = 'BOOLEAN',
    NIL = 'NIL',
    IDENTIFIER = 'IDENTIFIER',
    AND = 'AND',
    BREAK = 'BREAK',
    DO = 'DO',
    ELSE = 'ELSE',
    ELSEIF = 'ELSEIF',
    END = 'END',
    FALSE = 'FALSE',
    FOR = 'FOR',
    FUNCTION = 'FUNCTION',
    GOTO = 'GOTO',
    IF = 'IF',
    IN = 'IN',
    LOCAL = 'LOCAL',
    NOT = 'NOT',
    OR = 'OR',
    REPEAT = 'REPEAT',
    RETURN = 'RETURN',
    THEN = 'THEN',
    TRUE = 'TRUE',
    UNTIL = 'UNTIL',
    WHILE = 'WHILE',
    CONTINUE = 'CONTINUE',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    STAR = 'STAR',
    SLASH = 'SLASH',
    DOUBLE_SLASH = 'DOUBLE_SLASH',
    PERCENT = 'PERCENT',
    CARET = 'CARET',
    HASH = 'HASH',
    EQ = 'EQ',
    NEQ = 'NEQ',
    LT = 'LT',
    GT = 'GT',
    LTE = 'LTE',
    GTE = 'GTE',
    ASSIGN = 'ASSIGN',
    LPAREN = 'LPAREN',
    RPAREN = 'RPAREN',
    LBRACE = 'LBRACE',
    RBRACE = 'RBRACE',
    LBRACKET = 'LBRACKET',
    RBRACKET = 'RBRACKET',
    SEMICOLON = 'SEMICOLON',
    COLON = 'COLON',
    DOUBLE_COLON = 'DOUBLE_COLON',
    COMMA = 'COMMA',
    DOT = 'DOT',
    DOT_DOT = 'DOT_DOT',
    DOT_DOT_DOT = 'DOT_DOT_DOT',
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
    'and': TokenType.AND,
    'break': TokenType.BREAK,
    'do': TokenType.DO,
    'else': TokenType.ELSE,
    'elseif': TokenType.ELSEIF,
    'end': TokenType.END,
    'false': TokenType.FALSE,
    'for': TokenType.FOR,
    'function': TokenType.FUNCTION,
    'goto': TokenType.GOTO,
    'if': TokenType.IF,
    'in': TokenType.IN,
    'local': TokenType.LOCAL,
    'nil': TokenType.NIL,
    'not': TokenType.NOT,
    'or': TokenType.OR,
    'repeat': TokenType.REPEAT,
    'return': TokenType.RETURN,
    'then': TokenType.THEN,
    'true': TokenType.TRUE,
    'until': TokenType.UNTIL,
    'while': TokenType.WHILE,
    'continue': TokenType.CONTINUE
};

export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
    private column: number = 1;
    private startColumn: number = 1;

    constructor(source: string) {
        this.source = source;
    }

    public tokenize(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.startColumn = this.column;
            this.scanToken();
        }
        this.tokens.push({
            type: TokenType.EOF,
            value: '',
            line: this.line,
            column: this.column
        });
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
                if (this.match('.')) {
                    if (this.match('.')) {
                        this.addToken(TokenType.DOT_DOT_DOT);
                    } else {
                        this.addToken(TokenType.DOT_DOT);
                    }
                } else if (this.isDigit(this.peek())) {
                    this.number();
                } else {
                    this.addToken(TokenType.DOT);
                }
                break;
            case '-':
                if (this.match('-')) {
                    this.comment();
                } else {
                    this.addToken(TokenType.MINUS);
                }
                break;
            case '/':
                if (this.match('/')) {
                    this.addToken(TokenType.DOUBLE_SLASH);
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            case ':':
                if (this.match(':')) {
                    this.addToken(TokenType.DOUBLE_COLON);
                } else {
                    this.addToken(TokenType.COLON);
                }
                break;
            case '[':
                if (this.peek() === '[' || this.peek() === '=') {
                    this.longString();
                } else {
                    this.addToken(TokenType.LBRACKET);
                }
                break;
            case '=':
                if (this.match('=')) {
                    this.addToken(TokenType.EQ);
                } else {
                    this.addToken(TokenType.ASSIGN);
                }
                break;
            case '~':
                if (this.match('=')) {
                    this.addToken(TokenType.NEQ);
                }
                break;
            case '<':
                if (this.match('=')) {
                    this.addToken(TokenType.LTE);
                } else {
                    this.addToken(TokenType.LT);
                }
                break;
            case '>':
                if (this.match('=')) {
                    this.addToken(TokenType.GTE);
                } else {
                    this.addToken(TokenType.GT);
                }
                break;
            case '"':
            case "'":
                this.string(c);
                break;
            case ' ':
            case '\r':
            case '\t':
                break;
            case '\n':
                this.line++;
                this.column = 1;
                break;
            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                }
                break;
        }
    }

    private string(quote: string): void {
        let value = '';
        while (!this.isAtEnd() && this.peek() !== quote) {
            if (this.peek() === '\n') {
                this.line++;
                this.column = 1;
            }
            if (this.peek() === '\\') {
                this.advance();
                if (!this.isAtEnd()) {
                    const escaped = this.advance();
                    switch (escaped) {
                        case 'n': value += '\n'; break;
                        case 't': value += '\t'; break;
                        case 'r': value += '\r'; break;
                        case '\\': value += '\\'; break;
                        case '"': value += '"'; break;
                        case "'": value += "'"; break;
                        case '0': value += '\0'; break;
                        case 'x':
                            if (this.isHexDigit(this.peek()) && this.isHexDigit(this.peekNext())) {
                                const hex = this.advance() + this.advance();
                                value += String.fromCharCode(parseInt(hex, 16));
                            }
                            break;
                        default:
                            if (this.isDigit(escaped)) {
                                let dec = escaped;
                                if (this.isDigit(this.peek())) dec += this.advance();
                                if (this.isDigit(this.peek())) dec += this.advance();
                                value += String.fromCharCode(parseInt(dec, 10));
                            } else {
                                value += escaped;
                            }
                            break;
                    }
                }
            } else {
                value += this.advance();
            }
        }
        if (!this.isAtEnd()) {
            this.advance();
        }
        this.addToken(TokenType.STRING, value);
    }

    private longString(): void {
        let level = 0;
        while (this.peek() === '=') {
            this.advance();
            level++;
        }
        if (this.peek() !== '[') {
            this.addToken(TokenType.LBRACKET);
            return;
        }
        this.advance();
        if (this.peek() === '\n') {
            this.advance();
            this.line++;
            this.column = 1;
        }
        let value = '';
        const closing = ']' + '='.repeat(level) + ']';
        while (!this.isAtEnd()) {
            if (this.peek() === '\n') {
                value += this.advance();
                this.line++;
                this.column = 1;
            } else if (this.checkSequence(closing)) {
                for (let i = 0; i < closing.length; i++) {
                    this.advance();
                }
                break;
            } else {
                value += this.advance();
            }
        }
        this.addToken(TokenType.STRING, value);
    }

    private number(): void {
        if (this.source[this.start] === '0') {
            const next = this.peek().toLowerCase();
            if (next === 'x') {
                this.advance();
                while (this.isHexDigit(this.peek()) || this.peek() === '_') {
                    this.advance();
                }
                const text = this.source.substring(this.start, this.current).replace(/_/g, '');
                this.addToken(TokenType.NUMBER, parseInt(text, 16));
                return;
            } else if (next === 'b') {
                this.advance();
                while (this.peek() === '0' || this.peek() === '1' || this.peek() === '_') {
                    this.advance();
                }
                const text = this.source.substring(this.start + 2, this.current).replace(/_/g, '');
                this.addToken(TokenType.NUMBER, parseInt(text, 2));
                return;
            }
        }
        while (this.isDigit(this.peek()) || this.peek() === '_') {
            this.advance();
        }
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek()) || this.peek() === '_') {
                this.advance();
            }
        }
        if (this.peek().toLowerCase() === 'e') {
            this.advance();
            if (this.peek() === '+' || this.peek() === '-') {
                this.advance();
            }
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }
        const text = this.source.substring(this.start, this.current).replace(/_/g, '');
        this.addToken(TokenType.NUMBER, parseFloat(text));
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }
        const text = this.source.substring(this.start, this.current);
        const keywordType = KEYWORDS[text];
        if (keywordType !== undefined) {
            if (keywordType === TokenType.TRUE) {
                this.addToken(TokenType.TRUE, true);
            } else if (keywordType === TokenType.FALSE) {
                this.addToken(TokenType.FALSE, false);
            } else if (keywordType === TokenType.NIL) {
                this.addToken(TokenType.NIL, null);
            } else {
                this.addToken(keywordType);
            }
        } else {
            this.addToken(TokenType.IDENTIFIER, text);
        }
    }

    private comment(): void {
        if (this.peek() === '[' && (this.peekNext() === '[' || this.peekNext() === '=')) {
            this.longComment();
            return;
        }
        while (!this.isAtEnd() && this.peek() !== '\n') {
            this.advance();
        }
    }

    private longComment(): void {
        this.advance();
        let level = 0;
        while (this.peek() === '=') {
            this.advance();
            level++;
        }
        if (this.peek() !== '[') {
            return;
        }
        this.advance();
        const closing = ']' + '='.repeat(level) + ']';
        while (!this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.advance();
                this.line++;
                this.column = 1;
            } else if (this.checkSequence(closing)) {
                for (let i = 0; i < closing.length; i++) {
                    this.advance();
                }
                break;
            } else {
                this.advance();
            }
        }
    }

    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        const char = this.source[this.current];
        this.current++;
        this.column++;
        return char;
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source[this.current];
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source[this.current + 1];
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source[this.current] !== expected) return false;
        this.current++;
        this.column++;
        return true;
    }

    private checkSequence(seq: string): boolean {
        for (let i = 0; i < seq.length; i++) {
            if (this.current + i >= this.source.length) return false;
            if (this.source[this.current + i] !== seq[i]) return false;
        }
        return true;
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private isHexDigit(c: string): boolean {
        return this.isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private addToken(type: TokenType, literal?: any): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({
            type,
            value: text,
            literal: literal !== undefined ? literal : text,
            line: this.line,
            column: this.startColumn
        });
    }
}

export function tokenize(source: string): Token[] {
    const lexer = new Lexer(source);
    return lexer.tokenize();
}

// ============================================================================
// RESERVED GLOBALS - JANGAN RENAME
// ============================================================================

const RESERVED_GLOBALS = new Set([
    'print', 'type', 'tostring', 'tonumber', 'pairs', 'ipairs',
    'next', 'select', 'unpack', 'pcall', 'xpcall', 'error', 'assert',
    'setmetatable', 'getmetatable', 'rawget', 'rawset', 'rawequal',
    'loadstring', 'load', 'dofile', 'require', 'module',
    'collectgarbage', 'setfenv', 'getfenv',
    'math', 'string', 'table', 'os', 'io', 'coroutine', 'debug',
    'bit32', 'bit', 'utf8', 'package',
    'game', 'workspace', 'script', 'plugin',
    'wait', 'spawn', 'delay', 'tick', 'time', 'elapsedTime',
    'warn', 'typeof', 'task', 'version',
    'Instance', 'Vector3', 'Vector2', 'CFrame', 'Color3',
    'UDim', 'UDim2', 'Enum', 'Ray', 'Region3', 'Rect',
    'BrickColor', 'TweenInfo', 'NumberSequence', 'ColorSequence',
    'NumberRange', 'PhysicalProperties', 'Faces', 'Axes',
    'PathWaypoint', 'Random', 'TweenService',
    'Players', 'Workspace', 'Lighting', 'ReplicatedStorage',
    'ServerStorage', 'ServerScriptService', 'StarterGui',
    'StarterPlayer', 'Teams', 'SoundService', 'Chat',
    'LocalizationService', 'TestService', 'HttpService',
    'MarketplaceService', 'TeleportService', 'UserInputService',
    'ContextActionService', 'RunService', 'Debris',
    'TweenService', 'PathfindingService', 'PhysicsService',
    'CoreGui', 'CorePackages',
    'getgenv', 'getrenv', 'getrawmetatable', 'setrawmetatable',
    'hookfunction', 'hookmetamethod', 'newcclosure', 'islclosure',
    'iscclosure', 'checkcaller', 'getcallingscript',
    'getinfo', 'getupvalue', 'setupvalue', 'getupvalues',
    'getconstant', 'setconstant', 'getconstants',
    'getconnections', 'firesignal', 'fireserver', 'fireclient',
    'getnamecallmethod', 'setnamecallmethod',
    'syn', 'Synapse', 'fluxus', 'KRNL_LOADED',
    'Drawing', 'cleardrawcache', 'isreadonly', 'setreadonly',
    'getscriptclosure', 'getsenv', 'getmenv',
    'request', 'http_request', 'HttpGet', 'HttpPost',
    'readfile', 'writefile', 'appendfile', 'loadfile',
    'isfile', 'isfolder', 'makefolder', 'delfolder', 'delfile',
    'listfiles', 'getcustomasset',
    'setclipboard', 'setfflag', 'getfflag',
    'identifyexecutor', 'getexecutorname',
    '_G', '_VERSION', '_ENV', 'self', 'super',
    'true', 'false', 'nil',
    'new', 'Create', 'clone', 'Clone', 'Destroy', 'destroy',
    'Connect', 'connect', 'Disconnect', 'disconnect',
    'Wait', 'wait', 'Fire', 'fire', 'Invoke', 'invoke',
    'GetService', 'FindFirstChild', 'WaitForChild',
    'GetChildren', 'GetDescendants', 'IsA', 'IsDescendantOf',
    'GetPropertyChangedSignal', 'GetAttribute', 'SetAttribute',
    'FindFirstChildOfClass', 'FindFirstChildWhichIsA',
    'FindFirstAncestor', 'FindFirstAncestorOfClass',
    'LocalPlayer', 'Character', 'Humanoid', 'HumanoidRootPart',
    'Head', 'Torso', 'UpperTorso', 'LowerTorso',
    'Parent', 'Name', 'ClassName', 'Value',
    'Position', 'CFrame', 'Size', 'Transparency',
    'Enabled', 'Visible', 'Text', 'TextColor3',
    'BackgroundColor3', 'BackgroundTransparency',
    'Title', 'Text', 'Duration', 'Icon',
    'Callback', 'CurrentValue', 'Options', 'CurrentOption',
    'Range', 'Increment', 'Color',
]);

export interface RenameMap {
    [original: string]: string;
}

const CHARS_SET = ['I', 'l'];

function generateObfuscatedName(index: number): string {
    let name = '';
    let num = index;
    do {
        name = CHARS_SET[num % 2] + name;
        num = Math.floor(num / 2);
    } while (num > 0);
    while (name.length < 6) {
        name = CHARS_SET[Math.floor(Math.random() * 2)] + name;
    }
    for (let i = 0; i < 2; i++) {
        name += CHARS_SET[Math.floor(Math.random() * 2)];
    }
    return name;
}

// ============================================================================
// CONTEXT-AWARE ANALYSIS
// ============================================================================

interface TokenContext {
    isTableKey: boolean;
    isPropertyAccess: boolean;
    isMethodCall: boolean;
    isFunctionParam: boolean;
    isLocalDeclaration: boolean;
}

function analyzeTokenContext(tokens: Token[], index: number): TokenContext {
    const token = tokens[index];
    const prevToken = tokens[index - 1];
    const nextToken = tokens[index + 1];
    
    // Check if inside table {} and followed by =
    let braceDepth = 0;
    let isInsideTable = false;
    for (let i = 0; i < index; i++) {
        if (tokens[i].type === TokenType.LBRACE) braceDepth++;
        if (tokens[i].type === TokenType.RBRACE) braceDepth--;
    }
    isInsideTable = braceDepth > 0;
    
    // Table key: inside {} and followed by =
    const isTableKey = isInsideTable && 
                       nextToken && 
                       nextToken.type === TokenType.ASSIGN;
    
    // Property access: after . or :
    const isPropertyAccess = prevToken && prevToken.type === TokenType.DOT;
    const isMethodCall = prevToken && prevToken.type === TokenType.COLON;
    
    // Function parameter: inside () after function keyword
    let parenDepth = 0;
    let isFunctionParam = false;
    for (let i = index - 1; i >= 0; i--) {
        if (tokens[i].type === TokenType.RPAREN) parenDepth++;
        if (tokens[i].type === TokenType.LPAREN) {
            parenDepth--;
            if (parenDepth < 0) {
                // Check if there's a function keyword before this
                if (i > 0 && tokens[i - 1].type === TokenType.FUNCTION) {
                    isFunctionParam = true;
                }
                break;
            }
        }
    }
    
    // Local declaration: after 'local' keyword
    let isLocalDeclaration = false;
    for (let i = index - 1; i >= 0; i--) {
        if (tokens[i].type === TokenType.LOCAL) {
            isLocalDeclaration = true;
            break;
        }
        if (tokens[i].type === TokenType.ASSIGN || 
            tokens[i].type === TokenType.FUNCTION ||
            tokens[i].line < token.line) {
            break;
        }
    }
    
    return {
        isTableKey,
        isPropertyAccess,
        isMethodCall,
        isFunctionParam,
        isLocalDeclaration
    };
}

function canRename(name: string, context: TokenContext): boolean {
    // Never rename reserved globals
    if (RESERVED_GLOBALS.has(name)) return false;
    
    // Never rename table keys (e.g., {Title = "x"})
    if (context.isTableKey) return false;
    
    // Never rename property access (e.g., obj.Property)
    if (context.isPropertyAccess) return false;
    
    // Never rename method calls (e.g., obj:Method())
    if (context.isMethodCall) return false;
    
    return true;
}

// ============================================================================
// SMART RENAME MAP CREATION
// ============================================================================

export function createRenameMap(tokens: Token[]): RenameMap {
    const map: RenameMap = {};
    const localVars = new Set<string>();
    let counter = 0;
    
    // First pass: Find all LOCAL variable declarations
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const prevToken = tokens[i - 1];
        
        if (token.type === TokenType.IDENTIFIER) {
            const context = analyzeTokenContext(tokens, i);
            
            // Only track local declarations and function parameters
            if (context.isLocalDeclaration || context.isFunctionParam) {
                if (!RESERVED_GLOBALS.has(token.value)) {
                    localVars.add(token.value);
                }
            }
        }
    }
    
    // Create rename map for local variables only
    for (const varName of localVars) {
        map[varName] = generateObfuscatedName(counter++);
    }
    
    return map;
}

// ============================================================================
// APPLY RENAME MAP
// ============================================================================

export function applyRenameMap(tokens: Token[], map: RenameMap): Token[] {
    const result: Token[] = [];
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        
        if (token.type === TokenType.IDENTIFIER) {
            const context = analyzeTokenContext(tokens, i);
            
            // Only rename if:
            // 1. It's in our map
            // 2. It's not a table key, property access, or method call
            if (map[token.value] && canRename(token.value, context)) {
                result.push({
                    ...token,
                    value: map[token.value],
                    literal: map[token.value]
                });
            } else {
                result.push(token);
            }
        } else {
            result.push(token);
        }
    }
    
    return result;
}

// ============================================================================
// CODE GENERATOR
// ============================================================================

const NEEDS_SPACE_AFTER = new Set([
    TokenType.LOCAL, TokenType.FUNCTION, TokenType.IF, TokenType.THEN,
    TokenType.ELSE, TokenType.ELSEIF, TokenType.WHILE, TokenType.DO,
    TokenType.FOR, TokenType.IN, TokenType.RETURN, TokenType.AND,
    TokenType.OR, TokenType.NOT, TokenType.END, TokenType.UNTIL,
    TokenType.REPEAT, TokenType.BREAK, TokenType.GOTO,
    TokenType.IDENTIFIER, TokenType.NUMBER, TokenType.STRING,
    TokenType.TRUE, TokenType.FALSE, TokenType.NIL
]);

const NEEDS_SPACE_BEFORE = new Set([
    TokenType.IDENTIFIER, TokenType.NUMBER, TokenType.STRING,
    TokenType.TRUE, TokenType.FALSE, TokenType.NIL,
    TokenType.FUNCTION, TokenType.IF, TokenType.THEN, TokenType.ELSE,
    TokenType.END, TokenType.LOCAL, TokenType.RETURN, TokenType.AND,
    TokenType.OR, TokenType.NOT, TokenType.DO, TokenType.WHILE,
    TokenType.FOR, TokenType.IN, TokenType.UNTIL, TokenType.REPEAT,
    TokenType.ELSEIF, TokenType.BREAK, TokenType.GOTO
]);

const NO_SPACE_AFTER = new Set([
    TokenType.LPAREN, TokenType.LBRACE, TokenType.LBRACKET,
    TokenType.DOT, TokenType.COLON, TokenType.HASH
]);

const NO_SPACE_BEFORE = new Set([
    TokenType.RPAREN, TokenType.RBRACE, TokenType.RBRACKET,
    TokenType.DOT, TokenType.COLON, TokenType.COMMA, TokenType.SEMICOLON,
    TokenType.LPAREN, TokenType.LBRACKET
]);

export function tokensToCode(tokens: Token[]): string {
    let code = '';
    let lastLine = 1;
    
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const prevToken = tokens[i - 1];
        
        if (token.type === TokenType.EOF) continue;
        
        if (token.line > lastLine) {
            const newlines = token.line - lastLine;
            code += '\n'.repeat(newlines);
            lastLine = token.line;
        } else if (prevToken && prevToken.type !== TokenType.EOF) {
            const prevNeedsSpaceAfter = NEEDS_SPACE_AFTER.has(prevToken.type) && 
                                        !NO_SPACE_AFTER.has(prevToken.type);
            const currNeedsSpaceBefore = NEEDS_SPACE_BEFORE.has(token.type) && 
                                         !NO_SPACE_BEFORE.has(token.type);
            const prevNoSpaceAfter = NO_SPACE_AFTER.has(prevToken.type);
            const currNoSpaceBefore = NO_SPACE_BEFORE.has(token.type);
            
            if (!prevNoSpaceAfter && !currNoSpaceBefore && 
                (prevNeedsSpaceAfter || currNeedsSpaceBefore)) {
                code += ' ';
            }
        }
        
        if (token.type === TokenType.STRING) {
            const escaped = token.literal
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
            code += '"' + escaped + '"';
        } else {
            code += token.value;
        }
    }
    
    return code;
}

// ============================================================================
// MAIN OBFUSCATE FUNCTION
// ============================================================================

export interface ObfuscateResult {
    code: string;
    map: RenameMap;
    stats: {
        originalTokens: number;
        identifiersRenamed: number;
        originalLength: number;
        outputLength: number;
    };
}

export function obfuscate(source: string): ObfuscateResult {
    const tokens = tokenize(source);
    const renameMap = createRenameMap(tokens);
    const renamedTokens = applyRenameMap(tokens, renameMap);
    const obfuscatedCode = tokensToCode(renamedTokens);
    
    const stats = {
        originalTokens: tokens.length,
        identifiersRenamed: Object.keys(renameMap).length,
        originalLength: source.length,
        outputLength: obfuscatedCode.length
    };
    
    return { code: obfuscatedCode, map: renameMap, stats };
}
