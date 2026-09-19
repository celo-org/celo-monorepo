// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.9.0;

import { IGoldTokenTest } from "@test-sol/unit/common/interfaces/IGoldTokenTest.sol";

/**
 * @title Test-only type of the `celoToken` handle in TestWithUtils08.
 * The base test wires a MockCeloToken08 into the handle; a test that exercises the real
 * GoldToken deploys it and points the same handle at it, so the GoldToken surface and the
 * mock's balance setters share one type.
 */
interface ICeloTokenTest is IGoldTokenTest {
  function setBalanceOf(address a, uint256 value) external;
  function setTotalSupply(uint256 value) external;
}
