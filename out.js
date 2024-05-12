
// Prologue:
const { print } = require('./src/runtime');

let i = 5;
let j = 10;
j++;
print("j =", j);
while ((i > 0)) {
  print("i =", i);
  i--;
}
