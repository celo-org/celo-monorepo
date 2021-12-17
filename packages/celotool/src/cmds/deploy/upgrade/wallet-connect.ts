import { switchToClusterFromEnv } from 'src/lib/cluster'
import { upgradeWalletConnect } from 'src/lib/wallet-connect'
import { InitialArgv } from '../initial'

export const command = 'walletconnect'

export const describe = 'deploy the walletconnect package'

export const builder = {}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)
  await upgradeWalletConnect()
}
