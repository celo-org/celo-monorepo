import { newKit } from '@celo/contractkit'
import { WalletConnectWallet } from '../src'

async function main() {
  const wallet = new WalletConnectWallet({
    connect: {
      metadata: {
        name: 'use-contractkit demo',
        description: 'A showcase of use-contractkit',
        url: 'https://use-contractkit.vercel.app',
        icons: [],
      },
    },
    init: {
      relayProvider: 'wss://relay.walletconnect.org',
    },
  })
  const uri = await wallet.getUri()
  console.log(uri.toString())
  await wallet.init()

  const [from] = await wallet.getAccounts()
  const kit = newKit('https://alfajores-forno.celo-testnet.org', wallet)

  /**
   * Uncomment to send a test transaction
   */
  // const gold = await kit.contracts.getGoldToken()
  // await gold
  //   .transfer('0x4132F04EaCfdE9E2b707667A13CB69DbC5BABb68', '1')
  //   .sendAndWaitForReceipt({ from })
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
