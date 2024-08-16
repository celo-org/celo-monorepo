pragma solidity >=0.5.13 <0.9.0;

import "./interfaces/IBlockable.sol";
import "./interfaces/IBlocker.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract Blockable is IBlockable, Ownable {
  IBlocker blockedBy;

  // isBlocked will default to false if blockable not set
  function isBlocked() external view returns (bool) {
    // require(address(blockedBy) != address(0), "Blocker contract not set");
    return _isBlocked();
  }

  function _isBlocked() internal view returns (bool) {
    if (address(blockedBy) == address(0)) {
      return false;
    }
    return blockedBy.isBlocked();
  }

  modifier onlyWhenNotBlocked() {
    require(!_isBlocked(), "Contract is blocked from performin this action");
    _;
  }

  function getBlockedbyContract() external view returns (address) {
    return address(blockedBy);
  }

  function _setBlockedBy(address _blockedBy) internal {
    blockedBy = IBlocker(_blockedBy);
  }

  function setBlockedByContract(address _blockedBy) external onlyOwner {
    _setBlockedBy(_blockedBy);
  }
}
