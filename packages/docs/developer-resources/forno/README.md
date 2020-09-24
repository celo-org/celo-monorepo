# Forno

Forno is a cLabs hosted node service for interacting with the Celo network. This allows you to connect to the Celo Blockchain without having to run your own node.

Forno has an HTTP endpoint that you can use to query current Celo data or post transactions that you would like to broadcast to the network. The service runs full nodes in non-archive mode, so you can query the current state of the blockchain, but cannot access historic state.

Forno can be used as an `Http Provider` with [ContractKit](../contractkit/README.md).

```javascript
const ContractKit = require('@celo/contractkit')
const kit = ContractKit.newKit('https://alfajores-forno.celo-testnet.org')
```

Forno is a public node, so to send transactions from a Forno connection you will have to sign transactions with a private key before sending them to Forno. The [Hello Celo](../walkthroughs/hellocelo.md) guide shows you how to connect to the Alfajores testnet with Forno and use it to sign and send transactions on the network.

## Forno networks

Consult [this page](../../getting-started/choosing-a-network.md) to determine which network is right for you.

```
Alfajores = 'https://alfajores-forno.celo-testnet.org'

Baklava = 'https://baklava-forno.celo-testnet.org'

Mainnet = 'https://rc1-forno.celo-testnet.org'
```