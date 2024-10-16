// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.9.0;
// solhint-disable no-unused-vars

import "../../../contracts/common/interfaces/ICeloUnreleasedTreasury.sol";
import "../UsingRegistry.sol";

/**
 * @title A mock CeloUnreleasedTreasury for testing.
 */
contract MockCeloUnreleasedTreasury is ICeloUnreleasedTreasury, UsingRegistry {
  function release(address to, uint256 amount) external {
    require(address(this).balance >= amount, "Insufficient balance.");
    require(getCeloToken().transfer(to, amount), "CELO transfer failed.");
  }
}
