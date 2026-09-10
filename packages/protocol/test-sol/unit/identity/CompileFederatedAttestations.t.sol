// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts-8/identity/FederatedAttestations.sol";

// Forces forge to compile the 0.8 FederatedAttestations so the 0.5 unit tests can deploy
// it via deployCodeTo("FederatedAttestationsCompile", ...). The trivial test keeps this
// file in the compile closure under the identity --match-path run.
contract FederatedAttestationsCompile is FederatedAttestations(true) {}

contract CompileFederatedAttestations is Test {
  function test_nop() public view {}
}
