# Migration document from Contractkit

Hello devs 🌱 this is a migration path away from contractkit. This aims to give examples to help you move to [viem](https://viem.sh/).

## Initialization

```diff
- import Web3 from "web3";
- import { newKitFromWeb3 } from "@celo/contractkit";
-
- const web3 = new Web3("https://alfajores-forno.celo-testnet.org");
- const kit = newKitFromWeb3(web3);
+ import { createPublicClient, http } from 'viem'
+ import { celo, celoAlfajores } from 'viem/chains'
+
+ const publicClient = createPublicClient({
+   chain: celoAlfajores, // or celo for celo's mainnet
+   transport: http()
+ })
```

## Basic usage

While we cannot here show all the use-cases of contrackit or ethers or viem, let's try to give an overview of how they can be used for different goals.

### Get address

With viem:

```diff
- const accounts = await kit.web3.eth.getAccounts();
+ const accounts = await publicClient.getAddresses()
const defaultAccount = accounts[0];
```

### Get wallet

With viem:

> [viem does not full support](<[source](https://viem.sh/docs/ethers-migration.html#viem-11)>) client-side signing (it's coming shortly!) – until then, you can use an Ethers Wallet, however it does support `signMessage` and `signTypedData` already.

```diff
+ import { privateKeyToAccount } from 'viem/accounts'
+
+ const privateKey = "0x...";
+ const walletClient = createWalletClient({
+   transport: http(celoAlfajores.rpcUrls.default.http[0] as string),
+   chain: celoAlfajores,
+ });
+ const account = privateKeyToAccount(privateKey);
+ await walletClient.signMessage({
+   account,
+   message: 'hello world',
+ })
```

### Provider methods

```diff
- const provider = kit.connection.web3.currentProvider
- kit.connection.getBlock(...)
- kit.connection.getTransaction(...)
+ const block = await publicClient.getBlock()
+ /**
+  * {
+  *  baseFeePerGas: 10000n,
+  *  number: 1234n,
+  *  parentHash: "0x....",
+  *  ...
+  * }
+  */
+ const tx = await publicClient.getTransaction({
+   hash: "0x...",
+ })
+ /**
+  * {
+  *  blockHash: '0x...',
+  *  blockNumber: 1234n,
+  *  from: '0x...',
+  *  ...
+  * }
+  */
```

### Signer methods

```diff
- const provider = kit.connection.web3.currentProvider
- const signer = provider.getSigner(kit.connection.defaultAccount)
+ const [account] = await walletClient.getAddresses()
+ const hash = await walletClient.sendTransaction({ account, to: "0x...", value: 1000n })
```

### Contract interaction

I'll show the most "basic" interaction, which is a transfer. On CELO, it comes with a twist, you can transfer 4 currencies, CELO, cUSD, cEUR, and cREAL.

You can get the addresses on these tokens by heading to the explorer and getting their abi and addresses, or you can also use our [registry contract](https://docs.celo.org/developer/contractkit/contracts-wrappers-registry). You can also use the [`@celo/abis`](https://www.npmjs.com/package/@celo/abis) package to get the ABIs directly.

```ts
import { getContract } from 'viem'
import { registryABI } from '@celo/abis/types/viem'

// this address is constant
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'
const registryContract = getContract({
  address: REGISTRY_CONTRACT_ADDRESS,
  abi: registryABI,
  publicClient,
})

async function CeloTokens(): Promise<[string, string][]> {
  return Promise.all(
    ['GoldToken', 'StableToken', 'StableTokenEUR', 'StableTokenBRL'].map(async (token) => [
      token,
      await registryContract.read.getAddressForString(token),
    ])
  )
}
```

#### Balance

```diff
+ import { stableTokenABI } from '@celo/abis/types/viem'

- const contract = await kit.contracts.getGoldToken();
- const balance = await contract.balanceOf(wallet.address);
+ const tokenAddresses = await CeloTokens();
+ const cUSD = tokenAddresses["StableToken]
+ const balance = await client.readContract({
+   abi: tokenAbi,
+   address: cUSD,
+   functionName: "balanceOf",
+   args: [account.address],
+ });
```

#### Transfer

Then, use the address of the token that you need and call the transfer method of the contract.

```diff
+ import { stableTokenABI } from '@celo/abis/types/viem'
- const CELO = await kit.contracts.getGoldToken();
- const txReceipt = await CELO.transfer('0x...', amount)
+ const tokenAddresses = await CeloTokens();
+ const cUSD = tokenAddresses["StableToken]
+ const { request } = await walletClient.simulateContract({
+   abi,
+   address: cUSD,
+   functionName: 'transfer',
+   args: [
+     '0x...', // to address
+     amount: 1000n,
+   ],
+   account: '0x...', // from address
+ })
+ const hash = await walletClient.sendTransaction(request);
```

#### Multicall

While contractkit didn't directly support multicall, you could use libraries such as `@dopex-io/web3-multicall` as such:

```ts
import Multicall from '@dopex-io/web3-multicall'
const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' // same on mainnet and alfajores
const multicall = new Multicall({
  provider,
  chainId,
  multicallAddress: MULTICALL_ADDRESS,
})
const governance = await kit.contracts._web3Contracts.getGovernance()
const stageTxs = _dequeue.map((proposalId) => governance.methods.getProposalStage(proposalId))
const stages: string[] = await multicall.aggregate(stageTxs)
```

You now can use `viem` directly to multicall since they have the address configured in the `viem/chains` files.

```ts
const governanceAddress = await registryContract.read.getAddressForString(['Governance'])
const governanceContract = getContract({
  address: governanceAddress,
  abi: governanceABI,
  publicClient,
})
const _dequeue = await governanceContract.read.getDequeue()
const stageCalls = _dequeue.map((proposalId) => ({
  address: governanceAddress,
  abi: governanceABI,
  functionName: 'getProposalStage',
  args: [proposalId],
}))
const stages = (await publicClient.multicall({ contracts: stageCalls })).map((x) => x.result)
```

#### Fee Currency

With Viem's built in Celo transaction serializer and Celo block/transaction formatters it is easy to build a wallet that supports Celo's ability to pay gas fees with various erc20 tokens. Simply, import a Celo chain from `viem/chain` and pass it to Viem's `createWalletClient`. Once the client is created you can add the feeCurrency field to your transaction with the address of the token you want to use for gas.

```ts
  import { celo } from 'viem/chains'
  import { createWalletClient, privateKeyToAccount, type SendTransactionParameters, http } from 'viem'

  const account = privateKeyToAccount(PRIVATE_KEY)

  // ALFAJORES ADDRESS: Celo Mainnet can be fetched from the registry
  const cUSDAddress = '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'

  const localAccountClient = createWalletClient({
    account,
    chain: celo,
  })

  const sendTransaction = (tx: SendTransactionParameters<typeof celo>) => {
    return localAccountClient.sendTransaction(tx)
  }

  const hash = await sendTransaction({
    feeCurrency: cUSDAddress,
    value: BigInt(100000000),
    to: '0x22579CA45eE22E2E16dDF72D955D6cf4c767B0eF',
  })
```

### Further reading

For more in depth examples and documentation about viem specifically, I highly recommend checking out the extensive documentations of [viem](https://viem.sh/).

Another interesting application to help you migrate could be StCelo-v2.
You can checkout the changes going from `react-celo` + `contractkit` to `rainbowkit` + `wagmi` + `viem` in [this pull-request](https://github.com/celo-org/staked-celo-web-app/pull/129).
