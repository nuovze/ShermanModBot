require("colors");

class ExitHandler {
  //initialize
  static init(client) {
    console.log(`Registered client with ExitHandler... your crashes are protected now :)`.inverse, "\n...");

    //when app is closing
    process.on("exit", this.exitHandler.bind(null, client, {clean: true}));

    //catches ctrl-c event
    process.on("SIGINT", this.exitHandler.bind(null, client, {clean: true}));

    //catches kill pid
    process.on("SIGUSR1", this.exitHandler.bind(null, client, {clean: true}));
    process.on("SIGUSR2", this.exitHandler.bind(null, client, {clean: true}));

    //catches uncaught exceptions
    process.on("uncaughtException", (e) => {
      console.log("Uncaught exception:");
      console.log(e.stack.red.dim);
    });

    //catch unhandled promise rejections
    process.on("unhandledRejection", (e) => {
      console.log("Unhandled rejection:");
      console.log(e.stack.red.dim);
    });
  }

  static exitHandler(client, options, exitCode) {
    //if we executed the "restart" command
    if(exitCode == 99) return;

    console.log(`Preparing to shutdown with exit code (${exitCode})...`.magenta);

    if(exitCode == 2) {
      console.log("Forcing shutdown without clean attempt, process will not be restarted".red);
      client.destroy();
    } else if(options.clean) {
      console.log("Attempting to shutdown cleanly and restart...".magenta);
      client.commands.get("restart").run(client, null, null);
    }
  }
}

module.exports = ExitHandler;
