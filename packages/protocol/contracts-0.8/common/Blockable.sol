// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "../../contracts/common/interfaces/IBlockable.sol";
import "../../contracts/common/interfaces/IBlocker.sol";

/**
 * @title Blockable Contract (0.8)
 * @notice Allows certain actions to be blocked based on the logic of another
 * contract implementing IBlocker. 0.8 port of the 0.5 Blockable; abstract
 * because setBlockedByContract is left to the inheriting contract.
 **/
abstract contract Blockable is IBlockable {
  // using directly memory slot so contracts can inherit from this contract without breaking storage layout
  bytes32 private constant BLOCKEDBY_POSITION =
    bytes32(uint256(keccak256("blocked_by_position")) - 1);

  event BlockedBySet(address indexed _blockedBy);

  modifier onlyWhenNotBlocked() {
    require(!_isBlocked(), "Contract is blocked from performing this action");
    _;
  }

  function isBlocked() external view override returns (bool) {
    return _isBlocked();
  }

  function getBlockedByContract() public view override returns (address blockedBy) {
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
    if (getBlockedByContract() == address(0)) {
      return false;
    }
    return IBlocker(getBlockedByContract()).isBlocked();
  }
}
