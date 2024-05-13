/**
 * Leightweight process (aka "green thread").
 */

class Process {
  /**
   * Initiates the process.
   */
  constructor(handlerFn, ...args) {
    /**
     * Handler generator.
     */
    this.handler = handlerFn.apply(this, args);

    /**
     * Process ID.
     */
    this.pid = ++Process.pid;

    /**
     * Process name.
     */
    this.name = handlerFn.name || this.pid;
  }

  /**
   * String representation.
   */
  toString() {
    return `#${this.pid} (${this.name})`;
  }
}

/**
 * Global process ID.
 */
Process.pid = 0;

module.exports = {
  Process,
};
