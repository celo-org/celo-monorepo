// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

// Keeps the Random 0.8 mocks (RandomCompile/MockRandom08/RandomTest08) in the
// compile closure under the identity --match-path run, so the 0.5 tests can
// deploy them via deployCodeTo.
import "@test-sol/unit/identity/mocks/RandomMocks08.sol";

contract CompileRandom is Test {
  function test_nop() public view {}
}
