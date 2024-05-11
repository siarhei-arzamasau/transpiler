const evaParser = require('../parser/evaParser');

const { JSCodegen } = require('../codegen/JSCodegen');

const fs = require('node:fs');

/**
 * JSCodegen instance.
 */
const jsCodegen = new JSCodegen({ indent: 2 });

/**
 * Eva MPP to JavaScript transpiler.
 */
class EvaMPP {
  /**
   * Compiles Eva MPP program to JavaScript.
   */
  compile(program) {
    // 1. Parse source code:
    const evaAST = evaParser.parse(`(begin ${program})`);

    // 2. Translate to JavaScript AST:
    const jsAST = this.genProgram(evaAST);

    // 3. Generate JavaScript code:
    const target = jsCodegen.generate(jsAST);

    // 4. Write compiled code to file:
    this.saveToFile('./out.js', target);

    return { ast: jsAST, target };
  }

  /**
   * Saves compiled code to file.
   */
  saveToFile(filename, code) {
    const out = `
// Prologue:
const { print } = require('./src/runtime');

${code}
`;

    fs.writeFileSync(filename, out, 'utf-8');
  }

  /**
   * Codegen entire program.
   */
  genProgram(programBlock) {
    // A program is a implicit (begin ...) block:
    const [_tag, ...expressions] = programBlock;

    const body = [];

    expressions.forEach((exp) => body.push(this._toStatement(this.gen(exp))));

    return {
      type: 'Program',
      body,
    };
  }

  /**
   * Transpiles Eva AST to JavaScript AST.
   */
  gen(exp) {
    // -------------------------------------------------------
    // Self-evaluating expressions.

    if (this._isNumber(exp)) {
      return {
        type: 'NumericLiteral',
        value: exp,
      };
    }

    if (this._isString(exp)) {
      return {
        type: 'StringLiteral',
        value: exp.slice(1, -1),
      };
    }

    // -------------------------------------------------------
    // Variable access: foo
    if (this._isVariableName(exp)) {
      return {
        type: 'Identifier',
        name: this._toVariableName(exp),
      };
    }

    // -------------------------------------------------------
    // Variables: (var x 10)
    if (exp[0] === 'var') {
      return {
        type: 'VariableDeclaration',
        declarations: [
          {
            type: 'VariableDeclarator',
            id: this.gen(this._toVariableName(exp[1])),
            init: this.gen(exp[2]),
          },
        ],
      };
    }

    // -------------------------------------------------------
    // Variable update: (set x 10)
    if (exp[0] === 'set') {
      return {
        type: 'AssignmentExpression',
        operator: '=',
        left: this.gen(this._toVariableName(exp[1])),
        right: this.gen(exp[2]),
      };
    }

    // -------------------------------------------------------
    // Unary expression.
    if (this._isUnary(exp)) {
      let operator = exp[0];

      if (exp[0] === 'not') {
        operator = '!';
      }

      return {
        type: 'UnaryExpression',
        operator,
        argument: this.gen(exp[1]),
      };
    }

    // -------------------------------------------------------
    // Binary expression.
    if (this._isBinary(exp)) {
      return {
        type: 'BinaryExpression',
        left: this.gen(exp[1]),
        operator: exp[0],
        right: this.gen(exp[2]),
      };
    }

    // -------------------------------------------------------
    // Logical binary expression.
    if (this._isLogicalBinary(exp)) {
      let operator;

      switch (exp[0]) {
        case 'or':
          operator = '||';
          break;
        case 'and':
          operator = '&&';
          break;
        default:
          throw `Unknown logical operator ${exp[0]}.`;
      }

      return {
        type: 'LogicalExpression',
        left: this.gen(exp[1]),
        operator,
        right: this.gen(exp[2]),
      };
    }

    // -------------------------------------------------------
    // Block.
    if (exp[0] === 'begin') {
      const [_tag, ...expressions] = exp;

      const body = [];

      expressions.forEach((exp) => body.push(this._toStatement(this.gen(exp))));

      return {
        type: 'BlockStatement',
        body,
      };
    }

    // -------------------------------------------------------
    // Function calls: (square 2)

    if (Array.isArray(exp)) {
      const fnName = this._toVariableName(exp[0]);

      const callee = this.gen(fnName);
      const args = exp.slice(1).map((arg) => this.gen(arg));

      return {
        type: 'CallExpression',
        callee,
        arguments: args,
      };
    }

    throw `Unexpected expression ${JSON.stringify(exp)}`;
  }

  /**
   * Whether expression is a variable name.
   */
  _isVariableName(exp) {
    return typeof exp === 'string' && /^[+\-*/<>=a-zA-Z0-9_\.]+$/.test(exp);
  }

  /**
   * Converts an Eva variable name to JS format.
   */
  _toVariableName(exp) {
    return this._toJSName(exp);
  }

  /**
   * Whether the expression is a binary.
   */
  _isBinary(exp) {
    if (exp.length !== 3) {
      return false;
    }

    return (
      exp[0] === '+' ||
      exp[0] === '-' ||
      exp[0] === '*' ||
      exp[0] === '/' ||
      exp[0] === '==' ||
      exp[0] === '!=' ||
      exp[0] === '>' ||
      exp[0] === '>=' ||
      exp[0] === '<' ||
      exp[0] === '<='
    );
  }

  /**
   * Whether the expression is logical.
   */
  _isLogicalBinary(exp) {
    if (exp.length !== 3) {
      return false;
    }

    return exp[0] === 'or' || exp[0] === 'and';
  }

  /**
   * Whether the expression is unary.
   */
  _isUnary(exp) {
    if (exp.length !== 2) {
      return false;
    }

    return exp[0] === 'not' || exp[0] === '-';
  }

  /**
   * Converts dash-name (Eva) to camelCase (JS).
   */
  _toJSName(name) {
    return name.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Whether expression is a number.
   */
  _isNumber(exp) {
    return typeof exp === 'number';
  }

  /**
   * Whether expression is a string.
   */
  _isString(exp) {
    return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
  }

  /**
   * Converts an expression to a statement.
   */
  _toStatement(expression) {
    switch (expression.type) {
      case 'NumericLiteral':
      case 'StringLiteral':
      case 'AssignmentExpression':
      case 'Identifier':
      case 'CallExpression':
      case 'BinaryExpression':
      case 'LogicalExpression':
      case 'UnaryExpression':
        return { type: 'ExpressionStatement', expression };
      default:
        return expression;
    }
  }
}

module.exports = {
  EvaMPP,
};
