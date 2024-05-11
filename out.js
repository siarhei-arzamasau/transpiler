
// Prologue:
const { print } = require('./src/runtime');

let x = 42;
if ((x === 42)) {
  x = 100;
  print("Universe");
}  else {
  print("Unknown");
}
