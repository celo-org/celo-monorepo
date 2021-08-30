# Forno

Forno is a cLabs hosted node service for interacting with the Celo network. This allows you to connect to the Celo Blockchain without having to run your own node.

Forno has HTTP and websocket endpoints that you can use to query current Celo data or post transactions that you would like to broadcast to the network. The service runs full nodes in non-archive mode, so you can query the current state of the blockchain, but cannot access historic state.

Forno can be used as an `Http Provider` with [ContractKit](contractkit/).

```javascript
const ContractKit = require('@celo/contractkit')
const kit = ContractKit.newKit('https://alfajores-forno.celo-testnet.org')
```

Forno is a public node, so to send transactions from a Forno connection you will have to sign transactions with a private key before sending them to Forno. The [Hello Celo](start/hellocelo.md) guide shows you how to connect to the Alfajores testnet with Forno and use it to sign and send transactions on the network.

## Forno networks

Consult [this page](../getting-started/choosing-a-network.md) to determine which network is right for you.

```text
Alfajores = 'https://alfajores-forno.celo-testnet.org' 
            'wss://alfajores-forno.celo-testnet.org/ws' (for websocket support)

Baklava = 'https://baklava-forno.celo-testnet.org'

Mainnet = 'https://forno.celo.org'
          'wss://forno.celo.org/ws' (for websocket support)
```

### Websocket connections & Event listeners

Websocket connections are useful for listening to logs \(aka events\) emitted by a smart contract, but Forno only allows a websocket connection for 20 minutes before disconnecting. On disconnect, you can reconnect to the websocket endpoint to keep listening. [Here](https://gist.github.com/critesjosh/a230e7b2eb54c8d330ca57db1f6239db) is an example script of how to set up an event listener that reconnects when the connection is broken.

