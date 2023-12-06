# Celo core contracts ABIS

Smart contracts ABIS for the Celo protocol.

## Usage

### Installation

```bash
npm install @celo/abis
```

or

```bash
yarn add @celo/abis
```


**There is no index so the following do not work**
`import abis from '@celo/abis'` or  ` import web3AbiTypes from '@celo/abis/web3'`

### In your javascript or ts

```ts
// abi in json
import AccountsABI from '@celo/abis/Accounts.json'


// abi in js/ts for viem, wagmi, etc
import { accountsABI }  from '@celo/abis/Accounts'

// abi in js/ts for use with contractkit
import { type Accounts, newAccounts, ABI } from '@celo/abis/web3/Accounts'


```

### CommonJS syntax

```js
const AccountsABI = require("@celo/abis/Accounts.json");


// viem
const accounts = getContract({
  address: "0x...",
  abi: AccountsABI,
  ...
})
```


## License

All packages are licensed under the terms of the Apache 2.0 License unless otherwise specified in the LICENSE file at package's root.
