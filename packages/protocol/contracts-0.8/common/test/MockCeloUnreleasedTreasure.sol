pragma solidity >=0.8.0 <0.9.0;
// solhint-disable no-unused-vars

import "../../../contracts/common/interfaces/ICeloUnreleasedTreasure.sol";

/**
 * @title A mock CeloDistributionSchedule for testing.
 */
contract MockCeloUnreleasedTreasure is ICeloUnreleasedTreasure {
  function release(address to, uint256 amount) external {}
}
