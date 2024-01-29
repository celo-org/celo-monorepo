#!/usr/bin/env yarn run ts-node -r tsconfig-paths/register --cwd ../celotool
import yargs from 'yargs'

// eslint-disable-next-line  @typescript-eslint/no-unused-expressions
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
  .option('helmdryrun', {
    type: 'boolean',
    description: 'Simulate the Helm deployment. Other deployment operations can be executed',
    default: false,
  })
  .middleware([
    (argv: any) => {
      process.env.CELOTOOL_VERBOSE = argv.verbose
      process.env.CELOTOOL_CONFIRMED = argv.yesreally
      process.env.CELOTOOL_HELM_DRY_RUN = argv.helmdryrun
    },
  ])
  .commandDir('cmds', { extensions: ['ts'] })
  .demandCommand()
  .help()
  .wrap(yargs.terminalWidth()).argv
