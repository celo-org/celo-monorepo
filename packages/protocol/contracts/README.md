# Protocols

Smart contracts for the Celo protocols, including identity and stability.

## Usage

1. Target Release

```
RELEASE="celo-core-contracts-v2.mainnet"
URL="https://gitpkg.now.sh/celo-org/celo-monorepo/packages/protocol/contracts?$RELEASE"
```

2. Installation

npm

`npm install $URL`

Yarn

`yarn add $URL`

3. Development

Solidity

```solidity
pragma solidity ^0.5.13;

import 'celo/contracts/common/UsingRegistry.sol';

contract Example is UsingRegistry {
  constructor() {
    require(getAccounts().createAccount());
  }
}
```

## License

The contents of this package are licensed under the terms of the GNU Lesser Public License V3
