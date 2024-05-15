/**
 * JavaScript code generator.
 */
class JSCodegen {
  /**
   * Codegen options.
   */
  constructor({ indent = 2 }) {
    this._indent = indent;
    this._currentIndent = 0;
  }

  /**
   * Generates code for Program.
   */
  generate(exp) {
    return this.Program(exp);
  }

  /**
   * Program.
   */
  Program(exp) {
    return exp.body.map((exp) => this.gen(exp)).join('\n');
  }

  /**
   * Generates code for a JS node.
   */
  gen(exp) {
    if (this[exp.type] === null) {
      throw `Unexpected expression: "${exp.type}"`;
    }

    return this[exp.type](exp);
  }

  /**
   * NumericLiteral.
   */
  NumericLiteral(exp) {
    return `${exp.value}`;
  }

  /**
   * StringLiteral.
   */
  StringLiteral(exp) {
    return `"${exp.value}"`;
  }

  /**
   * Identifier.
   */
  Identifier(exp) {
    return exp.name;
  }

  /**
   * VariableDeclaration.
   */
  VariableDeclaration(exp) {
    let { id, init } = exp.declarations[0];
    return `let ${this.gen(id)} = ${this.gen(init)};`;
  }

  /**
   * AssignmentExpression.
   */
  AssignmentExpression(exp) {
    return `${this.gen(exp.left)} ${exp.operator} ${this.gen(exp.right)}`;
  }

  /**
   * CallExpression.
   */
  CallExpression(exp) {
    const callee = this.gen(exp.callee);
    const args = exp.arguments.map((arg) => this.gen(arg)).join(', ');
    return `${callee}(${args})`;
  }

  /**
   * BinaryExpression.
   */
  BinaryExpression(exp) {
    let operator = exp.operator;

    if (operator === '==') {
      operator = '===';
    }

    if (operator === '!=') {
      operator = '!==';
    }

    return `(${this.gen(exp.left)} ${operator} ${this.gen(exp.right)})`;
  }

  /**
   * IfStatement.
   */
  IfStatement(exp) {
    const test = this.gen(exp.test);
    const consequent = this.gen(exp.consequent);

    const alternate = exp.alternate != null ? ` else ${this.gen(exp.alternate)}` : '';

    return `if (${test}) ${consequent} ${alternate}`;
  }

  /**
   * WhileStatement.
   */
  WhileStatement(exp) {
    return `while (${this.gen(exp.test)}) ${this.gen(exp.body)}`;
  }

  /**
   * ReturnStatement.
   */
  ReturnStatement(exp) {
    return `return ${this.gen(exp.argument)}`;
  }

  /**
   * ArrayExpression
   */
  ArrayExpression(exp) {
    const elements = exp.elements.map((element) => this.gen(element));
    return `[${elements.join(', ')}]`;
  }

  /**
   * MemberExpression.
   */
  MemberExpression(exp) {
    if (exp.computed) {
      return `${this.gen(exp.object)}[${this.gen(exp.property)}]`;
    }

    return `${this.gen(exp.object)}.${this.gen(exp.property)}`;
  }

  /**
   * FunctionDeclaration
   */
  FunctionDeclaration(exp) {
    const id = this.gen(exp.id);
    const params = exp.params.map((param) => this.gen(param)).join(', ');
    const body = this.gen(exp.body);
    const async = exp.async ? 'async ' : '';
    const generator = exp.generator ? '*' : '';

    return `\n${async}function${generator} ${id}(${params}) ${body}\n`;
  }

  /**
   * YieldExpression.
   */
  YieldExpression(exp) {
    return `yield`;
  }

  /**
   * LogicalExpression.
   */
  LogicalExpression(exp) {
    return `(${this.gen(exp.left)} ${exp.operator} ${this.gen(exp.right)})`;
  }

  /**
   * UnaryExpression.
   */
  UnaryExpression(exp) {
    return `${exp.operator}${this.gen(exp.argument)}`;
  }

  /**
   * PrefixUpdateExpression
   */
  PrefixUpdateExpression(exp) {
    return `${exp.operator}${this.gen(exp.argument)}`;
  }

  /**
   * PostfixUpdateExpression
   */
  PostfixUpdateExpression(exp) {
    return `${this.gen(exp.argument)}${exp.operator}`;
  }

  /**
   * BlockStatement.
   */
  BlockStatement(exp) {
    this._currentIndent += this._indent;

    let result = '{\n' + `${exp.body.map((exp) => this._ind() + this.gen(exp)).join('\n')}` + '\n';

    this._currentIndent -= this._indent;

    result += this._ind() + '}';

    return result;
  }

  ExpressionStatement(exp) {
    return `${this.gen(exp.expression)};`;
  }

  /**
   * Indent print.
   */
  _ind() {
    return ' '.repeat(this._currentIndent);
  }
}

module.exports = {
  JSCodegen,
};
