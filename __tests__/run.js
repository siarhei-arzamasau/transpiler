const { EvaMPP } = require('../src/transpiler/EvaMPP');

const eva = new EvaMPP();

const { ast, target } = eva.compile(`

  // Lists

  (var data (list 1 2 3))

  (idx data 0) // 1

  (print data (idx data 0))



  // Records:

  (var z 3)

  (var point (rec (x 1) (y 2) z))

  (prop point x) // 1

  (print point (prop point x))
  




  // Pattern matching:

  // (var value (rec (x 1) (y 2)))

  // (match value
  // (rec (x 1) (y 2)) (print "x is 1")
  //   (rec (x 1) y) (print "y is any")
  //     _ "something else"
  // )

`);

// TODO Possible improvement for loop: (for (var i 5) (> i 0) (-- i) <body>)
// (begin
//   (var i 5)
//   (while (> i 0))
//      (begin
//        <body>
//        (set i (- i 1))
//      )
// )

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
