import { handler as deployInitialBlockchainApiHandler } from '../../deploy/initial/blockchain-api'
import { UpgradeArgv } from '../../deploy/upgrade'

export const command = 'blockchain-api'

export const describe = 'command for upgrading blockchain-api'

// Can't extend because yargs.Argv already has a `config` property
type BlockchainApiArgv = UpgradeArgv

export const handler = async (argv: BlockchainApiArgv) => {
  await deployInitialBlockchainApiHandler(argv)
}
