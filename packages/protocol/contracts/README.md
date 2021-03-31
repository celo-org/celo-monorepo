# Protocols

Smart contracts for the Celo protocols, including identity and stability.

## Usage

### Installation

`npm install @celo/contracts`

or

`yarn add @celo/contracts`

### Development

Solidity

```solidity
pragma solidity ^0.5.13;

import '@celo/contracts/common/UsingRegistry.sol';

contract Example is UsingRegistry {
  constructor() public {
    require(getAccounts().createAccount());
  }
}
```

Web3

```javascript
var Contract = require('web3-eth-contract');
var jsonInterface = require('@celo/contracts/build/AddressSortedLinkedList.json');
var contract = new Contract(jsonInterface, address);
```

For more advanced interaction with the celo core contracts, we recommend using [ContractKit](https://github.com/celo-org/celo-monorepo/tree/master/packages/sdk/contractkit).

## Development

Use `yarn publish --access public` to publish to the NPM registry.

## License

The contents of this package are licensed under the terms of the GNU Lesser Public License V3
