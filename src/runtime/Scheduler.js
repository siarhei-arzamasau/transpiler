/**
 * Process scheduler.
 */

const { Process } = require('./Process');

/**
 * Process scheduler. Implements simple round-robin scheduling.
 */
class Scheduler {
  /**
   * Initializes a Scheduler instance.
   */
  constructor() {
    /**
     * All alive processes.
     */
    this.processes = new Set();

    /**
     * Scheduled processes.
     */
    this.runQueue = [];
  }

  /**
   * Spawns a new process.
   */
  spawn(handlerFn, ...args) {
    const process = new Process(handlerFn, ...args);
    this.processes.add(process);

    console.log(`* Spawning a new process ${process}`);

    this.schedule(process);
    return process;
  }

  /**
   * Schedules a process.
   */
  schedule(process) {
    this.runQueue.push(process);
  }

  /**
   * Terminates a process.
   */
  terminate(process) {
    console.log(`* Process ${process} is terminated`);
    this.processes.delete(process);
  }

  /**
   * Sleep
   */
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Runs all iterations of this process.
   */
  async handleProcess(process) {
    try {
      for await (let it of process.handler) {
      }
    } catch (e) {
      console.log(`* Process ${process} threw an exception "${e}", terminating.`);
    }

    this.terminate(process);
  }

  /**
   * Main run loop.
   */
  async run() {
    while (true) {
      if (this.runQueue.length > 0) {
        // Run all the processes in parallel.
        Promise.all(this.runQueue.map((process) => this.handleProcess(process)));

        // Flush the queue.
        this.runQueue.length = 0;
      }

      await this.sleep(10);
    }
  }

  /**
   * Start the scheduler.
   */
  start() {
    setTimeout(() => this.run(), 0);
  }
}

module.exports = {
  Scheduler,
};
