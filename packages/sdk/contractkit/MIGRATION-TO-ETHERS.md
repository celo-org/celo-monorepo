# Migration document from Contractkit

Hello devs 🌱 this is a migration path away from contractkit. This aims to give examples to help you move to [ethers](https://docs.ethers.org/).

## Initialization

```diff
- import Web3 from "web3";
- import { newKitFromWeb3 } from "@celo/contractkit";

- const web3 = new Web3("https://alfajores-forno.celo-testnet.org");
- const kit = newKitFromWeb3(web3);
+ import { providers } from 'ethers'
+
+ const provider = new providers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org')
```

## Basic usage

While we cannot here show all the use-cases of contrackit or ethers or viem, let's try to give an overview of how they can be used for different goals.

### Get address

```diff
- const accounts = await kit.web3.eth.getAccounts();
+ const accounts = await provider.listAccounts();
const defaultAccount = accounts[0];
```

### Get wallet

```diff
+ import { Wallet } from 'ethers'

- const wallet = kit.getWallet();
+ const wallet = new Wallet('0x...', provider);
```

### Provider methods

```diff
- const provider = kit.connection.web3.currentProvider
- kit.connection.getBlock(...)
- kit.connection.getTransaction(...)
provider.getBlock(...)
provider.getTransaction(...)
```

### Signer methods

```diff
- const provider = kit.connection.web3.currentProvider
- const signer = provider.getSigner(kit.connection.defaultAccount)
+ const signer = provider.getSigner(address)
+ signer.sendTransaction(...)
+ signer.signMessage(...)
```

### Contract interaction

I'll show the most "basic" interaction, which is a transfer. On CELO, it comes with a twist, you can transfer 4 currencies, CELO, cUSD, cEUR, and cREAL.

You can get the addresses on these tokens by heading to the explorer and getting their abi and addresses, or you can also use our [registry contract](https://docs.celo.org/developer/contractkit/contracts-wrappers-registry). You can also use the [`@celo/abis`](https://www.npmjs.com/package/@celo/abis) package to get the ABIs directly.

```ts
// this address is constant
const REGISTRY_CONTRACT_ADDRESS = '0x000000000000000000000000000000000000ce10'
const registry = new Contract(REGISTRY_CONTRACT_ADDRESS, registryAbi, wallet)

async function getToken(token: string) {
  const goldTokenAddress = await registry.getAddressForString(token)
  return goldTokenAddress
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
+ const tokenAddress = '0x...' // Grabbed from the registry or from the explorer
+ const contract = new ethers.Contract(tokenAddress, tokenAbi, signer);
const balance = await contract.balanceOf(wallet.address);
```

#### Transfer

Then, use the address of the token that you need and call the transfer method of the contract.

```diff
+ import { tokenAbi } from './abi.json'

- const contract = await kit.contracts.getGoldToken();
+ const tokenAddress = '0x...' // Grabbed from the registry or from the explorer
+ const contract = new ethers.Contract(tokenAddress, tokenAbi, signer);
const txReceipt = await contract.transfer('0x...', amount);
```

For more in depth examples, I highly recommend checking out the extensive documentations of both [ethers](https://docs.ethers.org/) and [viem](https://viem.sh/).
