
// Prologue:
const { print, spawn, sleep, scheduler } = require('./src/runtime');


function handle(id) {
  print(id, 1);
  return print(id, 2)
}


async function* _handle(id) {
  print(id, 1);
  yield;
  return print(id, 2)
}

spawn(_handle, "x");
spawn(handle, "y");
