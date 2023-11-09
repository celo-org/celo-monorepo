// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IFreezer {
  function isFrozen(address) external view returns (bool);
}
