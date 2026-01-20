// ============================================================================
// NEPHILIM OBFUSCATOR v1.0.1 - FIXED NAME COLLISION
// ============================================================================

export enum TokenType{NUMBER='NUMBER',STRING='STRING',BOOLEAN='BOOLEAN',NIL='NIL',IDENTIFIER='IDENTIFIER',AND='AND',BREAK='BREAK',DO='DO',ELSE='ELSE',ELSEIF='ELSEIF',END='END',FALSE='FALSE',FOR='FOR',FUNCTION='FUNCTION',GOTO='GOTO',IF='IF',IN='IN',LOCAL='LOCAL',NOT='NOT',OR='OR',REPEAT='REPEAT',RETURN='RETURN',THEN='THEN',TRUE='TRUE',UNTIL='UNTIL',WHILE='WHILE',CONTINUE='CONTINUE',PLUS='PLUS',MINUS='MINUS',STAR='STAR',SLASH='SLASH',DOUBLE_SLASH='DOUBLE_SLASH',PERCENT='PERCENT',CARET='CARET',HASH='HASH',EQ='EQ',NEQ='NEQ',LT='LT',GT='GT',LTE='LTE',GTE='GTE',ASSIGN='ASSIGN',LPAREN='LPAREN',RPAREN='RPAREN',LBRACE='LBRACE',RBRACE='RBRACE',LBRACKET='LBRACKET',RBRACKET='RBRACKET',SEMICOLON='SEMICOLON',COLON='COLON',DOUBLE_COLON='DOUBLE_COLON',COMMA='COMMA',DOT='DOT',DOT_DOT='DOT_DOT',DOT_DOT_DOT='DOT_DOT_DOT',EOF='EOF'}
export interface Token{type:TokenType;value:string;literal?:any;line:number;column:number}
const KEYWORDS:Record<string,TokenType>={'and':TokenType.AND,'break':TokenType.BREAK,'do':TokenType.DO,'else':TokenType.ELSE,'elseif':TokenType.ELSEIF,'end':TokenType.END,'false':TokenType.FALSE,'for':TokenType.FOR,'function':TokenType.FUNCTION,'goto':TokenType.GOTO,'if':TokenType.IF,'in':TokenType.IN,'local':TokenType.LOCAL,'nil':TokenType.NIL,'not':TokenType.NOT,'or':TokenType.OR,'repeat':TokenType.REPEAT,'return':TokenType.RETURN,'then':TokenType.THEN,'true':TokenType.TRUE,'until':TokenType.UNTIL,'while':TokenType.WHILE,'continue':TokenType.CONTINUE};
export interface DebugLog{phase:string;message:string;data?:any}
let debugLogs:DebugLog[]=[];let debugEnabled=false;
export function enableDebug(enabled:boolean=true):void{debugEnabled=enabled;debugLogs=[];}
export function getDebugLogs():DebugLog[]{return debugLogs;}
function debug(phase:string,message:string,data?:any):void{if(debugEnabled)debugLogs.push({phase,message,data});}

// ============================================================================
// SHARED NAME GENERATOR (Prevents collisions)
// ============================================================================
class NameGenerator{
    private chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    private counter=0;
    generate():string{return this.getName(this.counter++);}
    private getName(n:number):string{
        if(n<52)return this.chars[n];
        return this.getName(Math.floor(n/52)-1)+this.chars[n%52];
    }
    reset(){this.counter=0;}
    // Get current position (for wrapper to start from different point)
    getCounter():number{return this.counter;}
    setCounter(n:number){this.counter=n;}
}

// GLOBAL shared generator - used across ALL phases
const globalNameGen = new NameGenerator();

// ============================================================================
// LEXER
// ============================================================================
export class Lexer{private source:string;private tokens:Token[]=[];private start=0;private current=0;private line=1;private column=1;private startColumn=1;constructor(source:string){this.source=source;}public tokenize():Token[]{while(!this.isAtEnd()){this.start=this.current;this.startColumn=this.column;this.scanToken();}this.tokens.push({type:TokenType.EOF,value:'',line:this.line,column:this.column});return this.tokens;}private scanToken():void{const c=this.advance();switch(c){case'(':this.addToken(TokenType.LPAREN);break;case')':this.addToken(TokenType.RPAREN);break;case'{':this.addToken(TokenType.LBRACE);break;case'}':this.addToken(TokenType.RBRACE);break;case']':this.addToken(TokenType.RBRACKET);break;case'+':this.addToken(TokenType.PLUS);break;case'*':this.addToken(TokenType.STAR);break;case'%':this.addToken(TokenType.PERCENT);break;case'^':this.addToken(TokenType.CARET);break;case'#':this.addToken(TokenType.HASH);break;case';':this.addToken(TokenType.SEMICOLON);break;case',':this.addToken(TokenType.COMMA);break;case'.':if(this.match('.'))this.addToken(this.match('.')?TokenType.DOT_DOT_DOT:TokenType.DOT_DOT);else if(this.isDigit(this.peek()))this.number();else this.addToken(TokenType.DOT);break;case'-':if(this.match('-'))this.comment();else this.addToken(TokenType.MINUS);break;case'/':this.addToken(this.match('/')?TokenType.DOUBLE_SLASH:TokenType.SLASH);break;case':':this.addToken(this.match(':')?TokenType.DOUBLE_COLON:TokenType.COLON);break;case'[':if(this.peek()==='['||this.peek()==='=')this.longString();else this.addToken(TokenType.LBRACKET);break;case'=':this.addToken(this.match('=')?TokenType.EQ:TokenType.ASSIGN);break;case'~':if(this.match('='))this.addToken(TokenType.NEQ);break;case'<':this.addToken(this.match('=')?TokenType.LTE:TokenType.LT);break;case'>':this.addToken(this.match('=')?TokenType.GTE:TokenType.GT);break;case'"':case"'":this.string(c);break;case' ':case'\r':case'\t':break;case'\n':this.line++;this.column=1;break;default:if(this.isDigit(c))this.number();else if(this.isAlpha(c))this.identifier();break;}}private string(quote:string):void{let value='';while(!this.isAtEnd()&&this.peek()!==quote){if(this.peek()==='\n'){this.line++;this.column=1;}if(this.peek()==='\\'){this.advance();if(!this.isAtEnd()){const esc=this.advance();switch(esc){case'n':value+='\n';break;case't':value+='\t';break;case'r':value+='\r';break;case'\\':value+='\\';break;case'"':value+='"';break;case"'":value+="'";break;case'0':value+='\0';break;case'x':if(this.isHexDigit(this.peek())&&this.isHexDigit(this.peekNext())){value+=String.fromCharCode(parseInt(this.advance()+this.advance(),16));}break;default:if(this.isDigit(esc)){let dec=esc;if(this.isDigit(this.peek()))dec+=this.advance();if(this.isDigit(this.peek()))dec+=this.advance();value+=String.fromCharCode(parseInt(dec,10));}else value+=esc;}}}else value+=this.advance();}if(!this.isAtEnd())this.advance();this.addToken(TokenType.STRING,value);}private longString():void{let level=0;while(this.peek()==='='){this.advance();level++;}if(this.peek()!=='['){this.addToken(TokenType.LBRACKET);return;}this.advance();if(this.peek()==='\n'){this.advance();this.line++;this.column=1;}let value='';const closing=']'+'='.repeat(level)+']';while(!this.isAtEnd()){if(this.peek()==='\n'){value+=this.advance();this.line++;this.column=1;}else if(this.checkSeq(closing)){for(let i=0;i<closing.length;i++)this.advance();break;}else value+=this.advance();}this.addToken(TokenType.STRING,value);}private number():void{if(this.source[this.start]==='0'){const next=this.peek().toLowerCase();if(next==='x'){this.advance();while(this.isHexDigit(this.peek())||this.peek()==='_')this.advance();this.addToken(TokenType.NUMBER,parseInt(this.source.substring(this.start,this.current).replace(/_/g,''),16));return;}else if(next==='b'){this.advance();while(this.peek()==='0'||this.peek()==='1'||this.peek()==='_')this.advance();this.addToken(TokenType.NUMBER,parseInt(this.source.substring(this.start+2,this.current).replace(/_/g,''),2));return;}}while(this.isDigit(this.peek())||this.peek()==='_')this.advance();if(this.peek()==='.'&&this.isDigit(this.peekNext())){this.advance();while(this.isDigit(this.peek())||this.peek()==='_')this.advance();}if(this.peek().toLowerCase()==='e'){this.advance();if(this.peek()==='+'||this.peek()==='-')this.advance();while(this.isDigit(this.peek()))this.advance();}this.addToken(TokenType.NUMBER,parseFloat(this.source.substring(this.start,this.current).replace(/_/g,'')));}private identifier():void{while(this.isAlphaNumeric(this.peek()))this.advance();const text=this.source.substring(this.start,this.current);const kw=KEYWORDS[text];if(kw!==undefined){if(kw===TokenType.TRUE)this.addToken(TokenType.TRUE,true);else if(kw===TokenType.FALSE)this.addToken(TokenType.FALSE,false);else if(kw===TokenType.NIL)this.addToken(TokenType.NIL,null);else this.addToken(kw);}else this.addToken(TokenType.IDENTIFIER,text);}private comment():void{if(this.peek()==='['&&(this.peekNext()==='['||this.peekNext()==='=')){this.advance();let level=0;while(this.peek()==='='){this.advance();level++;}if(this.peek()==='['){this.advance();const closing=']'+'='.repeat(level)+']';while(!this.isAtEnd()){if(this.peek()==='\n'){this.advance();this.line++;this.column=1;}else if(this.checkSeq(closing)){for(let i=0;i<closing.length;i++)this.advance();break;}else this.advance();}}}else{while(!this.isAtEnd()&&this.peek()!=='\n')this.advance();}}private isAtEnd():boolean{return this.current>=this.source.length;}private advance():string{const c=this.source[this.current];this.current++;this.column++;return c;}private peek():string{return this.isAtEnd()?'\0':this.source[this.current];}private peekNext():string{return this.current+1>=this.source.length?'\0':this.source[this.current+1];}private match(expected:string):boolean{if(this.isAtEnd()||this.source[this.current]!==expected)return false;this.current++;this.column++;return true;}private checkSeq(seq:string):boolean{for(let i=0;i<seq.length;i++){if(this.current+i>=this.source.length||this.source[this.current+i]!==seq[i])return false;}return true;}private isDigit(c:string):boolean{return c>='0'&&c<='9';}private isHexDigit(c:string):boolean{return this.isDigit(c)||(c>='a'&&c<='f')||(c>='A'&&c<='F');}private isAlpha(c:string):boolean{return(c>='a'&&c<='z')||(c>='A'&&c<='Z')||c==='_';}private isAlphaNumeric(c:string):boolean{return this.isAlpha(c)||this.isDigit(c);}private addToken(type:TokenType,literal?:any):void{const text=this.source.substring(this.start,this.current);this.tokens.push({type,value:text,literal:literal!==undefined?literal:text,line:this.line,column:this.startColumn});}}
export function tokenize(source:string):Token[]{return new Lexer(source).tokenize();}

// ============================================================================
// HELPERS
// ============================================================================
class NumFmt{static fmt(n:number):string{if(n<0)return`-${this.fmt(-n)}`;if(!Number.isInteger(n))return n.toString();const r=Math.random();if(r<0.25)return n.toString();if(r<0.5)return`0X${n.toString(16).toUpperCase()}`;if(r<0.75)return`0x${n.toString(16)}`;return`0B${n.toString(2)}`;}static fmtSafe(n:number):string{if(n<0)return`-${this.fmtSafe(-n)}`;if(!Number.isInteger(n))return n.toString();if(n<16)return n.toString();const r=Math.random();if(r<0.33)return`0X${n.toString(16).toUpperCase()}`;if(r<0.66)return`0x${n.toString(16)}`;return`0B${n.toString(2)}`;}}
class StrEnc{static enc(s:string,k:number):string{let r='';for(let i=0;i<s.length;i++){const c=(s.charCodeAt(i)^k)&0xFF;if(Math.random()<0.3)r+=`\\u{${c.toString(16).padStart(2,'0')}}`;else r+=`\\x${c.toString(16).padStart(2,'0')}`;}return r;}}

// ============================================================================
// RESERVED & CONSTANTS
// ============================================================================
const RESERVED=new Set(['print','type','tostring','tonumber','pairs','ipairs','next','select','unpack','pcall','xpcall','error','assert','setmetatable','getmetatable','rawget','rawset','rawequal','loadstring','load','dofile','require','collectgarbage','setfenv','getfenv','math','string','table','os','io','coroutine','debug','bit32','bit','utf8','package','game','workspace','script','plugin','wait','spawn','delay','tick','time','elapsedTime','warn','typeof','task','version','settings','Instance','Vector3','Vector2','CFrame','Color3','UDim','UDim2','Enum','Ray','Region3','Rect','BrickColor','TweenInfo','NumberSequence','ColorSequence','NumberRange','PhysicalProperties','Random','Axes','Faces','getgenv','getrenv','getrawmetatable','setrawmetatable','hookfunction','hookmetamethod','newcclosure','islclosure','iscclosure','checkcaller','getinfo','getupvalue','setupvalue','getconstant','setconstant','getconnections','firesignal','fireserver','fireclient','syn','Synapse','Drawing','request','http_request','HttpGet','HttpPost','readfile','writefile','appendfile','isfile','isfolder','makefolder','listfiles','setclipboard','identifyexecutor','getexecutorname','gethiddenproperty','sethiddenproperty','gethui','getinstances','getnilinstances','_G','_VERSION','_ENV','self','nil','true','false','shared']);
export interface RenameMap{[original:string]:string}
const STATEMENT_KEYWORDS=new Set([TokenType.LOCAL,TokenType.FUNCTION,TokenType.IF,TokenType.THEN,TokenType.ELSE,TokenType.ELSEIF,TokenType.END,TokenType.DO,TokenType.WHILE,TokenType.FOR,TokenType.REPEAT,TokenType.UNTIL,TokenType.RETURN,TokenType.BREAK,TokenType.GOTO]);
const SKIP_PROPERTIES=new Set(['new','Create','clone','Clone','Destroy','destroy','Parent','parent','Name','name','Value','value','Text','text','Visible','visible','Enabled','enabled','Position','position','Size','size','Color','color','Transparency','CFrame','Anchored','CanCollide','Character','Humanoid','Health','WalkSpeed','JumpPower','Hit','Target','Mouse','Keyboard','InputBegan','InputEnded','Touched','Changed','ChildAdded','ChildRemoved','AncestryChanged','GetPropertyChangedSignal','Wait','Connect','Disconnect','Once','Fire','Invoke','BindToRenderStep','UnbindFromRenderStep','Heartbeat','Stepped','RenderStepped']);

// ============================================================================
// PHASE 1: VARIABLE RENAMING
// ============================================================================
function isTableKey(tokens:Token[],index:number):boolean{const next=tokens[index+1];if(!next||next.type!==TokenType.ASSIGN)return false;let braceDepth=0;for(let j=index-1;j>=0;j--){const t=tokens[j];if(t.type===TokenType.RBRACE){braceDepth++;continue;}if(t.type===TokenType.LBRACE){if(braceDepth===0)return true;braceDepth--;continue;}if(braceDepth>0)continue;if(t.type===TokenType.SEMICOLON)return false;if(STATEMENT_KEYWORDS.has(t.type))return false;}return false;}
function analyzeIdentifiers(tokens:Token[]):Set<string>{const localVars=new Set<string>();for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type!==TokenType.IDENTIFIER)continue;if(RESERVED.has(t.value))continue;const prev=tokens[i-1];const prev2=tokens[i-2];if(prev&&(prev.type===TokenType.DOT||prev.type===TokenType.COLON))continue;if(isTableKey(tokens,i))continue;let isLocal=false;if(prev&&prev.type===TokenType.LOCAL)isLocal=true;if(!isLocal&&prev&&prev.type===TokenType.COMMA){for(let j=i-1;j>=0;j--){const tk=tokens[j];if(tk.type===TokenType.LOCAL){isLocal=true;break;}if(tk.type===TokenType.ASSIGN||tk.type===TokenType.IN||STATEMENT_KEYWORDS.has(tk.type))break;}}if(!isLocal&&prev&&prev.type===TokenType.FUNCTION){if(prev2&&prev2.type===TokenType.LOCAL)isLocal=true;}if(!isLocal){let parenDepth=0;for(let j=i-1;j>=0;j--){const tk=tokens[j];if(tk.type===TokenType.RPAREN)parenDepth++;else if(tk.type===TokenType.LPAREN){parenDepth--;if(parenDepth<0){for(let k=j-1;k>=0;k--){if(tokens[k].type===TokenType.FUNCTION){isLocal=true;break;}if(tokens[k].type!==TokenType.IDENTIFIER)break;}break;}}else if(STATEMENT_KEYWORDS.has(tk.type))break;}}if(!isLocal){for(let j=i-1;j>=0;j--){const tk=tokens[j];if(tk.type===TokenType.FOR){isLocal=true;break;}if(tk.type===TokenType.DO||STATEMENT_KEYWORDS.has(tk.type))break;}}if(isLocal)localVars.add(t.value);}return localVars;}
export function createRenameMap(tokens:Token[],nameGen:NameGenerator):RenameMap{const map:RenameMap={};const localVars=analyzeIdentifiers(tokens);for(const name of localVars)map[name]=nameGen.generate();return map;}
export function applyRenameMap(tokens:Token[],map:RenameMap):Token[]{const result:Token[]=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type!==TokenType.IDENTIFIER||!map[t.value]){result.push(t);continue;}const prev=tokens[i-1];if(prev&&(prev.type===TokenType.DOT||prev.type===TokenType.COLON)){result.push(t);continue;}if(isTableKey(tokens,i)){result.push(t);continue;}result.push({...t,value:map[t.value],literal:map[t.value]});}return result;}

// ============================================================================
// PHASE 2: STRING ENCRYPTION
// ============================================================================
export interface StringEncryptionResult{encryptedStrings:Map<string,{encrypted:string;key:number}>;decryptorName:string;decryptorCode:string;xorKey:number}
export function encryptStrings(tokens:Token[],nameGen:NameGenerator):{tokens:Token[];encryption:StringEncryptionResult}{const encryptedStrings=new Map<string,{encrypted:string;key:number}>();const decryptorName=nameGen.generate();const globalKey=Math.floor(Math.random()*200)+50;const result:Token[]=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.STRING&&typeof t.literal==='string'&&t.literal.length>0){const original=t.literal;const encrypted=StrEnc.enc(original,globalKey);encryptedStrings.set(original,{encrypted,key:globalKey});result.push({type:TokenType.IDENTIFIER,value:decryptorName,line:t.line,column:t.column});result.push({type:TokenType.LPAREN,value:'(',line:t.line,column:t.column});result.push({type:TokenType.STRING,value:`"${encrypted}"`,literal:encrypted,line:t.line,column:t.column});result.push({type:TokenType.COMMA,value:',',line:t.line,column:t.column});result.push({type:TokenType.NUMBER,value:NumFmt.fmt(globalKey),literal:globalKey,line:t.line,column:t.column});result.push({type:TokenType.RPAREN,value:')',line:t.line,column:t.column});}else{result.push(t);}}const decryptorCode=`local ${decryptorName}=(function()local b=bit32 or bit;local x=b and b.bxor or function(a,c)local r,p=${NumFmt.fmt(0)},${NumFmt.fmt(1)};while a>${NumFmt.fmt(0)} or c>${NumFmt.fmt(0)} do if a%${NumFmt.fmt(2)}~=c%${NumFmt.fmt(2)} then r=r+p;end;a,c,p=math.floor(a/${NumFmt.fmt(2)}),math.floor(c/${NumFmt.fmt(2)}),p*${NumFmt.fmt(2)};end;return r;end;return function(s,k)local o="";for i=${NumFmt.fmt(1)},#s do o=o..string.char(x(s:byte(i),k));end;return o;end;end)()`;return{tokens:result,encryption:{encryptedStrings,decryptorName,decryptorCode,xorKey:globalKey}};}

// ============================================================================
// PHASE 3: PROPERTY ACCESS OBFUSCATION
// ============================================================================
export function obfuscatePropertyAccess(tokens:Token[],decryptorName:string,xorKey:number):{tokens:Token[];propertiesObfuscated:number}{const result:Token[]=[];let count=0;for(let i=0;i<tokens.length;i++){const t=tokens[i];const next=tokens[i+1];if(t.type===TokenType.DOT&&next?.type===TokenType.IDENTIFIER){const propName=next.value;if(propName.length<=2||SKIP_PROPERTIES.has(propName)){result.push(t);continue;}const encrypted=StrEnc.enc(propName,xorKey);result.push({type:TokenType.LBRACKET,value:'[',line:t.line,column:t.column});result.push({type:TokenType.IDENTIFIER,value:decryptorName,line:t.line,column:t.column});result.push({type:TokenType.LPAREN,value:'(',line:t.line,column:t.column});result.push({type:TokenType.STRING,value:`"${encrypted}"`,literal:encrypted,line:t.line,column:t.column});result.push({type:TokenType.COMMA,value:',',line:t.line,column:t.column});result.push({type:TokenType.NUMBER,value:NumFmt.fmt(xorKey),literal:xorKey,line:t.line,column:t.column});result.push({type:TokenType.RPAREN,value:')',line:t.line,column:t.column});result.push({type:TokenType.RBRACKET,value:']',line:t.line,column:t.column});i++;count++;}else{result.push(t);}}return{tokens:result,propertiesObfuscated:count};}

// ============================================================================
// PHASE 4: TABLE KEYS OBFUSCATION
// ============================================================================
export function obfuscateTableKeys(tokens:Token[],decryptorName:string,xorKey:number):{tokens:Token[];keysObfuscated:number}{const result:Token[]=[];let count=0;for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.IDENTIFIER&&isTableKey(tokens,i)&&t.value.length>2){const encrypted=StrEnc.enc(t.value,xorKey);result.push({type:TokenType.LBRACKET,value:'[',line:t.line,column:t.column});result.push({type:TokenType.IDENTIFIER,value:decryptorName,line:t.line,column:t.column});result.push({type:TokenType.LPAREN,value:'(',line:t.line,column:t.column});result.push({type:TokenType.STRING,value:`"${encrypted}"`,literal:encrypted,line:t.line,column:t.column});result.push({type:TokenType.COMMA,value:',',line:t.line,column:t.column});result.push({type:TokenType.NUMBER,value:NumFmt.fmt(xorKey),literal:xorKey,line:t.line,column:t.column});result.push({type:TokenType.RPAREN,value:')',line:t.line,column:t.column});result.push({type:TokenType.RBRACKET,value:']',line:t.line,column:t.column});count++;}else{result.push(t);}}return{tokens:result,keysObfuscated:count};}

// ============================================================================
// PHASE 5: NUMBER OBFUSCATION
// ============================================================================
export function obfuscateNumbers(tokens:Token[]):{tokens:Token[];numbersObfuscated:number}{const result:Token[]=[];let numbersObfuscated=0;for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.NUMBER&&typeof t.literal==='number'){const num=t.literal;let inForLoop=false;for(let j=i-1;j>=Math.max(0,i-15);j--){if(tokens[j].type===TokenType.FOR){inForLoop=true;break;}if(tokens[j].type===TokenType.DO)break;}if(inForLoop){result.push(t);continue;}const prev=tokens[i-1];if(prev?.type===TokenType.LBRACKET&&num>=1&&num<=10&&Number.isInteger(num)){result.push(t);continue;}result.push({...t,value:NumFmt.fmtSafe(num)});numbersObfuscated++;}else{result.push(t);}}return{tokens:result,numbersObfuscated};}

// ============================================================================
// PHASE 6: OPAQUE PREDICATES & DEAD CODE
// ============================================================================
class OpaquePredicateGenerator{private nameGen:NameGenerator;constructor(ng:NameGenerator){this.nameGen=ng;}generateTruePredicate():{condition:string;setup:string}{const v=this.nameGen.generate();const n=Math.floor(Math.random()*100)+1;return{setup:`local ${v}=${NumFmt.fmt(n)}`,condition:`(${v}*${v}>=${NumFmt.fmt(0)})`};}generateFalsePredicate():{condition:string;setup:string}{const v=this.nameGen.generate();const n=Math.floor(Math.random()*100)+1;return{setup:`local ${v}=${NumFmt.fmt(n)}`,condition:`(${v}<${NumFmt.fmt(0)} and ${v}>${NumFmt.fmt(0)})`};}}
class DeadCodeGenerator{private nameGen:NameGenerator;constructor(ng:NameGenerator){this.nameGen=ng;}generateDeadCode():string{const v=this.nameGen.generate();return`local ${v}=${NumFmt.fmt(Math.floor(Math.random()*1000))}`;}generateDeadBlock():string{const lines:string[]=[];for(let i=0;i<2;i++)lines.push(this.generateDeadCode());return lines.join(';');}}
export function injectOpaquePredicates(tokens:Token[],nameGen:NameGenerator,config:{insertionRate?:number}={}):{tokens:Token[];predicatesInserted:number;deadCodeInserted:number}{const cfg={insertionRate:config.insertionRate??0.15};const opaqueGen=new OpaquePredicateGenerator(nameGen);const deadGen=new DeadCodeGenerator(nameGen);const result:Token[]=[];let predicatesInserted=0;let deadCodeInserted=0;const insertionPoints:number[]=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.THEN||t.type===TokenType.DO||t.type===TokenType.ELSE){if(Math.random()<cfg.insertionRate)insertionPoints.push(i);}}for(let i=0;i<tokens.length;i++){const t=tokens[i];result.push(t);if(insertionPoints.includes(i)){if(Math.random()<0.5){const falsePred=opaqueGen.generateFalsePredicate();const deadCode=deadGen.generateDeadBlock();const injection=`${falsePred.setup};if ${falsePred.condition} then ${deadCode} end`;const injTokens=tokenize(injection);injTokens.pop();result.push(...injTokens);predicatesInserted++;deadCodeInserted++;}else{const truePred=opaqueGen.generateTruePredicate();const injTokens=tokenize(truePred.setup);injTokens.pop();result.push(...injTokens);predicatesInserted++;}}}return{tokens:result,predicatesInserted,deadCodeInserted};}

// ============================================================================
// PHASE 7: CONTROL FLOW FLATTENING
// ============================================================================
interface CFBlock{id:number;tokens:Token[];nextState:number|null}
class ControlFlowFlattener{private stateVarName:string;private blocks:CFBlock[]=[];constructor(nameGen:NameGenerator){this.stateVarName=nameGen.generate();}private shuffleArray<T>(array:T[]):T[]{const result=[...array];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}flattenFunction(bodyTokens:Token[]):Token[]{this.blocks=[];const segments=this.splitIntoSegments(bodyTokens);if(segments.length<2)return bodyTokens;let stateId=1;for(const seg of segments){this.blocks.push({id:stateId,tokens:seg,nextState:stateId<segments.length?stateId+1:0});stateId++;}return this.generateStateMachine();}private splitIntoSegments(tokens:Token[]):Token[][]{const segments:Token[][]=[];let current:Token[]=[];let depth=0;let parenDepth=0;let bracketDepth=0;let braceDepth=0;for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.IF||t.type===TokenType.WHILE||t.type===TokenType.FOR||t.type===TokenType.FUNCTION||t.type===TokenType.REPEAT||t.type===TokenType.DO)depth++;if(t.type===TokenType.END||t.type===TokenType.UNTIL)depth--;if(t.type===TokenType.LPAREN)parenDepth++;if(t.type===TokenType.RPAREN)parenDepth--;if(t.type===TokenType.LBRACKET)bracketDepth++;if(t.type===TokenType.RBRACKET)bracketDepth--;if(t.type===TokenType.LBRACE)braceDepth++;if(t.type===TokenType.RBRACE)braceDepth--;current.push(t);const allClosed=depth===0&&parenDepth===0&&bracketDepth===0&&braceDepth===0;const canSplit=t.type===TokenType.END||i===tokens.length-1||(tokens[i+1]&&tokens[i+1].type===TokenType.LOCAL);if(allClosed&&current.length>3&&canSplit){segments.push(current);current=[];}}if(current.length>0)segments.push(current);return segments;}private generateStateMachine():Token[]{const result:Token[]=[];const shuffled=this.shuffleArray(this.blocks);const init=this.blocks.length>0?this.blocks[0].id:0;result.push(...tokenize(`local ${this.stateVarName}=${NumFmt.fmt(init)}`).slice(0,-1));result.push(...tokenize(`while ${this.stateVarName}~=${NumFmt.fmt(0)} do `).slice(0,-1));for(let i=0;i<shuffled.length;i++){const block=shuffled[i];const kw=i===0?'if':'elseif';result.push(...tokenize(`${kw} ${this.stateVarName}==${NumFmt.fmt(block.id)} then `).slice(0,-1));result.push(...block.tokens);result.push(...tokenize(`;${this.stateVarName}=${NumFmt.fmt(block.nextState??0)};`).slice(0,-1));}result.push(...tokenize(` end end`).slice(0,-1));return result;}}
export function flattenControlFlow(tokens:Token[],nameGen:NameGenerator,config:{flattenRate?:number;minStatements?:number}={}):{tokens:Token[];functionsFlattened:number}{const cfg={flattenRate:config.flattenRate??0.3,minStatements:config.minStatements??3};const result:Token[]=[];let functionsFlattened=0;let i=0;while(i<tokens.length){const t=tokens[i];if(t.type===TokenType.FUNCTION){result.push(t);i++;while(i<tokens.length&&tokens[i].type!==TokenType.LPAREN){result.push(tokens[i]);i++;}if(i<tokens.length){result.push(tokens[i]);i++;}let parenDepth=1;while(i<tokens.length&&parenDepth>0){if(tokens[i].type===TokenType.LPAREN)parenDepth++;if(tokens[i].type===TokenType.RPAREN)parenDepth--;result.push(tokens[i]);i++;}const bodyTokens:Token[]=[];let depth=1;while(i<tokens.length&&depth>0){const tk=tokens[i];if(tk.type===TokenType.FUNCTION||tk.type===TokenType.IF||tk.type===TokenType.WHILE||tk.type===TokenType.FOR||tk.type===TokenType.REPEAT||tk.type===TokenType.DO)depth++;if(tk.type===TokenType.END||tk.type===TokenType.UNTIL){depth--;if(depth===0)break;}bodyTokens.push(tk);i++;}let hasAnonymousFunc=false;let pDepth=0;for(let j=0;j<bodyTokens.length;j++){const tk=bodyTokens[j];if(tk.type===TokenType.LPAREN)pDepth++;if(tk.type===TokenType.RPAREN)pDepth--;if(tk.type===TokenType.FUNCTION&&pDepth>0){hasAnonymousFunc=true;break;}}if(bodyTokens.length>=cfg.minStatements&&Math.random()<cfg.flattenRate&&!hasAnonymousFunc){const flattener=new ControlFlowFlattener(nameGen);result.push(...flattener.flattenFunction(bodyTokens));functionsFlattened++;}else{result.push(...bodyTokens);}if(i<tokens.length){result.push(tokens[i]);i++;}}else{result.push(t);i++;}}return{tokens:result,functionsFlattened};}

// ============================================================================
// PHASE 8: FUNCTION PROXY
// ============================================================================
const PROXYABLE_FUNCTIONS=['print','warn','error','type','typeof','tostring','tonumber','pairs','ipairs','next','select','unpack','pcall','xpcall','assert','setmetatable','getmetatable','rawget','rawset','rawequal','loadstring','require'];
export interface FunctionProxyResult{proxyTableName:string;proxyCode:string;functionsProxied:number}
export function createFunctionProxy(tokens:Token[],nameGen:NameGenerator):{tokens:Token[];proxy:FunctionProxyResult}{const proxyTableName=nameGen.generate();const usedFunctions=new Set<string>();for(const t of tokens){if(t.type===TokenType.IDENTIFIER&&PROXYABLE_FUNCTIONS.includes(t.value)){usedFunctions.add(t.value);}}if(usedFunctions.size===0){return{tokens,proxy:{proxyTableName,proxyCode:'',functionsProxied:0}};}const proxyMap:Record<string,string>={};const entries:string[]=[];let idx=0;for(const fn of usedFunctions){const key=String.fromCharCode(97+idx%26)+(idx>=26?String(Math.floor(idx/26)):'');proxyMap[fn]=key;entries.push(`${key}=${fn}`);idx++;}const proxyCode=`local ${proxyTableName}={${entries.join(',')}}`;const result:Token[]=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.IDENTIFIER&&proxyMap[t.value]){const prev=tokens[i-1];if(prev&&(prev.type===TokenType.DOT||prev.type===TokenType.COLON)){result.push(t);continue;}result.push({type:TokenType.IDENTIFIER,value:proxyTableName,line:t.line,column:t.column});result.push({type:TokenType.DOT,value:'.',line:t.line,column:t.column});result.push({type:TokenType.IDENTIFIER,value:proxyMap[t.value],line:t.line,column:t.column});}else{result.push(t);}}return{tokens:result,proxy:{proxyTableName,proxyCode,functionsProxied:usedFunctions.size}};}

// ============================================================================
// LURAPH STYLE WRAPPER
// ============================================================================
class LuraphWrapper{private wrapperNameGen=new NameGenerator();generateVMEntry():string{const n=this.wrapperNameGen.generate();const variant=Math.floor(Math.random()*4);if(variant===0)return`${n}=function(a,X,K,e)e=({});(K)[${NumFmt.fmt(1)}]=(tostring);K[${NumFmt.fmt(2)}]=(nil);(K)[${NumFmt.fmt(3)}]=(nil);X=(${NumFmt.fmt(12)});repeat if X==${NumFmt.fmt(12)} then(K)[${NumFmt.fmt(2)}]=a.m;if not(not e[${NumFmt.fmt(3091)}])then X=(e[${NumFmt.fmt(3091)}]);else X=a:J(e,X);end;else if X~=${NumFmt.fmt(123)} then else K[${NumFmt.fmt(3)}]=a.Y;break;end;end;until false;return e,X;end`;if(variant===1)return`${n}=function(a,X,K,e,z,Y,f)local r;(f)[${NumFmt.fmt(44)}]=(nil);f[${NumFmt.fmt(45)}]=(nil);X=(nil);z=(${NumFmt.fmt(76)});while true do X,r,z=a:Nc(f,z,K,X);if r~=${NumFmt.fmt(61103)} then else break;end;end;e=(function(...)local K;K=a:Gc(...);return a.T(K);end);Y=X();(f[${NumFmt.fmt(39)}])[${NumFmt.fmt(13)}]=a.d;z=${NumFmt.fmt(99)};return X,z,Y,e;end`;if(variant===2)return`${n}=function(a,a,X)X=a[${NumFmt.fmt(4387)}];return X;end`;return`${n}=function(a,X,K)K=${NumFmt.fmt(94)}+((a.Dc(X[${NumFmt.fmt(8790)}]+X[${NumFmt.fmt(24554)}]-a.a[${NumFmt.fmt(8)}],K,X[${NumFmt.fmt(6816)}]))-X[${NumFmt.fmt(8790)}]);(X)[${NumFmt.fmt(18388)}]=K;return K;end`;}generateDataEntry():string{const n=this.wrapperNameGen.generate();const entries:string[]=[];const size=Math.floor(Math.random()*20)+10;for(let i=0;i<size;i++){entries.push(`[${NumFmt.fmt(Math.floor(Math.random()*10000))}]=${NumFmt.fmt(Math.floor(Math.random()*100000))}`);}return`${n}={${entries.join(',')}}`;}wrap(innerCode:string,decryptorCode:string,proxyCode:string,vmCount:number=10,dataCount:number=5):string{this.wrapperNameGen.reset();const entries:string[]=[];entries.push('m=select');entries.push('T=unpack');entries.push('u=coroutine.wrap');entries.push('g=getfenv');for(let i=0;i<vmCount;i++)entries.push(this.generateVMEntry());for(let i=0;i<dataCount;i++)entries.push(this.generateDataEntry());return`-- This file was protected using Nephilim Obfuscator v1.0.1 [https://nephilim.dev]

return(function(lI,...)
${decryptorCode}
${proxyCode}
${innerCode}
end)({${entries.join(',\n')}})`;}}

// ============================================================================
// CODE GENERATOR
// ============================================================================
const KEYWORDS_NEED_SPACE_AFTER=new Set([TokenType.LOCAL,TokenType.FUNCTION,TokenType.IF,TokenType.THEN,TokenType.ELSE,TokenType.ELSEIF,TokenType.WHILE,TokenType.DO,TokenType.FOR,TokenType.IN,TokenType.RETURN,TokenType.AND,TokenType.OR,TokenType.NOT,TokenType.END,TokenType.UNTIL,TokenType.REPEAT,TokenType.BREAK,TokenType.GOTO]);
const SPACE_AFTER=new Set([...KEYWORDS_NEED_SPACE_AFTER,TokenType.IDENTIFIER,TokenType.NUMBER,TokenType.STRING,TokenType.TRUE,TokenType.FALSE,TokenType.NIL,TokenType.RPAREN,TokenType.RBRACE,TokenType.RBRACKET]);
const SPACE_BEFORE=new Set([TokenType.IDENTIFIER,TokenType.NUMBER,TokenType.STRING,TokenType.TRUE,TokenType.FALSE,TokenType.NIL,TokenType.FUNCTION,TokenType.IF,TokenType.THEN,TokenType.ELSE,TokenType.END,TokenType.LOCAL,TokenType.RETURN,TokenType.AND,TokenType.OR,TokenType.NOT,TokenType.DO,TokenType.WHILE,TokenType.FOR,TokenType.IN,TokenType.UNTIL,TokenType.REPEAT,TokenType.ELSEIF,TokenType.LBRACE]);
const NO_SPACE_AFTER=new Set([TokenType.LPAREN,TokenType.LBRACE,TokenType.LBRACKET,TokenType.DOT,TokenType.COLON,TokenType.HASH]);
const NO_SPACE_BEFORE=new Set([TokenType.RPAREN,TokenType.RBRACE,TokenType.RBRACKET,TokenType.DOT,TokenType.COLON,TokenType.COMMA,TokenType.SEMICOLON,TokenType.LPAREN,TokenType.LBRACKET]);
export function tokensToCode(tokens:Token[]):string{let code='';for(let i=0;i<tokens.length;i++){const t=tokens[i];const prev=tokens[i-1];if(t.type===TokenType.EOF)continue;if(prev&&prev.type!==TokenType.EOF){let needsSpace=false;if(KEYWORDS_NEED_SPACE_AFTER.has(prev.type)){needsSpace=true;}else if(!NO_SPACE_AFTER.has(prev.type)&&!NO_SPACE_BEFORE.has(t.type)){if(SPACE_AFTER.has(prev.type)||SPACE_BEFORE.has(t.type)){needsSpace=true;}}if(needsSpace)code+=' ';}if(t.type===TokenType.STRING){if(t.value.startsWith('"')||t.value.startsWith("'")){code+=t.value;}else{const escaped=(t.literal??'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t');code+='"'+escaped+'"';}}else{code+=t.value;}}return code;}

// ============================================================================
// MAIN OBFUSCATE
// ============================================================================
export interface ObfuscateOptions{debug?:boolean;renameVariables?:boolean;encryptStrings?:boolean;obfuscateNumbers?:boolean;obfuscateProperties?:boolean;obfuscateTableKeys?:boolean;insertOpaquePredicates?:boolean;opaqueInsertionRate?:number;flattenControlFlow?:boolean;flattenRate?:number;proxyFunctions?:boolean;vmEntries?:number;dataEntries?:number}
export interface ObfuscateResult{code:string;map:RenameMap;stats:{originalTokens:number;identifiersRenamed:number;stringsEncrypted:number;numbersObfuscated:number;predicatesInserted:number;deadCodeInserted:number;propertiesObfuscated:number;tableKeysObfuscated:number;functionsFlattened:number;functionsProxied:number;originalLength:number;outputLength:number;timeMs:number};debugLogs?:DebugLog[]}

export function obfuscate(source:string,options:ObfuscateOptions={}):ObfuscateResult{
const startTime=Date.now();
const opts={
debug:options.debug??false,
renameVariables:options.renameVariables??true,
encryptStrings:options.encryptStrings??true,
obfuscateNumbers:options.obfuscateNumbers??true,
obfuscateProperties:options.obfuscateProperties??true,
obfuscateTableKeys:options.obfuscateTableKeys??true,
insertOpaquePredicates:options.insertOpaquePredicates??true,
opaqueInsertionRate:options.opaqueInsertionRate??0.15,
flattenControlFlow:options.flattenControlFlow??true,
flattenRate:options.flattenRate??0.3,
proxyFunctions:options.proxyFunctions??true,
vmEntries:options.vmEntries??10,
dataEntries:options.dataEntries??5
};
enableDebug(opts.debug);

// RESET global name generator for each obfuscation
globalNameGen.reset();

let tokens=tokenize(source);
const originalTokenCount=tokens.length;
let renameMap:RenameMap={};

// Phase 1: Rename Variables
if(opts.renameVariables){renameMap=createRenameMap(tokens,globalNameGen);tokens=applyRenameMap(tokens,renameMap);}

// Phase 2: Encrypt Strings (uses globalNameGen - no collision!)
let stringsEncrypted=0;
let decryptorCode='';
let decryptorName='';
let xorKey=0;
if(opts.encryptStrings){const encResult=encryptStrings(tokens,globalNameGen);tokens=encResult.tokens;decryptorCode=encResult.encryption.decryptorCode;decryptorName=encResult.encryption.decryptorName;xorKey=encResult.encryption.xorKey;stringsEncrypted=encResult.encryption.encryptedStrings.size;}

// Phase 3: Obfuscate Properties
let propertiesObfuscated=0;
if(opts.obfuscateProperties&&decryptorName){const propResult=obfuscatePropertyAccess(tokens,decryptorName,xorKey);tokens=propResult.tokens;propertiesObfuscated=propResult.propertiesObfuscated;}

// Phase 4: Obfuscate Table Keys
let tableKeysObfuscated=0;
if(opts.obfuscateTableKeys&&decryptorName){const keyResult=obfuscateTableKeys(tokens,decryptorName,xorKey);tokens=keyResult.tokens;tableKeysObfuscated=keyResult.keysObfuscated;}

// Phase 5: Obfuscate Numbers
let numbersObfuscated=0;
if(opts.obfuscateNumbers){const numResult=obfuscateNumbers(tokens);tokens=numResult.tokens;numbersObfuscated=numResult.numbersObfuscated;}

// Phase 6: Inject Opaque Predicates
let predicatesInserted=0;
let deadCodeInserted=0;
if(opts.insertOpaquePredicates){const opaqueResult=injectOpaquePredicates(tokens,globalNameGen,{insertionRate:opts.opaqueInsertionRate});tokens=opaqueResult.tokens;predicatesInserted=opaqueResult.predicatesInserted;deadCodeInserted=opaqueResult.deadCodeInserted;}

// Phase 7: Flatten Control Flow
let functionsFlattened=0;
if(opts.flattenControlFlow){const cffResult=flattenControlFlow(tokens,globalNameGen,{flattenRate:opts.flattenRate,minStatements:3});tokens=cffResult.tokens;functionsFlattened=cffResult.functionsFlattened;}

// Phase 8: Function Proxy (uses globalNameGen - no collision!)
let functionsProxied=0;
let proxyCode='';
if(opts.proxyFunctions){const proxyResult=createFunctionProxy(tokens,globalNameGen);tokens=proxyResult.tokens;proxyCode=proxyResult.proxy.proxyCode;functionsProxied=proxyResult.proxy.functionsProxied;}

// Generate Inner Code
let innerCode=tokensToCode(tokens);

// Wrap in Luraph Style (uses separate wrapperNameGen)
const wrapper=new LuraphWrapper();
const code=wrapper.wrap(innerCode,decryptorCode,proxyCode,opts.vmEntries,opts.dataEntries);

return{
code,
map:renameMap,
stats:{
originalTokens:originalTokenCount,
identifiersRenamed:Object.keys(renameMap).length,
stringsEncrypted,
numbersObfuscated,
predicatesInserted,
deadCodeInserted,
propertiesObfuscated,
tableKeysObfuscated,
functionsFlattened,
functionsProxied,
originalLength:source.length,
outputLength:code.length,
timeMs:Date.now()-startTime
},
debugLogs:opts.debug?getDebugLogs():undefined
};}

export default{obfuscate,tokenize,enableDebug,getDebugLogs};
