// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.9.0;
// solhint-disable no-unused-vars

import "../../../contracts/common/interfaces/ICeloUnreleasedTreasury.sol";
import "../UsingRegistry.sol";

/**
 * @title A mock CeloUnreleasedTreasury for testing.
 */
contract MockCeloUnreleasedTreasury is ICeloUnreleasedTreasury, UsingRegistry {
  bool internal hasAlreadyReleased;
  uint256 internal remainingTreasure;
  function release(address to, uint256 amount) external {
    if (!hasAlreadyReleased) {
      remainingTreasure = address(this).balance;
      hasAlreadyReleased = true;
    }

    require(remainingTreasure >= amount, "Insufficient balance.");
    require(getCeloToken().transfer(to, amount), "CELO transfer failed.");
    remainingTreasure -= amount;
  }

  function getRemainingBalanceToRelease() external view returns (uint256) {
    remainingTreasure;
  }

  function setRemainingTreasure(uint256 _amount) public {
    remainingTreasure = _amount;
  }

  function setFirstRelease(bool _hasAlreadyReleased) public {
    hasAlreadyReleased = _hasAlreadyReleased;
  }
}
