/**
 * JavaScript code generator.
 */
class JSCodegen {
  /**
   * Generates code for Program.
   */
  generate(exp) {
    return this.gen(exp);
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
}

module.exports = {
  JSCodegen,
};
