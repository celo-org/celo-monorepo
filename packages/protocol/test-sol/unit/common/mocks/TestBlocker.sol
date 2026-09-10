// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.13 <0.9.0;

import "@celo-contracts/common/interfaces/IBlocker.sol";

// Shared mock used by both 0.5 and 0.8 tests. Lives in its own dual-pragma file
// so it can be imported by test files on either compiler (it was previously
// defined inside Blockable.t.sol, which is now 0.8-only).
contract TestBlocker is IBlocker {
  bool public blocked;

  function mockSetBlocked(bool _blocked) public {
    blocked = _blocked;
  }

  function isBlocked() external view returns (bool) {
    return blocked;
  }
}
