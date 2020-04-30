import { sleep } from '@celo/utils/lib/async'
import yargs from 'yargs'
import { UpgradeArgv } from '../../deploy/upgrade'
import { handler as contractsHandler } from '../initial/contracts'
import { handler as attestationServiceHandler } from './attestation-service'
import { handler as blockscoutHandler } from './blockscout'
import { handler as celostatsHandler } from './celostats'
import { handler as testnetHandler } from './testnet'

export const command = 'all'

export const describe = 'upgrades a typical deploy'

type TestnetArgv = UpgradeArgv & {
  reset: boolean
  useExistingGenesis: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('reset', {
      describe: 'indicates a reset',
      default: false,
      type: 'boolean',
    })
    .option('useExistingGenesis', {
      type: 'boolean',
      description: 'Instead of generating a new genesis, use an existing genesis in GCS',
      default: false,
    })
}

export const handler = async (argv: TestnetArgv) => {
  console.info('Deploy the testnet')
  await testnetHandler(argv)
  console.info('Deploy celostats')
  await celostatsHandler(argv)
  console.info('Deploy blockscout')
  await blockscoutHandler(argv)

  if (argv.reset === true) {
    console.info('Sleeping for 5 minutes to let pods come up')
    await sleep(300000)
    console.info('Deploy contracts')
    await contractsHandler(argv)
  }

  console.info('Deploy attestation-service')
  await attestationServiceHandler(argv)
}
