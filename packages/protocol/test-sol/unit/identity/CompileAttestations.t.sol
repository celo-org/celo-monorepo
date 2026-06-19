// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@test-sol/unit/identity/mocks/AttestationsMocks08.sol";

// Forces forge to compile the 0.8 Attestations + AttestationsTestMock08 so the 0.5 unit
// tests can deploy the mock via deployCodeTo("AttestationsTestMock08", ...). The trivial
// test keeps this file in the compile closure under the identity --match-path run.
contract CompileAttestations is Test {
  function test_nop() public view {}
}
