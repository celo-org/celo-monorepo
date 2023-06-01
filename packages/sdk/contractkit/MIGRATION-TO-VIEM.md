# Draft: Migration document from Contractkit

Hello devs 🌱 this is a migration path away from contractkit following the [public deprecation notice](https://forum.celo.org/t/sunsetting-contractkit/5337/1) of contractkit. This aims to give examples to help you move to [viem](https://viem.sh/).

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
+ const client = createPublicClient({
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
+ const accounts = await client.getAddresses()
const defaultAccount = accounts[0];
```

### Get wallet

With viem:

> [viem does not currently support](<[source](https://viem.sh/docs/ethers-migration.html#viem-11)>) client-side signing (it's coming shortly!) – until then, you can use an Ethers Wallet

```diff
+ const walletClient = createWalletClient({
+   transport: http(celoAlfajores.rpcUrls.default.http[0] as string),
+   chain: celoAlfajores,
+ });
+ const provider = new JsonRpcProvider(celoAlfajores.rpcUrls.default.http[0]);
+ const wallet = new Wallet(privateKey, provider);
+ const account = getAccount(wallet);
```

### Provider methods

```diff
- const provider = kit.connection.web3.currentProvider
- kit.connection.getBlock(...)
- kit.connection.getTransaction(...)
+ client.getBlock(...)
+ client.getTransaction(...)
```

### Signer methods

```diff
- const provider = kit.connection.web3.currentProvider
- const signer = provider.getSigner(kit.connection.defaultAccount)
+ const [address] = await client.getAddresses()
+ const account = getAccount(address)
+ client.sendTransaction({ account, ... })
```

### Contract interaction

I'll show the most "basic" interaction, which is a transfer. On CELO, it comes with a twist, you can transfer 4 currencies, CELO, cUSD, cEUR, and cREAL.

You can get the addresses on these tokens by heading to the explorer and getting their abi and addresses, or you can also use our [registry contract](https://docs.celo.org/developer/contractkit/contracts-wrappers-registry).

```ts
// this address is constant
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'
const registry = new Contract(REGISTRY_CONTRACT_ADDRESS, registryAbi, wallet)

async function getToken(token: string) {
  const tokenAddress = await registry.getAddressForString(token)
  return tokenAddress
}
async function CeloTokens(): Promise<[string, string][]> {
  return Promise.all(
    ['GoldToken', 'StableToken', 'StableTokenEUR', 'StableTokenBRL'].map(async (token) => [
      token,
      await getToken(token),
    ])
  )
}
```

#### Balance

```diff
+ import { tokenAbi } from './abi.json'

- const contract = await kit.contracts.getGoldToken();
- const balance = await contract.balanceOf(wallet.address);
+ const tokenAddress = '0x...' // Grabbed from the registry or from the explorer
+ const balance = await client.readContract({
+   abi: tokenAbi,
+   address: tokenAddress,
+   functionName: "balanceOf",
+   args: [account.address],
+ });
```

#### Transfer

Then, use the address of the token that you need and call the transfer method of the contract.

```diff
+ import { tokenAbi } from './abi.json'
- const CELO = await kit.contracts.getGoldToken();
- const txReceipt = await CELO.transfer('0x...', amount)
+ const tokenAddress = '0x...'
+ const transfer = await walletClient.simulateContract({abi, address: tokenAddress, functionName: 'transfer', args: ['0x...', amount] })
```

For more in depth examples, I highly recommend checking out the extensive documentations of both [ethers](https://docs.ethers.org/) and [viem](https://viem.sh/).
