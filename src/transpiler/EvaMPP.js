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
    fs.writeFileSync(filename, code, 'utf-8');
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

    throw `Unexpected expression ${JSON.stringify(exp)}`;
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
        return { type: 'ExpressionStatement', expression };
      default:
        return expression;
    }
  }
}

module.exports = {
  EvaMPP,
};
