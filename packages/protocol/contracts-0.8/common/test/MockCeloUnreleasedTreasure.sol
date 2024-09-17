pragma solidity >=0.8.0 <0.9.0;
// solhint-disable no-unused-vars

import "../../../contracts/common/interfaces/ICeloUnreleasedTreasure.sol";
import "../UsingRegistry.sol";

/**
 * @title A mock CeloUnreleasedTreasure for testing.
 */
contract MockCeloUnreleasedTreasure is ICeloUnreleasedTreasure, UsingRegistry {
  function release(address to, uint256 amount) external {
    require(address(this).balance >= amount, "Insufficient balance.");
    require(getCeloToken().transfer(to, amount), "CELO transfer failed.");
  }
}
