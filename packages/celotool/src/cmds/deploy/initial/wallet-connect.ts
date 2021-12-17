import { switchToClusterFromEnv } from 'src/lib/cluster'
import { installWalletConnect } from 'src/lib/wallet-connect'
import { InitialArgv } from '../../deploy/initial'

export const command = 'walletconnect'

export const describe = 'deploy the walletconnect package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await installWalletConnect()
}
