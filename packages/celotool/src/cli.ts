#!/usr/bin/env yarn run ts-node -r tsconfig-paths/register --cwd ../celotool
import * as yargs from 'yargs'

// tslint:disable-next-line: no-unused-expression
yargs
  .scriptName('celotooljs')
  .option('verbose', {
    type: 'boolean',
    description:
      'Whether to show a bunch of debugging output like stdout and stderr of shell commands',
    default: false,
  })
  .option('yesreally', {
    type: 'boolean',
    description: 'Reply "yes" to prompts about changing staging/production (be careful!)',
    default: false,
  })
  .middleware([
    (argv: any) => {
      process.env.CELOTOOL_VERBOSE = argv.verbose
      process.env.CELOTOOL_CONFIRMED = argv.yesreally
    },
  ])
  .commandDir('cmds', { extensions: ['ts'] })
  .demandCommand()
  .help()
  .wrap(yargs.terminalWidth()).argv
