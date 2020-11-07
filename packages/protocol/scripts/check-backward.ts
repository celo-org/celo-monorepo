import { ASTContractVersionsChecker } from '@celo/protocol/lib/compatibility/ast-version'
import { DefaultCategorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { ASTBackwardReport, instantiateArtifacts } from '@celo/protocol/lib/compatibility/utils'
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
    'Check if the semantic version change provided is correct (exit code 0, or 1 otherwise)'
  )
  .option('exclude', {
    alias: 'e',
    description: 'Contract name exclusion regex',
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
    description: 'New contracts build artifacts folder',
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
const exclude: RegExp = argv.exclude ? new RegExp(argv.exclude) : null
const oldArtifacts = instantiateArtifacts(oldArtifactsFolder)
const newArtifacts = instantiateArtifacts(newArtifactsFolder)

try {
  const backward = ASTBackwardReport.create(
    oldArtifactsFolder,
    newArtifactsFolder,
    oldArtifacts,
    newArtifacts,
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
    const doVersionCheck = async () => {
      const versionChecker = await ASTContractVersionsChecker.create(
        oldArtifacts,
        newArtifacts,
        backward.report.versionDeltas()
      )
      const mismatches = versionChecker.excluding(exclude).mismatches()
      if (mismatches.isEmpty()) {
        out('Success! Actual version numbers match expected\n')
        process.exit(0)
      } else {
        console.error(`Version mismatch detected:\n${JSON.stringify(mismatches, null, 4)}`)
        process.exit(1)
      }
    }
    doVersionCheck().catch((err) => {
      console.error('Error when performing version check', err)
      process.exit(1)
    })
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
