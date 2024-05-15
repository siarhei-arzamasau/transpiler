const evaParser = require('../parser/evaParser');

const { JSCodegen } = require('../codegen/JSCodegen');
const { JSTransform } = require('../transform/JSTransform');

const fs = require('node:fs');

/**
 * JSCodegen instance.
 */
const jsCodegen = new JSCodegen({ indent: 2 });

/**
 * JSTransform instance.
 */
const jsTransform = new JSTransform();

/**
 * Eva MPP to JavaScript transpiler.
 */
class EvaMPP {
  /**
   * Compiles Eva MPP program to JavaScript.
   */
  compile(program) {
    // Functions map.
    this._functions = {};

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
const { print, spawn, sleep, scheduler } = require('./src/runtime');

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

    const prevBlock = this._currentBlock;
    const body = (this._currentBlock = []);

    expressions.forEach((exp) => body.push(this._toStatement(this.gen(exp))));

    this._currentBlock = prevBlock;

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
    // Prefix Increment or decrement.
    if (this._isPrefixUpdateExpression(exp)) {
      return {
        type: 'PrefixUpdateExpression',
        operator: exp[0],
        argument: this.gen(exp[1]),
      };
    }

    // -------------------------------------------------------
    // Postfix Increment or decrement.
    if (this._isPostfixUpdateExpression(exp)) {
      return {
        type: 'PostfixUpdateExpression',
        operator: exp[1],
        argument: this.gen(exp[0]),
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

      const prevBlock = this._currentBlock;
      const body = (this._currentBlock = []);

      expressions.forEach((exp) => body.push(this._toStatement(this.gen(exp))));

      this._currentBlock = prevBlock;

      return {
        type: 'BlockStatement',
        body,
      };
    }

    // -------------------------------------------------------
    // If statement: (if <test> <consequent> <alternate>)
    if (exp[0] === 'if') {
      return {
        type: 'IfStatement',
        test: this.gen(exp[1]),
        consequent: this._toStatement(this.gen(exp[2])),
        alternate: this._toStatement(this.gen(exp[3])),
      };
    }

    // -------------------------------------------------------
    // While loop
    if (exp[0] === 'while') {
      return {
        type: 'WhileStatement',
        test: this.gen(exp[1]),
        body: this._toStatement(this.gen(exp[2])),
      };
    }

    // -------------------------------------------------------
    // Functions: (def square (x) (* x x))
    if (exp[0] === 'def') {
      const id = this.gen(this._toVariableName(exp[1]));

      const params = exp[2].map((exp) => this.gen(exp));

      let bodyExp = exp[3];

      if (!this._hasBlock(bodyExp)) {
        bodyExp = ['begin', bodyExp];
      }

      const last = bodyExp[bodyExp.length - 1];

      if (!this._isStatement(last) && last[0] !== 'return') {
        bodyExp[bodyExp.length - 1] = ['return', last];
      }

      const body = this.gen(bodyExp);

      const fn = {
        type: 'FunctionDeclaration',
        id,
        params,
        body,
      };

      this._functions[id.name] = {
        fn,
        definingBlock: this._currentBlock,
        index: this._currentBlock.length,
      };

      return fn;
    }

    // -------------------------------------------------------
    // Return: (return x)
    if (exp[0] === 'return') {
      return {
        type: 'ReturnStatement',
        argument: this.gen(exp[1]),
      };
    }

    // -------------------------------------------------------
    // List: (list 1 2 3)
    if (exp[0] === 'list') {
      const elements = exp.slice(1).map((element) => this.gen(element));

      return {
        type: 'ArrayExpression',
        elements,
      };
    }

    // -------------------------------------------------------
    // List index: (idx p 0)

    if (exp[0] === 'idx') {
      return {
        type: 'MemberExpression',
        computed: true,
        object: this.gen(exp[1]),
        property: this.gen(exp[2]),
      };
    }

    // -------------------------------------------------------
    // Record: (rec (key value) key)

    if (exp[0] === 'rec') {
      const properties = exp.slice(1).map((entry) => {
        let key;
        let value;

        if (Array.isArray(entry)) {
          key = this.gen(entry[0]);
          value = this.gen(entry[1]);
        } else {
          key = this.gen(entry);
          value = key;
        }

        return {
          type: 'ObjectProperty',
          key,
          value,
        };
      });

      return {
        type: 'ObjectExpression',
        properties,
      };
    }

    // -------------------------------------------------------
    // Property access: (prop p x)
    if (exp[0] === 'prop') {
      return {
        type: 'MemberExpression',
        object: this.gen(exp[1]),
        property: this.gen(exp[2]),
      }
    }

    // -------------------------------------------------------
    // Function calls: (square 2)
    if (Array.isArray(exp)) {
      const fnName = this._toVariableName(exp[0]);

      const callee = this.gen(fnName);
      const args = exp.slice(1).map((arg) => this.gen(arg));

      // Dynamically allocate a process function if the
      // original function is used in the spawn(...) call:
      if (callee.name === 'spawn') {
        const fnName = args[0].name;
        const processName = `_${fnName}`;

        if (this._functions[processName] == null) {
          // Create a process handler from the original function.
          const processFn = jsTransform.functionToAsyncGenerator(this._functions[fnName].fn);

          this._functions[processName] = {
            ...this._functions[fnName],
            fn: processFn,
            index: this._functions[fnName].index + 1,
          };

          // And push ot to the same block where the
          // original function is defined.
          this._functions[fnName].definingBlock.splice(this._functions[processName].index, 0, processFn);
        }
        args[0].name = processName;
      }

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
   * Whether Eva node creates a block.
   */
  _hasBlock(exp) {
    return exp[0] === 'begin';
  }

  /**
   * Whether Eva node is a statement.
   */
  _isStatement(exp) {
    return exp[0] === 'begin' || exp[0] === 'if' || exp[0] === 'while' || exp[0] === 'var';
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
   * Whether the expression is prefix update: increment or decrement
   */
  _isPrefixUpdateExpression(exp) {
    if (exp.length !== 2) {
      return false;
    }

    if (exp[0] === '++' || exp[0] === '--') {
      return true;
    }
  }

  /**
   * Whether the expression is postfix update: increment or decrement
   */
  _isPostfixUpdateExpression(exp) {
    if (exp.length !== 2) {
      return false;
    }

    if (exp[1] === '++' || exp[1] === '--') {
      return true;
    }
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
      case 'PrefixUpdateExpression':
      case 'PostfixUpdateExpression':
      case 'YieldExpression':
      case 'ArrayExpression':
      case 'MemberExpression':
        return { type: 'ExpressionStatement', expression };
      default:
        return expression;
    }
  }
}

module.exports = {
  EvaMPP,
};
