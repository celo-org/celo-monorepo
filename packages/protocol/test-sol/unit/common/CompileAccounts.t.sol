// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Forces forge to compile the 0.8 Accounts so the 0.5 unit tests can deploy it via
// deployCodeTo("Accounts.sol", abi.encode(...), addr). The trivial test keeps this file in
// the compile closure under the common --match-path run.
import "@celo-contracts-8/common/Accounts.sol";

contract CompileAccounts is Test {
  function test_nop() public view {}
}
