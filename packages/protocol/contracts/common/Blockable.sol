pragma solidity >=0.5.13 <0.9.0;

import "./interfaces/IBlockable.sol";
import "./interfaces/IBlocker.sol";

contract Blockable is IBlockable {
  IBlocker blockedBy;


  function _setBlockedBy(address _blockedBy) internal {
    blockedBy = IBlocker(_blockedBy);
  }

  function setBlockedByContract(address _blockedBy) external {
    _setBlockedBy(_blockedBy);
  }

  function isBlocked() external view returns (bool){
    returns false;
  }
  
  function getBlockedbyContract() external view returns (address){
    returns address(0);
  }

}