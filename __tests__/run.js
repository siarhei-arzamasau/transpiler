const { EvaMPP } = require('../src/transpiler/EvaMPP');

const eva = new EvaMPP();

const { ast, target } = eva.compile(`

  (var i 5)

  (while (> i 0)
    (begin 
      (print "i =" i)
      (set i (- i 1))  // TODO: (-- i) Syntactic sugar
    )
  )

  // TODO: (for (var i 5) (> i 0) (-- i) <body>)
  // (begin
  //   (var i 5)
  //   (while (> i 0))
  //      (begin
  //        <body>
  //        (set i (- i 1))
  //      )
  // )

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
