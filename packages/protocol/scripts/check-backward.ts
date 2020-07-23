import { DefaultCategorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { instantiateArtifacts, ASTBackwardReport } from '@celo/protocol/lib/compatibility/utils'
import { ASTContractVersionsReport } from '@celo/protocol/lib/compatibility/ast-version'
import { writeJsonSync } from 'fs-extra'
import * as path from 'path'
import * as tmp from 'tmp'
import * as yargs from 'yargs'

const COMMAND_REPORT = 'report'
const COMMAND_SEM_CHECK = 'sem_check'

const argv = yargs
  .command(COMMAND_REPORT, 'Generates a backward compatibility report')
  .command(
    COMMAND_SEM_CHECK,
    'Check if the semantic version change is correct (exit code 0, or 1 otherwise)'
  )
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
  out(`Writing compatibility report to ${outFile} ...`)
  writeJsonSync(outFile, backward, { spaces: 2 })
  out('Done\n')
  if (argv._.includes(COMMAND_REPORT)) {
    // Report always generated
    // Placebo command
  } else if (argv._.includes(COMMAND_SEM_CHECK)) {
    const versionReport = ASTContractVersionsReport.create(
      instantiateArtifacts(oldArtifactsFolder),
      instantiateArtifacts(newArtifactsFolder),
      backward.report.versionDeltas()
    )
    console.log(versionReport)
    const mismatches = versionReport.mismatches()
    if (mismatches.isEmpty()) {
      console.log('Actual version numbers match expected')
      process.exit(0)
    } else {
      const outFile2 = argv.output_file ? argv.output_file : tmp.tmpNameSync({})
      console.error('Version mismatch detected...')
      console.error(`Writing version mismatch to ${outFile2} ...`)
      writeJsonSync(outFile2, mismatches, { spaces: 2 })
      process.exit(1)
    }
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
