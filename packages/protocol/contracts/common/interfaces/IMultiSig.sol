// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IMultiSig {
  function submitTransaction(
    address destination,
    uint256 value,
    bytes calldata data
  ) external returns (uint256);
}
