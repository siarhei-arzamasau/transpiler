
// Prologue:
const { print } = require('./src/runtime');


function square(x) {
  return (x * x)
}

print(square(2));

function sum(a, b) {
  let c = 30;
  return (c * (a + b))
}

print(sum(10, 20));
