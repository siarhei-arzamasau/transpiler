const { EvaMPP } = require('../src/transpiler/EvaMPP');

const eva = new EvaMPP();

const { ast, target } = eva.compile(`

  (var user-name "John")

  // (print "user =" user-name)

  (set user-name "Alex")

  // (print "user =" user-name)

`);

console.log('\n----------------------------------------');
console.log(` 1. Compiled AST:\n`);

// JS AST:
console.log(JSON.stringify(ast, null, 2));

console.log('\n----------------------------------------');
console.log(` 2. Compiled code:\n`);

// JS Code:
console.log(target);

// Run compiled code:

console.log('\n----------------------------------------');
console.log(` 3. Result:\n`);

// executed from ./compile-run.sh