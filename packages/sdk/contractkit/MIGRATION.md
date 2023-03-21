# Draft: Migration document from Contractkit

Hello devs 🌱 this is a migration path away from contractkit following the [public deprecation notice](https://forum.celo.org/t/sunsetting-contractkit/5337/1) of contractkit. This aims to give examples to help you move to either [ethers](https://docs.ethers.org/) or [viem](https://viem.sh/).

## Initialization

With ethers:

```diff
- import Web3 from "web3";
- import { newKitFromWeb3 } from "@celo/contractkit";

- const web3 = new Web3("https://alfajores-forno.celo-testnet.org");
- const kit = newKitFromWeb3(web3);
+ import { providers } from 'ethers'
+
+ const provider = new providers.JsonRpcProvider('https://alfajores-forno.celo-testnet.org')
```

With viem:

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

With ethers:

```diff
- const accounts = await kit.web3.eth.getAccounts();
+ const accounts = await provider.listAccounts();
const defaultAccount = accounts[0];
```

With viem:

```diff
- const accounts = await kit.web3.eth.getAccounts();
+ const accounts = await client.getAddresses()
const defaultAccount = accounts[0];
```

### Get wallet

With ethers:

```diff
+ import { Wallet } from 'ethers'

- const wallet = kit.getWallet();
+ const wallet = new Wallet('0x...', provider);
```

With viem:

> [viem does not currently support](<[source](https://viem.sh/docs/ethers-migration.html#viem-11)>) client-side signing (it's coming shortly!) – until then, you can use an Ethers Wallet

### Provider methods

With ethers:

```diff
- const provider = kit.connection.web3.currentProvider
- kit.connection.getBlock(...)
- kit.connection.getTransaction(...)
provider.getBlock(...)
provider.getTransaction(...)
```

With viem:

```diff
- const provider = kit.connection.web3.currentProvider
- kit.connection.getBlock(...)
- kit.connection.getTransaction(...)
+ client.getBlock(...)
+ client.getTransaction(...)
```

### Signer methods

With ethers:

```diff
- const provider = kit.connection.web3.currentProvider
- const signer = provider.getSigner(kit.connection.defaultAccount)
+ const signer = provider.getSigner(address)
+ signer.sendTransaction(...)
+ signer.signMessage(...)
```

With viem:

```diff
- const provider = kit.connection.web3.currentProvider
- const signer = provider.getSigner(kit.connection.defaultAccount)
+ const [address] = await client.getAddresses()
+ const account = getAccount(address)
+ client.sendTransaction({ account, ... })
```

### Contract interaction

I'll show the most "basic" interaction, which is a CELO transfer:

With ethers:

```diff
+ import { tokenAbi } from './abi.json'
- const CELO = await kit.contracts.getGoldToken();
- const txReceipt = await CELO.transfer('0x...', amount)
+ const tokenAddress = '0x...'
+ const contract = new ethers.Contract(tokenAddress, tokenAbi, signer);
+ const txReceipt = await contract.transfer('0x...', amount);
```

With viem:

```diff
+ import { tokenAbi } from './abi.json'
- const CELO = await kit.contracts.getGoldToken();
- const txReceipt = await CELO.transfer('0x...', amount)
+ const tokenAddress = '0x...'
+ const transfer = await client.simulateContract({abi, address: tokenAddress, functionName: 'transfer' })
+ const txReceipt = await transfer('0x...', amount);
```

For more in depth examples, I highly recommend checking out the extensive documentations of both [ethers](https://docs.ethers.org/) and [viem](https://viem.sh/).
