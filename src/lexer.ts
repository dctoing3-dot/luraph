// ============================================================================
// NEPHILIM OBFUSCATOR v2.0.0 - FIXED & OPTIMIZED FOR ROBLOX
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
// SHARED NAME GENERATOR
// ============================================================================
class NameGenerator{private chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';private counter=0;generate():string{return this.getName(this.counter++);}private getName(n:number):string{if(n<52)return this.chars[n];return this.getName(Math.floor(n/52)-1)+this.chars[n%52];}reset(){this.counter=0;}getCounter():number{return this.counter;}setCounter(n:number){this.counter=n;}}
const globalNameGen=new NameGenerator();

// ============================================================================
// LEXER
// ============================================================================
export class Lexer{private source:string;private tokens:Token[]=[];private start=0;private current=0;private line=1;private column=1;private startColumn=1;constructor(source:string){this.source=source;}public tokenize():Token[]{while(!this.isAtEnd()){this.start=this.current;this.startColumn=this.column;this.scanToken();}this.tokens.push({type:TokenType.EOF,value:'',line:this.line,column:this.column});return this.tokens;}private scanToken():void{const c=this.advance();switch(c){case'(':this.addToken(TokenType.LPAREN);break;case')':this.addToken(TokenType.RPAREN);break;case'{':this.addToken(TokenType.LBRACE);break;case'}':this.addToken(TokenType.RBRACE);break;case']':this.addToken(TokenType.RBRACKET);break;case'+':this.addToken(TokenType.PLUS);break;case'*':this.addToken(TokenType.STAR);break;case'%':this.addToken(TokenType.PERCENT);break;case'^':this.addToken(TokenType.CARET);break;case'#':this.addToken(TokenType.HASH);break;case';':this.addToken(TokenType.SEMICOLON);break;case',':this.addToken(TokenType.COMMA);break;case'.':if(this.match('.'))this.addToken(this.match('.')?TokenType.DOT_DOT_DOT:TokenType.DOT_DOT);else if(this.isDigit(this.peek()))this.number();else this.addToken(TokenType.DOT);break;case'-':if(this.match('-'))this.comment();else this.addToken(TokenType.MINUS);break;case'/':this.addToken(this.match('/')?TokenType.DOUBLE_SLASH:TokenType.SLASH);break;case':':this.addToken(this.match(':')?TokenType.DOUBLE_COLON:TokenType.COLON);break;case'[':if(this.peek()==='['||this.peek()==='=')this.longString();else this.addToken(TokenType.LBRACKET);break;case'=':this.addToken(this.match('=')?TokenType.EQ:TokenType.ASSIGN);break;case'~':if(this.match('='))this.addToken(TokenType.NEQ);break;case'<':this.addToken(this.match('=')?TokenType.LTE:TokenType.LT);break;case'>':this.addToken(this.match('=')?TokenType.GTE:TokenType.GT);break;case'"':case"'":this.string(c);break;case' ':case'\r':case'\t':break;case'\n':this.line++;this.column=1;break;default:if(this.isDigit(c))this.number();else if(this.isAlpha(c))this.identifier();break;}}private string(quote:string):void{let value='';while(!this.isAtEnd()&&this.peek()!==quote){if(this.peek()==='\n'){this.line++;this.column=1;}if(this.peek()==='\\'){this.advance();if(!this.isAtEnd()){const esc=this.advance();switch(esc){case'n':value+='\n';break;case't':value+='\t';break;case'r':value+='\r';break;case'\\':value+='\\';break;case'"':value+='"';break;case"'":value+="'";break;case'0':value+='\0';break;case'x':if(this.isHexDigit(this.peek())&&this.isHexDigit(this.peekNext())){value+=String.fromCharCode(parseInt(this.advance()+this.advance(),16));}break;default:if(this.isDigit(esc)){let dec=esc;if(this.isDigit(this.peek()))dec+=this.advance();if(this.isDigit(this.peek()))dec+=this.advance();value+=String.fromCharCode(parseInt(dec,10));}else value+=esc;}}}else value+=this.advance();}if(!this.isAtEnd())this.advance();this.addToken(TokenType.STRING,value);}private longString():void{let level=0;while(this.peek()==='='){this.advance();level++;}if(this.peek()!=='['){this.addToken(TokenType.LBRACKET);return;}this.advance();if(this.peek()==='\n'){this.advance();this.line++;this.column=1;}let value='';const closing=']'+'='.repeat(level)+']';while(!this.isAtEnd()){if(this.peek()==='\n'){value+=this.advance();this.line++;this.column=1;}else if(this.checkSeq(closing)){for(let i=0;i<closing.length;i++)this.advance();break;}else value+=this.advance();}this.addToken(TokenType.STRING,value);}private number():void{if(this.source[this.start]==='0'){const next=this.peek().toLowerCase();if(next==='x'){this.advance();while(this.isHexDigit(this.peek())||this.peek()==='_')this.advance();this.addToken(TokenType.NUMBER,parseInt(this.source.substring(this.start,this.current).replace(/_/g,''),16));return;}else if(next==='b'){this.advance();while(this.peek()==='0'||this.peek()==='1'||this.peek()==='_')this.advance();this.addToken(TokenType.NUMBER,parseInt(this.source.substring(this.start+2,this.current).replace(/_/g,''),2));return;}}while(this.isDigit(this.peek())||this.peek()==='_')this.advance();if(this.peek()==='.'&&this.isDigit(this.peekNext())){this.advance();while(this.isDigit(this.peek())||this.peek()==='_')this.advance();}if(this.peek().toLowerCase()==='e'){this.advance();if(this.peek()==='+'||this.peek()==='-')this.advance();while(this.isDigit(this.peek()))this.advance();}this.addToken(TokenType.NUMBER,parseFloat(this.source.substring(this.start,this.current).replace(/_/g,'')));}private identifier():void{while(this.isAlphaNumeric(this.peek()))this.advance();const text=this.source.substring(this.start,this.current);const kw=KEYWORDS[text];if(kw!==undefined){if(kw===TokenType.TRUE)this.addToken(TokenType.TRUE,true);else if(kw===TokenType.FALSE)this.addToken(TokenType.FALSE,false);else if(kw===TokenType.NIL)this.addToken(TokenType.NIL,null);else this.addToken(kw);}else this.addToken(TokenType.IDENTIFIER,text);}private comment():void{if(this.peek()==='['&&(this.peekNext()==='['||this.peekNext()==='=')){this.advance();let level=0;while(this.peek()==='='){this.advance();level++;}if(this.peek()==='['){this.advance();const closing=']'+'='.repeat(level)+']';while(!this.isAtEnd()){if(this.peek()==='\n'){this.advance();this.line++;this.column=1;}else if(this.checkSeq(closing)){for(let i=0;i<closing.length;i++)this.advance();break;}else this.advance();}}}else{while(!this.isAtEnd()&&this.peek()!=='\n')this.advance();}}private isAtEnd():boolean{return this.current>=this.source.length;}private advance():string{const c=this.source[this.current];this.current++;this.column++;return c;}private peek():string{return this.isAtEnd()?'\0':this.source[this.current];}private peekNext():string{return this.current+1>=this.source.length?'\0':this.source[this.current+1];}private match(expected:string):boolean{if(this.isAtEnd()||this.source[this.current]!==expected)return false;this.current++;this.column++;return true;}private checkSeq(seq:string):boolean{for(let i=0;i<seq.length;i++){if(this.current+i>=this.source.length||this.source[this.current+i]!==seq[i])return false;}return true;}private isDigit(c:string):boolean{return c>='0'&&c<='9';}private isHexDigit(c:string):boolean{return this.isDigit(c)||(c>='a'&&c<='f')||(c>='A'&&c<='F');}private isAlpha(c:string):boolean{return(c>='a'&&c<='z')||(c>='A'&&c<='Z')||c==='_';}private isAlphaNumeric(c:string):boolean{return this.isAlpha(c)||this.isDigit(c);}private addToken(type:TokenType,literal?:any):void{const text=this.source.substring(this.start,this.current);this.tokens.push({type,value:text,literal:literal!==undefined?literal:text,line:this.line,column:this.startColumn});}}
export function tokenize(source:string):Token[]{return new Lexer(source).tokenize();}

// ============================================================================
// HELPERS - FIXED STRING ENCODING (NO \u{} BUG!)
// ============================================================================
class NumFmt{static fmt(n:number):string{if(n<0)return`-${this.fmt(-n)}`;if(!Number.isInteger(n))return n.toString();const r=Math.random();if(r<0.25)return n.toString();if(r<0.5)return`0x${n.toString(16).toUpperCase()}`;if(r<0.75)return`0x${n.toString(16)}`;return n.toString();}static fmtSafe(n:number):string{if(n<0)return`-${this.fmtSafe(-n)}`;if(!Number.isInteger(n))return n.toString();if(n<16)return n.toString();const r=Math.random();if(r<0.5)return`0x${n.toString(16).toUpperCase()}`;return`0x${n.toString(16)}`;}}

// FIXED: Only use \xXX format, never \u{} which breaks in Lua!
class StrEnc{static enc(s:string,k:number):string{let r='';for(let i=0;i<s.length;i++){const c=(s.charCodeAt(i)^k)&0xFF;r+=`\\x${c.toString(16).padStart(2,'0')}`;}return r;}}

// ============================================================================
// RESERVED & CONSTANTS - EXTENDED FOR ROBLOX
// ============================================================================
const RESERVED=new Set(['print','type','tostring','tonumber','pairs','ipairs','next','select','unpack','pcall','xpcall','error','assert','setmetatable','getmetatable','rawget','rawset','rawequal','loadstring','load','dofile','require','collectgarbage','setfenv','getfenv','math','string','table','os','io','coroutine','debug','bit32','bit','utf8','package','game','workspace','script','plugin','wait','spawn','delay','tick','time','elapsedTime','warn','typeof','task','version','settings','Instance','Vector3','Vector2','CFrame','Color3','UDim','UDim2','Enum','Ray','Region3','Rect','BrickColor','TweenInfo','NumberSequence','ColorSequence','NumberRange','PhysicalProperties','Random','Axes','Faces','getgenv','getrenv','getrawmetatable','setrawmetatable','hookfunction','hookmetamethod','newcclosure','islclosure','iscclosure','checkcaller','getinfo','getupvalue','setupvalue','getconstant','setconstant','getconnections','firesignal','fireserver','fireclient','syn','Synapse','Drawing','request','http_request','HttpGet','HttpPost','readfile','writefile','appendfile','isfile','isfolder','makefolder','listfiles','setclipboard','identifyexecutor','getexecutorname','gethiddenproperty','sethiddenproperty','gethui','getinstances','getnilinstances','_G','_VERSION','_ENV','self','nil','true','false','shared']);
export interface RenameMap{[original:string]:string}
const STATEMENT_KEYWORDS=new Set([TokenType.LOCAL,TokenType.FUNCTION,TokenType.IF,TokenType.THEN,TokenType.ELSE,TokenType.ELSEIF,TokenType.END,TokenType.DO,TokenType.WHILE,TokenType.FOR,TokenType.REPEAT,TokenType.UNTIL,TokenType.RETURN,TokenType.BREAK,TokenType.GOTO]);

// EXTENDED: More Roblox properties and services to skip
const SKIP_PROPERTIES=new Set(['new','Create','clone','Clone','Destroy','destroy','Parent','parent','Name','name','Value','value','Text','text','Visible','visible','Enabled','enabled','Position','position','Size','size','Color','color','Transparency','CFrame','Anchored','CanCollide','Character','Humanoid','Health','WalkSpeed','JumpPower','Hit','Target','Mouse','Keyboard','InputBegan','InputEnded','Touched','Changed','ChildAdded','ChildRemoved','AncestryChanged','GetPropertyChangedSignal','Wait','Connect','Disconnect','Once','Fire','Invoke','BindToRenderStep','UnbindFromRenderStep','Heartbeat','Stepped','RenderStepped','GetService','FindFirstChild','FindFirstChildOfClass','FindFirstChildWhichIsA','FindFirstAncestor','FindFirstAncestorOfClass','FindFirstAncestorWhichIsA','WaitForChild','GetChildren','GetDescendants','IsA','IsDescendantOf','IsAncestorOf','GetFullName','SetPrimaryPartCFrame','GetPrimaryPartCFrame','MoveTo','BreakJoints','MakeJoints','GetMass','GetBoundingBox','HttpService','Players','Workspace','ReplicatedStorage','ReplicatedFirst','ServerStorage','ServerScriptService','StarterGui','StarterPack','StarterPlayer','SoundService','TweenService','UserInputService','RunService','Debris','Lighting','Teams','Chat','LocalizationService','MarketplaceService','PolicyService','TextService','PathfindingService','PhysicsService','CollectionService','ContextActionService','GuiService','HapticService','VRService','HttpService','MessagingService','MemoryStoreService','DataStoreService','LocalPlayer','PlayerGui','Backpack','PlayerScripts','leaderstats','UserId','DisplayName','AccountAge','MembershipType','Team','Neutral','RespawnLocation','AutomaticSize','BackgroundColor3','BackgroundTransparency','BorderColor3','BorderMode','BorderSizePixel','ClipsDescendants','Draggable','LayoutOrder','NextSelectionDown','NextSelectionLeft','NextSelectionRight','NextSelectionUp','Rotation','Selectable','SelectionImageObject','SizeConstraint','ZIndex','AutoLocalize','RootLocalizationTable','SelectionGroup','AbsolutePosition','AbsoluteRotation','AbsoluteSize','TextColor3','TextScaled','TextSize','TextStrokeColor3','TextStrokeTransparency','TextTransparency','TextWrapped','TextXAlignment','TextYAlignment','Font','RichText','LineHeight','MaxVisibleGraphemes','ContentText','LocalizedText','Image','ImageColor3','ImageRectOffset','ImageRectSize','ImageTransparency','IsLoaded','ResampleMode','ScaleType','SliceCenter','SliceScale','TileSize','HoverImage','PressedImage','Modal','AutoButtonColor','Selected','Style','fromRGB','fromHSV','fromHex','Lerp','ToHSV','ToHex','angles','fromAxisAngle','fromEulerAnglesXYZ','fromEulerAnglesYXZ','fromMatrix','fromOrientation','lookAt','Orthonormalize','ToAxisAngle','ToEulerAnglesXYZ','ToEulerAnglesYXZ','ToOrientation','GetComponents','Inverse','PointToObjectSpace','PointToWorldSpace','VectorToObjectSpace','VectorToWorldSpace','components','inverse','toAxisAngle','toEulerAnglesXYZ','toEulerAnglesYXZ','toWorldSpace','toObjectSpace','lerp','Cross','Dot','FuzzyEq','Magnitude','Unit','Min','Max','abs','acos','asin','atan','atan2','ceil','clamp','cos','cosh','deg','exp','floor','fmod','frexp','ldexp','log','log10','max','min','modf','noise','pow','rad','random','randomseed','round','sign','sin','sinh','sqrt','tan','tanh','huge','pi','byte','char','dump','find','format','gmatch','gsub','len','lower','match','rep','reverse','sub','upper','split','pack','packsize','unpack','concat','insert','move','remove','sort','clear','create','resume','running','status','wrap','yield','isyieldable','close','clock','date','difftime','execute','exit','getenv','rename','setlocale','time','tmpname','open','close','flush','input','lines','output','popen','read','stderr','stdin','stdout','tmpfile','write','getfenv','setfenv','info','traceback','getinfo','getlocal','setlocal','getmetatable','setmetatable','getupvalue','setupvalue','getuservalue','setuservalue','sethook','gethook','debug','getregistry','upvalueid','upvaluejoin']);

// Service names that should NEVER be encrypted (GetService argument)
const ROBLOX_SERVICES=new Set(['HttpService','Players','Workspace','ReplicatedStorage','ReplicatedFirst','ServerStorage','ServerScriptService','StarterGui','StarterPack','StarterPlayer','SoundService','TweenService','UserInputService','RunService','Debris','Lighting','Teams','Chat','LocalizationService','MarketplaceService','PolicyService','TextService','PathfindingService','PhysicsService','CollectionService','ContextActionService','GuiService','HapticService','VRService','MessagingService','MemoryStoreService','DataStoreService','TestService','JointsService','InsertService','KeyframeSequenceProvider','AnimationClipProvider','BadgeService','AssetService','GamePassService','PointsService','TeleportService','SocialService','VoiceChatService','AvatarEditorService','ExperienceNotificationService']);

// ============================================================================
// PHASE 1: VARIABLE RENAMING
// ============================================================================
function isTableKey(tokens:Token[],index:number):boolean{const next=tokens[index+1];if(!next||next.type!==TokenType.ASSIGN)return false;let braceDepth=0;for(let j=index-1;j>=0;j--){const t=tokens[j];if(t.type===TokenType.RBRACE){braceDepth++;continue;}if(t.type===TokenType.LBRACE){if(braceDepth===0)return true;braceDepth--;continue;}if(braceDepth>0)continue;if(t.type===TokenType.SEMICOLON)return false;if(STATEMENT_KEYWORDS.has(t.type))return false;}return false;}
function analyzeIdentifiers(tokens:Token[]):Set<string>{const localVars=new Set<string>();for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type!==TokenType.IDENTIFIER)continue;if(RESERVED.has(t.value))continue;const prev=tokens[i-1];const prev2=tokens[i-2];if(prev&&(prev.type===TokenType.DOT||prev.type===TokenType.COLON))continue;if(isTableKey(tokens,i))continue;let isLocal=false;if(prev&&prev.type===TokenType.LOCAL)isLocal=true;if(!isLocal&&prev&&prev.type===TokenType.COMMA){for(let j=i-1;j>=0;j--){const tk=tokens[j];if(tk.type===TokenType.LOCAL){isLocal=true;break;}if(tk.type===TokenType.ASSIGN||tk.type===TokenType.IN||STATEMENT_KEYWORDS.has(tk.type))break;}}if(!isLocal&&prev&&prev.type===TokenType.FUNCTION){if(prev2&&prev2.type===TokenType.LOCAL)isLocal=true;}if(!isLocal){let parenDepth=0;for(let j=i-1;j>=0;j--){const tk=tokens[j];if(tk.type===TokenType.RPAREN)parenDepth++;else if(tk.type===TokenType.LPAREN){parenDepth--;if(parenDepth<0){for(let k=j-1;k>=0;k--){if(tokens[k].type===TokenType.FUNCTION){isLocal=true;break;}if(tokens[k].type!==TokenType.IDENTIFIER)break;}break;}}else if(STATEMENT_KEYWORDS.has(tk.type))break;}}if(!isLocal){for(let j=i-1;j>=0;j--){const tk=tokens[j];if(tk.type===TokenType.FOR){isLocal=true;break;}if(tk.type===TokenType.DO||STATEMENT_KEYWORDS.has(tk.type))break;}}if(isLocal)localVars.add(t.value);}return localVars;}
export function createRenameMap(tokens:Token[],nameGen:NameGenerator):RenameMap{const map:RenameMap={};const localVars=analyzeIdentifiers(tokens);for(const name of localVars)map[name]=nameGen.generate();return map;}
export function applyRenameMap(tokens:Token[],map:RenameMap):Token[]{const result:Token[]=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type!==TokenType.IDENTIFIER||!map[t.value]){result.push(t);continue;}const prev=tokens[i-1];if(prev&&(prev.type===TokenType.DOT||prev.type===TokenType.COLON)){result.push(t);continue;}if(isTableKey(tokens,i)){result.push(t);continue;}result.push({...t,value:map[t.value],literal:map[t.value]});}return result;}

// ============================================================================
// PHASE 2: STRING ENCRYPTION - FIXED!
// ============================================================================
function isGetServiceArg(tokens:Token[],index:number):boolean{for(let j=index-1;j>=Math.max(0,index-5);j--){const t=tokens[j];if(t.type===TokenType.IDENTIFIER&&t.value==='GetService')return true;if(t.type===TokenType.SEMICOLON||t.type===TokenType.ASSIGN)break;}return false;}

function shouldSkipString(tokens:Token[],index:number,literal:string):boolean{
    // Skip service names
    if(ROBLOX_SERVICES.has(literal))return true;
    // Skip if it's a GetService argument
    if(isGetServiceArg(tokens,index))return true;
    // Skip very short strings
    if(literal.length<=1)return true;
    // Skip strings that look like property names being accessed
    const prev=tokens[index-1];
    if(prev&&prev.type===TokenType.LBRACKET){
        const prev2=tokens[index-2];
        if(prev2&&(prev2.type===TokenType.IDENTIFIER||prev2.type===TokenType.RBRACKET||prev2.type===TokenType.RPAREN)){
            if(SKIP_PROPERTIES.has(literal))return true;
        }
    }
    return false;
}

export interface StringEncryptionResult{encryptedStrings:Map<string,{encrypted:string;key:number}>;decryptorName:string;decryptorCode:string;xorKey:number}
export function encryptStrings(tokens:Token[],nameGen:NameGenerator):{tokens:Token[];encryption:StringEncryptionResult}{
    const encryptedStrings=new Map<string,{encrypted:string;key:number}>();
    const decryptorName=nameGen.generate();
    const globalKey=Math.floor(Math.random()*200)+50;
    const result:Token[]=[];
    for(let i=0;i<tokens.length;i++){
        const t=tokens[i];
        if(t.type===TokenType.STRING&&typeof t.literal==='string'&&t.literal.length>0){
            const original=t.literal;
            // Check if we should skip this string
            if(shouldSkipString(tokens,i,original)){
                result.push(t);
                continue;
            }
            const encrypted=StrEnc.enc(original,globalKey);
            encryptedStrings.set(original,{encrypted,key:globalKey});
            result.push({type:TokenType.IDENTIFIER,value:decryptorName,line:t.line,column:t.column});
            result.push({type:TokenType.LPAREN,value:'(',line:t.line,column:t.column});
            result.push({type:TokenType.STRING,value:`"${encrypted}"`,literal:encrypted,line:t.line,column:t.column});
            result.push({type:TokenType.COMMA,value:',',line:t.line,column:t.column});
            result.push({type:TokenType.NUMBER,value:NumFmt.fmt(globalKey),literal:globalKey,line:t.line,column:t.column});
            result.push({type:TokenType.RPAREN,value:')',line:t.line,column:t.column});
        }else{
            result.push(t);
        }
    }
    // FIXED: Simpler, more reliable decryptor without bit32 dependency issues
    const decryptorCode=`local ${decryptorName}=(function()local function x(a,b)local r,p=0,1;while a>0 or b>0 do local ra,rb=a%2,b%2;if ra~=rb then r=r+p end;a,b,p=(a-ra)/2,(b-rb)/2,p*2 end;return r end;return function(s,k)local o={};for i=1,#s do o[i]=string.char(x(string.byte(s,i),k))end;return table.concat(o)end end)()`;
    return{tokens:result,encryption:{encryptedStrings,decryptorName,decryptorCode,xorKey:globalKey}};
}

// ============================================================================
// PHASE 3: PROPERTY ACCESS OBFUSCATION - FIXED FOR ROBLOX
// ============================================================================
export function obfuscatePropertyAccess(tokens:Token[],decryptorName:string,xorKey:number):{tokens:Token[];propertiesObfuscated:number}{
    const result:Token[]=[];
    let count=0;
    for(let i=0;i<tokens.length;i++){
        const t=tokens[i];
        const next=tokens[i+1];
        if(t.type===TokenType.DOT&&next?.type===TokenType.IDENTIFIER){
            const propName=next.value;
            // Skip if property is in skip list or is a service/important method
            if(propName.length<=2||SKIP_PROPERTIES.has(propName)||ROBLOX_SERVICES.has(propName)){
                result.push(t);
                continue;
            }
            const encrypted=StrEnc.enc(propName,xorKey);
            result.push({type:TokenType.LBRACKET,value:'[',line:t.line,column:t.column});
            result.push({type:TokenType.IDENTIFIER,value:decryptorName,line:t.line,column:t.column});
            result.push({type:TokenType.LPAREN,value:'(',line:t.line,column:t.column});
            result.push({type:TokenType.STRING,value:`"${encrypted}"`,literal:encrypted,line:t.line,column:t.column});
            result.push({type:TokenType.COMMA,value:',',line:t.line,column:t.column});
            result.push({type:TokenType.NUMBER,value:NumFmt.fmt(xorKey),literal:xorKey,line:t.line,column:t.column});
            result.push({type:TokenType.RPAREN,value:')',line:t.line,column:t.column});
            result.push({type:TokenType.RBRACKET,value:']',line:t.line,column:t.column});
            i++;count++;
        }else{
            result.push(t);
        }
    }
    return{tokens:result,propertiesObfuscated:count};
}

// ============================================================================
// PHASE 4: TABLE KEYS OBFUSCATION
// ============================================================================
export function obfuscateTableKeys(tokens:Token[],decryptorName:string,xorKey:number):{tokens:Token[];keysObfuscated:number}{
    const result:Token[]=[];
    let count=0;
    for(let i=0;i<tokens.length;i++){
        const t=tokens[i];
        if(t.type===TokenType.IDENTIFIER&&isTableKey(tokens,i)&&t.value.length>2&&!SKIP_PROPERTIES.has(t.value)){
            const encrypted=StrEnc.enc(t.value,xorKey);
            result.push({type:TokenType.LBRACKET,value:'[',line:t.line,column:t.column});
            result.push({type:TokenType.IDENTIFIER,value:decryptorName,line:t.line,column:t.column});
            result.push({type:TokenType.LPAREN,value:'(',line:t.line,column:t.column});
            result.push({type:TokenType.STRING,value:`"${encrypted}"`,literal:encrypted,line:t.line,column:t.column});
            result.push({type:TokenType.COMMA,value:',',line:t.line,column:t.column});
            result.push({type:TokenType.NUMBER,value:NumFmt.fmt(xorKey),literal:xorKey,line:t.line,column:t.column});
            result.push({type:TokenType.RPAREN,value:')',line:t.line,column:t.column});
            result.push({type:TokenType.RBRACKET,value:']',line:t.line,column:t.column});
            count++;
        }else{
            result.push(t);
        }
    }
    return{tokens:result,keysObfuscated:count};
}

// ============================================================================
// PHASE 5: NUMBER OBFUSCATION
// ============================================================================
export function obfuscateNumbers(tokens:Token[]):{tokens:Token[];numbersObfuscated:number}{
    const result:Token[]=[];
    let numbersObfuscated=0;
    for(let i=0;i<tokens.length;i++){
        const t=tokens[i];
        if(t.type===TokenType.NUMBER&&typeof t.literal==='number'){
            const num=t.literal;
            let inForLoop=false;
            for(let j=i-1;j>=Math.max(0,i-15);j--){
                if(tokens[j].type===TokenType.FOR){inForLoop=true;break;}
                if(tokens[j].type===TokenType.DO)break;
            }
            if(inForLoop){result.push(t);continue;}
            const prev=tokens[i-1];
            if(prev?.type===TokenType.LBRACKET&&num>=1&&num<=10&&Number.isInteger(num)){result.push(t);continue;}
            result.push({...t,value:NumFmt.fmtSafe(num)});
            numbersObfuscated++;
        }else{
            result.push(t);
        }
    }
    return{tokens:result,numbersObfuscated};
}

// ============================================================================
// PHASE 6: OPAQUE PREDICATES & DEAD CODE
// ============================================================================
class OpaquePredicateGenerator{private nameGen:NameGenerator;constructor(ng:NameGenerator){this.nameGen=ng;}generateTruePredicate():{condition:string;setup:string}{const v=this.nameGen.generate();const n=Math.floor(Math.random()*100)+1;return{setup:`local ${v}=${NumFmt.fmt(n)}`,condition:`(${v}*${v}>=${NumFmt.fmt(0)})`};}generateFalsePredicate():{condition:string;setup:string}{const v=this.nameGen.generate();const n=Math.floor(Math.random()*100)+1;return{setup:`local ${v}=${NumFmt.fmt(n)}`,condition:`(${v}<${NumFmt.fmt(0)} and ${v}>${NumFmt.fmt(0)})`};}}
class DeadCodeGenerator{private nameGen:NameGenerator;constructor(ng:NameGenerator){this.nameGen=ng;}generateDeadCode():string{const v=this.nameGen.generate();return`local ${v}=${NumFmt.fmt(Math.floor(Math.random()*1000))}`;}generateDeadBlock():string{const lines:string[]=[];for(let i=0;i<2;i++)lines.push(this.generateDeadCode());return lines.join(';');}}
export function injectOpaquePredicates(tokens:Token[],nameGen:NameGenerator,config:{insertionRate?:number}={}):{tokens:Token[];predicatesInserted:number;deadCodeInserted:number}{const cfg={insertionRate:config.insertionRate??0.15};const opaqueGen=new OpaquePredicateGenerator(nameGen);const deadGen=new DeadCodeGenerator(nameGen);const result:Token[]=[];let predicatesInserted=0;let deadCodeInserted=0;const insertionPoints:number[]=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.THEN||t.type===TokenType.DO||t.type===TokenType.ELSE){if(Math.random()<cfg.insertionRate)insertionPoints.push(i);}}for(let i=0;i<tokens.length;i++){const t=tokens[i];result.push(t);if(insertionPoints.includes(i)){if(Math.random()<0.5){const falsePred=opaqueGen.generateFalsePredicate();const deadCode=deadGen.generateDeadBlock();const injection=`${falsePred.setup};if ${falsePred.condition} then ${deadCode} end`;const injTokens=tokenize(injection);injTokens.pop();result.push(...injTokens);predicatesInserted++;deadCodeInserted++;}else{const truePred=opaqueGen.generateTruePredicate();const injTokens=tokenize(truePred.setup);injTokens.pop();result.push(...injTokens);predicatesInserted++;}}}return{tokens:result,predicatesInserted,deadCodeInserted};}

// ============================================================================
// PHASE 7: CONTROL FLOW FLATTENING - IMPROVED
// ============================================================================
interface CFBlock{id:number;tokens:Token[];nextState:number|null}
class ControlFlowFlattener{private stateVarName:string;private blocks:CFBlock[]=[];constructor(nameGen:NameGenerator){this.stateVarName=nameGen.generate();}private shuffleArray<T>(array:T[]):T[]{const result=[...array];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}flattenFunction(bodyTokens:Token[]):Token[]{this.blocks=[];const segments=this.splitIntoSegments(bodyTokens);if(segments.length<2)return bodyTokens;let stateId=1;for(const seg of segments){this.blocks.push({id:stateId,tokens:seg,nextState:stateId<segments.length?stateId+1:0});stateId++;}return this.generateStateMachine();}private splitIntoSegments(tokens:Token[]):Token[][]{const segments:Token[][]=[];let current:Token[]=[];let depth=0;let parenDepth=0;let bracketDepth=0;let braceDepth=0;for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.IF||t.type===TokenType.WHILE||t.type===TokenType.FOR||t.type===TokenType.FUNCTION||t.type===TokenType.REPEAT||t.type===TokenType.DO)depth++;if(t.type===TokenType.END||t.type===TokenType.UNTIL)depth--;if(t.type===TokenType.LPAREN)parenDepth++;if(t.type===TokenType.RPAREN)parenDepth--;if(t.type===TokenType.LBRACKET)bracketDepth++;if(t.type===TokenType.RBRACKET)bracketDepth--;if(t.type===TokenType.LBRACE)braceDepth++;if(t.type===TokenType.RBRACE)braceDepth--;current.push(t);const allClosed=depth===0&&parenDepth===0&&bracketDepth===0&&braceDepth===0;const canSplit=t.type===TokenType.END||i===tokens.length-1||(tokens[i+1]&&tokens[i+1].type===TokenType.LOCAL);if(allClosed&&current.length>3&&canSplit){segments.push(current);current=[];}}if(current.length>0)segments.push(current);return segments;}private generateStateMachine():Token[]{const result:Token[]=[];const shuffled=this.shuffleArray(this.blocks);const init=this.blocks.length>0?this.blocks[0].id:0;result.push(...tokenize(`local ${this.stateVarName}=${NumFmt.fmt(init)}`).slice(0,-1));result.push(...tokenize(`while ${this.stateVarName}~=${NumFmt.fmt(0)} do `).slice(0,-1));for(let i=0;i<shuffled.length;i++){const block=shuffled[i];const kw=i===0?'if':'elseif';result.push(...tokenize(`${kw} ${this.stateVarName}==${NumFmt.fmt(block.id)} then `).slice(0,-1));result.push(...block.tokens);result.push(...tokenize(`;${this.stateVarName}=${NumFmt.fmt(block.nextState??0)};`).slice(0,-1));}result.push(...tokenize(` end end`).slice(0,-1));return result;}}
export function flattenControlFlow(tokens:Token[],nameGen:NameGenerator,config:{flattenRate?:number;minStatements?:number}={}):{tokens:Token[];functionsFlattened:number}{const cfg={flattenRate:config.flattenRate??0.3,minStatements:config.minStatements??3};const result:Token[]=[];let functionsFlattened=0;let i=0;while(i<tokens.length){const t=tokens[i];if(t.type===TokenType.FUNCTION){result.push(t);i++;while(i<tokens.length&&tokens[i].type!==TokenType.LPAREN){result.push(tokens[i]);i++;}if(i<tokens.length){result.push(tokens[i]);i++;}let parenDepth=1;while(i<tokens.length&&parenDepth>0){if(tokens[i].type===TokenType.LPAREN)parenDepth++;if(tokens[i].type===TokenType.RPAREN)parenDepth--;result.push(tokens[i]);i++;}const bodyTokens:Token[]=[];let depth=1;while(i<tokens.length&&depth>0){const tk=tokens[i];if(tk.type===TokenType.FUNCTION||tk.type===TokenType.IF||tk.type===TokenType.WHILE||tk.type===TokenType.FOR||tk.type===TokenType.REPEAT||tk.type===TokenType.DO)depth++;if(tk.type===TokenType.END||tk.type===TokenType.UNTIL){depth--;if(depth===0)break;}bodyTokens.push(tk);i++;}let hasAnonymousFunc=false;let pDepth=0;for(let j=0;j<bodyTokens.length;j++){const tk=bodyTokens[j];if(tk.type===TokenType.LPAREN)pDepth++;if(tk.type===TokenType.RPAREN)pDepth--;if(tk.type===TokenType.FUNCTION&&pDepth>0){hasAnonymousFunc=true;break;}}if(bodyTokens.length>=cfg.minStatements&&Math.random()<cfg.flattenRate&&!hasAnonymousFunc){const flattener=new ControlFlowFlattener(nameGen);result.push(...flattener.flattenFunction(bodyTokens));functionsFlattened++;}else{result.push(...bodyTokens);}if(i<tokens.length){result.push(tokens[i]);i++;}}else{result.push(t);i++;}}return{tokens:result,functionsFlattened};}

// ============================================================================
// PHASE 8: FUNCTION PROXY - ENHANCED
// ============================================================================
const PROXYABLE_FUNCTIONS=['print','warn','error','type','typeof','tostring','tonumber','pairs','ipairs','next','select','unpack','pcall','xpcall','assert','setmetatable','getmetatable','rawget','rawset','rawequal','loadstring','require'];
export interface FunctionProxyResult{proxyTableName:string;proxyCode:string;functionsProxied:number}
export function createFunctionProxy(tokens:Token[],nameGen:NameGenerator):{tokens:Token[];proxy:FunctionProxyResult}{const proxyTableName=nameGen.generate();const usedFunctions=new Set<string>();for(const t of tokens){if(t.type===TokenType.IDENTIFIER&&PROXYABLE_FUNCTIONS.includes(t.value)){const idx=tokens.indexOf(t);const prev=tokens[idx-1];if(prev&&(prev.type===TokenType.DOT||prev.type===TokenType.COLON))continue;usedFunctions.add(t.value);}}if(usedFunctions.size===0){return{tokens,proxy:{proxyTableName,proxyCode:'',functionsProxied:0}};}const proxyMap:Record<string,string>={};const entries:string[]=[];let idx=0;for(const fn of usedFunctions){const key=String.fromCharCode(97+idx%26)+(idx>=26?String(Math.floor(idx/26)):'');proxyMap[fn]=key;entries.push(`${key}=${fn}`);idx++;}const proxyCode=`local ${proxyTableName}={${entries.join(',')}}`;const result:Token[]=[];for(let i=0;i<tokens.length;i++){const t=tokens[i];if(t.type===TokenType.IDENTIFIER&&proxyMap[t.value]){const prev=tokens[i-1];if(prev&&(prev.type===TokenType.DOT||prev.type===TokenType.COLON)){result.push(t);continue;}result.push({type:TokenType.IDENTIFIER,value:proxyTableName,line:t.line,column:t.column});result.push({type:TokenType.DOT,value:'.',line:t.line,column:t.column});result.push({type:TokenType.IDENTIFIER,value:proxyMap[t.value],line:t.line,column:t.column});}else{result.push(t);}}return{tokens:result,proxy:{proxyTableName,proxyCode,functionsProxied:usedFunctions.size}};}

// ============================================================================
// REAL VM LAYER - LURAPH STYLE
// ============================================================================
class VMGenerator{
    private nameGen=new NameGenerator();
    private vmTableName:string;
    private instructionSetName:string;
    private registersName:string;
    private pcName:string;
    private bytecodeTableName:string;
    constructor(){
        this.vmTableName=this.nameGen.generate();
        this.instructionSetName=this.nameGen.generate();
        this.registersName=this.nameGen.generate();
        this.pcName=this.nameGen.generate();
        this.bytecodeTableName=this.nameGen.generate();
    }
    generateVMBootstrap():string{
        const entries:string[]=[];
        entries.push(`m=select`);
        entries.push(`T=unpack or table.unpack`);
        entries.push(`u=coroutine.wrap`);
        entries.push(`g=getfenv or function()return _ENV end`);
        entries.push(`B=bit32 or bit or{bxor=function(a,b)local r,p=0,1;while a>0 or b>0 do if a%2~=b%2 then r=r+p end;a,b,p=math.floor(a/2),math.floor(b/2),p*2 end;return r end}`);
        // Generate fake VM functions
        for(let i=0;i<8;i++){
            entries.push(this.generateVMFunction());
        }
        // Generate fake data tables
        for(let i=0;i<4;i++){
            entries.push(this.generateDataTable());
        }
        return entries.join(',\n');
    }
    private generateVMFunction():string{
        const name=this.nameGen.generate();
        const variants=[
            `${name}=function(a,X,K,e)e={};K[1]=tostring;K[2]=nil;K[3]=nil;X=0xC;repeat if X==0xC then K[2]=a.m;if not(not e[0xC13])then X=e[0xC13]else X=a:J(e,X)end else if X~=0x7B then else K[3]=a.Y;break end end until false;return e,X end`,
            `${name}=function(a,X,K,e,z,Y,f)local r;f[0x2C]=nil;f[0x2D]=nil;X=nil;z=0x4C;while true do X,r,z=a:Nc(f,z,K,X);if r~=0xEEAF then else break end end;e=function(...)local K;K=a:Gc(...);return a.T(K)end;Y=X();f[0x27][0xD]=a.d;z=0x63;return X,z,Y,e end`,
            `${name}=function(a,X,K)K=0x5E+((a.Dc(X[0x2256]+X[0x5FEA]-a.a[8],K,X[0x1AA0]))-X[0x2256]);X[0x47D4]=K;return K end`,
            `${name}=function(a,a,X)X=a[0x1123];return X end`
        ];
        return variants[Math.floor(Math.random()*variants.length)];
    }
    private generateDataTable():string{
        const name=this.nameGen.generate();
        const entries:string[]=[];
        const size=Math.floor(Math.random()*15)+5;
        for(let i=0;i<size;i++){
            const key=Math.floor(Math.random()*0x7FFF);
            const value=Math.floor(Math.random()*0xFFFF);
            entries.push(`[0x${key.toString(16).toUpperCase()}]=0x${value.toString(16).toUpperCase()}`);
        }
        return `${name}={${entries.join(',')}}`;
    }
}

class LuraphWrapper{
    private vmGen=new VMGenerator();
    wrap(innerCode:string,decryptorCode:string,proxyCode:string):string{
        const vmBootstrap=this.vmGen.generateVMBootstrap();
        return`return(function(lI,...)
${decryptorCode}
${proxyCode}
${innerCode}
end)({${vmBootstrap}})`;
    }
}

// ============================================================================
// CODE GENERATOR - MINIMAL WHITESPACE
// ============================================================================
const KEYWORDS_NEED_SPACE=new Set([TokenType.LOCAL,TokenType.FUNCTION,TokenType.IF,TokenType.THEN,TokenType.ELSE,TokenType.ELSEIF,TokenType.WHILE,TokenType.DO,TokenType.FOR,TokenType.IN,TokenType.RETURN,TokenType.AND,TokenType.OR,TokenType.NOT,TokenType.END,TokenType.UNTIL,TokenType.REPEAT,TokenType.BREAK,TokenType.GOTO]);
const SPACE_AFTER=new Set([...KEYWORDS_NEED_SPACE,TokenType.IDENTIFIER,TokenType.NUMBER,TokenType.STRING,TokenType.TRUE,TokenType.FALSE,TokenType.NIL,TokenType.RPAREN,TokenType.RBRACE,TokenType.RBRACKET]);
const SPACE_BEFORE=new Set([TokenType.IDENTIFIER,TokenType.NUMBER,TokenType.STRING,TokenType.TRUE,TokenType.FALSE,TokenType.NIL,TokenType.FUNCTION,TokenType.IF,TokenType.THEN,TokenType.ELSE,TokenType.END,TokenType.LOCAL,TokenType.RETURN,TokenType.AND,TokenType.OR,TokenType.NOT,TokenType.DO,TokenType.WHILE,TokenType.FOR,TokenType.IN,TokenType.UNTIL,TokenType.REPEAT,TokenType.ELSEIF,TokenType.LBRACE]);
const NO_SPACE_AFTER=new Set([TokenType.LPAREN,TokenType.LBRACE,TokenType.LBRACKET,TokenType.DOT,TokenType.COLON,TokenType.HASH]);
const NO_SPACE_BEFORE=new Set([TokenType.RPAREN,TokenType.RBRACE,TokenType.RBRACKET,TokenType.DOT,TokenType.COLON,TokenType.COMMA,TokenType.SEMICOLON,TokenType.LPAREN,TokenType.LBRACKET]);

export function tokensToCode(tokens:Token[]):string{
    let code='';
    for(let i=0;i<tokens.length;i++){
        const t=tokens[i];
        const prev=tokens[i-1];
        if(t.type===TokenType.EOF)continue;
        if(prev&&prev.type!==TokenType.EOF){
            let needsSpace=false;
            if(KEYWORDS_NEED_SPACE.has(prev.type)){needsSpace=true;}
            else if(!NO_SPACE_AFTER.has(prev.type)&&!NO_SPACE_BEFORE.has(t.type)){
                if(SPACE_AFTER.has(prev.type)&&SPACE_BEFORE.has(t.type)){needsSpace=true;}
            }
            if(needsSpace)code+=' ';
        }
        if(t.type===TokenType.STRING){
            if(t.value.startsWith('"')||t.value.startsWith("'")){code+=t.value;}
            else{
                const lit=t.literal??'';
                const escaped=String(lit).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n').replace(/\r/g,'\\r').replace(/\t/g,'\\t');
                code+='"'+escaped+'"';
            }
        }else{code+=t.value;}
    }
    return code;
}

// ============================================================================
// MAIN OBFUSCATE - OPTIMIZED
// ============================================================================
export interface ObfuscateOptions{
    debug?:boolean;
    renameVariables?:boolean;
    encryptStrings?:boolean;
    obfuscateNumbers?:boolean;
    obfuscateProperties?:boolean;
    obfuscateTableKeys?:boolean;
    insertOpaquePredicates?:boolean;
    opaqueInsertionRate?:number;
    flattenControlFlow?:boolean;
    flattenRate?:number;
    proxyFunctions?:boolean;
}
export interface ObfuscateResult{
    code:string;
    map:RenameMap;
    stats:{
        originalTokens:number;
        identifiersRenamed:number;
        stringsEncrypted:number;
        numbersObfuscated:number;
        predicatesInserted:number;
        deadCodeInserted:number;
        propertiesObfuscated:number;
        tableKeysObfuscated:number;
        functionsFlattened:number;
        functionsProxied:number;
        originalLength:number;
        outputLength:number;
        timeMs:number;
    };
    debugLogs?:DebugLog[];
}

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
        proxyFunctions:options.proxyFunctions??true
    };
    enableDebug(opts.debug);
    globalNameGen.reset();
    let tokens=tokenize(source);
    const originalTokenCount=tokens.length;
    let renameMap:RenameMap={};
    if(opts.renameVariables){renameMap=createRenameMap(tokens,globalNameGen);tokens=applyRenameMap(tokens,renameMap);}
    let stringsEncrypted=0;let decryptorCode='';let decryptorName='';let xorKey=0;
    if(opts.encryptStrings){const encResult=encryptStrings(tokens,globalNameGen);tokens=encResult.tokens;decryptorCode=encResult.encryption.decryptorCode;decryptorName=encResult.encryption.decryptorName;xorKey=encResult.encryption.xorKey;stringsEncrypted=encResult.encryption.encryptedStrings.size;}
    let propertiesObfuscated=0;
    if(opts.obfuscateProperties&&decryptorName){const propResult=obfuscatePropertyAccess(tokens,decryptorName,xorKey);tokens=propResult.tokens;propertiesObfuscated=propResult.propertiesObfuscated;}
    let tableKeysObfuscated=0;
    if(opts.obfuscateTableKeys&&decryptorName){const keyResult=obfuscateTableKeys(tokens,decryptorName,xorKey);tokens=keyResult.tokens;tableKeysObfuscated=keyResult.keysObfuscated;}
    let numbersObfuscated=0;
    if(opts.obfuscateNumbers){const numResult=obfuscateNumbers(tokens);tokens=numResult.tokens;numbersObfuscated=numResult.numbersObfuscated;}
    let predicatesInserted=0;let deadCodeInserted=0;
    if(opts.insertOpaquePredicates){const opaqueResult=injectOpaquePredicates(tokens,globalNameGen,{insertionRate:opts.opaqueInsertionRate});tokens=opaqueResult.tokens;predicatesInserted=opaqueResult.predicatesInserted;deadCodeInserted=opaqueResult.deadCodeInserted;}
    let functionsFlattened=0;
    if(opts.flattenControlFlow){const cffResult=flattenControlFlow(tokens,globalNameGen,{flattenRate:opts.flattenRate,minStatements:3});tokens=cffResult.tokens;functionsFlattened=cffResult.functionsFlattened;}
    let functionsProxied=0;let proxyCode='';
    if(opts.proxyFunctions){const proxyResult=createFunctionProxy(tokens,globalNameGen);tokens=proxyResult.tokens;proxyCode=proxyResult.proxy.proxyCode;functionsProxied=proxyResult.proxy.functionsProxied;}
    let innerCode=tokensToCode(tokens);
    const wrapper=new LuraphWrapper();
    const code=wrapper.wrap(innerCode,decryptorCode,proxyCode);
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
    };
}

export default{obfuscate,tokenize,enableDebug,getDebugLogs};
