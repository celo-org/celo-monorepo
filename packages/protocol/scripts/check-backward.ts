import { DefaultCategorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { ASTBackwardReport } from '@celo/protocol/lib/compatibility/utils'
import { ContractVersion } from '@celo/protocol/lib/compatibility/version'
import { writeJsonSync } from 'fs-extra'
import * as path from 'path'
import * as tmp from 'tmp'
import * as yargs from 'yargs'

const COMMAND_REPORT = 'report'
const COMMAND_SEM_CHECK = 'sem_check'
const COMMAND_SEM_INFER = 'sem_infer'
const COMMAND_SEM_DELTA = 'sem_delta'

const verCheck = (ver): boolean => {
  if (ver === undefined || ContractVersion.isValid(ver)) {
    return true
  }
  throw new Error(`Invalid version format: '${ver}'. Expeting 's.x.y.z' instead`)
}

const argv = yargs
  .command(COMMAND_REPORT, 'Generates a backward compatibility report')
  .command(
    COMMAND_SEM_CHECK,
    'Check if the semantic version change provided is correct (exit code 0, or 1 otherwise)',
    {
      old_version: {
        demandOption: true,
      },
      new_version: {
        demandOption: true,
      },
    }
  )
  .command(COMMAND_SEM_INFER, 'Infer what the semantic version change should be', {
    old_version: {
      demandOption: true,
    },
  })
  .command(COMMAND_SEM_DELTA, 'Generates the semantic version delta')
  .option('exclude', {
    alias: 'e',
    description: 'Contract name exclusion pattern',
    type: 'string',
  })
  .option('old_contracts', {
    alias: 'o',
    description: 'Old contracts build artifacts folder',
    type: 'string',
    demandOption: true,
  })
  .option('new_contracts', {
    alias: 'n',
    description: 'Old contracts build artifacts folder',
    type: 'string',
    demandOption: true,
  })
  .option('old_version', {
    alias: 'v',
    description: 'Semantic version string for the old contracts',
    type: 'string',
  })
  .option('new_version', {
    alias: 'w',
    description: 'Semantic version string for the new contracts',
    type: 'string',
  })
  .option('output_file', {
    alias: 'f',
    description: 'Destination file output for the compatibility report',
    type: 'string',
  })
  .option('quiet', {
    alias: 'q',
    description: 'Run in quiet mode (no logs)',
    default: false,
    type: 'boolean',
  })
  .help()
  .alias('help', 'h')
  .showHelpOnFail(true)
  .demandCommand()
  .check((av) => verCheck(av.old_version))
  .check((av) => verCheck(av.new_version))
  .strict().argv

const oldArtifactsFolder = path.resolve(argv.old_contracts)
const newArtifactsFolder = path.resolve(argv.new_contracts)

const out = (msg: string, force?: boolean): void => {
  if (force || !argv.quiet) {
    process.stdout.write(msg)
  }
}

const outFile = argv.output_file ? argv.output_file : tmp.tmpNameSync({})
const exclude = argv.exclude ? argv.exclude : ''

try {
  const backward = ASTBackwardReport.create(
    oldArtifactsFolder,
    newArtifactsFolder,
    exclude,
    new DefaultCategorizer(),
    out
  )
  out(`Writing report to ${outFile} ...`)
  writeJsonSync(outFile, backward, { spaces: 2 })
  out('Done\n')
  if (argv._.includes(COMMAND_REPORT)) {
    // Report always generated
    // Placebo command
  } else if (argv._.includes(COMMAND_SEM_INFER)) {
    out(`Inferred version: `)
    out(
      backward.report.global.versionDelta
        .appliedTo(ContractVersion.fromString(argv.old_version))
        .toString(),
      true
    )
    out(`\n`)
  } else if (argv._.includes(COMMAND_SEM_CHECK)) {
    const expected = backward.report.global.versionDelta.appliedTo(
      ContractVersion.fromString(argv.old_version)
    )
    if (expected.toString() !== argv.new_version) {
      out(
        `${argv.old_version} + ${backward.report.global.versionDelta} != ${argv.new_version}`,
        true
      )
      out(`\n`)
      process.exit(1)
    } else {
      out(
        `${argv.old_version} + ${backward.report.global.versionDelta} == ${argv.new_version}`,
        true
      )
      out(`\n`)
      process.exit(0)
    }
  } else if (argv._.includes(COMMAND_SEM_DELTA)) {
    out(`Version delta: `)
    out(`${backward.report.global.versionDelta}`, true)
    out(`\n`)
  } else {
    // Should never happen
    console.error('Error parsing command line arguments')
    process.exit(10007)
  }
} catch (error) {
  if (error.message) {
    console.error(error.message)
  } else {
    console.error(error)
  }
  process.exit(10003)
}
