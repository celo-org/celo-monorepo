pragma solidity >=0.5.13 < 0.9;

import "./interfaces/IBlockable.sol";
import "./interfaces/IBlocker.sol";

/**
 * @title Blockable Contract
 * @notice This contract allows certain actions to be blocked based on the logic of another contract implementing the IBlocker interface.
 * @dev This contract uses an external IBlocker contract to determine if it is blocked. The owner can set the blocking contract.
 **/
contract Blockable is IBlockable {
  // using directly memory slot so contracts can inherit from this contract withtout breaking storage layout
  bytes32 private constant BLOCKEDBY_POSITION =
    bytes32(uint256(keccak256("blocked_by_position")) - 1);

  event BlockedBySet(address indexed _blockedBy);

  /// @notice Modifier to ensure the function is only executed when the contract is not blocked.
  /// @dev Reverts with an error if the contract is blocked.
  modifier onlyWhenNotBlocked() {
    require(!_isBlocked(), "Contract is blocked from performing this action");
    _;
  }

  /// @notice Checks if the contract is currently blocked.
  /// @return Returns true if the contract is blocked, otherwise false.
  /// @dev The function returns false if no blocking contract has been set.
  function isBlocked() external view returns (bool) {
    return _isBlocked();
  }

  function getBlockedbyContract() public view returns (address blockedBy) {
    bytes32 blockedByPosition = BLOCKEDBY_POSITION;
    assembly {
      blockedBy := sload(blockedByPosition)
    }
    return blockedBy;
  }

  function _setBlockedBy(address _blockedBy) internal {
    bytes32 blockedByPosition = BLOCKEDBY_POSITION;
    assembly {
      sstore(blockedByPosition, _blockedBy)
    }

    emit BlockedBySet(_blockedBy);
  }

  function _isBlocked() internal view returns (bool) {
    if (getBlockedbyContract() == address(0)) {
      return false;
    }
    return IBlocker(getBlockedbyContract()).isBlocked();
  }
}
