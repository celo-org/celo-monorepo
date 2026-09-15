// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "@celo-contracts-8/governance/Election.sol";

// 0.8 mock of Election for use in tests. Extends Election(true) so the
// initializer guard is bypassed on construction. Overrides distributeEpochRewards
// to remove the onlyPermitted restriction, mirroring the 0.5 ElectionMock.
contract ElectionCompile is Election(true) {
  function distributeEpochRewards(
    address group,
    uint256 value,
    address lesser,
    address greater
  ) external override {
    _distributeEpochRewards(group, value, lesser, greater);
  }
}
