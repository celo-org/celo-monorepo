# Setup

## Installation and System Requirements

To install, run the following:

```bash
npm install @celo/contractkit
// or
yarn add @celo/contractkit
```

You will need Node.js v12.x.

## Initializing the Kit

To start working with ContractKit you need a `kit` instance and a valid net to connect with. In this example will use `alfajores` \(you can read more about it [here](../../getting-started/alfajores-testnet/)\)

```typescript
import { newKit } from '@celo/contractkit'

const kit = newKit('https://alfajores-forno.celo-testnet.org')
```

Go to the [page about Forno](../forno.md) for details about different connection types and network endpoints.

## Initialize the Kit with your own node

If you are hosting your own node \(you can follow [this guide](../../getting-started/mainnet/running-a-full-node-in-mainnet.md) to run one\) you can connect our ContractKit to it.

```typescript
import { newKit } from '@celo/contractkit'

// define localUrl and port with the ones of your node

const kit = newKit(`${localUrl}:${port}`)
```

Same as `Web3` we support `WebSockets`, `RPC` and connecting via `IPC`. For this last one you will have to initialize the `kit` with an instances of `Web3` that has a **valid** `IPC Provider`

```typescript
import Web3 from 'web3'
import { newKitFromWeb3 } from '@celo/contractkit'

const web3Instance: Web3 = new Web3(new Web3.providers.IpcProvider('/Users/myuser/Library/CeloNode/geth.ipc', net))

const kit = newKitFromWeb3(web3Instance)
```

