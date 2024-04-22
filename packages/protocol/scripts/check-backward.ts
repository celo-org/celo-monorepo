import { ASTContractVersionsChecker } from '@celo/protocol/lib/compatibility/ast-version'
import { DefaultCategorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { getReleaseVersion } from '@celo/protocol/lib/compatibility/ignored-contracts-v9'
import { CategorizedChanges } from '@celo/protocol/lib/compatibility/report'
import { ASTBackwardReport, instantiateArtifacts } from '@celo/protocol/lib/compatibility/utils'
import { writeJsonSync } from 'fs-extra'
import path from 'path'
import tmp from 'tmp'
import yargs from 'yargs'

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
  .option('new_branch', {
    alias: 'b',
    description: 'Branch name (for versioning)',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .showHelpOnFail(true)
  .demandCommand()
  .strict().argv

// old artifacts folder needs to be generalized https://github.com/celo-org/celo-monorepo/issues/10567
const oldArtifactsFolder = path.relative(process.cwd(), argv.old_contracts)
const oldArtifactsFolder08 = path.relative(process.cwd(), argv.old_contracts + '-0.8')
const newArtifactsFolder = path.relative(process.cwd(), argv.new_contracts)
const newArtifactsFolder08 = path.relative(process.cwd(), argv.new_contracts + '-0.8')
const newArtifactsFolders = [newArtifactsFolder, newArtifactsFolder08]

const out = (msg: string, force?: boolean): void => {
  if (force || !argv.quiet) {
    process.stdout.write(msg)
  }
}

const outFile = argv.output_file ? argv.output_file : tmp.tmpNameSync({})
const exclude: RegExp = argv.exclude ? new RegExp(argv.exclude) : null
// old artifacts needs to be generalized https://github.com/celo-org/celo-monorepo/issues/10567
const oldArtifacts = instantiateArtifacts(oldArtifactsFolder)
const oldArtifacts08 = instantiateArtifacts(oldArtifactsFolder08)
const newArtifacts = instantiateArtifacts(newArtifactsFolder)
const newArtifacts08 = instantiateArtifacts(newArtifactsFolder08)

try {
  const backward = ASTBackwardReport.create(
    oldArtifactsFolder,
    newArtifactsFolders,
    [oldArtifacts, oldArtifacts08],
    [newArtifacts, newArtifacts08],
    exclude,
    new DefaultCategorizer(),
    out
  )

  try {
    const version = getReleaseVersion(argv.new_branch)
    if (version === 11) {
      // force redeploy of AddressSortedLinkedListWithMedian for CR11
      // since it was deployed by Mento team with different settings and bytecode
      backward.report.libraries.AddressSortedLinkedListWithMedian = {} as CategorizedChanges
    }
  } catch (error) {
    out(`Error parsing branch name: ${argv.new_branch}\n`)
  }

  out(`Writing compatibility report to ${outFile} ...`)
  writeJsonSync(outFile, backward, { spaces: 2 })
  out('Done\n')
  if (argv._.includes(COMMAND_REPORT)) {
    // Report always generated
    // Placebo command
  } else if (argv._.includes(COMMAND_SEM_CHECK)) {
    const doVersionCheck = async () => {
      const versionChecker = await ASTContractVersionsChecker.create(
        [oldArtifacts, oldArtifacts08],
        [newArtifacts, newArtifacts08],
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
