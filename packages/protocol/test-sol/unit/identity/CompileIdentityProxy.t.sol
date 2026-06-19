// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/IdentityProxy.sol";
import "@celo-contracts/identity/IdentityProxyHub.sol";

// IdentityProxy / IdentityProxyHub stay at Solidity 0.5. This forces forge to compile
// them (the trivial test keeps the file in the compile closure under the identity
// --match-path run) so the 0.8 tests can deploy them via deployCodeTo / vm.getCode.
contract CompileIdentityProxy is Test {
  function test_nop() public {}
}
