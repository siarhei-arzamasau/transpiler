/**
 * Print to stdout.
 */
function print(...args) {
  console.log(...args);
}

/**
 * Spawns a process.
 */
function spawn(fn, ...args) {
  // TODO: Process Scheduler
}

module.exports = {
  print,
  spawn,
};
