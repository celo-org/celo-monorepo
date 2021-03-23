import { WalletConnectWallet } from '../src'
;(async function main() {
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
})()
