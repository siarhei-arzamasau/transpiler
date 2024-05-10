const { JSCodegen } = require('../codegen/JSCodegen');

/**
 * JSCodegen instance.
 */
const jsCodegen = new JSCodegen();

/**
 * Eva MPP to JavaScript transpiler.
 */
class EvaMPP {
  /**
   * Compiles Eva MPP program to JavaScript.
   */
  compile(program) {
    // 1. TODO: Parse source code:
    // const evaAST = evaParser.parse(program);

    const evaAST = program; // 1, ['+', 5, 3], etc.

    // 2. Translate to JavaScript AST:
    const jsAST = this.gen(evaAST);

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
    // TODO
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

    throw `Unexpected expression ${JSON.stringify(exp)}`;
  }

  /**
   * Whether expression is a number.
   */
  _isNumber(exp) {
    return typeof exp === 'number';
  }
}

module.exports = {
  EvaMPP,
};
