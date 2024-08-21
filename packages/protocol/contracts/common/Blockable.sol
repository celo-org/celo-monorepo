pragma solidity >=0.5.13 <0.9.0;

import "./interfaces/IBlockable.sol";
import "./interfaces/IBlocker.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * @title Blockable Contract
 * @notice This contract allows certain actions to be blocked based on the logic of another contract implementing the IBlocker interface.
 * @dev This contract uses an external IBlocker contract to determine if it is blocked. The owner can set the blocking contract.
 **/
contract Blockable is IBlockable, Ownable {
  IBlocker blockedBy;

  event BlockedBySet(address indexed _blockedBy);

  /// @notice Modifier to ensure the function is only executed when the contract is not blocked.
  /// @dev Reverts with an error if the contract is blocked.
  modifier onlyWhenNotBlocked() {
    require(!_isBlocked(), "Contract is blocked from performing this action");
    _;
  }

  /// @notice Sets the address of the blocking contract.
  /// @param _blockedBy The address of the contract that will determine if this contract is blocked.
  /// @dev Can only be called by the owner of the contract.
  function setBlockedByContract(address _blockedBy) external onlyOwner {
    _setBlockedBy(_blockedBy);
  }

  /// @notice Checks if the contract is currently blocked.
  /// @return Returns true if the contract is blocked, otherwise false.
  /// @dev The function returns false if no blocking contract has been set.
  function isBlocked() external view returns (bool) {
    return _isBlocked();
  }

  function getBlockedbyContract() external view returns (address) {
    return address(blockedBy);
  }

  function _setBlockedBy(address _blockedBy) internal {
    blockedBy = IBlocker(_blockedBy);
    emit BlockedBySet(_blockedBy);
  }

  function _isBlocked() internal view returns (bool) {
    if (address(blockedBy) == address(0)) {
      return false;
    }
    return blockedBy.isBlocked();
  }
}
