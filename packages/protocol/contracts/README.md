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
pragma solidity >=0.8.7 <0.8.20;

import '@celo/contracts/common/UsingRegistryV2NoMento.sol';

// UsingRegistryV2NoMento reads the Registry at its fixed address, so no initialization is needed.
contract Example is UsingRegistryV2NoMento {
  constructor() {
    require(getAccounts().createAccount());
  }
}

```

## License

The contents of this package are licensed under the terms of the GNU Lesser Public License V3
