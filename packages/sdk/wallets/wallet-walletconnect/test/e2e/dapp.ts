import { ensureLeading0x } from '@celo/utils/lib/address'
import { WalletConnectWallet } from '../../src'
import { initialiseTestWallet } from './wallet'

async function main() {
  const wallet = new WalletConnectWallet((uri) => initialiseTestWallet(uri), {
    name: 'Example Dapp',
    description: 'Example Dapp for WalletConnect',
    url: 'https://example.org/',
    icons: ['https://example.org/favicon.ico'],
  })

  await wallet.init()
  console.log('WalletConnectWallet connection established')

  const accounts = await wallet.getAccounts()
  console.log('> wallet.getAccounts()', accounts)

  const [account] = accounts
  const signedPersonalMessage = await wallet.signPersonalMessage(
    account,
    ensureLeading0x(Buffer.from('hello').toString('hex'))
  )
  console.log('> wallet.signPersonalMessage()', signedPersonalMessage)
}

main()
