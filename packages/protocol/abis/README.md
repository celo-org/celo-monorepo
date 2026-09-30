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
// abi in json
import AccountsABI from '@celo/abis/Accounts.json'

// abi in js/ts for viem, wagmi, etc
import { accountsABI }  from '@celo/abis'

// abi in js/ts for viem, wagmi, etc (with moduleResolution and module set to "Node16" in your tsconfig.json file)
import { accountsABI }  from '@celo/abis/Accounts'
```

Version 18 removed the web3.js typings that earlier versions exported under
`@celo/abis/web3/*`. Use the ABIs above with viem, or stay on `@celo/abis@17` if you
still depend on them.

### CommonJS syntax

```js
const { accountsABI } = require('@celo/abis');

// viem
const accounts = getContract({
  address: "0x...",
  abi: accountsABI,
  ...
})
```


## License

All packages are licensed under the terms of the Apache 2.0 License unless otherwise specified in the LICENSE file at package's root.
