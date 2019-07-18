import { addCeloEnvMiddleware, CeloEnvArgv } from '@celo/celotool/src/lib/utils'
import * as fs from 'fs'
import { CONTRACTS_TO_COPY, downloadArtifacts, getContractAddresses } from 'src/lib/artifacts'
import * as yargs from 'yargs'

export const command = 'contract-addresses'

export const describe = 'command for obtaining the contract addesses map'

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
      alias: 'o',
      type: 'string',
      description: 'the absolute output folder path',
    })
}

export const handler = async (argv: CopyContractArtifactsArgs) => {
  await downloadArtifacts(argv.celoEnv)

  const contractList = argv.contracts.split(',')

  const addressMap = await getContractAddresses(argv.celoEnv, contractList)

  if (argv.outputPath) {
    fs.writeFileSync(argv.outputPath, JSON.stringify(addressMap, null, 2))
  } else {
    // tslint:disable-next-line: no-console
    console.log(addressMap)
  }
}
