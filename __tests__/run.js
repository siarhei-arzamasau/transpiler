const { EvaMPP } = require('../src/transpiler/EvaMPP');

const eva = new EvaMPP();

const { ast, target } = eva.compile(`

  (var x 42)

  (if (== x 42)
    (begin 
      (set x 100)
      (print "Universe"))
    (begin 
      (print "Unknown")
    )
    
  )

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

/* executed from ./compile-run.sh */
