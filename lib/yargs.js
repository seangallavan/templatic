'use strict';

exports.demandCommand = (yargs, dir) => {
  yargs
    .commandDir(dir)
    .demandCommand()
    .help()
    .strict()
    .wrap(yargs.terminalWidth());

  return yargs;
};
