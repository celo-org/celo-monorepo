import { addCeloEnvMiddleware, CeloEnvArgv } from '@celo/celotool/src/lib/utils'
import { CONTRACTS_TO_COPY, copyContractArtifacts, downloadArtifacts } from 'src/lib/artifacts'
import * as yargs from 'yargs'

export const command = 'copy-contract-artifacts'

export const describe =
  'command for copying contract artifacts in a format to be easily consumed by other (typescript) packages. It will use the ABI of a particular contract and swap the address for the address of the Proxy.'

interface CopyContractArtifactsArgs extends CeloEnvArgv {
  contracts: string
  outputPath: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('contracts', {
      default: CONTRACTS_TO_COPY.join(','),
      type: 'string',
      description: 'the names of the contracts separated by commas',
    })
    .option('output-path', {
      required: true,
      alias: 'o',
      type: 'string',
      description: 'the absolute output folder path',
    })
}

export const handler = async (argv: CopyContractArtifactsArgs) => {
  await downloadArtifacts(argv.celoEnv)

  const contractList = argv.contracts.split(',')

  await copyContractArtifacts(argv.celoEnv, argv.outputPath, contractList)
}
