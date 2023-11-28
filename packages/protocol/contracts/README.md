# Celo core contracts

Smart contracts for the Celo protocol.

## Usage

### Installation

```bash
npm install @celo/contracts
```

or

```bash
yarn add @celo/contracts
```

### In your Solidity contracts

```solidity
pragma solidity ^0.5.13;

import '@celo/contracts/common/UsingRegistryV2.sol';

contract Example is UsingRegistryV2 {
  constructor() public {
    require(getAccounts().createAccount());
  }
}

```

## License

The contents of this package are licensed under the terms of the GNU Lesser Public License V3
