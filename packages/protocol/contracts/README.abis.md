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

### In your javascript or ts

```ts
// json abi
import Accounts from '@celo/abis/Accounts.json'

// ethers
import { Accounts } from '@celo/abis/types/ethers'

// web3
import Accounts from '@celo/abis/types/web3/Accounts'

// truffle
import { AccountsContract } from '@celo/abis/types/truffle'
```

## License

All packages are licensed under the terms of the Apache 2.0 License unless otherwise specified in the LICENSE file at package's root.
