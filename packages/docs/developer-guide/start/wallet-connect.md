# WalletConnect

This tutorial will be a basic guide on integrating [WalletConnect V2](https://walletconnect.org/) support into your decentralised application \(DApp\). Integrating WalletConnect support means users with Valora, [Celo Wallet](https://celowallet.app) and other WalletConnect compatible wallets can interact with your DApp.

{% hint style="info" %}
If you'd prefer a more managed and opinionated flow for connecting wallets to your DApp, checkout the [use-contractkit](https://github.com/celo-tools/use-contractkit) library. It handles connecting to a variety of wallets \(WalletConnect, Ledger, Metamask and more\) and is a higher level abstraction than the library we'll be using in this tutorial.
{% endhint %}

This tutorial is platform independent and using TypeScript, so you may need to sort out a Webpack \(or similar bundling tool\) build pipeline before usage in your environment of choice.

## Getting started

Step one of creating our WalletConnect compatible application is installing the [@celo/wallet-walletconnect](https://www.npmjs.com/package/@celo/wallet-walletconnect) library.

```bash
yarn add @celo/wallet-walletconnect
```

`@celo/wallet-walletconnect` is an abstraction we've built around the base [@walletconnect/client](https://www.npmjs.com/package/@walletconnect/client) library that conforms to the `Wallet` interface commonly used in the Celo ecosystem. The `Wallet` interface has a standardised and convenient API with operations like `sendTransaction`, `signTypedData` that you can use once the wallet has been initialised.

## Initialise the client

There's a few properties the `WalletConnectWallet` needs when instantiated, these properties will be shown to your users on their wallet of choice so it's important you specify them.

```javascript
import { WalletConnectWallet } from '@celo/wallet-walletconnect'

const wallet = new WalletConnectWallet({
  connect: {
    metadata: {
      name: 'The name of your awesome DApp',
      description: 'Your DApp description',
      url: 'https://example.com',
      icons: ['https://example.com/favicon.ico'],
    },
  },
})
```

## Establish the connection

```javascript
import { WalletConnectWallet } from '@celo/wallet-walletconnect'

async function connect() {
  const wallet = new WalletConnectWallet({
    connect: {
      metadata: {
        name: 'The name of your awesome DApp',
        description: 'Your DApp description',
        url: 'https://example.com',
        icons: ['https://example.com/favicon.ico'],
      },
    },
  })

  const uri = await wallet.getUri()
  // display this uri as a QR code to the user
  await wallet.init()
}

connect()
```

In this code snippet we're calling the `getUri` function on our `WalletConnectWallet`. This needs to be communicated "out-of-band", or via a QR code, to your user so they can scan it with their wallet. If you're developing a React.js based application, the [react-qr-code](https://www.npmjs.com/package/react-qr-code) library could be a nice option for you here.

After the wallet has scanned the QR code it should handle establishing a connection and the `await wallet.init()` promise will resolve.

## Get connected accounts

After the `WalletConnectWallet` has been initialised you can read the accounts that have been loaded as signers into the wallet. Any account here will be able to sign payloads or send transaction in your DApp.

```javascript
import { WalletConnectWallet } from '@celo/wallet-walletconnect'

async function connect() {
  const wallet = new WalletConnectWallet({
    connect: {
      metadata: {
        name: 'The name of your awesome DApp',
        description: 'Your DApp description',
        url: 'https://example.com',
        icons: ['https://example.com/favicon.ico'],
      },
    },
  })

  const uri = await wallet.getUri()
  // display this uri as a QR code to the user
  await wallet.init()

  // an array of addresses you can use to sign and
  // send transactions
  const accounts = await wallet.getAccounts()
}

connect()
```

## Initialise ContractKit

As a final step, `WalletConnectWallet` \(and any library that implements the `Wallet` interface we mentioned earlier\) integrates natively with [@celo/contractkit](https://docs.celo.org/developer-guide/contractkit). This means you can start sending various transactions as soon as the wallet is initialised. Here's a full example displaying the end-to-end flow of connecting and sending transferring some CELO.

```javascript
import { newKit } from '@celo/contractkit'
import { WalletConnectWallet } from '@celo/wallet-walletconnect'

async function connect() {
  const wallet = new WalletConnectWallet({
    connect: {
      metadata: {
        name: 'The name of your awesome DApp',
        description: 'Your DApp description',
        url: 'https://example.com',
        icons: ['https://example.com/favicon.ico'],
      },
    },
  })

  const uri = await wallet.getUri()
  // display this uri as a QR code to the user
  await wallet.init()

  const [from] = await wallet.getAccounts()
  const kit = newKit('https://alfajores-forno.celo-testnet.org', wallet)

  const gold = await kit.contracts.getGoldToken()
  await gold.transfer('0x...', '1').sendAndWaitForReceipt({ from })
}

connect()
```

## Wrapping up

Hopefully you now have an understanding of how to build WalletConnect compatible DApps, keep exploring the [docs](https://docs.celo.org) to learn more and please [connect with us on Discord](https://chat.celo.org) if you need any help \(or just want to chat\)!

