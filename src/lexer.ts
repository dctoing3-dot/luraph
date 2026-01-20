export enum TokenType{NUMBER='NUMBER',STRING='STRING',BOOLEAN='BOOLEAN',NIL='NIL',IDENTIFIER='IDENTIFIER',AND='AND',BREAK='BREAK',DO='DO',ELSE='ELSE',ELSEIF='ELSEIF',END='END',FALSE='FALSE',FOR='FOR',FUNCTION='FUNCTION',GOTO='GOTO',IF='IF',IN='IN',LOCAL='LOCAL',NOT='NOT',OR='OR',REPEAT='REPEAT',RETURN='RETURN',THEN='THEN',TRUE='TRUE',UNTIL='UNTIL',WHILE='WHILE',CONTINUE='CONTINUE',PLUS='PLUS',MINUS='MINUS',STAR='STAR',SLASH='SLASH',DOUBLE_SLASH='DOUBLE_SLASH',PERCENT='PERCENT',CARET='CARET',HASH='HASH',EQ='EQ',NEQ='NEQ',LT='LT',GT='GT',LTE='LTE',GTE='GTE',ASSIGN='ASSIGN',LPAREN='LPAREN',RPAREN='RPAREN',LBRACE='LBRACE',RBRACE='RBRACE',LBRACKET='LBRACKET',RBRACKET='RBRACKET',SEMICOLON='SEMICOLON',COLON='COLON',DOUBLE_COLON='DOUBLE_COLON',COMMA='COMMA',DOT='DOT',DOT_DOT='DOT_DOT',DOT_DOT_DOT='DOT_DOT_DOT',EOF='EOF'}
export interface Token{type:TokenType;value:string;literal?:any;line:number;column:number}
const KEYWORDS:Record<string,TokenType>={'and':TokenType.AND,'break':TokenType.BREAK,'do':TokenType.DO,'else':TokenType.ELSE,'elseif':TokenType.ELSEIF,'end':TokenType.END,'false':TokenType.FALSE,'for':TokenType.FOR,'function':TokenType.FUNCTION,'goto':TokenType.GOTO,'if':TokenType.IF,'in':TokenType.IN,'local':TokenType.LOCAL,'nil':TokenType.NIL,'not':TokenType.NOT,'or':TokenType.OR,'repeat':TokenType.REPEAT,'return':TokenType.RETURN,'then':TokenType.THEN,'true':TokenType.TRUE,'until':TokenType.UNTIL,'while':TokenType.WHILE,'continue':TokenType.CONTINUE};
export type ASTNode=ProgramNode|StatementNode|ExpressionNode;
export interface ProgramNode{type:'Program';body:StatementNode[]}
export type StatementNode=LocalDeclaration|Assignment|FunctionDeclaration|LocalFunctionDeclaration|IfStatement|WhileStatement|RepeatStatement|ForNumericStatement|ForGenericStatement|ReturnStatement|BreakStatement|DoBlock|CallStatement|MethodCallStatement;
export type ExpressionNode=Identifier|NumberLiteral|StringLiteral|BooleanLiteral|NilLiteral|VarargLiteral|BinaryExpression|UnaryExpression|TableConstructor|FunctionExpression|CallExpression|MethodCallExpression|IndexExpression|MemberExpression|TableField|TableFieldKey|ParenExpression;
export interface Identifier{type:'Identifier';name:string}
export interface NumberLiteral{type:'NumberLiteral';value:number}
export interface StringLiteral{type:'StringLiteral';value:string}
export interface BooleanLiteral{type:'BooleanLiteral';value:boolean}
export interface NilLiteral{type:'NilLiteral'}
export interface VarargLiteral{type:'VarargLiteral'}
export interface BinaryExpression{type:'BinaryExpression';operator:string;left:ExpressionNode;right:ExpressionNode}
export interface UnaryExpression{type:'UnaryExpression';operator:string;argument:ExpressionNode}
export interface TableConstructor{type:'TableConstructor';fields:(TableField|TableFieldKey)[]}
export interface TableField{type:'TableField';value:ExpressionNode}
export interface TableFieldKey{type:'TableFieldKey';key:ExpressionNode;value:ExpressionNode}
export interface FunctionExpression{type:'FunctionExpression';params:Identifier[];vararg:boolean;body:StatementNode[]}
export interface CallExpression{type:'CallExpression';callee:ExpressionNode;arguments:ExpressionNode[]}
export interface MethodCallExpression{type:'MethodCallExpression';object:ExpressionNode;method:string;arguments:ExpressionNode[]}
export interface IndexExpression{type:'IndexExpression';object:ExpressionNode;index:ExpressionNode}
export interface MemberExpression{type:'MemberExpression';object:ExpressionNode;property:string}
export interface ParenExpression{type:'ParenExpression';expression:ExpressionNode}
export interface LocalDeclaration{type:'LocalDeclaration';names:Identifier[];values:ExpressionNode[]}
export interface Assignment{type:'Assignment';targets:ExpressionNode[];values:ExpressionNode[]}
export interface FunctionDeclaration{type:'FunctionDeclaration';name:ExpressionNode;params:Identifier[];vararg:boolean;body:StatementNode[]}
export interface LocalFunctionDeclaration{type:'LocalFunctionDeclaration';name:Identifier;params:Identifier[];vararg:boolean;body:StatementNode[]}
export interface IfStatement{type:'IfStatement';condition:ExpressionNode;consequent:StatementNode[];alternatives:ElseifClause[];elseBody:StatementNode[]|null}
export interface ElseifClause{type:'ElseifClause';condition:ExpressionNode;body:StatementNode[]}
export interface WhileStatement{type:'WhileStatement';condition:ExpressionNode;body:StatementNode[]}
export interface RepeatStatement{type:'RepeatStatement';condition:ExpressionNode;body:StatementNode[]}
export interface ForNumericStatement{type:'ForNumericStatement';variable:Identifier;start:ExpressionNode;end:ExpressionNode;step:ExpressionNode|null;body:StatementNode[]}
export interface ForGenericStatement{type:'ForGenericStatement';variables:Identifier[];iterators:ExpressionNode[];body:StatementNode[]}
export interface ReturnStatement{type:'ReturnStatement';values:ExpressionNode[]}
export interface BreakStatement{type:'BreakStatement'}
export interface DoBlock{type:'DoBlock';body:StatementNode[]}
export interface CallStatement{type:'CallStatement';expression:CallExpression}
export interface MethodCallStatement{type:'MethodCallStatement';expression:MethodCallExpression}
export class Lexer{private source:string;private tokens:Token[]=[];private start=0;private current=0;private line=1;private column=1;private startColumn=1;constructor(source:string){this.source=source;}tokenize():Token[]{while(!this.isAtEnd()){this.start=this.current;this.startColumn=this.column;this.scanToken();}this.tokens.push({type:TokenType.EOF,value:'',line:this.line,column:this.column});return this.tokens;}private scanToken():void{const c=this.advance();switch(c){case'(':this.addToken(TokenType.LPAREN);break;case')':this.addToken(TokenType.RPAREN);break;case'{':this.addToken(TokenType.LBRACE);break;case'}':this.addToken(TokenType.RBRACE);break;case']':this.addToken(TokenType.RBRACKET);break;case'+':this.addToken(TokenType.PLUS);break;case'*':this.addToken(TokenType.STAR);break;case'%':this.addToken(TokenType.PERCENT);break;case'^':this.addToken(TokenType.CARET);break;case'#':this.addToken(TokenType.HASH);break;case';':this.addToken(TokenType.SEMICOLON);break;case',':this.addToken(TokenType.COMMA);break;case'.':if(this.match('.'))this.addToken(this.match('.')?TokenType.DOT_DOT_DOT:TokenType.DOT_DOT);else if(this.isDigit(this.peek()))this.number();else this.addToken(TokenType.DOT);break;case'-':if(this.match('-'))this.comment();else this.addToken(TokenType.MINUS);break;case'/':this.addToken(this.match('/')?TokenType.DOUBLE_SLASH:TokenType.SLASH);break;case':':this.addToken(this.match(':')?TokenType.DOUBLE_COLON:TokenType.COLON);break;case'[':if(this.peek()==='['||this.peek()==='=')this.longString();else this.addToken(TokenType.LBRACKET);break;case'=':this.addToken(this.match('=')?TokenType.EQ:TokenType.ASSIGN);break;case'~':if(this.match('='))this.addToken(TokenType.NEQ);break;case'<':this.addToken(this.match('=')?TokenType.LTE:TokenType.LT);break;case'>':this.addToken(this.match('=')?TokenType.GTE:TokenType.GT);break;case'"':case"'":this.string(c);break;case' ':case'\r':case'\t':break;case'\n':this.line++;this.column=1;break;default:if(this.isDigit(c))this.number();else if(this.isAlpha(c))this.identifier();break;}}private string(quote:string):void{let value='';while(!this.isAtEnd()&&this.peek()!==quote){if(this.peek()==='\n'){this.line++;this.column=1;}if(this.peek()==='\\'){this.advance();if(!this.isAtEnd()){const esc=this.advance();switch(esc){case'n':value+='\n';break;case't':value+='\t';break;case'r':value+='\r';break;case'\\':value+='\\';break;case'"':value+='"';break;case"'":value+="'";break;case'0':value+='\0';break;case'x':if(this.isHexDigit(this.peek())&&this.isHexDigit(this.peekNext())){value+=String.fromCharCode(parseInt(this.advance()+this.advance(),16));}break;case'z':while(!this.isAtEnd()&&(this.peek()===' '||this.peek()==='\t'||this.peek()==='\n'||this.peek()==='\r')){if(this.peek()==='\n'){this.line++;this.column=1;}this.advance();}break;default:if(this.isDigit(esc)){let dec=esc;if(this.isDigit(this.peek()))dec+=this.advance();if(this.isDigit(this.peek()))dec+=this.advance();value+=String.fromCharCode(parseInt(dec,10));}else value+=esc;}}}else value+=this.advance();}if(!this.isAtEnd())this.advance();this.addToken(TokenType.STRING,value);}private longString():void{let level=0;while(this.peek()==='='){this.advance();level++;}if(this.peek()!=='['){this.addToken(TokenType.LBRACKET);return;}this.advance();if(this.peek()==='\n'){this.advance();this.line++;this.column=1;}let value='';const closing=']'+'='.repeat(level)+']';while(!this.isAtEnd()){if(this.peek()==='\n'){value+=this.advance();this.line++;this.column=1;}else if(this.checkSeq(closing)){for(let i=0;i<closing.length;i++)this.advance();break;}else value+=this.advance();}this.addToken(TokenType.STRING,value);}private number():void{if(this.source[this.start]==='0'){const next=this.peek().toLowerCase();if(next==='x'){this.advance();while(this.isHexDigit(this.peek())||this.peek()==='_')this.advance();this.addToken(TokenType.NUMBER,parseInt(this.source.substring(this.start,this.current).replace(/_/g,''),16));return;}else if(next==='b'){this.advance();while(this.peek()==='0'||this.peek()==='1'||this.peek()==='_')this.advance();this.addToken(TokenType.NUMBER,parseInt(this.source.substring(this.start+2,this.current).replace(/_/g,''),2));return;}}while(this.isDigit(this.peek())||this.peek()==='_')this.advance();if(this.peek()==='.'&&this.isDigit(this.peekNext())){this.advance();while(this.isDigit(this.peek())||this.peek()==='_')this.advance();}if(this.peek().toLowerCase()==='e'){this.advance();if(this.peek()==='+'||this.peek()==='-')this.advance();while(this.isDigit(this.peek()))this.advance();}this.addToken(TokenType.NUMBER,parseFloat(this.source.substring(this.start,this.current).replace(/_/g,'')));}private identifier():void{while(this.isAlphaNumeric(this.peek()))this.advance();const text=this.source.substring(this.start,this.current);const kw=KEYWORDS[text];if(kw!==undefined){if(kw===TokenType.TRUE)this.addToken(TokenType.TRUE,true);else if(kw===TokenType.FALSE)this.addToken(TokenType.FALSE,false);else if(kw===TokenType.NIL)this.addToken(TokenType.NIL,null);else this.addToken(kw);}else this.addToken(TokenType.IDENTIFIER,text);}private comment():void{if(this.peek()==='['&&(this.peekNext()==='['||this.peekNext()==='=')){this.advance();let level=0;while(this.peek()==='='){this.advance();level++;}if(this.peek()==='['){this.advance();const closing=']'+'='.repeat(level)+']';while(!this.isAtEnd()){if(this.peek()==='\n'){this.advance();this.line++;this.column=1;}else if(this.checkSeq(closing)){for(let i=0;i<closing.length;i++)this.advance();break;}else this.advance();}}}else{while(!this.isAtEnd()&&this.peek()!=='\n')this.advance();}}private isAtEnd():boolean{return this.current>=this.source.length;}private advance():string{const c=this.source[this.current];this.current++;this.column++;return c;}private peek():string{return this.isAtEnd()?'\0':this.source[this.current];}private peekNext():string{return this.current+1>=this.source.length?'\0':this.source[this.current+1];}private match(expected:string):boolean{if(this.isAtEnd()||this.source[this.current]!==expected)return false;this.current++;this.column++;return true;}private checkSeq(seq:string):boolean{for(let i=0;i<seq.length;i++){if(this.current+i>=this.source.length||this.source[this.current+i]!==seq[i])return false;}return true;}private isDigit(c:string):boolean{return c>='0'&&c<='9';}private isHexDigit(c:string):boolean{return this.isDigit(c)||(c>='a'&&c<='f')||(c>='A'&&c<='F');}private isAlpha(c:string):boolean{return(c>='a'&&c<='z')||(c>='A'&&c<='Z')||c==='_';}private isAlphaNumeric(c:string):boolean{return this.isAlpha(c)||this.isDigit(c);}private addToken(type:TokenType,literal?:any):void{const text=this.source.substring(this.start,this.current);this.tokens.push({type,value:text,literal:literal!==undefined?literal:text,line:this.line,column:this.startColumn});}}
export function tokenize(source:string):Token[]{return new Lexer(source).tokenize();}
export class Parser{private tokens:Token[];private current=0;constructor(tokens:Token[]){this.tokens=tokens;}parse():ProgramNode{const body:StatementNode[]=[];while(!this.isAtEnd()){const stmt=this.parseStatement();if(stmt)body.push(stmt);}return{type:'Program',body};}private parseStatement():StatementNode|null{if(this.check(TokenType.SEMICOLON)){this.advance();return null;}if(this.match(TokenType.LOCAL)){if(this.check(TokenType.FUNCTION)){return this.parseLocalFunction();}return this.parseLocalDeclaration();}if(this.match(TokenType.FUNCTION)){return this.parseFunctionDeclaration();}if(this.match(TokenType.IF)){return this.parseIfStatement();}if(this.match(TokenType.WHILE)){return this.parseWhileStatement();}if(this.match(TokenType.REPEAT)){return this.parseRepeatStatement();}if(this.match(TokenType.FOR)){return this.parseForStatement();}if(this.match(TokenType.RETURN)){return this.parseReturnStatement();}if(this.match(TokenType.BREAK)){return{type:'BreakStatement'};}if(this.match(TokenType.DO)){return this.parseDoBlock();}return this.parseExpressionStatement();}private parseLocalDeclaration():LocalDeclaration{const names:Identifier[]=[];do{const name=this.consume(TokenType.IDENTIFIER,'Expected variable name');names.push({type:'Identifier',name:name.literal});}while(this.match(TokenType.COMMA));let values:ExpressionNode[]=[];if(this.match(TokenType.ASSIGN)){do{values.push(this.parseExpression());}while(this.match(TokenType.COMMA));}return{type:'LocalDeclaration',names,values};}private parseLocalFunction():LocalFunctionDeclaration{this.consume(TokenType.FUNCTION,'Expected function');const name=this.consume(TokenType.IDENTIFIER,'Expected function name');this.consume(TokenType.LPAREN,'Expected (');const{params,vararg}=this.parseParamList();this.consume(TokenType.RPAREN,'Expected )');const body=this.parseBlock();this.consume(TokenType.END,'Expected end');return{type:'LocalFunctionDeclaration',name:{type:'Identifier',name:name.literal},params,vararg,body};}private parseFunctionDeclaration():FunctionDeclaration{let name:ExpressionNode={type:'Identifier',name:this.consume(TokenType.IDENTIFIER,'Expected function name').literal};while(this.match(TokenType.DOT)){const prop=this.consume(TokenType.IDENTIFIER,'Expected property name');name={type:'MemberExpression',object:name,property:prop.literal};}let isMethod=false;if(this.match(TokenType.COLON)){isMethod=true;const method=this.consume(TokenType.IDENTIFIER,'Expected method name');name={type:'MemberExpression',object:name,property:method.literal};}this.consume(TokenType.LPAREN,'Expected (');const{params,vararg}=this.parseParamList();if(isMethod){params.unshift({type:'Identifier',name:'self'});}this.consume(TokenType.RPAREN,'Expected )');const body=this.parseBlock();this.consume(TokenType.END,'Expected end');return{type:'FunctionDeclaration',name,params,vararg,body};}private parseParamList():{params:Identifier[];vararg:boolean}{const params:Identifier[]=[];let vararg=false;if(!this.check(TokenType.RPAREN)){do{if(this.match(TokenType.DOT_DOT_DOT)){vararg=true;break;}const param=this.consume(TokenType.IDENTIFIER,'Expected parameter name');params.push({type:'Identifier',name:param.literal});}while(this.match(TokenType.COMMA));}return{params,vararg};}private parseIfStatement():IfStatement{const condition=this.parseExpression();this.consume(TokenType.THEN,'Expected then');const consequent=this.parseBlock();const alternatives:ElseifClause[]=[];while(this.match(TokenType.ELSEIF)){const altCondition=this.parseExpression();this.consume(TokenType.THEN,'Expected then');const altBody=this.parseBlock();alternatives.push({type:'ElseifClause',condition:altCondition,body:altBody});}let elseBody:StatementNode[]|null=null;if(this.match(TokenType.ELSE)){elseBody=this.parseBlock();}this.consume(TokenType.END,'Expected end');return{type:'IfStatement',condition,consequent,alternatives,elseBody};}private parseWhileStatement():WhileStatement{const condition=this.parseExpression();this.consume(TokenType.DO,'Expected do');const body=this.parseBlock();this.consume(TokenType.END,'Expected end');return{type:'WhileStatement',condition,body};}private parseRepeatStatement():RepeatStatement{const body=this.parseBlock();this.consume(TokenType.UNTIL,'Expected until');const condition=this.parseExpression();return{type:'RepeatStatement',condition,body};}private parseForStatement():ForNumericStatement|ForGenericStatement{const firstName=this.consume(TokenType.IDENTIFIER,'Expected variable name');if(this.match(TokenType.ASSIGN)){const start=this.parseExpression();this.consume(TokenType.COMMA,'Expected ,');const end=this.parseExpression();let step:ExpressionNode|null=null;if(this.match(TokenType.COMMA)){step=this.parseExpression();}this.consume(TokenType.DO,'Expected do');const body=this.parseBlock();this.consume(TokenType.END,'Expected end');return{type:'ForNumericStatement',variable:{type:'Identifier',name:firstName.literal},start,end,step,body};}else{const variables:Identifier[]=[{type:'Identifier',name:firstName.literal}];while(this.match(TokenType.COMMA)){const name=this.consume(TokenType.IDENTIFIER,'Expected variable name');variables.push({type:'Identifier',name:name.literal});}this.consume(TokenType.IN,'Expected in');const iterators:ExpressionNode[]=[];do{iterators.push(this.parseExpression());}while(this.match(TokenType.COMMA));this.consume(TokenType.DO,'Expected do');const body=this.parseBlock();this.consume(TokenType.END,'Expected end');return{type:'ForGenericStatement',variables,iterators,body};}}private parseReturnStatement():ReturnStatement{const values:ExpressionNode[]=[];if(!this.check(TokenType.END)&&!this.check(TokenType.ELSE)&&!this.check(TokenType.ELSEIF)&&!this.check(TokenType.UNTIL)&&!this.isAtEnd()&&!this.check(TokenType.SEMICOLON)){do{values.push(this.parseExpression());}while(this.match(TokenType.COMMA));}this.match(TokenType.SEMICOLON);return{type:'ReturnStatement',values};}private parseDoBlock():DoBlock{const body=this.parseBlock();this.consume(TokenType.END,'Expected end');return{type:'DoBlock',body};}private parseBlock():StatementNode[]{const statements:StatementNode[]=[];while(!this.check(TokenType.END)&&!this.check(TokenType.ELSE)&&!this.check(TokenType.ELSEIF)&&!this.check(TokenType.UNTIL)&&!this.isAtEnd()){const stmt=this.parseStatement();if(stmt)statements.push(stmt);}return statements;}private parseExpressionStatement():StatementNode{const expr=this.parsePrefixExpression();if(expr.type==='CallExpression'){return{type:'CallStatement',expression:expr};}if(expr.type==='MethodCallExpression'){return{type:'MethodCallStatement',expression:expr};}const targets:ExpressionNode[]=[expr];while(this.match(TokenType.COMMA)){targets.push(this.parsePrefixExpression());}this.consume(TokenType.ASSIGN,'Expected =');const values:ExpressionNode[]=[];do{values.push(this.parseExpression());}while(this.match(TokenType.COMMA));return{type:'Assignment',targets,values};}private parseExpression():ExpressionNode{return this.parseOr();}private parseOr():ExpressionNode{let left=this.parseAnd();while(this.match(TokenType.OR)){const right=this.parseAnd();left={type:'BinaryExpression',operator:'or',left,right};}return left;}private parseAnd():ExpressionNode{let left=this.parseComparison();while(this.match(TokenType.AND)){const right=this.parseComparison();left={type:'BinaryExpression',operator:'and',left,right};}return left;}private parseComparison():ExpressionNode{let left=this.parseConcat();while(this.match(TokenType.LT)||this.match(TokenType.GT)||this.match(TokenType.LTE)||this.match(TokenType.GTE)||this.match(TokenType.EQ)||this.match(TokenType.NEQ)){const operator=this.previous().value;const right=this.parseConcat();left={type:'BinaryExpression',operator,left,right};}return left;}private parseConcat():ExpressionNode{let left=this.parseAdditive();if(this.match(TokenType.DOT_DOT)){const right=this.parseConcat();return{type:'BinaryExpression',operator:'..',left,right};}return left;}private parseAdditive():ExpressionNode{let left=this.parseMultiplicative();while(this.match(TokenType.PLUS)||this.match(TokenType.MINUS)){const operator=this.previous().value;const right=this.parseMultiplicative();left={type:'BinaryExpression',operator,left,right};}return left;}private parseMultiplicative():ExpressionNode{let left=this.parseUnary();while(this.match(TokenType.STAR)||this.match(TokenType.SLASH)||this.match(TokenType.DOUBLE_SLASH)||this.match(TokenType.PERCENT)){const operator=this.previous().value;const right=this.parseUnary();left={type:'BinaryExpression',operator,left,right};}return left;}private parseUnary():ExpressionNode{if(this.match(TokenType.NOT)||this.match(TokenType.MINUS)||this.match(TokenType.HASH)){const operator=this.previous().value;const argument=this.parseUnary();return{type:'UnaryExpression',operator,argument};}return this.parsePower();}private parsePower():ExpressionNode{let left=this.parsePrefixExpression();if(this.match(TokenType.CARET)){const right=this.parseUnary();return{type:'BinaryExpression',operator:'^',left,right};}return left;}private parsePrefixExpression():ExpressionNode{let expr=this.parsePrimary();while(true){if(this.match(TokenType.DOT)){const property=this.consume(TokenType.IDENTIFIER,'Expected property name');expr={type:'MemberExpression',object:expr,property:property.literal};}else if(this.match(TokenType.LBRACKET)){const index=this.parseExpression();this.consume(TokenType.RBRACKET,'Expected ]');expr={type:'IndexExpression',object:expr,index};}else if(this.match(TokenType.COLON)){const method=this.consume(TokenType.IDENTIFIER,'Expected method name');this.consume(TokenType.LPAREN,'Expected (');const args=this.parseArgList();this.consume(TokenType.RPAREN,'Expected )');expr={type:'MethodCallExpression',object:expr,method:method.literal,arguments:args};}else if(this.match(TokenType.LPAREN)){const args=this.parseArgList();this.consume(TokenType.RPAREN,'Expected )');expr={type:'CallExpression',callee:expr,arguments:args};}else if(this.check(TokenType.STRING)){const arg=this.advance();expr={type:'CallExpression',callee:expr,arguments:[{type:'StringLiteral',value:arg.literal}]};}else if(this.check(TokenType.LBRACE)){const table=this.parseTableConstructor();expr={type:'CallExpression',callee:expr,arguments:[table]};}else{break;}}return expr;}private parseArgList():ExpressionNode[]{const args:ExpressionNode[]=[];if(!this.check(TokenType.RPAREN)){do{args.push(this.parseExpression());}while(this.match(TokenType.COMMA));}return args;}private parsePrimary():ExpressionNode{if(this.match(TokenType.NIL)){return{type:'NilLiteral'};}if(this.match(TokenType.TRUE)){return{type:'BooleanLiteral',value:true};}if(this.match(TokenType.FALSE)){return{type:'BooleanLiteral',value:false};}if(this.match(TokenType.NUMBER)){return{type:'NumberLiteral',value:this.previous().literal};}if(this.match(TokenType.STRING)){return{type:'StringLiteral',value:this.previous().literal};}if(this.match(TokenType.DOT_DOT_DOT)){return{type:'VarargLiteral'};}if(this.match(TokenType.FUNCTION)){return this.parseFunctionExpression();}if(this.match(TokenType.LBRACE)){return this.parseTableConstructor();}if(this.match(TokenType.LPAREN)){const expr=this.parseExpression();this.consume(TokenType.RPAREN,'Expected )');return{type:'ParenExpression',expression:expr};}if(this.match(TokenType.IDENTIFIER)){return{type:'Identifier',name:this.previous().literal};}throw new Error('Unexpected token: '+this.peek().value+' at line '+this.peek().line);}private parseFunctionExpression():FunctionExpression{this.consume(TokenType.LPAREN,'Expected (');const{params,vararg}=this.parseParamList();this.consume(TokenType.RPAREN,'Expected )');const body=this.parseBlock();this.consume(TokenType.END,'Expected end');return{type:'FunctionExpression',params,vararg,body};}private parseTableConstructor():TableConstructor{const fields:(TableField|TableFieldKey)[]=[];if(!this.check(TokenType.RBRACE)){do{if(this.check(TokenType.RBRACE))break;if(this.match(TokenType.LBRACKET)){const key=this.parseExpression();this.consume(TokenType.RBRACKET,'Expected ]');this.consume(TokenType.ASSIGN,'Expected =');const value=this.parseExpression();fields.push({type:'TableFieldKey',key,value});}else if(this.check(TokenType.IDENTIFIER)&&this.peekNext()?.type===TokenType.ASSIGN){const key=this.advance();this.consume(TokenType.ASSIGN,'Expected =');const value=this.parseExpression();fields.push({type:'TableFieldKey',key:{type:'StringLiteral',value:key.literal},value});}else{const value=this.parseExpression();fields.push({type:'TableField',value});}}while(this.match(TokenType.COMMA)||this.match(TokenType.SEMICOLON));}this.consume(TokenType.RBRACE,'Expected }');return{type:'TableConstructor',fields};}private match(...types:TokenType[]):boolean{for(const type of types){if(this.check(type)){this.advance();return true;}}return false;}private check(type:TokenType):boolean{if(this.isAtEnd())return false;return this.peek().type===type;}private advance():Token{if(!this.isAtEnd())this.current++;return this.previous();}private isAtEnd():boolean{return this.peek().type===TokenType.EOF;}private peek():Token{return this.tokens[this.current];}private peekNext():Token|null{if(this.current+1>=this.tokens.length)return null;return this.tokens[this.current+1];}private previous():Token{return this.tokens[this.current-1];}private consume(type:TokenType,message:string):Token{if(this.check(type))return this.advance();throw new Error(message+' at line '+this.peek().line+', got '+this.peek().value);}}
export function parse(source:string):ProgramNode{const tokens=tokenize(source);return new Parser(tokens).parse();}
export enum OpCode{LOADNIL=0,LOADBOOL=1,LOADK=2,LOADINT=3,GETGLOBAL=4,SETGLOBAL=5,GETLOCAL=6,SETLOCAL=7,GETUPVAL=8,SETUPVAL=9,GETTABLE=10,SETTABLE=11,NEWTABLE=12,SETLIST=13,ADD=14,SUB=15,MUL=16,DIV=17,MOD=18,POW=19,IDIV=20,UNM=21,NOT=22,LEN=23,CONCAT=24,EQ=25,LT=26,LE=27,JMP=28,JMPIF=29,JMPIFNOT=30,CALL=31,TAILCALL=32,RETURN=33,CLOSURE=34,VARARG=35,SELF=36,FORPREP=37,FORLOOP=38,TFORCALL=39,TFORLOOP=40,CLOSE=41,MOVE=42,TEST=43,TESTSET=44,NOP=45}
export interface Instruction{op:OpCode;a:number;b:number;c:number;bx?:number;sbx?:number}
export interface Prototype{code:Instruction[];constants:(null|boolean|number|string)[];protos:Prototype[];numParams:number;isVararg:boolean;maxStack:number;upvalues:{name:string;instack:boolean;idx:number}[];locals:{name:string;startpc:number;endpc:number}[];source:string}
interface Local{name:string;depth:number;startpc:number}
interface Upvalue{name:string;isLocal:boolean;index:number}
interface LoopInfo{start:number;breaks:number[];depth:number}
interface CompileStats{identifiers:number;strings:number;numbers:number;functions:number}
class Compiler{private proto:Prototype;private locals:Local[]=[];private upvalues:Upvalue[]=[];private scopeDepth=0;private loopStack:LoopInfo[]=[];private parent:Compiler|null;private stats:CompileStats={identifiers:0,strings:0,numbers:0,functions:0};constructor(parent:Compiler|null=null,source:string=''){this.parent=parent;this.proto={code:[],constants:[],protos:[],numParams:0,isVararg:false,maxStack:2,upvalues:[],locals:[],source};}getStats():CompileStats{return this.stats;}compile(ast:ProgramNode):Prototype{for(const stmt of ast.body){this.compileStatement(stmt);}this.emit(OpCode.RETURN,0,1,0);this.proto.maxStack=Math.max(this.proto.maxStack,this.locals.length+10);return this.proto;}private emit(op:OpCode,a:number,b:number,c:number):number{this.proto.code.push({op,a,b,c});return this.proto.code.length-1;}private emitABx(op:OpCode,a:number,bx:number):number{this.proto.code.push({op,a,b:0,c:0,bx});return this.proto.code.length-1;}private emitAsBx(op:OpCode,a:number,sbx:number):number{this.proto.code.push({op,a,b:0,c:0,sbx});return this.proto.code.length-1;}private addConstant(value:null|boolean|number|string):number{const idx=this.proto.constants.indexOf(value);if(idx!==-1)return idx;this.proto.constants.push(value);if(typeof value==='string')this.stats.strings++;if(typeof value==='number')this.stats.numbers++;return this.proto.constants.length-1;}private addLocal(name:string):number{const local:Local={name,depth:this.scopeDepth,startpc:this.proto.code.length};this.locals.push(local);this.stats.identifiers++;return this.locals.length-1;}private resolveLocal(name:string):number{for(let i=this.locals.length-1;i>=0;i--){if(this.locals[i].name===name)return i;}return-1;}private resolveUpvalue(name:string):number{for(let i=0;i<this.upvalues.length;i++){if(this.upvalues[i].name===name)return i;}if(this.parent){const local=this.parent.resolveLocal(name);if(local!==-1){return this.addUpvalue(name,true,local);}const upval=this.parent.resolveUpvalue(name);if(upval!==-1){return this.addUpvalue(name,false,upval);}}return-1;}private addUpvalue(name:string,isLocal:boolean,index:number):number{for(let i=0;i<this.upvalues.length;i++){const uv=this.upvalues[i];if(uv.index===index&&uv.isLocal===isLocal)return i;}this.upvalues.push({name,isLocal,index});this.proto.upvalues.push({name,instack:isLocal,idx:index});return this.upvalues.length-1;}private beginScope():void{this.scopeDepth++;}private endScope():void{this.scopeDepth--;while(this.locals.length>0&&this.locals[this.locals.length-1].depth>this.scopeDepth){this.locals.pop();}}private compileStatement(stmt:StatementNode):void{switch(stmt.type){case'LocalDeclaration':this.compileLocalDeclaration(stmt);break;case'Assignment':this.compileAssignment(stmt);break;case'FunctionDeclaration':this.compileFunctionDeclaration(stmt);break;case'LocalFunctionDeclaration':this.compileLocalFunctionDeclaration(stmt);break;case'IfStatement':this.compileIfStatement(stmt);break;case'WhileStatement':this.compileWhileStatement(stmt);break;case'RepeatStatement':this.compileRepeatStatement(stmt);break;case'ForNumericStatement':this.compileForNumeric(stmt);break;case'ForGenericStatement':this.compileForGeneric(stmt);break;case'ReturnStatement':this.compileReturnStatement(stmt);break;case'BreakStatement':this.compileBreakStatement();break;case'DoBlock':this.compileDoBlock(stmt);break;case'CallStatement':this.compileCallStatement(stmt);break;case'MethodCallStatement':this.compileMethodCallStatement(stmt);break;}}private compileLocalDeclaration(stmt:LocalDeclaration):void{const baseReg=this.locals.length;for(let i=0;i<stmt.names.length;i++){this.addLocal(stmt.names[i].name);}if(stmt.values.length===0){for(let i=0;i<stmt.names.length;i++){this.emit(OpCode.LOADNIL,baseReg+i,0,0);}}else{for(let i=0;i<stmt.values.length;i++){const reg=baseReg+i;if(i<stmt.names.length){this.compileExpression(stmt.values[i],reg,1);}else{this.compileExpression(stmt.values[i],reg,0);}}for(let i=stmt.values.length;i<stmt.names.length;i++){this.emit(OpCode.LOADNIL,baseReg+i,0,0);}}}private compileAssignment(stmt:Assignment):void{const tempBase=this.locals.length;for(let i=0;i<stmt.values.length;i++){this.compileExpression(stmt.values[i],tempBase+i,1);}for(let i=0;i<stmt.targets.length;i++){const target=stmt.targets[i];const valueReg=tempBase+Math.min(i,stmt.values.length-1);this.compileAssignTarget(target,valueReg);}}private compileAssignTarget(target:ExpressionNode,valueReg:number):void{if(target.type==='Identifier'){const local=this.resolveLocal(target.name);if(local!==-1){this.emit(OpCode.MOVE,local,valueReg,0);}else{const upval=this.resolveUpvalue(target.name);if(upval!==-1){this.emit(OpCode.SETUPVAL,valueReg,upval,0);}else{const nameK=this.addConstant(target.name);this.emitABx(OpCode.SETGLOBAL,valueReg,nameK);}}}else if(target.type==='IndexExpression'){const tableReg=this.locals.length;const keyReg=this.locals.length+1;this.compileExpression(target.object,tableReg,1);this.compileExpression(target.index,keyReg,1);this.emit(OpCode.SETTABLE,tableReg,keyReg,valueReg);}else if(target.type==='MemberExpression'){const tableReg=this.locals.length;this.compileExpression(target.object,tableReg,1);const keyK=this.addConstant(target.property);this.emit(OpCode.SETTABLE,tableReg,256+keyK,valueReg);}}private compileFunctionDeclaration(stmt:FunctionDeclaration):void{const funcReg=this.locals.length;this.compileFunction(stmt.params,stmt.vararg,stmt.body,funcReg);this.compileAssignTarget(stmt.name,funcReg);}private compileLocalFunctionDeclaration(stmt:LocalFunctionDeclaration):void{const reg=this.addLocal(stmt.name.name);this.compileFunction(stmt.params,stmt.vararg,stmt.body,reg);}private compileFunction(params:Identifier[],vararg:boolean,body:StatementNode[],reg:number):void{const childCompiler=new Compiler(this,this.proto.source);childCompiler.proto.numParams=params.length;childCompiler.proto.isVararg=vararg;childCompiler.beginScope();for(const param of params){childCompiler.addLocal(param.name);}for(const stmt of body){childCompiler.compileStatement(stmt);}childCompiler.emit(OpCode.RETURN,0,1,0);childCompiler.endScope();const protoIdx=this.proto.protos.length;this.proto.protos.push(childCompiler.proto);this.emitABx(OpCode.CLOSURE,reg,protoIdx);this.stats.functions++;const childStats=childCompiler.getStats();this.stats.identifiers+=childStats.identifiers;this.stats.strings+=childStats.strings;this.stats.numbers+=childStats.numbers;this.stats.functions+=childStats.functions;}private compileIfStatement(stmt:IfStatement):void{const endJumps:number[]=[];const condReg=this.locals.length;this.compileExpression(stmt.condition,condReg,1);const falseJump=this.emitAsBx(OpCode.JMPIFNOT,condReg,0);this.beginScope();for(const s of stmt.consequent)this.compileStatement(s);this.endScope();endJumps.push(this.emitAsBx(OpCode.JMP,0,0));this.proto.code[falseJump].sbx=this.proto.code.length-falseJump-1;for(const alt of stmt.alternatives){const altCondReg=this.locals.length;this.compileExpression(alt.condition,altCondReg,1);const altFalseJump=this.emitAsBx(OpCode.JMPIFNOT,altCondReg,0);this.beginScope();for(const s of alt.body)this.compileStatement(s);this.endScope();endJumps.push(this.emitAsBx(OpCode.JMP,0,0));this.proto.code[altFalseJump].sbx=this.proto.code.length-altFalseJump-1;}if(stmt.elseBody){this.beginScope();for(const s of stmt.elseBody)this.compileStatement(s);this.endScope();}for(const jmp of endJumps){this.proto.code[jmp].sbx=this.proto.code.length-jmp-1;}}private compileWhileStatement(stmt:WhileStatement):void{const loopStart=this.proto.code.length;this.loopStack.push({start:loopStart,breaks:[],depth:this.scopeDepth});const condReg=this.locals.length;this.compileExpression(stmt.condition,condReg,1);const exitJump=this.emitAsBx(OpCode.JMPIFNOT,condReg,0);this.beginScope();for(const s of stmt.body)this.compileStatement(s);this.endScope();this.emitAsBx(OpCode.JMP,0,loopStart-this.proto.code.length-1);this.proto.code[exitJump].sbx=this.proto.code.length-exitJump-1;const loop=this.loopStack.pop()!;for(const brk of loop.breaks){this.proto.code[brk].sbx=this.proto.code.length-brk-1;}}private compileRepeatStatement(stmt:RepeatStatement):void{const loopStart=this.proto.code.length;this.loopStack.push({start:loopStart,breaks:[],depth:this.scopeDepth});this.beginScope();for(const s of stmt.body)this.compileStatement(s);const condReg=this.locals.length;this.compileExpression(stmt.condition,condReg,1);this.emitAsBx(OpCode.JMPIFNOT,condReg,loopStart-this.proto.code.length-1);this.endScope();const loop=this.loopStack.pop()!;for(const brk of loop.breaks){this.proto.code[brk].sbx=this.proto.code.length-brk-1;}}private compileForNumeric(stmt:ForNumericStatement):void{this.beginScope();const baseReg=this.locals.length;this.addLocal('(for index)');this.addLocal('(for limit)');this.addLocal('(for step)');this.addLocal(stmt.variable.name);this.compileExpression(stmt.start,baseReg,1);this.compileExpression(stmt.end,baseReg+1,1);if(stmt.step){this.compileExpression(stmt.step,baseReg+2,1);}else{this.emit(OpCode.LOADINT,baseReg+2,1,0);}const prepJump=this.emitAsBx(OpCode.FORPREP,baseReg,0);const loopStart=this.proto.code.length;this.loopStack.push({start:loopStart,breaks:[],depth:this.scopeDepth});for(const s of stmt.body)this.compileStatement(s);this.proto.code[prepJump].sbx=this.proto.code.length-prepJump-1;this.emitAsBx(OpCode.FORLOOP,baseReg,loopStart-this.proto.code.length-1);const loop=this.loopStack.pop()!;for(const brk of loop.breaks){this.proto.code[brk].sbx=this.proto.code.length-brk-1;}this.endScope();}private compileForGeneric(stmt:ForGenericStatement):void{this.beginScope();const baseReg=this.locals.length;this.addLocal('(for generator)');this.addLocal('(for state)');this.addLocal('(for control)');for(const v of stmt.variables){this.addLocal(v.name);}for(let i=0;i<stmt.iterators.length&&i<3;i++){this.compileExpression(stmt.iterators[i],baseReg+i,1);}const prepJump=this.emitAsBx(OpCode.JMP,0,0);const loopStart=this.proto.code.length;this.loopStack.push({start:loopStart,breaks:[],depth:this.scopeDepth});for(const s of stmt.body)this.compileStatement(s);this.proto.code[prepJump].sbx=this.proto.code.length-prepJump-1;this.emit(OpCode.TFORCALL,baseReg,0,stmt.variables.length);this.emitAsBx(OpCode.TFORLOOP,baseReg+2,loopStart-this.proto.code.length-1);const loop=this.loopStack.pop()!;for(const brk of loop.breaks){this.proto.code[brk].sbx=this.proto.code.length-brk-1;}this.endScope();}private compileReturnStatement(stmt:ReturnStatement):void{if(stmt.values.length===0){this.emit(OpCode.RETURN,0,1,0);}else{const baseReg=this.locals.length;for(let i=0;i<stmt.values.length;i++){this.compileExpression(stmt.values[i],baseReg+i,1);}this.emit(OpCode.RETURN,baseReg,stmt.values.length+1,0);}}private compileBreakStatement():void{if(this.loopStack.length===0){throw new Error('Break outside loop');}const loop=this.loopStack[this.loopStack.length-1];loop.breaks.push(this.emitAsBx(OpCode.JMP,0,0));}private compileDoBlock(stmt:DoBlock):void{this.beginScope();for(const s of stmt.body)this.compileStatement(s);this.endScope();}private compileCallStatement(stmt:CallStatement):void{const reg=this.locals.length;this.compileCall(stmt.expression,reg,0);}private compileMethodCallStatement(stmt:MethodCallStatement):void{const reg=this.locals.length;this.compileMethodCall(stmt.expression,reg,0);}private compileExpression(expr:ExpressionNode,reg:number,want:number):void{switch(expr.type){case'NilLiteral':this.emit(OpCode.LOADNIL,reg,0,0);break;case'BooleanLiteral':this.emit(OpCode.LOADBOOL,reg,expr.value?1:0,0);break;case'NumberLiteral':if(Number.isInteger(expr.value)&&expr.value>=-131072&&expr.value<=131071){this.emit(OpCode.LOADINT,reg,expr.value,0);}else{const k=this.addConstant(expr.value);this.emitABx(OpCode.LOADK,reg,k);}break;case'StringLiteral':{const k=this.addConstant(expr.value);this.emitABx(OpCode.LOADK,reg,k);break;}case'Identifier':this.compileIdentifier(expr,reg);break;case'BinaryExpression':this.compileBinaryExpression(expr,reg);break;case'UnaryExpression':this.compileUnaryExpression(expr,reg);break;case'TableConstructor':this.compileTableConstructor(expr,reg);break;case'FunctionExpression':this.compileFunction(expr.params,expr.vararg,expr.body,reg);break;case'CallExpression':this.compileCall(expr,reg,want);break;case'MethodCallExpression':this.compileMethodCall(expr,reg,want);break;case'IndexExpression':this.compileIndexExpression(expr,reg);break;case'MemberExpression':this.compileMemberExpression(expr,reg);break;case'ParenExpression':this.compileExpression(expr.expression,reg,1);break;case'VarargLiteral':this.emit(OpCode.VARARG,reg,want+1,0);break;}}private compileIdentifier(expr:Identifier,reg:number):void{const local=this.resolveLocal(expr.name);if(local!==-1){if(local!==reg)this.emit(OpCode.MOVE,reg,local,0);}else{const upval=this.resolveUpvalue(expr.name);if(upval!==-1){this.emit(OpCode.GETUPVAL,reg,upval,0);}else{const k=this.addConstant(expr.name);this.emitABx(OpCode.GETGLOBAL,reg,k);}}}private compileBinaryExpression(expr:BinaryExpression,reg:number):void{if(expr.operator==='and'){this.compileExpression(expr.left,reg,1);const jump=this.emitAsBx(OpCode.JMPIFNOT,reg,0);this.compileExpression(expr.right,reg,1);this.proto.code[jump].sbx=this.proto.code.length-jump-1;return;}if(expr.operator==='or'){this.compileExpression(expr.left,reg,1);const jump=this.emitAsBx(OpCode.JMPIF,reg,0);this.compileExpression(expr.right,reg,1);this.proto.code[jump].sbx=this.proto.code.length-jump-1;return;}const leftReg=reg;const rightReg=this.locals.length+1;this.compileExpression(expr.left,leftReg,1);this.compileExpression(expr.right,rightReg,1);switch(expr.operator){case'+':this.emit(OpCode.ADD,reg,leftReg,rightReg);break;case'-':this.emit(OpCode.SUB,reg,leftReg,rightReg);break;case'*':this.emit(OpCode.MUL,reg,leftReg,rightReg);break;case'/':this.emit(OpCode.DIV,reg,leftReg,rightReg);break;case'%':this.emit(OpCode.MOD,reg,leftReg,rightReg);break;case'^':this.emit(OpCode.POW,reg,leftReg,rightReg);break;case'//':this.emit(OpCode.IDIV,reg,leftReg,rightReg);break;case'..':this.emit(OpCode.CONCAT,reg,leftReg,rightReg);break;case'==':this.emit(OpCode.EQ,1,leftReg,rightReg);this.emitAsBx(OpCode.JMP,0,1);this.emit(OpCode.LOADBOOL,reg,0,1);this.emit(OpCode.LOADBOOL,reg,1,0);break;case'~=':this.emit(OpCode.EQ,0,leftReg,rightReg);this.emitAsBx(OpCode.JMP,0,1);this.emit(OpCode.LOADBOOL,reg,0,1);this.emit(OpCode.LOADBOOL,reg,1,0);break;case'<':this.emit(OpCode.LT,1,leftReg,rightReg);this.emitAsBx(OpCode.JMP,0,1);this.emit(OpCode.LOADBOOL,reg,0,1);this.emit(OpCode.LOADBOOL,reg,1,0);break;case'>':this.emit(OpCode.LT,1,rightReg,leftReg);this.emitAsBx(OpCode.JMP,0,1);this.emit(OpCode.LOADBOOL,reg,0,1);this.emit(OpCode.LOADBOOL,reg,1,0);break;case'<=':this.emit(OpCode.LE,1,leftReg,rightReg);this.emitAsBx(OpCode.JMP,0,1);this.emit(OpCode.LOADBOOL,reg,0,1);this.emit(OpCode.LOADBOOL,reg,1,0);break;case'>=':this.emit(OpCode.LE,1,rightReg,leftReg);this.emitAsBx(OpCode.JMP,0,1);this.emit(OpCode.LOADBOOL,reg,0,1);this.emit(OpCode.LOADBOOL,reg,1,0);break;}}private compileUnaryExpression(expr:UnaryExpression,reg:number):void{this.compileExpression(expr.argument,reg,1);switch(expr.operator){case'-':this.emit(OpCode.UNM,reg,reg,0);break;case'not':this.emit(OpCode.NOT,reg,reg,0);break;case'#':this.emit(OpCode.LEN,reg,reg,0);break;}}private compileTableConstructor(expr:TableConstructor,reg:number):void{this.emit(OpCode.NEWTABLE,reg,0,0);let arrayIdx=1;const tempBase=this.locals.length+1;for(const field of expr.fields){if(field.type==='TableField'){this.compileExpression(field.value,tempBase,1);this.emit(OpCode.LOADINT,tempBase+1,arrayIdx,0);this.emit(OpCode.SETTABLE,reg,tempBase+1,tempBase);arrayIdx++;}else{if(field.key.type==='StringLiteral'){const k=this.addConstant(field.key.value);this.compileExpression(field.value,tempBase,1);this.emit(OpCode.SETTABLE,reg,256+k,tempBase);}else{this.compileExpression(field.key,tempBase,1);this.compileExpression(field.value,tempBase+1,1);this.emit(OpCode.SETTABLE,reg,tempBase,tempBase+1);}}}}private compileCall(expr:CallExpression,reg:number,want:number):void{this.compileExpression(expr.callee,reg,1);for(let i=0;i<expr.arguments.length;i++){this.compileExpression(expr.arguments[i],reg+1+i,1);}this.emit(OpCode.CALL,reg,expr.arguments.length+1,want+1);}private compileMethodCall(expr:MethodCallExpression,reg:number,want:number):void{this.compileExpression(expr.object,reg,1);const methodK=this.addConstant(expr.method);this.emit(OpCode.SELF,reg,reg,256+methodK);for(let i=0;i<expr.arguments.length;i++){this.compileExpression(expr.arguments[i],reg+2+i,1);}this.emit(OpCode.CALL,reg,expr.arguments.length+2,want+1);}private compileIndexExpression(expr:IndexExpression,reg:number):void{this.compileExpression(expr.object,reg,1);const keyReg=this.locals.length+1;this.compileExpression(expr.index,keyReg,1);this.emit(OpCode.GETTABLE,reg,reg,keyReg);}private compileMemberExpression(expr:MemberExpression,reg:number):void{this.compileExpression(expr.object,reg,1);const k=this.addConstant(expr.property);this.emit(OpCode.GETTABLE,reg,reg,256+k);}}
function compileSource(source:string):{proto:Prototype;stats:CompileStats}{const ast=parse(source);const compiler=new Compiler(null,source);const proto=compiler.compile(ast);return{proto,stats:compiler.getStats()};}
function shuffleArray<T>(arr:T[]):T[]{const r=[...arr];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
function encodeNumber(n:number):string{if(n<0)return'-'+encodeNumber(-n);const r=Math.random();if(r<0.33)return n.toString();if(r<0.66)return'0x'+n.toString(16).toUpperCase();return'0x'+n.toString(16);}
function encryptBytes(data:number[],key:number):number[]{return data.map(b=>(b^key)&0xFF);}
function toBase64(bytes:number[]):string{const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';let result='';for(let i=0;i<bytes.length;i+=3){const b1=bytes[i];const b2=bytes[i+1]||0;const b3=bytes[i+2]||0;result+=chars[b1>>2];result+=chars[((b1&3)<<4)|(b2>>4)];result+=i+1<bytes.length?chars[((b2&15)<<2)|(b3>>6)]:'=';result+=i+2<bytes.length?chars[b3&63]:'=';}return result;}
function serializePrototype(proto:Prototype):number[]{const bytes:number[]=[];const writeInt=(n:number)=>{const un=n<0?n+4294967296:n;bytes.push(un&0xFF,(un>>8)&0xFF,(un>>16)&0xFF,(un>>24)&0xFF);};const writeDouble=(n:number)=>{const buf=new ArrayBuffer(8);new Float64Array(buf)[0]=n;const view=new Uint8Array(buf);for(let i=0;i<8;i++)bytes.push(view[i]);};const writeString=(s:string)=>{writeInt(s.length);for(let i=0;i<s.length;i++)bytes.push(s.charCodeAt(i)&0xFF);};writeInt(proto.numParams);bytes.push(proto.isVararg?1:0);writeInt(proto.maxStack);writeInt(proto.code.length);for(const inst of proto.code){bytes.push(inst.op);writeInt(inst.a);writeInt(inst.b);writeInt(inst.c);writeInt(inst.bx??0);writeInt(inst.sbx??0);}writeInt(proto.constants.length);for(const k of proto.constants){if(k===null){bytes.push(0);}else if(typeof k==='boolean'){bytes.push(1);bytes.push(k?1:0);}else if(typeof k==='number'){bytes.push(2);writeDouble(k);}else{bytes.push(3);writeString(k);}}writeInt(proto.protos.length);for(const p of proto.protos){const childBytes=serializePrototype(p);writeInt(childBytes.length);bytes.push(...childBytes);}writeInt(proto.upvalues.length);for(const uv of proto.upvalues){bytes.push(uv.instack?1:0);writeInt(uv.idx);}return bytes;}
class VMGenerator{private opcodeMap:Map<number,number>=new Map();private key:number;constructor(){this.key=Math.floor(Math.random()*200)+50;this.generateOpcodeMapping();}private generateOpcodeMapping():void{const opcodes:number[]=[];for(let i=0;i<=45;i++)opcodes.push(i);const shuffled=shuffleArray([...opcodes]);for(let i=0;i<opcodes.length;i++){this.opcodeMap.set(opcodes[i],shuffled[i]);}}private mapOpcode(op:number):number{return this.opcodeMap.get(op)??op;}private remapBytecode(proto:Prototype):Prototype{return{...proto,code:proto.code.map(inst=>({...inst,op:this.mapOpcode(inst.op)})),protos:proto.protos.map(p=>this.remapBytecode(p))};}generate(proto:Prototype):string{const remapped=this.remapBytecode(proto);const bytes=serializePrototype(remapped);const encrypted=encryptBytes(bytes,this.key);const b64=toBase64(encrypted);const opcodeTable=this.generateOpcodeTable();return this.buildVMCode(b64,opcodeTable);}private generateOpcodeTable():string{const entries:string[]=[];this.opcodeMap.forEach((mapped,original)=>{entries.push('['+encodeNumber(mapped)+']='+encodeNumber(original));});return entries.join(',');}
private buildVMCode(b64:string,opcodeTable:string):string{
const L:string[]=[];
L.push('return(function()');
L.push('local _bxor,_band,_bor,_rshift,_lshift');
L.push('do');
L.push('local _bit=bit32 or bit');
L.push('if _bit then');
L.push('_bxor,_band,_bor,_rshift,_lshift=_bit.bxor,_bit.band,_bit.bor,_bit.rshift,_bit.lshift');
L.push('else');
L.push('_bxor=function(_a,_c)local _r,_p=0,1;while _a>0 or _c>0 do local _ra,_rb=_a%2,_c%2;if _ra~=_rb then _r=_r+_p end;_a,_c,_p=(_a-_ra)/2,(_c-_rb)/2,_p*2 end;return _r end');
L.push('_band=function(_a,_c)local _r,_p=0,1;while _a>0 and _c>0 do local _ra,_rb=_a%2,_c%2;if _ra==1 and _rb==1 then _r=_r+_p end;_a,_c,_p=(_a-_ra)/2,(_c-_rb)/2,_p*2 end;return _r end');
L.push('_bor=function(_a,_c)local _r,_p=0,1;while _a>0 or _c>0 do local _ra,_rb=_a%2,_c%2;if _ra==1 or _rb==1 then _r=_r+_p end;_a,_c,_p=(_a-_ra)/2,(_c-_rb)/2,_p*2 end;return _r end');
L.push('_rshift=function(_a,_n)return math.floor(_a/(2^_n))end');
L.push('_lshift=function(_a,_n)return _a*(2^_n)end');
L.push('end');
L.push('end');
L.push('local _xorkey='+encodeNumber(this.key));
L.push('local _b64decode=(function()');
L.push('local _chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"');
L.push('local _lookup={}');
L.push('for _idx=1,64 do _lookup[_chars:sub(_idx,_idx)]=_idx-1 end');
L.push('return function(_str)');
L.push('local _result={}');
L.push('local _val,_bits=0,0');
L.push('for _idx=1,#_str do');
L.push('local _ch=_str:sub(_idx,_idx)');
L.push('if _lookup[_ch]then');
L.push('_val=_lshift(_val,6)+_lookup[_ch]');
L.push('_bits=_bits+6');
L.push('while _bits>=8 do');
L.push('_bits=_bits-8');
L.push('_result[#_result+1]=string.char(_band(_rshift(_val,_bits),255))');
L.push('end');
L.push('end');
L.push('end');
L.push('return table.concat(_result)');
L.push('end');
L.push('end)()');
L.push('local _bytecode="'+b64+'"');
L.push('local function _deserialize(_data,_key)');
L.push('local _pos=1');
L.push('local function _rb()local _b=_data:byte(_pos);_pos=_pos+1;return _bxor(_b or 0,_key)end');
L.push('local function _ri()local _a,_b,_c,_d=_rb(),_rb(),_rb(),_rb();return _a+_b*256+_c*65536+_d*16777216 end');
L.push('local function _rs()local _n=_ri();if _n>=2147483648 then _n=_n-4294967296 end;return _n end');
L.push('local function _rd()local _t={};for _idx=1,8 do _t[_idx]=_rb()end;local _sign=(_t[8]>127)and-1 or 1;local _exp=_band(_t[8],127)*16+_rshift(_t[7],4);local _mant=_band(_t[7],15);for _idx=6,1,-1 do _mant=_mant*256+_t[_idx]end;if _exp==0 then return 0 elseif _exp==2047 then return _mant==0 and _sign*(1/0)or(0/0)end;return _sign*(1+_mant/4503599627370496)*(2^(_exp-1023))end');
L.push('local function _rstr()local _len=_ri();local _t={};for _idx=1,_len do _t[_idx]=string.char(_rb())end;return table.concat(_t)end');
L.push('local function _rproto()');
L.push('local _np=_ri()');
L.push('local _iv=_rb()==1');
L.push('local _ms=_ri()');
L.push('local _cl=_ri()');
L.push('local _code={}');
L.push('for _idx=1,_cl do');
L.push('local _op=_rb()');
L.push('local _a=_rs()');
L.push('local _b=_rs()');
L.push('local _c=_rs()');
L.push('local _bx=_rs()');
L.push('local _sbx=_rs()');
L.push('_code[_idx]={op=_op,a=_a,b=_b,c=_c,bx=_bx,sbx=_sbx}');
L.push('end');
L.push('local _kl=_ri()');
L.push('local _constants={}');
L.push('for _idx=1,_kl do');
L.push('local _t=_rb()');
L.push('if _t==0 then _constants[_idx]=nil');
L.push('elseif _t==1 then _constants[_idx]=_rb()==1');
L.push('elseif _t==2 then _constants[_idx]=_rd()');
L.push('else _constants[_idx]=_rstr()end');
L.push('end');
L.push('local _pl=_ri()');
L.push('local _protos={}');
L.push('for _idx=1,_pl do');
L.push('local _=_ri()');
L.push('_protos[_idx]=_rproto()');
L.push('end');
L.push('local _ul=_ri()');
L.push('local _upvalues={}');
L.push('for _idx=1,_ul do');
L.push('_upvalues[_idx]={instack=_rb()==1,idx=_ri()}');
L.push('end');
L.push('return{code=_code,constants=_constants,protos=_protos,numParams=_np,isVararg=_iv,maxStack=_ms,upvalues=_upvalues}');
L.push('end');
L.push('return _rproto()');
L.push('end');
L.push('local _opcodes={'+opcodeTable+'}');
L.push('local function _execute(_proto,_env,_upvals,_varargs)');
L.push('local _code=_proto.code');
L.push('local _constants=_proto.constants');
L.push('local _protos=_proto.protos');
L.push('local _stack={}');
L.push('local _top=0');
L.push('local _openUpvals={}');
L.push('local _pc=1');
L.push('local _base=0');
L.push('_varargs=_varargs or{}');
L.push('for _idx=1,_proto.numParams do _stack[_idx-1]=_varargs[_idx]end');
L.push('_upvals.varargs={}');
L.push('for _idx=_proto.numParams+1,#_varargs do _upvals.varargs[_idx-_proto.numParams]=_varargs[_idx]end');
L.push('local function _RK(_x)if _x>=256 then return _constants[_x-255]else return _stack[_base+_x]end end');
L.push('while true do');
L.push('local _inst=_code[_pc]');
L.push('if not _inst then return end');
L.push('local _op=_inst.op');
L.push('local _A,_B,_C,_Bx,_sBx=_inst.a,_inst.b,_inst.c,_inst.bx,_inst.sbx');
L.push('_pc=_pc+1');
L.push('_A=_base+_A');
L.push('local _rop=_opcodes[_op]');
L.push('if _rop==nil then _rop=_op end');
L.push('if _rop==0 then _stack[_A]=nil');
L.push('elseif _rop==1 then _stack[_A]=_B==1;if _C==1 then _pc=_pc+1 end');
L.push('elseif _rop==2 then _stack[_A]=_constants[_Bx+1]');
L.push('elseif _rop==3 then _stack[_A]=_B');
L.push('elseif _rop==4 then _stack[_A]=_env[_constants[_Bx+1]]');
L.push('elseif _rop==5 then _env[_constants[_Bx+1]]=_stack[_A]');
L.push('elseif _rop==6 then _stack[_A]=_stack[_base+_B]');
L.push('elseif _rop==7 then _stack[_base+_B]=_stack[_A]');
L.push('elseif _rop==8 then _stack[_A]=_upvals[_B+1].val');
L.push('elseif _rop==9 then _upvals[_B+1].val=_stack[_A]');
L.push('elseif _rop==10 then _stack[_A]=_stack[_base+_B][_RK(_C)]');
L.push('elseif _rop==11 then _stack[_base+_A][_RK(_B)]=_RK(_C)');
L.push('elseif _rop==12 then _stack[_A]={}');
L.push('elseif _rop==13 then end');
L.push('elseif _rop==14 then _stack[_A]=_stack[_base+_B]+_stack[_base+_C]');
L.push('elseif _rop==15 then _stack[_A]=_stack[_base+_B]-_stack[_base+_C]');
L.push('elseif _rop==16 then _stack[_A]=_stack[_base+_B]*_stack[_base+_C]');
L.push('elseif _rop==17 then _stack[_A]=_stack[_base+_B]/_stack[_base+_C]');
L.push('elseif _rop==18 then _stack[_A]=_stack[_base+_B]%_stack[_base+_C]');
L.push('elseif _rop==19 then _stack[_A]=_stack[_base+_B]^_stack[_base+_C]');
L.push('elseif _rop==20 then _stack[_A]=math.floor(_stack[_base+_B]/_stack[_base+_C])');
L.push('elseif _rop==21 then _stack[_A]=-_stack[_base+_B]');
L.push('elseif _rop==22 then _stack[_A]=not _stack[_base+_B]');
L.push('elseif _rop==23 then _stack[_A]=#_stack[_base+_B]');
L.push('elseif _rop==24 then _stack[_A]=tostring(_stack[_base+_B])..tostring(_stack[_base+_C])');
L.push('elseif _rop==25 then if(_stack[_base+_B]==_stack[_base+_C])~=(_A==_base+1)then _pc=_pc+1 end');
L.push('elseif _rop==26 then if(_stack[_base+_B]<_stack[_base+_C])~=(_A==_base+1)then _pc=_pc+1 end');
L.push('elseif _rop==27 then if(_stack[_base+_B]<=_stack[_base+_C])~=(_A==_base+1)then _pc=_pc+1 end');
L.push('elseif _rop==28 then _pc=_pc+_sBx');
L.push('elseif _rop==29 then if _stack[_A]then _pc=_pc+_sBx end');
L.push('elseif _rop==30 then if not _stack[_A]then _pc=_pc+_sBx end');
L.push('elseif _rop==31 then');
L.push('local _nargs=_B-1');
L.push('local _nrets=_C-1');
L.push('local _func=_stack[_A]');
L.push('if _func==nil then error("attempt to call nil value")end');
L.push('local _args={}');
L.push('if _nargs<0 then _nargs=_top-_A end');
L.push('for _idx=1,_nargs do _args[_idx]=_stack[_A+_idx]end');
L.push('local _results={_func(unpack(_args,1,_nargs))}');
L.push('if _nrets<0 then');
L.push('for _idx=1,#_results do _stack[_A+_idx-1]=_results[_idx]end');
L.push('_top=_A+#_results-1');
L.push('else');
L.push('for _idx=1,_nrets do _stack[_A+_idx-1]=_results[_idx]end');
L.push('end');
L.push('elseif _rop==32 then');
L.push('local _nargs=_B-1');
L.push('local _func=_stack[_A]');
L.push('local _args={}');
L.push('if _nargs<0 then _nargs=_top-_A end');
L.push('for _idx=1,_nargs do _args[_idx]=_stack[_A+_idx]end');
L.push('return _func(unpack(_args,1,_nargs))');
L.push('elseif _rop==33 then');
L.push('local _nrets=_B-1');
L.push('if _nrets<0 then _nrets=_top-_A+1 end');
L.push('local _rets={}');
L.push('for _idx=1,_nrets do _rets[_idx]=_stack[_A+_idx-1]end');
L.push('return unpack(_rets,1,_nrets)');
L.push('elseif _rop==34 then');
L.push('local _newProto=_protos[_Bx+1]');
L.push('local _newUpvals={}');
L.push('for _idx,_uv in ipairs(_newProto.upvalues)do');
L.push('if _uv.instack then');
L.push('local _key=_base+_uv.idx');
L.push('if not _openUpvals[_key]then _openUpvals[_key]={val=_stack[_key]}end');
L.push('_newUpvals[_idx]=_openUpvals[_key]');
L.push('else');
L.push('_newUpvals[_idx]=_upvals[_uv.idx+1]');
L.push('end');
L.push('end');
L.push('_stack[_A]=function(...)return _execute(_newProto,_env,_newUpvals,{...})end');
L.push('elseif _rop==35 then');
L.push('local _va=_upvals.varargs or{}');
L.push('local _want=_B-1');
L.push('if _want<0 then');
L.push('for _idx=1,#_va do _stack[_A+_idx-1]=_va[_idx]end');
L.push('_top=_A+#_va-1');
L.push('else');
L.push('for _idx=1,_want do _stack[_A+_idx-1]=_va[_idx]end');
L.push('end');
L.push('elseif _rop==36 then');
L.push('local _obj=_stack[_base+_B]');
L.push('local _key=_RK(_C)');
L.push('_stack[_A+1]=_obj');
L.push('_stack[_A]=_obj[_key]');
L.push('elseif _rop==37 then');
L.push('_stack[_A]=_stack[_A]-_stack[_A+2]');
L.push('_pc=_pc+_sBx+1');
L.push('elseif _rop==38 then');
L.push('local _step=_stack[_A+2]');
L.push('local _idx=_stack[_A]+_step');
L.push('local _limit=_stack[_A+1]');
L.push('_stack[_A]=_idx');
L.push('if(_step>0 and _idx<=_limit)or(_step<=0 and _idx>=_limit)then');
L.push('_stack[_A+3]=_idx');
L.push('_pc=_pc+_sBx');
L.push('end');
L.push('elseif _rop==39 then');
L.push('local _iter=_stack[_A]');
L.push('local _state=_stack[_A+1]');
L.push('local _ctrl=_stack[_A+2]');
L.push('local _vals={_iter(_state,_ctrl)}');
L.push('for _idx=1,_C do _stack[_A+2+_idx]=_vals[_idx]end');
L.push('elseif _rop==40 then');
L.push('if _stack[_A+3]~=nil then');
L.push('_stack[_A+2]=_stack[_A+3]');
L.push('_pc=_pc+_sBx');
L.push('end');
L.push('elseif _rop==41 then end');
L.push('elseif _rop==42 then _stack[_A]=_stack[_base+_B]');
L.push('elseif _rop==43 then if not _stack[_A]==(_C~=0)then _pc=_pc+1 end');
L.push('elseif _rop==44 then if not _stack[_base+_B]==(_C~=0)then _stack[_A]=_stack[_base+_B]else _pc=_pc+1 end');
L.push('elseif _rop==45 then end');
L.push('end');
L.push('end');
L.push('end');
L.push('local _globalEnv');
L.push('if getgenv then _globalEnv=getgenv()');
L.push('elseif getfenv then _globalEnv=getfenv(0)');
L.push('else _globalEnv=_G or _ENV end');
L.push('local _envProxy=setmetatable({},{');
L.push('__index=function(_,_k)return _globalEnv[_k]end,');
L.push('__newindex=function(_,_k,_v)_globalEnv[_k]=_v end');
L.push('})');
L.push('local _mainProto=_deserialize(_b64decode(_bytecode),_xorkey)');
L.push('return _execute(_mainProto,_envProxy,{})');
L.push('end)()');
return L.join('\n');
}}
export interface ObfuscateOptions{debug?:boolean}
export interface ObfuscateResult{code:string;map:Record<string,string>;stats:{originalLength:number;outputLength:number;timeMs:number;instructionCount:number;constantCount:number;prototypeCount:number;identifiersRenamed:number;stringsEncrypted:number;numbersObfuscated:number;functionsFlattened:number}}
export function obfuscate(source:string,options:ObfuscateOptions={}):ObfuscateResult{const startTime=Date.now();try{const{proto,stats}=compileSource(source);const vmGen=new VMGenerator();const code=vmGen.generate(proto);const countProtos=(p:Prototype):number=>1+p.protos.reduce((a,c)=>a+countProtos(c),0);return{code,map:{},stats:{originalLength:source.length,outputLength:code.length,timeMs:Date.now()-startTime,instructionCount:proto.code.length,constantCount:proto.constants.length,prototypeCount:countProtos(proto),identifiersRenamed:stats.identifiers,stringsEncrypted:stats.strings,numbersObfuscated:stats.numbers,functionsFlattened:stats.functions}};}catch(e){throw new Error('Obfuscation failed: '+(e instanceof Error?e.message:String(e)));}}
export default{obfuscate,parse,tokenize};
