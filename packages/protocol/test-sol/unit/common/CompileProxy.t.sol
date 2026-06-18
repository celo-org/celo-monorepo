// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/Proxy.sol";

// Proxy stays at Solidity 0.5. This forces forge to compile it (the trivial test keeps
// the file in the compile closure under the common --match-path run) so the 0.8 Proxy
// test can deploy it via deployCodeTo("Proxy.sol").
contract CompileProxy is Test {
  function test_nop() public {}
}
