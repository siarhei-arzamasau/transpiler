const { EvaMPP } = require('../src/transpiler/EvaMPP');

const eva = new EvaMPP();

const { ast, target } = eva.compile(`

  // Each function can be spawned as a process:

  (def handle (id)
    (begin
      (print id 1)
      (print id 2)
    )
  )

  (handle "x") // x 1, x 2
  (handle "y") // y 1, y 2

  // Parallel execution:
  //
  // x 1, y 1, x 2, y 2, ...

  (spawn handle "x")
  (spawn handle "y")
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
