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
