// src/lexer.ts

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
    line: number;
}

const KEYWORDS: Record<string, TokenType> = {
    'and': TokenType.AND, 'break': TokenType.BREAK, 'do': TokenType.DO,
    'else': TokenType.ELSE, 'elseif': TokenType.ELSEIF, 'end': TokenType.END,
    'false': TokenType.FALSE, 'for': TokenType.FOR, 'function': TokenType.FUNCTION,
    'if': TokenType.IF, 'in': TokenType.IN, 'local': TokenType.LOCAL,
    'nil': TokenType.NIL, 'not': TokenType.NOT, 'or': TokenType.OR,
    'repeat': TokenType.REPEAT, 'return': TokenType.RETURN, 'then': TokenType.THEN,
    'true': TokenType.TRUE, 'until': TokenType.UNTIL, 'while': TokenType.WHILE
};

export class Lexer {
    private source: string;
    private tokens: Token[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    constructor(source: string) { this.source = source; }

    public tokenize(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }
        this.tokens.push({ type: TokenType.EOF, value: '', line: this.line });
        return this.tokens;
    }

    private scanToken(): void {
        const c = this.advance();
        switch (c) {
            case '(': this.addToken(TokenType.LPAREN); break;
            case ')': this.addToken(TokenType.RPAREN); break;
            case '{': this.addToken(TokenType.LBRACE); break;
            case '}': this.addToken(TokenType.RBRACE); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '.': 
                if (this.match('.')) this.addToken(this.match('.') ? TokenType.DOT_DOT_DOT : TokenType.DOT_DOT);
                else this.addToken(TokenType.DOT); 
                break;
            case '-':
                if (this.match('-')) { while (this.peek() != '\n' && !this.isAtEnd()) this.advance(); }
                else this.addToken(TokenType.MINUS);
                break;
            case '+': this.addToken(TokenType.PLUS); break;
            case '*': this.addToken(TokenType.STAR); break;
            case '/': this.addToken(TokenType.SLASH); break;
            case '=': this.addToken(this.match('=') ? TokenType.EQ : TokenType.ASSIGN); break;
            case '~': if(this.match('=')) this.addToken(TokenType.NEQ); break;
            case '<': this.addToken(this.match('=') ? TokenType.LTE : TokenType.LT); break;
            case '>': this.addToken(this.match('=') ? TokenType.GTE : TokenType.GT); break;
            case '"': case "'": this.string(c); break;
            case ' ': case '\r': case '\t': break;
            case '\n': this.line++; break;
            default:
                if (this.isDigit(c)) this.number();
                else if (this.isAlpha(c)) this.identifier();
                break;
        }
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) this.advance();
        const text = this.source.substring(this.start, this.current);
        const type = KEYWORDS[text] || TokenType.IDENTIFIER;
        this.addToken(type);
    }

    private number(): void {
        while (this.isDigit(this.peek())) this.advance();
        if (this.peek() == '.' && this.isDigit(this.peekNext())) {
            this.advance();
            while (this.isDigit(this.peek())) this.advance();
        }
        this.addToken(TokenType.NUMBER);
    }

    private string(quote: string): void {
        while (this.peek() != quote && !this.isAtEnd()) {
            if (this.peek() == '\n') this.line++;
            this.advance();
        }
        if (this.isAtEnd()) return;
        this.advance();
        this.addToken(TokenType.STRING);
    }

    private match(expected: string): boolean {
        if (this.isAtEnd() || this.source[this.current] != expected) return false;
        this.current++; return true;
    }

    private peek(): string { return this.isAtEnd() ? '\0' : this.source[this.current]; }
    private peekNext(): string { return this.current + 1 >= this.source.length ? '\0' : this.source[this.current + 1]; }
    private isAlpha(c: string): boolean { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_'; }
    private isDigit(c: string): boolean { return c >= '0' && c <= '9'; }
    private isAlphaNumeric(c: string): boolean { return this.isAlpha(c) || this.isDigit(c); }
    private isAtEnd(): boolean { return this.current >= this.source.length; }
    private advance(): string { return this.source[this.current++]; }
    private addToken(type: TokenType): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({ type, value: text, line: this.line });
    }
}

export function tokenize(source: string) { return new Lexer(source).tokenize(); }
