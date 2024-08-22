// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/test/ValidatorsMock.sol";
import "@celo-contracts-8/governance/test/IValidatorsMock.sol";

contract ValidatorsMockFactory {
  function deployValidatorsMock(bool test) external returns (address) {
    return address(new ValidatorsMock());
  }
}
