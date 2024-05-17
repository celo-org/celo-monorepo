// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IFreezer {
  function initialize() external;
  function freeze(address target) external;
  function unfreeze(address target) external;
  function isFrozen(address) external view returns (bool);
}
