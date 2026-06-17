// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

// Minimal local copy of the Mento Reserve interface. The Mento core IReserve is
// pinned at Solidity 0.5 (a git submodule) and cannot be imported by 0.8 code;
// EpochRewards only needs the reserve gold balance.
interface IReserve {
  function getReserveGoldBalance() external view returns (uint256);
}
