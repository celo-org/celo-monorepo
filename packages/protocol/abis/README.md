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

### JS/TS syntax

```ts
// json abi
import Accounts from '@celo/abis/Accounts.json'

// viem
import { accountsABI } from "@celo/abis/types/wagmi";

// ethers
import { Accounts } from '@celo/abis/types/ethers'

// web3
import Accounts from '@celo/abis/types/web3/Accounts'

// truffle
import { AccountsContract } from '@celo/abis/types/truffle'
```

### CommonJS syntax

```js
const Accounts = require("@celo/abis/Accounts.json");

// ethers
const accounts = new ethers.Contract("0x...", Accounts.abi, ...);

// viem
const accounts = getContract({
  address: "0x...",
  abi: Accounts.abi,
  ...
})
```


## License

All packages are licensed under the terms of the Apache 2.0 License unless otherwise specified in the LICENSE file at package's root.
