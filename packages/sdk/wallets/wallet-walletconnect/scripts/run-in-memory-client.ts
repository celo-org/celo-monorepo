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
      logger: 'error',
    },
  })
  const uri = await wallet.getUri()
  console.log(`=== START OUT OF BAND URI ===
${uri.toString()}
=== END OUT OF BAND URI ===`)
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
  // console.log('Transaction sent!')

  /**
   * Uncomment to sign a test payload
   */
  // await kit.connection.sign(ensureLeading0x(Buffer.from('hello').toString()), from)
  // console.log('Payload signed!')

  /**
   * Uncomment to hold connection open
   */
  // await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 60 * 24))

  await wallet.close()
}

main()
  .then(() => process.exit())
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
