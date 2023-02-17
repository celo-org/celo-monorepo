# @celo/connect


*Connect to the Celo Blockchain.*  `Connection` provides the core of what you need to interact with Celo blockchain. The Core Difference between it and ContractKit is that it provides zero Contract Wrappers, and therefore leaves out convenience methods for example for setting FeeCurrency, or getting configs.

## Examples

### Basic

```typescript
import { Connection, CeloProvider } from '@celo/connect'

const web3 = new Web3("YOUR_RPC_URL")
const connection = new Connection(web3)

connection.setProvider()

const connectedChainID =  await connection.chainId()

```

For a raw transaction:

```ts
const oneCelo = connection.web3.utils.toWei('1', 'ether')

const tx = connection.sendTransaction({
  from: myAddress,
  to: someAddress,
  value: oneCelo,
})
const hash = await tx.getHash()
const receipt = await tx.waitReceipt()
```

