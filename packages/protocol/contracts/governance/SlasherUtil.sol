pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/UsingPrecompiles.sol";

contract SlasherUtil is Ownable, Initializable, UsingRegistry, UsingPrecompiles {
  using SafeMath for uint256;

  /**
   * @notice Returns the group to be slashed.
   * @param validator Validator that was slashed.
   * @param blockNumber Block number associated with slashing.
   * @param groupMembershipHistoryIndex Index used for history lookup.
   * @return Group to be slashed.
   */
  function groupMembershipAtBlock(
    address validator,
    uint256 blockNumber,
    uint256 groupMembershipHistoryIndex
  ) public view returns (address) {
    uint256 epoch = getEpochNumberOfBlock(blockNumber);
    require(epoch != 0, "Cannot slash on epoch 0");
    // Use `epoch-1` because the elections were on that epoch
    return
      getValidators().groupMembershipInEpoch(validator, epoch.sub(1), groupMembershipHistoryIndex);
  }

}
