import { ASTContractVersionsChecker } from '@celo/protocol/lib/compatibility/ast-version'
import { DefaultCategorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { DeployedBytecodeChange } from '@celo/protocol/lib/compatibility/change'
import { getReleaseVersion } from '@celo/protocol/lib/compatibility/ignored-contracts-v9'
import {
  ASTVersionedReport,
  CategorizedChanges,
  isLibrary,
} from '@celo/protocol/lib/compatibility/report'
import { ASTBackwardReport, instantiateArtifacts } from '@celo/protocol/lib/compatibility/utils'
import { ContractVersionDelta } from '@celo/protocol/lib/compatibility/version'
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
  .option('force_deploy_all', {
    description: 'Force all contracts to be marked as having bytecode changes (for full release)',
    default: false,
    type: 'boolean',
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
const oldArtifactsFolders = [oldArtifactsFolder, oldArtifactsFolder08]

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
    oldArtifactsFolders,
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

  // Force all contracts to be marked as having bytecode changes for full release
  if (argv.force_deploy_all) {
    out('Forcing all contracts to be marked as changed for full release...\n')
    const allContracts: string[] = []
    const artifactsSet = [newArtifacts, newArtifacts08]

    for (const artifacts of artifactsSet) {
      for (const artifact of artifacts.listArtifacts()) {
        allContracts.push(artifact.contractName)
      }
    }
    const filteredContracts = allContracts.filter((name) => !exclude || !exclude.test(name))

    let contractsAdded = 0
    let librariesAdded = 0
    let skippedNoVersion = 0

    for (const contractName of filteredContracts) {
      // Check if this is a library
      if (isLibrary(contractName, artifactsSet)) {
        // Skip if already in the libraries report
        if (backward.report.libraries[contractName]) {
          continue
        }
        // Add to libraries section (libraries don't have version deltas)
        backward.report.libraries[contractName] = {} as CategorizedChanges
        librariesAdded++
      } else {
        // Skip if already in the contracts report
        if (backward.report.contracts[contractName]) {
          continue
        }

        // Check if the contract has getVersionNumber function
        let hasVersionNumber = false
        for (const artifacts of artifactsSet) {
          try {
            const artifact = artifacts.getArtifactByName(contractName)
            if (artifact && artifact.abi) {
              const getVersionNumberAbi = artifact.abi.find(
                (abi: any) => abi.type === 'function' && abi.name === 'getVersionNumber'
              )
              if (getVersionNumberAbi) {
                hasVersionNumber = true
                break
              }
            }
          } catch (e) {
            // Contract not found in this artifacts set
          }
        }

        // Skip contracts without getVersionNumber (except for specific contracts like Freezer)
        const noVersionExceptions = ['Freezer']
        if (!hasVersionNumber && !noVersionExceptions.includes(contractName)) {
          skippedNoVersion++
          continue
        }

        // Create a bytecode change entry for this contract
        const changes = new CategorizedChanges(
          [],
          [],
          [],
          [new DeployedBytecodeChange(contractName)]
        )
        const versionDelta = ContractVersionDelta.fromChanges(false, false, false, true)
        backward.report.contracts[contractName] = new ASTVersionedReport(changes, versionDelta)
        contractsAdded++
      }
    }
    out(`Added ${contractsAdded} contracts and ${librariesAdded} libraries to the report\n`)
    out(`Skipped ${skippedNoVersion} contracts without getVersionNumber\n`)
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
